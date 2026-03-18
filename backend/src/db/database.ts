import Database from 'better-sqlite3'

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
  private readonly database: Database.Database

  public constructor(databasePath: string) {
    this.database = new Database(databasePath)
    this.database.pragma('journal_mode = WAL')
    this.migrate()
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
  }

  public countMedia(): number {
    const row = this.database.prepare('SELECT COUNT(*) AS count FROM media').get() as { count: number }
    return row.count
  }

  public listMedia(filters: MediaFilters): MediaItem[] {
    const clauses: string[] = []
    const params: Record<string, string | number> = {}

    if (filters.query.trim()) {
      clauses.push('(m.filename LIKE @query OR m.tags LIKE @query OR m.collection_name LIKE @query OR IFNULL(n.markdown, \'\') LIKE @query)')
      params.query = `%${filters.query.trim()}%`
    }
    if (filters.type !== 'all') {
      clauses.push('m.type = @type')
      params.type = filters.type
    }
    if (filters.collection !== 'all') {
      clauses.push('m.collection_name = @collection')
      params.collection = filters.collection
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
    const statement = this.database.prepare(`
      SELECT
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
      ORDER BY ${orderBy}
    `)

    return (statement.all(params) as MediaRow[]).map((row) => this.toMediaItem(row))
  }

  public getMedia(id: string): MediaItem | null {
    const row = this.database
      .prepare(
        `SELECT m.id, m.filename, m.path, m.type, m.tags, m.collection_name, m.favorite, m.created_at,
          m.updated_at, m.thumbnail_path, m.size_bytes, n.markdown AS note_markdown
         FROM media m LEFT JOIN notes n ON n.media_id = m.id WHERE m.id = ?`,
      )
      .get(id) as MediaRow | undefined

    return row ? this.toMediaItem(row) : null
  }

  public insertMedia(item: Omit<MediaItem, 'noteMarkdown'>): void {
    this.database
      .prepare(
        `INSERT INTO media
          (id, filename, path, type, tags, collection_name, favorite, created_at, updated_at, thumbnail_path, size_bytes)
         VALUES (@id, @filename, @path, @type, @tags, @collection_name, @favorite, @created_at, @updated_at, @thumbnail_path, @size_bytes)`,
      )
      .run({
        ...item,
        tags: JSON.stringify(item.tags),
        collection_name: item.collection,
        favorite: item.favorite ? 1 : 0,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
        thumbnail_path: item.thumbnailPath,
        size_bytes: item.sizeBytes,
      })

    this.database
      .prepare('INSERT OR IGNORE INTO notes (media_id, markdown, updated_at) VALUES (?, ?, ?)')
      .run(item.id, '', item.updatedAt)
  }

  public updateMedia(id: string, input: UpdateMediaInput): MediaItem {
    const current = this.getMedia(id)
    if (!current) {
      throw new Error('Media item not found')
    }
    const updatedAt = nowIso()
    this.database
      .prepare(
        `UPDATE media SET
           tags = @tags,
           collection_name = @collection_name,
           favorite = @favorite,
           updated_at = @updated_at
         WHERE id = @id`,
      )
      .run({
        id,
        tags: JSON.stringify(input.tags ?? current.tags),
        collection_name: input.collection ?? current.collection,
        favorite: (input.favorite ?? current.favorite) ? 1 : 0,
        updated_at: updatedAt,
      })

    return this.getMedia(id) as MediaItem
  }

  public saveNote(id: string, markdown: string): MediaItem {
    const timestamp = nowIso()
    this.database
      .prepare(
        'INSERT INTO notes (media_id, markdown, updated_at) VALUES (?, ?, ?) ON CONFLICT(media_id) DO UPDATE SET markdown = excluded.markdown, updated_at = excluded.updated_at',
      )
      .run(id, markdown, timestamp)
    this.database.prepare('UPDATE media SET updated_at = ? WHERE id = ?').run(timestamp, id)
    return this.getMedia(id) as MediaItem
  }

  public deleteMedia(id: string): MediaItem | null {
    const current = this.getMedia(id)
    if (!current) {
      return null
    }
    this.database.prepare('DELETE FROM media WHERE id = ?').run(id)
    return current
  }

  private toMediaItem(row: MediaRow): MediaItem {
    return {
      id: row.id,
      filename: row.filename,
      path: row.path,
      type: row.type,
      tags: JSON.parse(row.tags) as string[],
      collection: row.collection_name,
      favorite: row.favorite === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      thumbnailPath: row.thumbnail_path,
      sizeBytes: row.size_bytes,
      noteMarkdown: row.note_markdown ?? '',
    }
  }
}
