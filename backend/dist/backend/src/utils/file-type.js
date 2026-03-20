"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mimeTypeForPath = exports.detectMediaType = void 0;
const node_path_1 = __importDefault(require("node:path"));
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg']);
const videoExtensions = new Set(['.mp4', '.mov', '.mkv', '.avi', '.webm']);
const documentExtensions = new Set(['.pdf']);
const detectMediaType = (filePath) => {
    const extension = node_path_1.default.extname(filePath).toLowerCase();
    if (imageExtensions.has(extension)) {
        return 'image';
    }
    if (videoExtensions.has(extension)) {
        return 'video';
    }
    if (documentExtensions.has(extension)) {
        return 'document';
    }
    return null;
};
exports.detectMediaType = detectMediaType;
const mimeTypeForPath = (filePath) => {
    const extension = node_path_1.default.extname(filePath).toLowerCase();
    switch (extension) {
        case '.png':
            return 'image/png';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.webp':
            return 'image/webp';
        case '.gif':
            return 'image/gif';
        case '.bmp':
            return 'image/bmp';
        case '.svg':
            return 'image/svg+xml';
        case '.mp4':
            return 'video/mp4';
        case '.mov':
            return 'video/quicktime';
        case '.mkv':
            return 'video/x-matroska';
        case '.avi':
            return 'video/x-msvideo';
        case '.webm':
            return 'video/webm';
        case '.pdf':
            return 'application/pdf';
        default:
            return 'application/octet-stream';
    }
};
exports.mimeTypeForPath = mimeTypeForPath;
