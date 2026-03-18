import path from 'node:path'

import type { MediaType } from '../../../shared/contracts'

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'])
const videoExtensions = new Set(['.mp4', '.mov', '.mkv', '.avi', '.webm'])
const documentExtensions = new Set(['.pdf'])

export const detectMediaType = (filePath: string): MediaType | null => {
  const extension = path.extname(filePath).toLowerCase()
  if (imageExtensions.has(extension)) {
    return 'image'
  }
  if (videoExtensions.has(extension)) {
    return 'video'
  }
  if (documentExtensions.has(extension)) {
    return 'document'
  }
  return null
}

export const mimeTypeForPath = (filePath: string): string => {
  const extension = path.extname(filePath).toLowerCase()
  switch (extension) {
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.webp':
      return 'image/webp'
    case '.gif':
      return 'image/gif'
    case '.bmp':
      return 'image/bmp'
    case '.svg':
      return 'image/svg+xml'
    case '.mp4':
      return 'video/mp4'
    case '.mov':
      return 'video/quicktime'
    case '.mkv':
      return 'video/x-matroska'
    case '.avi':
      return 'video/x-msvideo'
    case '.webm':
      return 'video/webm'
    case '.pdf':
      return 'application/pdf'
    default:
      return 'application/octet-stream'
  }
}

