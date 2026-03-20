"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThumbnailService = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const crypto_1 = require("../utils/crypto");
const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const imageMime = 'image/svg+xml';
class ThumbnailService {
    encryptedThumbnailDir;
    previewDir;
    constructor(encryptedThumbnailDir, previewDir) {
        this.encryptedThumbnailDir = encryptedThumbnailDir;
        this.previewDir = previewDir;
    }
    async createThumbnail(id, sourcePath, type, title, key) {
        const payload = await this.buildThumbnailPayload(sourcePath, type, title);
        const outputPath = node_path_1.default.join(this.encryptedThumbnailDir, `${id}.thumb`);
        await node_fs_1.default.promises.mkdir(this.encryptedThumbnailDir, { recursive: true });
        await node_fs_1.default.promises.writeFile(outputPath, (0, crypto_1.encryptBuffer)(payload, key));
        return outputPath;
    }
    async materializeThumbnail(id, encryptedPath, title, type, key) {
        const outputExtension = type === 'image' ? '.jpg' : '.svg';
        const outputPath = node_path_1.default.join(this.previewDir, `thumb-${id}${outputExtension}`);
        if (node_fs_1.default.existsSync(outputPath)) {
            return outputPath;
        }
        const encryptedPayload = await node_fs_1.default.promises.readFile(encryptedPath);
        let payload;
        try {
            payload = (0, crypto_1.decryptBuffer)(encryptedPayload, key);
        }
        catch {
            payload = await this.buildPlaceholderPayload(type, title);
        }
        await node_fs_1.default.promises.mkdir(this.previewDir, { recursive: true });
        await node_fs_1.default.promises.writeFile(outputPath, payload);
        return outputPath;
    }
    getThumbnailMimeType(type) {
        return type === 'image' ? imageMime : 'image/svg+xml';
    }
    async buildThumbnailPayload(sourcePath, type, title) {
        void sourcePath;
        return this.buildPlaceholderPayload(type, title);
    }
    async buildPlaceholderPayload(type, title) {
        const accent = type === 'video' ? '#ff6d42' : type === 'document' ? '#4fd1a1' : '#87a3ff';
        const label = type === 'video' ? 'VIDEO' : type === 'document' ? 'PDF' : 'IMAGE';
        const safeTitle = escapeHtml(title);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#121926" />
          <stop offset="55%" stop-color="#09111d" />
          <stop offset="100%" stop-color="#04070f" />
        </linearGradient>
      </defs>
      <rect width="480" height="270" rx="28" fill="url(#bg)" />
      <circle cx="424" cy="56" r="52" fill="${accent}" opacity="0.18" />
      <circle cx="72" cy="228" r="96" fill="${accent}" opacity="0.12" />
      <rect x="28" y="28" width="94" height="32" rx="16" fill="${accent}" />
      <text x="75" y="49" fill="#071018" font-size="15" font-family="Arial" text-anchor="middle">${label}</text>
      <text x="36" y="176" fill="#f5f7ff" font-size="29" font-family="Arial">${safeTitle.slice(0, 24)}</text>
      <text x="36" y="208" fill="#9baccc" font-size="15" font-family="Arial">Encrypted thumbnail cache</text>
    </svg>`;
        return Buffer.from(svg, 'utf8');
    }
}
exports.ThumbnailService = ThumbnailService;
