"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const crypto_1 = require("../utils/crypto");
(0, node_test_1.default)('deriveKey and verifier are stable for the same password + salt', async () => {
    const salt = (0, crypto_1.createSalt)();
    const first = await (0, crypto_1.deriveKey)('correct horse battery staple', salt);
    const second = await (0, crypto_1.deriveKey)('correct horse battery staple', salt);
    strict_1.default.deepEqual(first, second);
    strict_1.default.equal((0, crypto_1.createVerifier)(first), (0, crypto_1.createVerifier)(second));
});
(0, node_test_1.default)('encryptBuffer/decryptBuffer round trips payload', async () => {
    const key = await (0, crypto_1.deriveKey)('buffer-passphrase', (0, crypto_1.createSalt)());
    const payload = Buffer.from('media-notebook');
    const encrypted = (0, crypto_1.encryptBuffer)(payload, key);
    const decrypted = (0, crypto_1.decryptBuffer)(encrypted, key);
    strict_1.default.deepEqual(decrypted, payload);
});
(0, node_test_1.default)('encryptFile/decryptFile round trips file contents', async () => {
    const directory = await node_fs_1.default.promises.mkdtemp(node_path_1.default.join(node_os_1.default.tmpdir(), 'mn-'));
    const source = node_path_1.default.join(directory, 'source.txt');
    const encrypted = node_path_1.default.join(directory, 'source.bin');
    const restored = node_path_1.default.join(directory, 'restored.txt');
    await node_fs_1.default.promises.writeFile(source, 'local first and encrypted', 'utf8');
    const key = await (0, crypto_1.deriveKey)('file-passphrase', (0, crypto_1.createSalt)());
    await (0, crypto_1.encryptFile)(source, encrypted, key);
    await (0, crypto_1.decryptFile)(encrypted, restored, key);
    strict_1.default.equal(await node_fs_1.default.promises.readFile(restored, 'utf8'), 'local first and encrypted');
});
