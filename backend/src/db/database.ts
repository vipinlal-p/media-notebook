import fs from 'node:fs'
import path from 'node:path'

import initSqlJs, { type Database } from 'sql.js/dist/sql-asm'

import type { MediaFilters, MediaItem, UpdateMediaInput } from '../../../shared/contracts'

import { nowIso } from '../utils/time'

interface MediaRow {
  id: string
  filename: string
  path: string
  type: MediaItem['type']
  tags: string
  collection_name: string
  favorite: number
  created_at: string
  updated_at: string
  thumbnail_path: string | null
  size_bytes: number
  note_markdown: string | null
}

export class MediaDatabase {
  private constructor(
    private readonly dbPath: string,
    private readonly database: Database,
  ) {
    this.migrate()
  }

  public static async create(databasePath: string): Promise<MediaDatabase> {
    const sqlite = await initSqlJs()
    const database = fs.existsSync(databasePath)
      ? new sqlite.Database(fs.readFileSync(databasePath))
      : new sqlite.Database()
    return new MediaDatabase(databasePath, database)
  }

  private migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]',
        collection_name TEXT NOT NULL DEFAULT 'Inbox',
        favorite INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        thumbnail_path TEXT,
        size_bytes INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS notes (
        media_id TEXT PRIMARY KEY,
        markdown TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL,
        FOREIGN KEY(media_id) REFERENCES media(id) ON DELETE CASCADE
      );
    `)
    this.persist()
  }

  public countMedia(): number {
    return this.queryOne<{ count: number }>('SELECT COUNT(*) AS count FROM media')?.count ?? 0
  }

  public listMedia(filters: MediaFilters): MediaItem[] {
    const clauses: string[] = []
    const params: Record<string, string | number> = {}

    if (filters.query.trim()) {
      clauses.push("(m.filename LIKE $query OR m.tags LIKE $query OR IFNULL(n.markdown, '') LIKE $query)")
      params.$query = `%${filters.query.trim()}%`
    }
    if (filters.type !== 'all') {
      clauses.push('m.type = $type')
      params.$type = filters.type
    }
    if (filters.collection !== 'all') {
      clauses.push('m.collection_name = $collection')
      params.$collection = filters.collection
    }
    if (filters.favoriteOnly) {
      clauses.push('m.favorite = 1')
    }

    const orderBy =
      filters.sort === 'oldest'
        ? 'm.created_at ASC'
        : filters.sort === 'name'
          ? 'm.filename COLLATE NOCASE ASC'
          : filters.sort === 'size-asc'
            ? 'm.size_bytes ASC'
            : filters.sort === 'size-desc'
              ? 'm.size_bytes DESC'
              : 'm.updated_at DESC'

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''
    return this.queryRows<MediaRow>(
      `SELECT
        m.id,
        m.filename,
        m.path,
        m.type,
        m.tags,
        m.collection_name,
        m.favorite,
        m.created_at,
        m.updated_at,
        m.thumbnail_path,
        m.size_bytes,
        n.markdown AS note_markdown
      FROM media m
      LEFT JOIN notes n ON n.media_id = m.id
      ${whereClause}
      ORDER BY ${orderBy}`,
      params,
    ).map((row) => this.toMediaItem(row))
  }

  public getMedia(id: string): MediaItem | null {
    const row = this.queryOne<MediaRow>(
      `SELECT m.id, m.filename, m.path, m.type, m.tags, m.collection_name, m.favorite, m.created_at,
        m.updated_at, m.thumbnail_path, m.size_bytes, n.markdown AS note_markdown
       FROM media m LEFT JOIN notes n ON n.media_id = m.id WHERE m.id = $id`,
      { $id: id },
    )
    return row ? this.toMediaItem(row) : null
  }

  public insertMedia(item: Omit<MediaItem, 'noteMarkdown'>): void {
    this.mutate(() => {
      this.run(
        `INSERT INTO media
          (id, filename, path, type, tags, collection_name, favorite, created_at, updated_at, thumbnail_path, size_bytes)
         VALUES ($id, $filename, $path, $type, $tags, $collection_name, $favorite, $created_at, $updated_at, $thumbnail_path, $size_bytes)`,
        {
          $id: item.id,
          $filename: item.filename,
          $path: item.path,
          $type: item.type,
          $tags: JSON.stringify(item.tags),
          $collection_name: item.collection,
          $favorite: item.favorite ? 1 : 0,
          $created_at: item.createdAt,
          $updated_at: item.updatedAt,
          $thumbnail_path: item.thumbnailPath,
          $size_bytes: item.sizeBytes,
        },
      )
      this.run('INSERT OR IGNORE INTO notes (media_id, markdown, updated_at) VALUES ($id, $markdown, $updated_at)', {
        $id: item.id,
        $markdown: '',
        $updated_at: item.updatedAt,
      })
    })
  }

  public updateMedia(id: string, input: UpdateMediaInput): MediaItem {
    const current = this.getMedia(id)
    if (!current) {
      throw new Error('Media item not found')
    }

    this.mutate(() => {
      this.run(
        `UPDATE media SET
          tags = $tags,
          collection_name = $collection_name,
          favorite = $favorite,
          updated_at = $updated_at
         WHERE id = $id`,
        {
          $id: id,
          $tags: JSON.stringify(input.tags ?? current.tags),
          $collection_name: input.collection ?? current.collection,
          $favorite: (input.favorite ?? current.favorite) ? 1 : 0,
          $updated_at: nowIso(),
        },
      )
    })

    return this.getMedia(id) as MediaItem
  }

  public saveNote(id: string, markdown: string): MediaItem {
    const timestamp = nowIso()
    this.mutate(() => {
      this.run(
        'INSERT INTO notes (media_id, markdown, updated_at) VALUES ($id, $markdown, $updated_at) ON CONFLICT(media_id) DO UPDATE SET markdown = excluded.markdown, updated_at = excluded.updated_at',
        {
          $id: id,
          $markdown: markdown,
          $updated_at: timestamp,
        },
      )
      this.run('UPDATE media SET updated_at = $updated_at WHERE id = $id', {
        $id: id,
        $updated_at: timestamp,
      })
    })
    return this.getMedia(id) as MediaItem
  }

  public deleteMedia(id: string): MediaItem | null {
    const current = this.getMedia(id)
    if (!current) {
      return null
    }
    this.mutate(() => {
      this.run('DELETE FROM media WHERE id = $id', { $id: id })
    })
    return current
  }

  private mutate(operation: () => void): void {
    this.database.exec('BEGIN')
    try {
      operation()
      this.database.exec('COMMIT')
      this.persist()
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }

  private run(sql: string, params: Record<string, string | number | null>): void {
    const statement = this.database.prepare(sql)
    try {
      statement.run(params)
    } finally {
      statement.free()
    }
  }

  private queryRows<T>(sql: string, params?: Record<string, string | number>): T[] {
    const statement = this.database.prepare(sql)
    try {
      if (params) {
        statement.bind(params)
      }
      const rows: T[] = []
      while (statement.step()) {
        rows.push(statement.getAsObject() as T)
      }
      return rows
    } finally {
      statement.free()
    }
  }

  private queryOne<T>(sql: string, params?: Record<string, string | number>): T | null {
    return this.queryRows<T>(sql, params)[0] ?? null
  }

  private persist(): void {
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true })
    fs.writeFileSync(this.dbPath, Buffer.from(this.database.export()))
  }

  private toMediaItem(row: MediaRow): MediaItem {
    return {
      id: row.id,
      filename: row.filename,
      path: row.path,
      type: row.type,
      tags: JSON.parse(row.tags) as string[],
      collection: row.collection_name,
      favorite: Number(row.favorite) === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      thumbnailPath: row.thumbnail_path,
      sizeBytes: Number(row.size_bytes),
      noteMarkdown: row.note_markdown ?? '',
    }
  }
}
