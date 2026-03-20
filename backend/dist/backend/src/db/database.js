"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaDatabase = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const sql_asm_1 = __importDefault(require("sql.js/dist/sql-asm"));
const time_1 = require("../utils/time");
class MediaDatabase {
    dbPath;
    database;
    constructor(dbPath, database) {
        this.dbPath = dbPath;
        this.database = database;
        this.migrate();
    }
    static async create(databasePath) {
        const sqlite = await (0, sql_asm_1.default)();
        const database = node_fs_1.default.existsSync(databasePath)
            ? new sqlite.Database(node_fs_1.default.readFileSync(databasePath))
            : new sqlite.Database();
        return new MediaDatabase(databasePath, database);
    }
    migrate() {
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
    `);
        this.persist();
    }
    countMedia() {
        return this.queryOne('SELECT COUNT(*) AS count FROM media')?.count ?? 0;
    }
    listMedia(filters) {
        const clauses = [];
        const params = {};
        if (filters.query.trim()) {
            clauses.push("(m.filename LIKE $query OR m.tags LIKE $query OR IFNULL(n.markdown, '') LIKE $query)");
            params.$query = `%${filters.query.trim()}%`;
        }
        if (filters.type !== 'all') {
            clauses.push('m.type = $type');
            params.$type = filters.type;
        }
        if (filters.collection !== 'all') {
            clauses.push('m.collection_name = $collection');
            params.$collection = filters.collection;
        }
        if (filters.favoriteOnly) {
            clauses.push('m.favorite = 1');
        }
        const orderBy = filters.sort === 'oldest'
            ? 'm.created_at ASC'
            : filters.sort === 'name'
                ? 'm.filename COLLATE NOCASE ASC'
                : filters.sort === 'size-asc'
                    ? 'm.size_bytes ASC'
                    : filters.sort === 'size-desc'
                        ? 'm.size_bytes DESC'
                        : 'm.updated_at DESC';
        const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
        return this.queryRows(`SELECT
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
      ORDER BY ${orderBy}`, params).map((row) => this.toMediaItem(row));
    }
    getMedia(id) {
        const row = this.queryOne(`SELECT m.id, m.filename, m.path, m.type, m.tags, m.collection_name, m.favorite, m.created_at,
        m.updated_at, m.thumbnail_path, m.size_bytes, n.markdown AS note_markdown
       FROM media m LEFT JOIN notes n ON n.media_id = m.id WHERE m.id = $id`, { $id: id });
        return row ? this.toMediaItem(row) : null;
    }
    insertMedia(item) {
        this.mutate(() => {
            this.run(`INSERT INTO media
          (id, filename, path, type, tags, collection_name, favorite, created_at, updated_at, thumbnail_path, size_bytes)
         VALUES ($id, $filename, $path, $type, $tags, $collection_name, $favorite, $created_at, $updated_at, $thumbnail_path, $size_bytes)`, {
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
            });
            this.run('INSERT OR IGNORE INTO notes (media_id, markdown, updated_at) VALUES ($id, $markdown, $updated_at)', {
                $id: item.id,
                $markdown: '',
                $updated_at: item.updatedAt,
            });
        });
    }
    updateMedia(id, input) {
        const current = this.getMedia(id);
        if (!current) {
            throw new Error('Media item not found');
        }
        this.mutate(() => {
            this.run(`UPDATE media SET
          tags = $tags,
          collection_name = $collection_name,
          favorite = $favorite,
          updated_at = $updated_at
         WHERE id = $id`, {
                $id: id,
                $tags: JSON.stringify(input.tags ?? current.tags),
                $collection_name: input.collection ?? current.collection,
                $favorite: (input.favorite ?? current.favorite) ? 1 : 0,
                $updated_at: (0, time_1.nowIso)(),
            });
        });
        return this.getMedia(id);
    }
    saveNote(id, markdown) {
        const timestamp = (0, time_1.nowIso)();
        this.mutate(() => {
            this.run('INSERT INTO notes (media_id, markdown, updated_at) VALUES ($id, $markdown, $updated_at) ON CONFLICT(media_id) DO UPDATE SET markdown = excluded.markdown, updated_at = excluded.updated_at', {
                $id: id,
                $markdown: markdown,
                $updated_at: timestamp,
            });
            this.run('UPDATE media SET updated_at = $updated_at WHERE id = $id', {
                $id: id,
                $updated_at: timestamp,
            });
        });
        return this.getMedia(id);
    }
    deleteMedia(id) {
        const current = this.getMedia(id);
        if (!current) {
            return null;
        }
        this.mutate(() => {
            this.run('DELETE FROM media WHERE id = $id', { $id: id });
        });
        return current;
    }
    mutate(operation) {
        this.database.exec('BEGIN');
        try {
            operation();
            this.database.exec('COMMIT');
            this.persist();
        }
        catch (error) {
            this.database.exec('ROLLBACK');
            throw error;
        }
    }
    run(sql, params) {
        const statement = this.database.prepare(sql);
        try {
            statement.run(params);
        }
        finally {
            statement.free();
        }
    }
    queryRows(sql, params) {
        const statement = this.database.prepare(sql);
        try {
            if (params) {
                statement.bind(params);
            }
            const rows = [];
            while (statement.step()) {
                rows.push(statement.getAsObject());
            }
            return rows;
        }
        finally {
            statement.free();
        }
    }
    queryOne(sql, params) {
        return this.queryRows(sql, params)[0] ?? null;
    }
    persist() {
        node_fs_1.default.mkdirSync(node_path_1.default.dirname(this.dbPath), { recursive: true });
        node_fs_1.default.writeFileSync(this.dbPath, Buffer.from(this.database.export()));
    }
    toMediaItem(row) {
        return {
            id: row.id,
            filename: row.filename,
            path: row.path,
            type: row.type,
            tags: JSON.parse(row.tags),
            collection: row.collection_name,
            favorite: Number(row.favorite) === 1,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            thumbnailPath: row.thumbnail_path,
            sizeBytes: Number(row.size_bytes),
            noteMarkdown: row.note_markdown ?? '',
        };
    }
}
exports.MediaDatabase = MediaDatabase;
