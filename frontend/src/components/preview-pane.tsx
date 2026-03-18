import { useMemo, useState } from 'react'

import { marked } from 'marked'

import type { MediaItem, PreviewPayload } from '@shared/contracts'

import { formatBytes, formatDate } from '../lib/format'

interface PreviewPaneProps {
  item: MediaItem | null
  preview: PreviewPayload | null
  onUpdate: (id: string, updates: { tags?: string[]; collection?: string; favorite?: boolean }) => Promise<void>
  onSaveNote: (id: string, markdown: string) => Promise<void>
  onExport: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export const PreviewPane = ({ item, preview, onUpdate, onSaveNote, onExport, onDelete }: PreviewPaneProps) => {
  const [tagInput, setTagInput] = useState(() => item?.tags.join(', ') ?? '')
  const [collectionInput, setCollectionInput] = useState(() => item?.collection ?? 'Inbox')
  const [noteDraft, setNoteDraft] = useState(() => item?.noteMarkdown ?? '')

  const renderer = useMemo(() => {
    const nextRenderer = new marked.Renderer()
    nextRenderer.html = () => ''
    return nextRenderer
  }, [])

  const noteMarkup = useMemo(
    () =>
      ({
        __html: marked.parse(noteDraft || '*No markdown note yet.*', {
          breaks: true,
          gfm: true,
          renderer,
        }) as string,
      }) satisfies { __html: string },
    [noteDraft, renderer],
  )

  if (!item) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 text-slate-400">
        Select a media item to inspect details, preview the decrypted asset, and attach notes.
      </section>
    )
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">{item.filename}</h2>
          <p className="mt-2 text-sm text-slate-400">{item.collection} collection</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void onUpdate(item.id, { favorite: !item.favorite })}
            className={`rounded-2xl px-4 py-2 text-sm font-medium ${item.favorite ? 'bg-accent text-slate-950' : 'border border-white/10 bg-slate-950/80 text-slate-200'}`}
          >
            {item.favorite ? 'Favorited' : 'Add favorite'}
          </button>
          <button
            type="button"
            onClick={() => void onExport(item.id)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2 text-sm text-slate-200"
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => void onDelete(item.id)}
            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/80">
        {preview && item.type === 'image' && <img className="max-h-[28rem] w-full object-contain" src={preview.url} alt={item.filename} />}
        {preview && item.type === 'video' && <video className="max-h-[28rem] w-full" src={preview.url} controls playsInline />}
        {preview && item.type === 'document' && <iframe className="h-[28rem] w-full bg-white" src={preview.url} title={item.filename} />}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Metadata</p>
            <dl className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex justify-between gap-4">
                <dt>Type</dt>
                <dd>{item.type}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Size</dt>
                <dd>{formatBytes(item.sizeBytes)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Created</dt>
                <dd>{formatDate(item.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Updated</dt>
                <dd>{formatDate(item.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4">
            <label className="block text-sm font-medium text-slate-200">
              Collection
              <input
                value={collectionInput}
                onChange={(event) => setCollectionInput(event.target.value)}
                onBlur={() => void onUpdate(item.id, { collection: collectionInput.trim() || 'Inbox' })}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-accent"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-200">
              Tags
              <input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onBlur={() =>
                  void onUpdate(item.id, {
                    tags: tagInput
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  })
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-accent"
                placeholder="travel, invoice, inspiration"
              />
            </label>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold text-white">Notebook</h3>
            <button
              type="button"
              onClick={() => void onSaveNote(item.id, noteDraft)}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Save note
            </button>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              className="min-h-64 rounded-[1.5rem] border border-white/10 bg-slate-950/80 px-4 py-4 text-sm leading-6 text-slate-100 outline-none focus:border-accent"
              placeholder={'# Scene notes\n\n- Key visual motif\n- Quote or caption\n- Follow-up tasks'}
            />
            <div
              className="prose prose-invert min-h-64 max-w-none rounded-[1.5rem] border border-white/10 bg-slate-950/80 px-4 py-4 text-sm"
              dangerouslySetInnerHTML={noteMarkup}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
