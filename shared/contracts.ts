export type MediaType = 'image' | 'video' | 'document'

export type SortOption = 'newest' | 'oldest' | 'name' | 'size-desc' | 'size-asc'

export interface MediaItem {
  id: string
  filename: string
  path: string
  type: MediaType
  tags: string[]
  collection: string
  favorite: boolean
  createdAt: string
  updatedAt: string
  thumbnailPath: string | null
  sizeBytes: number
  noteMarkdown: string
}

export interface MediaFilters {
  query: string
  type: MediaType | 'all'
  collection: string | 'all'
  favoriteOnly: boolean
  sort: SortOption
}

export interface VaultStatus {
  initialized: boolean
  unlocked: boolean
  libraryPath: string
  mediaCount: number
}

export interface ImportMediaResult {
  imported: MediaItem[]
  skipped: string[]
}

export interface PreviewPayload {
  url: string
  mimeType: string
  mode: 'file'
}

export interface UpdateMediaInput {
  tags?: string[]
  collection?: string
  favorite?: boolean
}

export interface AppShellState {
  view: 'collections' | 'favorites' | 'settings'
  layout: 'grid' | 'list'
}

