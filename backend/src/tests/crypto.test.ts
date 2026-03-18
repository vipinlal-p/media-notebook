import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

import { createSalt, createVerifier, decryptBuffer, decryptFile, deriveKey, encryptBuffer, encryptFile } from '../utils/crypto'

test('deriveKey and verifier are stable for the same password + salt', async () => {
  const salt = createSalt()
  const first = await deriveKey('correct horse battery staple', salt)
  const second = await deriveKey('correct horse battery staple', salt)

  assert.deepEqual(first, second)
  assert.equal(createVerifier(first), createVerifier(second))
})

test('encryptBuffer/decryptBuffer round trips payload', async () => {
  const key = await deriveKey('buffer-passphrase', createSalt())
  const payload = Buffer.from('media-notebook')
  const encrypted = encryptBuffer(payload, key)
  const decrypted = decryptBuffer(encrypted, key)

  assert.deepEqual(decrypted, payload)
})

test('encryptFile/decryptFile round trips file contents', async () => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'mn-'))
  const source = path.join(directory, 'source.txt')
  const encrypted = path.join(directory, 'source.bin')
  const restored = path.join(directory, 'restored.txt')
  await fs.promises.writeFile(source, 'local first and encrypted', 'utf8')

  const key = await deriveKey('file-passphrase', createSalt())
  await encryptFile(source, encrypted, key)
  await decryptFile(encrypted, restored, key)

  assert.equal(await fs.promises.readFile(restored, 'utf8'), 'local first and encrypted')
})

