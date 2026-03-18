import type { Dispatch, SetStateAction } from 'react'

import type { MediaFilters } from '@shared/contracts'

interface TopbarProps {
  filters: MediaFilters
  setFilters: Dispatch<SetStateAction<MediaFilters>>
  layout: 'grid' | 'list'
  setLayout: (layout: 'grid' | 'list') => void
  collections: string[]
  busy: boolean
  onImport: () => Promise<void>
  onLock: () => Promise<void>
}

export const Topbar = ({
  filters,
  setFilters,
  layout,
  setLayout,
  collections,
  busy,
  onImport,
  onLock,
}: TopbarProps) => (
  <header className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="grid flex-1 gap-3 md:grid-cols-[2fr_repeat(3,minmax(0,1fr))]">
        <input
          type="search"
          value={filters.query}
          onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
          placeholder="Search filename, tags, notes..."
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-accent"
        />
        <select
          value={filters.type}
          onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value as MediaFilters['type'] }))}
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-accent"
        >
          <option value="all">All types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
        </select>
        <select
          value={filters.collection}
          onChange={(event) => setFilters((current) => ({ ...current, collection: event.target.value }))}
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-accent"
        >
          <option value="all">All collections</option>
          {collections.map((collection) => (
            <option
              key={collection}
              value={collection}
            >
              {collection}
            </option>
          ))}
        </select>
        <select
          value={filters.sort}
          onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as MediaFilters['sort'] }))}
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-accent"
        >
          <option value="newest">Recently updated</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Filename A-Z</option>
          <option value="size-desc">Largest first</option>
          <option value="size-asc">Smallest first</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setFilters((current) => ({ ...current, favoriteOnly: !current.favoriteOnly }))}
          className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
            filters.favoriteOnly ? 'bg-accent text-slate-950' : 'border border-white/10 bg-slate-950/80 text-slate-200'
          }`}
        >
          Favorites only
        </button>
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-1">
          {(['grid', 'list'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLayout(option)}
              className={`rounded-xl px-4 py-2 text-sm transition ${layout === option ? 'bg-white text-slate-950' : 'text-slate-300'}`}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void onImport()}
          className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accentSoft disabled:opacity-60"
          disabled={busy}
        >
          {busy ? 'Working...' : 'Import media'}
        </button>
        <button
          type="button"
          onClick={() => void onLock()}
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-200"
        >
          Lock vault
        </button>
      </div>
    </div>
  </header>
)
