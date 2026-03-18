import { startTransition, useCallback, useDeferredValue, useEffect, useState } from 'react'

import type { MediaFilters, MediaItem, PreviewPayload, VaultStatus } from '@shared/contracts'

const defaultFilters: MediaFilters = {
  query: '',
  type: 'all',
  collection: 'all',
  favoriteOnly: false,
  sort: 'newest',
}

export const useLibrary = () => {
  const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null)
  const [filters, setFilters] = useState<MediaFilters>(defaultFilters)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const deferredQuery = useDeferredValue(filters.query)
  const selectedItem = media.find((item) => item.id === selectedId) ?? null

  const refreshStatus = async (): Promise<void> => {
    const status = await window.mediaNotebook.getVaultStatus()
    setVaultStatus(status)
  }

  const refreshMedia = useCallback(async (nextFilters: MediaFilters): Promise<void> => {
    if (!vaultStatus?.unlocked) {
      setMedia([])
      setSelectedId(null)
      setPreview(null)
      return
    }
    const items = await window.mediaNotebook.listMedia({
      ...nextFilters,
      query: deferredQuery,
    })
    startTransition(() => {
      setMedia(items)
      setSelectedId((current) => (current && items.some((item) => item.id === current) ? current : items[0]?.id ?? null))
    })
  }, [deferredQuery, vaultStatus?.unlocked])

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true)
        await refreshStatus()
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load vault')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!vaultStatus?.unlocked) {
      return
    }
    void refreshMedia({
      ...filters,
      query: deferredQuery,
    })
  }, [deferredQuery, filters, refreshMedia, vaultStatus?.unlocked])

  useEffect(() => {
    if (!selectedId || !vaultStatus?.unlocked) {
      setPreview(null)
      return
    }
    void (async () => {
      try {
        const nextPreview = await window.mediaNotebook.getPreview(selectedId)
        setPreview(nextPreview)
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to render preview')
      }
    })()
  }, [selectedId, vaultStatus?.unlocked])

  const initializeVault = async (password: string): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      const status = await window.mediaNotebook.initializeVault(password)
      setVaultStatus(status)
      await refreshMedia(defaultFilters)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to initialize vault')
      throw caughtError
    } finally {
      setBusy(false)
    }
  }

  const unlockVault = async (password: string): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      const status = await window.mediaNotebook.unlockVault(password)
      setVaultStatus(status)
      await refreshMedia({
        ...filters,
        query: deferredQuery,
      })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to unlock vault')
      throw caughtError
    } finally {
      setBusy(false)
    }
  }

  const lockVault = async (): Promise<void> => {
    const status = await window.mediaNotebook.lockVault()
    setVaultStatus(status)
    setMedia([])
    setSelectedId(null)
    setPreview(null)
  }

  const importFiles = async (filePaths: string[]): Promise<void> => {
    if (filePaths.length === 0) {
      return
    }
    setBusy(true)
    try {
      await window.mediaNotebook.importFiles(filePaths)
      await refreshStatus()
      await refreshMedia({
        ...filters,
        query: deferredQuery,
      })
    } finally {
      setBusy(false)
    }
  }

  const pickAndImport = async (): Promise<void> => {
    const filePaths = await window.mediaNotebook.pickFiles()
    await importFiles(filePaths)
  }

  const updateMedia = async (id: string, updates: Parameters<typeof window.mediaNotebook.updateMedia>[1]): Promise<void> => {
    const updated = await window.mediaNotebook.updateMedia(id, updates)
    setMedia((items) => items.map((item) => (item.id === id ? updated : item)))
  }

  const saveNote = async (id: string, markdown: string): Promise<void> => {
    const updated = await window.mediaNotebook.saveNote(id, markdown)
    setMedia((items) => items.map((item) => (item.id === id ? updated : item)))
  }

  const deleteMedia = async (id: string): Promise<void> => {
    setBusy(true)
    try {
      await window.mediaNotebook.deleteMedia(id)
      await refreshStatus()
      await refreshMedia({
        ...filters,
        query: deferredQuery,
      })
    } finally {
      setBusy(false)
    }
  }

  return {
    vaultStatus,
    filters,
    setFilters,
    media,
    selectedId,
    setSelectedId,
    selectedItem,
    preview,
    loading,
    busy,
    error,
    setError,
    initializeVault,
    unlockVault,
    lockVault,
    importFiles,
    pickAndImport,
    updateMedia,
    saveNote,
    deleteMedia,
  }
}
