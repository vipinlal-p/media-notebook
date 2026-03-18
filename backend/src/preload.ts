import { contextBridge, ipcRenderer } from 'electron'

import type {
  ImportMediaResult,
  MediaFilters,
  MediaItem,
  PreviewPayload,
  UpdateMediaInput,
  VaultStatus,
} from '../../shared/contracts'

const api = {
  getVaultStatus: (): Promise<VaultStatus> => ipcRenderer.invoke('vault:status'),
  initializeVault: (password: string): Promise<VaultStatus> => ipcRenderer.invoke('vault:initialize', password),
  unlockVault: (password: string): Promise<VaultStatus> => ipcRenderer.invoke('vault:unlock', password),
  lockVault: (): Promise<VaultStatus> => ipcRenderer.invoke('vault:lock'),
  listMedia: (filters: MediaFilters): Promise<MediaItem[]> => ipcRenderer.invoke('media:list', filters),
  pickFiles: (): Promise<string[]> => ipcRenderer.invoke('media:pick-files'),
  importFiles: (filePaths: string[]): Promise<ImportMediaResult> => ipcRenderer.invoke('media:import', filePaths),
  exportMedia: (id: string): Promise<string | null> => ipcRenderer.invoke('media:export', id),
  getThumbnail: (id: string): Promise<PreviewPayload> => ipcRenderer.invoke('media:thumbnail', id),
  getPreview: (id: string): Promise<PreviewPayload> => ipcRenderer.invoke('media:preview', id),
  updateMedia: (id: string, input: UpdateMediaInput): Promise<MediaItem> => ipcRenderer.invoke('media:update', id, input),
  saveNote: (id: string, markdown: string): Promise<MediaItem> => ipcRenderer.invoke('media:save-note', id, markdown),
  deleteMedia: (id: string): Promise<void> => ipcRenderer.invoke('media:delete', id),
  revealLibrary: (): Promise<void> => ipcRenderer.invoke('app:reveal-library'),
}

contextBridge.exposeInMainWorld('mediaNotebook', api)
