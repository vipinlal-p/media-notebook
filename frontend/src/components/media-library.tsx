import { useMemo, useState } from 'react'

import type { MediaItem } from '@shared/contracts'

import { formatBytes, formatDate } from '../lib/format'
import { ThumbnailImage } from './thumbnail-image'

interface MediaLibraryProps {
  items: MediaItem[]
  selectedId: string | null
  layout: 'grid' | 'list'
  onSelect: (id: string) => void
}

export const MediaLibrary = ({ items, selectedId, layout, onSelect }: MediaLibraryProps) => {
  const [visibleCount, setVisibleCount] = useState(24)
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount])

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">Encrypted Library</h2>
          <p className="text-sm text-slate-400">Browse cached thumbnails and open secure previews on demand.</p>
        </div>
        {items.length > visibleCount && (
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + 24)}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-slate-200"
          >
            Load more
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/50 px-6 py-14 text-center text-slate-400">
          Import a few images, videos, or PDFs to begin building your private catalog.
        </div>
      ) : (
        <div className={layout === 'grid' ? 'grid gap-5 md:grid-cols-2 2xl:grid-cols-3' : 'space-y-3'}>
          {visibleItems.map((item) => {
            const isSelected = item.id === selectedId
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`group overflow-hidden rounded-[1.5rem] border text-left transition ${
                  isSelected ? 'border-accent shadow-glow' : 'border-white/10 hover:border-white/30'
                } ${layout === 'grid' ? 'bg-slate-950/60' : 'flex w-full items-center gap-4 bg-slate-950/60 p-3'}`}
              >
                <ThumbnailImage
                  id={item.id}
                  alt={item.filename}
                  className={
                    layout === 'grid'
                      ? 'h-52 w-full transition duration-500 group-hover:scale-[1.03]'
                      : 'h-20 w-32 rounded-2xl'
                  }
                />
                <div className={layout === 'grid' ? 'space-y-3 p-4' : 'flex-1'}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-white">{item.filename}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">{item.type}</p>
                    </div>
                    {item.favorite && <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-slate-950">Favorite</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                    <span>{item.collection}</span>
                    <span>{formatBytes(item.sizeBytes)}</span>
                    <span>{formatDate(item.updatedAt)}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
