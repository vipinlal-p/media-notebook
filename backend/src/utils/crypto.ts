import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

const MAGIC = Buffer.from('MNB1')
const HEADER_LENGTH = 32
const ITERATIONS = 210_000

export const vaultIterations = ITERATIONS

export const createSalt = (): string => crypto.randomBytes(16).toString('hex')

export const deriveKey = async (password: string, saltHex: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    crypto.pbkdf2(password, Buffer.from(saltHex, 'hex'), ITERATIONS, 32, 'sha512', (error, key) => {
      if (error) {
        reject(error)
        return
      }
      resolve(key)
    })
  })

export const createVerifier = (key: Buffer): string =>
  crypto.createHash('sha256').update(key).digest('hex')

export const encryptFile = async (sourcePath: string, destinationPath: string, key: Buffer): Promise<void> => {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const header = Buffer.concat([MAGIC, iv, Buffer.alloc(16)])

  await fs.promises.mkdir(path.dirname(destinationPath), { recursive: true }).catch(() => undefined)
  await fs.promises.writeFile(destinationPath, header)

  const output = fs.createWriteStream(destinationPath, { flags: 'a' })
  await pipeline(fs.createReadStream(sourcePath), cipher, output)

  const authTag = cipher.getAuthTag()
  const descriptor = await fs.promises.open(destinationPath, 'r+')
  try {
    await descriptor.write(authTag, 0, authTag.length, 16)
  } finally {
    await descriptor.close()
  }
}

export const decryptFile = async (sourcePath: string, destinationPath: string, key: Buffer): Promise<void> => {
  const header = Buffer.alloc(HEADER_LENGTH)
  const descriptor = await fs.promises.open(sourcePath, 'r')
  try {
    const { bytesRead } = await descriptor.read(header, 0, HEADER_LENGTH, 0)
    if (bytesRead !== HEADER_LENGTH || !header.subarray(0, 4).equals(MAGIC)) {
      throw new Error('Invalid encrypted media header')
    }
  } finally {
    await descriptor.close()
  }

  const iv = header.subarray(4, 16)
  const authTag = header.subarray(16, 32)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  await fs.promises.mkdir(path.dirname(destinationPath), { recursive: true }).catch(() => undefined)
  await pipeline(fs.createReadStream(sourcePath, { start: HEADER_LENGTH }), decipher, fs.createWriteStream(destinationPath))
}

export const encryptBuffer = (payload: Buffer, key: Buffer): Buffer => {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()])
  return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), encrypted])
}

export const decryptBuffer = (payload: Buffer, key: Buffer): Buffer => {
  if (!payload.subarray(0, 4).equals(MAGIC)) {
    throw new Error('Invalid payload magic')
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, payload.subarray(4, 16))
  decipher.setAuthTag(payload.subarray(16, 32))
  return Buffer.concat([decipher.update(payload.subarray(32)), decipher.final()])
}
