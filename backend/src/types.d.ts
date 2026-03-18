import type {
  ImportMediaResult,
  MediaFilters,
  MediaItem,
  PreviewPayload,
  UpdateMediaInput,
  VaultStatus,
} from '../../shared/contracts'

declare global {
  interface Window {
    mediaNotebook: {
      getVaultStatus: () => Promise<VaultStatus>
      initializeVault: (password: string) => Promise<VaultStatus>
      unlockVault: (password: string) => Promise<VaultStatus>
      lockVault: () => Promise<VaultStatus>
      listMedia: (filters: MediaFilters) => Promise<MediaItem[]>
      pickFiles: () => Promise<string[]>
      importFiles: (filePaths: string[]) => Promise<ImportMediaResult>
      exportMedia: (id: string) => Promise<string | null>
      getThumbnail: (id: string) => Promise<PreviewPayload>
      getPreview: (id: string) => Promise<PreviewPayload>
      updateMedia: (id: string, input: UpdateMediaInput) => Promise<MediaItem>
      saveNote: (id: string, markdown: string) => Promise<MediaItem>
      deleteMedia: (id: string) => Promise<void>
      revealLibrary: () => Promise<void>
    }
  }
}

export {}
