"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAppPaths = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const electron_1 = require("electron");
const resolveAppPaths = () => {
    const root = node_path_1.default.join(electron_1.app.getPath('userData'), 'vault-data');
    const mediaDir = node_path_1.default.join(root, 'media');
    const previewDir = node_path_1.default.join(root, 'previews');
    const thumbnailDir = node_path_1.default.join(root, 'thumbnails');
    node_fs_1.default.mkdirSync(mediaDir, { recursive: true });
    node_fs_1.default.mkdirSync(previewDir, { recursive: true });
    node_fs_1.default.mkdirSync(thumbnailDir, { recursive: true });
    return {
        root,
        mediaDir,
        previewDir,
        thumbnailDir,
        databasePath: node_path_1.default.join(root, 'media-notebook.db'),
        settingsPath: node_path_1.default.join(root, 'settings.json'),
    };
};
exports.resolveAppPaths = resolveAppPaths;
