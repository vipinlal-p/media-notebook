import { FormEvent, useState } from 'react'

interface VaultGateProps {
  initialized: boolean
  busy: boolean
  error: string | null
  onInitialize: (password: string) => Promise<void>
  onUnlock: (password: string) => Promise<void>
}

export const VaultGate = ({ initialized, busy, error, onInitialize, onUnlock }: VaultGateProps) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)

    if (!initialized && password !== confirmPassword) {
      setLocalError('Passwords must match')
      return
    }

    if (!initialized) {
      await onInitialize(password)
      return
    }

    await onUnlock(password)
  }

  return (
    <div className="min-h-screen bg-canvas bg-spotlight px-6 py-10 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur">
          <p className="mb-3 inline-flex rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-accentSoft">
            Local-first vault
          </p>
          <h1 className="font-display text-5xl font-bold tracking-tight text-white">Media Notebook</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            A secure desktop vault for images, videos, and PDF documents with a cinematic library UI, instant search, and notebook-style annotations.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
              <p className="text-sm font-semibold text-white">AES-256-GCM</p>
              <p className="mt-2 text-sm text-slate-400">Each media file is encrypted before it lands in the local vault.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
              <p className="text-sm font-semibold text-white">PBKDF2-SHA512</p>
              <p className="mt-2 text-sm text-slate-400">Passwords are stretched, keys stay in memory only, and plaintext secrets are never stored.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
              <p className="text-sm font-semibold text-white">SQLite metadata</p>
              <p className="mt-2 text-sm text-slate-400">Collections, notes, tags, and thumbnails stay fast and local.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-panel/90 p-8">
          <h2 className="font-display text-3xl font-semibold text-white">{initialized ? 'Unlock your vault' : 'Create your vault password'}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {initialized
              ? 'Enter the vault password to decrypt media previews and metadata in this session.'
              : 'This password gates the encrypted vault. Keep it safe. The app cannot recover it for you.'}
          </p>
          <form
            className="mt-8 space-y-4"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Password</span>
              <input
                autoFocus
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-accent"
                placeholder="Enter a strong password"
                minLength={10}
                required
              />
            </label>
            {!initialized && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Confirm password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-accent"
                  placeholder="Repeat your password"
                  minLength={10}
                  required
                />
              </label>
            )}
            {(localError ?? error) && <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{localError ?? error}</p>}
            <button
              type="submit"
              className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950 transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
            >
              {busy ? 'Securing vault...' : initialized ? 'Unlock Media Notebook' : 'Create secure vault'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

