"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const DB_FILE = path_1.default.join(electron_1.app.getPath('userData'), 'media-notebook.sqlite');
const db = new sqlite3_1.default.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error opening database', err);
    }
    else {
        console.log('Database opened successfully');
        createTables();
    }
});
function createTables() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      path TEXT NOT NULL,
      type TEXT NOT NULL,
      tags TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      thumbnail_path TEXT
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      media_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (media_id) REFERENCES media (id)
    );
  `);
}
exports.default = db;
