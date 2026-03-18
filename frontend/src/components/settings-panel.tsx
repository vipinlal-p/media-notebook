interface SettingsPanelProps {
  libraryPath: string
  onRevealLibrary: () => Promise<void>
}

export const SettingsPanel = ({ libraryPath, onRevealLibrary }: SettingsPanelProps) => (
  <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
    <h2 className="font-display text-2xl font-semibold text-white">Settings</h2>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Vault storage</p>
        <p className="mt-3 break-all text-sm text-slate-300">{libraryPath}</p>
        <button
          type="button"
          onClick={() => void onRevealLibrary()}
          className="mt-4 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Show library path
        </button>
      </div>
      <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Security notes</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
          <li>Media files are encrypted with AES-256-GCM before they are stored.</li>
          <li>The password-derived vault key stays in memory only for the current unlock session.</li>
          <li>Decrypted previews are generated on demand and purged when the vault locks.</li>
        </ul>
      </div>
    </div>
  </section>
)

