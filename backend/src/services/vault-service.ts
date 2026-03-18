import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { dialog, shell } from 'electron'

import type {
  ImportMediaResult,
  MediaFilters,
  MediaItem,
  PreviewPayload,
  UpdateMediaInput,
  VaultStatus,
} from '../../../shared/contracts'

import { MediaDatabase } from '../db/database'
import { createSalt, createVerifier, decryptFile, deriveKey, encryptFile } from '../utils/crypto'
import { detectMediaType, mimeTypeForPath } from '../utils/file-type'
import { createId } from '../utils/ids'
import { nowIso } from '../utils/time'
import { logger } from './logger'
import type { AppPaths } from './paths'
import { SettingsService } from './settings-service'
import { ThumbnailService } from './thumbnail-service'

export class VaultService {
  private key: Buffer | null = null

  private readonly db: MediaDatabase
  private readonly settings: SettingsService
  private readonly thumbnails: ThumbnailService

  public constructor(private readonly appPaths: AppPaths) {
    this.db = new MediaDatabase(appPaths.databasePath)
    this.settings = new SettingsService(appPaths)
    this.thumbnails = new ThumbnailService(appPaths.thumbnailDir, appPaths.previewDir)
    this.clearPreviewCache()
  }

  public getStatus(): VaultStatus {
    return this.settings.getStatus(this.key !== null, this.db.countMedia())
  }

  public async initialize(password: string): Promise<VaultStatus> {
    if (password.length < 10) {
      throw new Error('Use a password with at least 10 characters')
    }
    if (this.settings.getSettings()) {
      throw new Error('Vault already initialized')
    }
    const salt = createSalt()
    const key = await deriveKey(password, salt)
    this.settings.saveSettings(this.settings.createVaultConfig(salt, createVerifier(key)))
    this.key = key
    logger.info('Vault initialized')
    return this.getStatus()
  }

  public async unlock(password: string): Promise<VaultStatus> {
    const key = await this.settings.verifyPassword(password)
    if (!key) {
      throw new Error('Invalid password')
    }
    this.key = key
    logger.info('Vault unlocked')
    return this.getStatus()
  }

  public lock(): VaultStatus {
    this.key = null
    this.clearPreviewCache()
    return this.getStatus()
  }

  public listMedia(filters: MediaFilters): MediaItem[] {
    this.assertUnlocked()
    return this.db.listMedia(filters)
  }

  public async importFiles(filePaths: string[]): Promise<ImportMediaResult> {
    this.assertUnlocked()
    const imported: MediaItem[] = []
    const skipped: string[] = []

    for (const filePath of filePaths) {
      try {
        const type = detectMediaType(filePath)
        if (!type) {
          skipped.push(filePath)
          continue
        }

        const stats = await fs.promises.stat(filePath)
        if (!stats.isFile()) {
          skipped.push(filePath)
          continue
        }

        const id = createId()
        const encryptedPath = path.join(this.appPaths.mediaDir, `${id}.bin`)
        const thumbnailPath = await this.thumbnails.createThumbnail(id, filePath, type, path.basename(filePath), this.key as Buffer)

        await encryptFile(filePath, encryptedPath, this.key as Buffer)

        const timestamp = nowIso()
        const item: Omit<MediaItem, 'noteMarkdown'> = {
          id,
          filename: path.basename(filePath),
          path: encryptedPath,
          type,
          tags: [],
          collection: 'Inbox',
          favorite: false,
          createdAt: timestamp,
          updatedAt: timestamp,
          thumbnailPath,
          sizeBytes: stats.size,
        }
        this.db.insertMedia(item)
        imported.push({ ...item, noteMarkdown: '' })
      } catch (error) {
        logger.error('Failed to import file', { filePath, error })
        skipped.push(filePath)
      }
    }

    logger.info('Imported media', { imported: imported.length, skipped: skipped.length })
    return { imported, skipped }
  }

  public async pickFiles(): Promise<string[]> {
    const result = await dialog.showOpenDialog({
      title: 'Import media',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Supported media', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg', 'mp4', 'mov', 'mkv', 'avi', 'webm', 'pdf'] },
      ],
    })
    return result.canceled ? [] : result.filePaths
  }

  public async exportMedia(id: string): Promise<string | null> {
    this.assertUnlocked()
    const item = this.db.getMedia(id)
    if (!item) {
      throw new Error('Media item not found')
    }
    const result = await dialog.showSaveDialog({
      title: 'Export decrypted media',
      defaultPath: item.filename,
    })
    if (result.canceled || !result.filePath) {
      return null
    }
    await decryptFile(item.path, result.filePath, this.key as Buffer)
    return result.filePath
  }

  public async getThumbnail(id: string): Promise<PreviewPayload> {
    this.assertUnlocked()
    const item = this.db.getMedia(id)
    if (!item) {
      throw new Error('Media item not found')
    }

    const thumbnailPath = item.thumbnailPath
    const outputPath = thumbnailPath
      ? await this.thumbnails.materializeThumbnail(id, thumbnailPath, item.filename, item.type, this.key as Buffer)
      : path.join(this.appPaths.previewDir, `thumb-${id}.svg`)

    return {
      url: pathToFileURL(outputPath).toString(),
      mimeType: this.thumbnails.getThumbnailMimeType(item.type),
      mode: 'file',
    }
  }

  public async getPreview(id: string): Promise<PreviewPayload> {
    this.assertUnlocked()
    const item = this.db.getMedia(id)
    if (!item) {
      throw new Error('Media item not found')
    }
    const previewPath = path.join(this.appPaths.previewDir, `${id}${path.extname(item.filename)}`)
    if (!fs.existsSync(previewPath)) {
      await decryptFile(item.path, previewPath, this.key as Buffer)
    }
    return {
      url: pathToFileURL(previewPath).toString(),
      mimeType: mimeTypeForPath(item.filename),
      mode: 'file',
    }
  }

  public updateMedia(id: string, input: UpdateMediaInput): MediaItem {
    this.assertUnlocked()
    return this.db.updateMedia(id, input)
  }

  public saveNote(id: string, markdown: string): MediaItem {
    this.assertUnlocked()
    return this.db.saveNote(id, markdown)
  }

  public async deleteMedia(id: string): Promise<void> {
    this.assertUnlocked()
    const item = this.db.deleteMedia(id)
    if (!item) {
      return
    }
    await fs.promises.rm(item.path, { force: true })
    if (item.thumbnailPath) {
      await fs.promises.rm(item.thumbnailPath, { force: true })
    }
    const previewPath = path.join(this.appPaths.previewDir, `${id}${path.extname(item.filename)}`)
    await fs.promises.rm(previewPath, { force: true })
  }

  public async revealLibrary(): Promise<void> {
    const result = await shell.openPath(this.appPaths.root)
    if (result) {
      await dialog.showMessageBox({
        title: 'Library path',
        message: this.appPaths.root,
        detail: 'The vault path could not be opened automatically on this device.',
      })
    }
  }

  private clearPreviewCache(): void {
    fs.rmSync(this.appPaths.previewDir, { recursive: true, force: true })
    fs.mkdirSync(this.appPaths.previewDir, { recursive: true })
  }

  private assertUnlocked(): asserts this is this & { key: Buffer } {
    if (!this.key) {
      throw new Error('Vault is locked')
    }
  }
}
