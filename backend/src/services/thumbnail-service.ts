import fs from 'node:fs'
import path from 'node:path'

import type { MediaType } from '../../../shared/contracts'
import { decryptBuffer, encryptBuffer } from '../utils/crypto'

const escapeHtml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

const imageMime = 'image/svg+xml'

export class ThumbnailService {
  public constructor(
    private readonly encryptedThumbnailDir: string,
    private readonly previewDir: string,
  ) {}

  public async createThumbnail(id: string, sourcePath: string, type: MediaType, title: string, key: Buffer): Promise<string> {
    const payload = await this.buildThumbnailPayload(sourcePath, type, title)
    const outputPath = path.join(this.encryptedThumbnailDir, `${id}.thumb`)
    await fs.promises.mkdir(this.encryptedThumbnailDir, { recursive: true })
    await fs.promises.writeFile(outputPath, encryptBuffer(payload, key))
    return outputPath
  }

  public async materializeThumbnail(id: string, encryptedPath: string, title: string, type: MediaType, key: Buffer): Promise<string> {
    const outputExtension = type === 'image' ? '.jpg' : '.svg'
    const outputPath = path.join(this.previewDir, `thumb-${id}${outputExtension}`)
    if (fs.existsSync(outputPath)) {
      return outputPath
    }

    const encryptedPayload = await fs.promises.readFile(encryptedPath)
    let payload: Buffer
    try {
      payload = decryptBuffer(encryptedPayload, key)
    } catch {
      payload = await this.buildPlaceholderPayload(type, title)
    }

    await fs.promises.mkdir(this.previewDir, { recursive: true })
    await fs.promises.writeFile(outputPath, payload)
    return outputPath
  }

  public getThumbnailMimeType(type: MediaType): string {
    return type === 'image' ? imageMime : 'image/svg+xml'
  }

  private async buildThumbnailPayload(sourcePath: string, type: MediaType, title: string): Promise<Buffer> {
    void sourcePath
    return this.buildPlaceholderPayload(type, title)
  }

  private async buildPlaceholderPayload(type: MediaType, title: string): Promise<Buffer> {
    const accent = type === 'video' ? '#ff6d42' : type === 'document' ? '#4fd1a1' : '#87a3ff'
    const label = type === 'video' ? 'VIDEO' : type === 'document' ? 'PDF' : 'IMAGE'
    const safeTitle = escapeHtml(title)
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
    </svg>`
    return Buffer.from(svg, 'utf8')
  }
}
