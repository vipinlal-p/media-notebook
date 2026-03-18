import { useMemo, useState } from 'react'

import type { AppShellState } from '@shared/contracts'

import { MediaLibrary } from './components/media-library'
import { PreviewPane } from './components/preview-pane'
import { SettingsPanel } from './components/settings-panel'
import { Sidebar } from './components/sidebar'
import { Topbar } from './components/topbar'
import { VaultGate } from './components/vault-gate'
import { useLibrary } from './hooks/use-library'

export const App = () => {
  const {
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
    initializeVault,
    unlockVault,
    lockVault,
    importFiles,
    pickAndImport,
    updateMedia,
    saveNote,
    deleteMedia,
  } = useLibrary()
  const [shell, setShell] = useState<AppShellState>({ view: 'collections', layout: 'grid' })
  const [dragging, setDragging] = useState(false)

  const collections = useMemo(() => Array.from(new Set(media.map((item) => item.collection))).sort(), [media])
  const tags = useMemo(() => Array.from(new Set(media.flatMap((item) => item.tags))).sort(), [media])
  const filteredMedia = useMemo(
    () => (shell.view === 'favorites' || filters.favoriteOnly ? media.filter((item) => item.favorite) : media),
    [filters.favoriteOnly, media, shell.view],
  )

  if (loading || !vaultStatus) {
    return <div className="flex min-h-screen items-center justify-center bg-canvas text-slate-300">Loading secure workspace...</div>
  }

  if (!vaultStatus.unlocked) {
    return (
      <VaultGate
        initialized={vaultStatus.initialized}
        busy={busy}
        error={error}
        onInitialize={initializeVault}
        onUnlock={unlockVault}
      />
    )
  }

  return (
    <div
      className="min-h-screen bg-canvas bg-spotlight px-5 py-5 text-white"
      onDragEnter={() => setDragging(true)}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        const filePaths = Array.from(event.dataTransfer.files)
          .map((file) => (file as File & { path?: string }).path)
          .filter((path): path is string => Boolean(path))
        void importFiles(filePaths)
      }}
    >
      {dragging && (
        <div className="pointer-events-none fixed inset-4 z-50 flex items-center justify-center rounded-[2rem] border-2 border-dashed border-accent bg-slate-950/80 text-xl font-semibold text-white">
          Drop files to import into the encrypted vault
        </div>
      )}

      <div className="grid min-h-[calc(100vh-2.5rem)] gap-5 xl:grid-cols-[300px_1fr]">
        <Sidebar
          shell={shell}
          setShell={setShell}
          collections={collections}
          tags={tags}
          mediaCount={vaultStatus.mediaCount}
        />

        <main className="space-y-5">
          <Topbar
            filters={filters}
            setFilters={setFilters}
            layout={shell.layout}
            setLayout={(layout) => setShell((current) => ({ ...current, layout }))}
            collections={collections}
            busy={busy}
            onImport={pickAndImport}
            onLock={lockVault}
          />

          {shell.view === 'settings' ? (
            <SettingsPanel
              libraryPath={vaultStatus.libraryPath}
              onRevealLibrary={window.mediaNotebook.revealLibrary}
            />
          ) : (
            <div className="grid gap-5 2xl:grid-cols-[1.1fr_0.9fr]">
              <MediaLibrary
                items={filteredMedia}
                selectedId={selectedId}
                layout={shell.layout}
                onSelect={setSelectedId}
              />
              <PreviewPane
                key={selectedItem?.id ?? 'empty'}
                item={selectedItem}
                preview={preview}
                onUpdate={updateMedia}
                onSaveNote={saveNote}
                onExport={async (id) => {
                  await window.mediaNotebook.exportMedia(id)
                }}
                onDelete={deleteMedia}
              />
            </div>
          )}
        </main>
      </div>

      {error && (
        <div className="fixed bottom-5 right-5 z-[60] rounded-2xl border border-red-500/30 bg-red-950/85 px-4 py-3 text-sm text-red-100 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          {error}
        </div>
      )}
    </div>
  )
}
