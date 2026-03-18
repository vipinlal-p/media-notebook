import path from 'node:path'

import { app, BrowserWindow, dialog, ipcMain } from 'electron'

import type { MediaFilters, UpdateMediaInput } from '../../shared/contracts'

import { logger } from './services/logger'
import { resolveAppPaths } from './services/paths'
import { VaultService } from './services/vault-service'

let mainWindow: BrowserWindow | null = null
let vaultService: VaultService

const isDevelopment = !app.isPackaged

const createWindow = async (): Promise<void> => {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: '#070b14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (isDevelopment) {
    await mainWindow.loadURL('http://127.0.0.1:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
    return
  }

  await mainWindow.loadFile(path.join(__dirname, '../../frontend/dist/index.html'))
}

app.whenReady().then(async () => {
  vaultService = await VaultService.create(resolveAppPaths())

  ipcMain.handle('vault:status', () => vaultService.getStatus())
  ipcMain.handle('vault:initialize', (_event, password: string) => vaultService.initialize(password))
  ipcMain.handle('vault:unlock', (_event, password: string) => vaultService.unlock(password))
  ipcMain.handle('vault:lock', () => vaultService.lock())
  ipcMain.handle('media:list', (_event, filters: MediaFilters) => vaultService.listMedia(filters))
  ipcMain.handle('media:pick-files', () => vaultService.pickFiles())
  ipcMain.handle('media:import', (_event, filePaths: string[]) => vaultService.importFiles(filePaths))
  ipcMain.handle('media:export', (_event, id: string) => vaultService.exportMedia(id))
  ipcMain.handle('media:thumbnail', (_event, id: string) => vaultService.getThumbnail(id))
  ipcMain.handle('media:preview', (_event, id: string) => vaultService.getPreview(id))
  ipcMain.handle('media:update', (_event, id: string, input: UpdateMediaInput) => vaultService.updateMedia(id, input))
  ipcMain.handle('media:save-note', (_event, id: string, markdown: string) => vaultService.saveNote(id, markdown))
  ipcMain.handle('media:delete', (_event, id: string) => vaultService.deleteMedia(id))
  ipcMain.handle('app:reveal-library', () => vaultService.revealLibrary())

  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

process.on('uncaughtException', (error) => {
  logger.error('Unhandled exception', error)
  void dialog.showErrorBox('Media Notebook error', error.message)
})
