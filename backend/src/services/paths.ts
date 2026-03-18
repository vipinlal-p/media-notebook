import fs from 'node:fs'
import path from 'node:path'

import { app } from 'electron'

export interface AppPaths {
  root: string
  mediaDir: string
  previewDir: string
  thumbnailDir: string
  databasePath: string
  settingsPath: string
}

export const resolveAppPaths = (): AppPaths => {
  const root = path.join(app.getPath('userData'), 'vault-data')
  const mediaDir = path.join(root, 'media')
  const previewDir = path.join(root, 'previews')
  const thumbnailDir = path.join(root, 'thumbnails')
  fs.mkdirSync(mediaDir, { recursive: true })
  fs.mkdirSync(previewDir, { recursive: true })
  fs.mkdirSync(thumbnailDir, { recursive: true })

  return {
    root,
    mediaDir,
    previewDir,
    thumbnailDir,
    databasePath: path.join(root, 'media-notebook.db'),
    settingsPath: path.join(root, 'settings.json'),
  }
}

