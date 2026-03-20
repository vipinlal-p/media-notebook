"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const crypto_1 = require("../utils/crypto");
class SettingsService {
    appPaths;
    constructor(appPaths) {
        this.appPaths = appPaths;
    }
    getSettings() {
        if (!node_fs_1.default.existsSync(this.appPaths.settingsPath)) {
            return null;
        }
        const raw = node_fs_1.default.readFileSync(this.appPaths.settingsPath, 'utf8');
        return JSON.parse(raw);
    }
    saveSettings(settings) {
        node_fs_1.default.writeFileSync(this.appPaths.settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    }
    async verifyPassword(password) {
        const settings = this.getSettings();
        if (!settings) {
            return null;
        }
        const key = await (0, crypto_1.deriveKey)(password, settings.salt);
        return (0, crypto_1.createVerifier)(key) === settings.verifier ? key : null;
    }
    getStatus(unlocked, mediaCount) {
        const initialized = this.getSettings() !== null;
        return {
            initialized,
            unlocked,
            libraryPath: this.appPaths.root,
            mediaCount,
        };
    }
    createVaultConfig(salt, verifier) {
        return {
            initializedAt: new Date().toISOString(),
            salt,
            verifier,
            iterations: crypto_1.vaultIterations,
        };
    }
}
exports.SettingsService = SettingsService;
