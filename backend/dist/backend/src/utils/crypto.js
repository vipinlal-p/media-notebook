"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptBuffer = exports.encryptBuffer = exports.decryptFile = exports.encryptFile = exports.createVerifier = exports.deriveKey = exports.createSalt = exports.vaultIterations = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const promises_1 = require("node:stream/promises");
const MAGIC = Buffer.from('MNB1');
const HEADER_LENGTH = 32;
const ITERATIONS = 210_000;
exports.vaultIterations = ITERATIONS;
const createSalt = () => node_crypto_1.default.randomBytes(16).toString('hex');
exports.createSalt = createSalt;
const deriveKey = async (password, saltHex) => new Promise((resolve, reject) => {
    node_crypto_1.default.pbkdf2(password, Buffer.from(saltHex, 'hex'), ITERATIONS, 32, 'sha512', (error, key) => {
        if (error) {
            reject(error);
            return;
        }
        resolve(key);
    });
});
exports.deriveKey = deriveKey;
const createVerifier = (key) => node_crypto_1.default.createHash('sha256').update(key).digest('hex');
exports.createVerifier = createVerifier;
const encryptFile = async (sourcePath, destinationPath, key) => {
    const iv = node_crypto_1.default.randomBytes(12);
    const cipher = node_crypto_1.default.createCipheriv('aes-256-gcm', key, iv);
    const header = Buffer.concat([MAGIC, iv, Buffer.alloc(16)]);
    await node_fs_1.default.promises.mkdir(node_path_1.default.dirname(destinationPath), { recursive: true }).catch(() => undefined);
    await node_fs_1.default.promises.writeFile(destinationPath, header);
    const output = node_fs_1.default.createWriteStream(destinationPath, { flags: 'a' });
    await (0, promises_1.pipeline)(node_fs_1.default.createReadStream(sourcePath), cipher, output);
    const authTag = cipher.getAuthTag();
    const descriptor = await node_fs_1.default.promises.open(destinationPath, 'r+');
    try {
        await descriptor.write(authTag, 0, authTag.length, 16);
    }
    finally {
        await descriptor.close();
    }
};
exports.encryptFile = encryptFile;
const decryptFile = async (sourcePath, destinationPath, key) => {
    const header = Buffer.alloc(HEADER_LENGTH);
    const descriptor = await node_fs_1.default.promises.open(sourcePath, 'r');
    try {
        const { bytesRead } = await descriptor.read(header, 0, HEADER_LENGTH, 0);
        if (bytesRead !== HEADER_LENGTH || !header.subarray(0, 4).equals(MAGIC)) {
            throw new Error('Invalid encrypted media header');
        }
    }
    finally {
        await descriptor.close();
    }
    const iv = header.subarray(4, 16);
    const authTag = header.subarray(16, 32);
    const decipher = node_crypto_1.default.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    await node_fs_1.default.promises.mkdir(node_path_1.default.dirname(destinationPath), { recursive: true }).catch(() => undefined);
    await (0, promises_1.pipeline)(node_fs_1.default.createReadStream(sourcePath, { start: HEADER_LENGTH }), decipher, node_fs_1.default.createWriteStream(destinationPath));
};
exports.decryptFile = decryptFile;
const encryptBuffer = (payload, key) => {
    const iv = node_crypto_1.default.randomBytes(12);
    const cipher = node_crypto_1.default.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
    return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), encrypted]);
};
exports.encryptBuffer = encryptBuffer;
const decryptBuffer = (payload, key) => {
    if (!payload.subarray(0, 4).equals(MAGIC)) {
        throw new Error('Invalid payload magic');
    }
    const decipher = node_crypto_1.default.createDecipheriv('aes-256-gcm', key, payload.subarray(4, 16));
    decipher.setAuthTag(payload.subarray(16, 32));
    return Buffer.concat([decipher.update(payload.subarray(32)), decipher.final()]);
};
exports.decryptBuffer = decryptBuffer;
