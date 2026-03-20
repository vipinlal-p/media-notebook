"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultService = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_url_1 = require("node:url");
const electron_1 = require("electron");
const database_1 = require("../db/database");
const crypto_1 = require("../utils/crypto");
const file_type_1 = require("../utils/file-type");
const ids_1 = require("../utils/ids");
const time_1 = require("../utils/time");
const logger_1 = require("./logger");
const settings_service_1 = require("./settings-service");
const thumbnail_service_1 = require("./thumbnail-service");
class VaultService {
    appPaths;
    db;
    static async create(appPaths) {
        const db = await database_1.MediaDatabase.create(appPaths.databasePath);
        return new VaultService(appPaths, db);
    }
    key = null;
    settings;
    thumbnails;
    constructor(appPaths, db) {
        this.appPaths = appPaths;
        this.db = db;
        this.settings = new settings_service_1.SettingsService(appPaths);
        this.thumbnails = new thumbnail_service_1.ThumbnailService(appPaths.thumbnailDir, appPaths.previewDir);
        this.clearPreviewCache();
    }
    getStatus() {
        return this.settings.getStatus(this.key !== null, this.db.countMedia());
    }
    async initialize(password) {
        if (password.length < 10) {
            throw new Error('Use a password with at least 10 characters');
        }
        if (this.settings.getSettings()) {
            throw new Error('Vault already initialized');
        }
        const salt = (0, crypto_1.createSalt)();
        const key = await (0, crypto_1.deriveKey)(password, salt);
        this.settings.saveSettings(this.settings.createVaultConfig(salt, (0, crypto_1.createVerifier)(key)));
        this.key = key;
        logger_1.logger.info('Vault initialized');
        return this.getStatus();
    }
    async unlock(password) {
        const key = await this.settings.verifyPassword(password);
        if (!key) {
            throw new Error('Invalid password');
        }
        this.key = key;
        logger_1.logger.info('Vault unlocked');
        return this.getStatus();
    }
    lock() {
        this.key = null;
        this.clearPreviewCache();
        return this.getStatus();
    }
    listMedia(filters) {
        this.requireKey();
        return this.db.listMedia(filters);
    }
    async importFiles(filePaths) {
        const key = this.requireKey();
        const imported = [];
        const skipped = [];
        for (const filePath of filePaths) {
            try {
                const type = (0, file_type_1.detectMediaType)(filePath);
                if (!type) {
                    skipped.push(filePath);
                    continue;
                }
                const stats = await node_fs_1.default.promises.stat(filePath);
                if (!stats.isFile()) {
                    skipped.push(filePath);
                    continue;
                }
                const id = (0, ids_1.createId)();
                const encryptedPath = node_path_1.default.join(this.appPaths.mediaDir, `${id}.bin`);
                const thumbnailPath = await this.thumbnails.createThumbnail(id, filePath, type, node_path_1.default.basename(filePath), key);
                await (0, crypto_1.encryptFile)(filePath, encryptedPath, key);
                const timestamp = (0, time_1.nowIso)();
                const item = {
                    id,
                    filename: node_path_1.default.basename(filePath),
                    path: encryptedPath,
                    type,
                    tags: [],
                    collection: 'Inbox',
                    favorite: false,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    thumbnailPath,
                    sizeBytes: stats.size,
                };
                this.db.insertMedia(item);
                imported.push({ ...item, noteMarkdown: '' });
            }
            catch (error) {
                logger_1.logger.error('Failed to import file', { filePath, error });
                skipped.push(filePath);
            }
        }
        logger_1.logger.info('Imported media', { imported: imported.length, skipped: skipped.length });
        return { imported, skipped };
    }
    async pickFiles() {
        const result = await electron_1.dialog.showOpenDialog({
            title: 'Import media',
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'Supported media', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg', 'mp4', 'mov', 'mkv', 'avi', 'webm', 'pdf'] },
            ],
        });
        return result.canceled ? [] : result.filePaths;
    }
    async exportMedia(id) {
        const key = this.requireKey();
        const item = this.db.getMedia(id);
        if (!item) {
            throw new Error('Media item not found');
        }
        const result = await electron_1.dialog.showSaveDialog({
            title: 'Export decrypted media',
            defaultPath: item.filename,
        });
        if (result.canceled || !result.filePath) {
            return null;
        }
        await (0, crypto_1.decryptFile)(item.path, result.filePath, key);
        return result.filePath;
    }
    async getThumbnail(id) {
        const key = this.requireKey();
        const item = this.db.getMedia(id);
        if (!item) {
            throw new Error('Media item not found');
        }
        const thumbnailPath = item.thumbnailPath;
        const outputPath = thumbnailPath
            ? await this.thumbnails.materializeThumbnail(id, thumbnailPath, item.filename, item.type, key)
            : node_path_1.default.join(this.appPaths.previewDir, `thumb-${id}.svg`);
        return {
            url: (0, node_url_1.pathToFileURL)(outputPath).toString(),
            mimeType: this.thumbnails.getThumbnailMimeType(item.type),
            mode: 'file',
        };
    }
    async getPreview(id) {
        const key = this.requireKey();
        const item = this.db.getMedia(id);
        if (!item) {
            throw new Error('Media item not found');
        }
        const previewPath = node_path_1.default.join(this.appPaths.previewDir, `${id}${node_path_1.default.extname(item.filename)}`);
        if (!node_fs_1.default.existsSync(previewPath)) {
            await (0, crypto_1.decryptFile)(item.path, previewPath, key);
        }
        return {
            url: (0, node_url_1.pathToFileURL)(previewPath).toString(),
            mimeType: (0, file_type_1.mimeTypeForPath)(item.filename),
            mode: 'file',
        };
    }
    updateMedia(id, input) {
        this.requireKey();
        return this.db.updateMedia(id, input);
    }
    saveNote(id, markdown) {
        this.requireKey();
        return this.db.saveNote(id, markdown);
    }
    async deleteMedia(id) {
        this.requireKey();
        const item = this.db.deleteMedia(id);
        if (!item) {
            return;
        }
        await node_fs_1.default.promises.rm(item.path, { force: true });
        if (item.thumbnailPath) {
            await node_fs_1.default.promises.rm(item.thumbnailPath, { force: true });
        }
        const previewPath = node_path_1.default.join(this.appPaths.previewDir, `${id}${node_path_1.default.extname(item.filename)}`);
        await node_fs_1.default.promises.rm(previewPath, { force: true });
    }
    async revealLibrary() {
        const result = await electron_1.shell.openPath(this.appPaths.root);
        if (result) {
            await electron_1.dialog.showMessageBox({
                title: 'Library path',
                message: this.appPaths.root,
                detail: 'The vault path could not be opened automatically on this device.',
            });
        }
    }
    clearPreviewCache() {
        node_fs_1.default.rmSync(this.appPaths.previewDir, { recursive: true, force: true });
        node_fs_1.default.mkdirSync(this.appPaths.previewDir, { recursive: true });
    }
    requireKey() {
        if (!this.key) {
            throw new Error('Vault is locked');
        }
        return this.key;
    }
}
exports.VaultService = VaultService;
