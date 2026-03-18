import type { Dispatch, SetStateAction } from 'react'

import type { AppShellState } from '@shared/contracts'

interface SidebarProps {
  shell: AppShellState
  setShell: Dispatch<SetStateAction<AppShellState>>
  collections: string[]
  tags: string[]
  mediaCount: number
}

export const Sidebar = ({ shell, setShell, collections, tags, mediaCount }: SidebarProps) => (
  <aside className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/5 p-5">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accentSoft">Vipinlal P</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-white">Media Notebook</h1>
      <p className="mt-2 text-sm text-slate-400">{mediaCount} encrypted items ready to browse.</p>
    </div>

    <nav className="mt-8 space-y-2">
      {[
        { id: 'collections', label: 'Collections' },
        { id: 'favorites', label: 'Favorites' },
        { id: 'settings', label: 'Settings' },
      ].map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setShell((current) => ({ ...current, view: item.id as AppShellState['view'] }))}
          className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
            shell.view === item.id ? 'bg-accent text-slate-950' : 'bg-slate-950/50 text-slate-200 hover:bg-slate-900'
          }`}
        >
          <span className="font-medium">{item.label}</span>
        </button>
      ))}
    </nav>

    <section className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Collections</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {collections.map((collection) => (
          <span
            key={collection}
            className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-xs text-slate-300"
          >
            {collection}
          </span>
        ))}
      </div>
    </section>

    <section className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Tags</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-xs text-slate-300"
            >
              #{tag}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-500">Add tags to keep your catalog tidy.</span>
        )}
      </div>
    </section>
  </aside>
)
