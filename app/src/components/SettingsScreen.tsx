import type { AppStore } from '../store'
import { useMusic, togglePlay, nextTrack, prevTrack, toggleLoop, setMusicVolume, selectTrack } from '../music'
import { exportAllData } from '../persistence'
import Header from './Header'
import SpotifyPanel from './SpotifyPanel'

interface Props {
  store: AppStore
  closeSettings: () => void
}

/** Full-screen Settings (DESIGN_V3 §3.11): Timer, Sound, Music, Data & Privacy. */
export default function SettingsScreen({ store, closeSettings }: Props) {
  const { state, settings, setMode, setCountUp, toggleSound, setSoundVolume, refreshSettings, clearFocusHistory, clearCompletedTasks } = store
  const music = useMusic()
  const sessionActive = state.status === 'running' || state.status === 'paused'

  const handleClearHistory = () => {
    if (window.confirm('Permanently delete all recorded focus sessions? This cannot be undone.')) {
      clearFocusHistory()
    }
  }

  const handleClearCompleted = () => {
    if (window.confirm('Clear all completed tasks? This cannot be undone.')) {
      clearCompletedTasks()
    }
  }

  return (
    <div className="relative w-full ethereal-bg overflow-y-auto" style={{ height: '100%' }}>
      <div className="absolute top-[2%] left-[3%] w-96 h-96 rounded-full blur-[60px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.45) 0%, rgba(236,72,153,0.15) 50%, transparent 70%)' }} />
      <div className="absolute top-[30%] right-[2%] w-[420px] h-[420px] rounded-full blur-[65px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.50) 0%, rgba(139,92,246,0.18) 50%, transparent 70%)' }} />

      <Header
        mode={state.mode}
        sessionActive={sessionActive}
        soundEnabled={settings.soundEnabled}
        setMode={setMode}
        toggleSound={toggleSound}
        openSettings={closeSettings}
        hideToggle
      />

      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="material-symbols-outlined text-primary text-2xl">settings</span>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>Settings</h1>
        </div>

        {/* ── Timer ── */}
        <SettingsCard icon="timer" title="Timer" subtitle="Control how the focus timer counts.">
          <SettingsRow title="Timer Direction" subtitle="Count down from a preset, or count up from zero." last>
            <Segmented
              options={[
                { label: 'Count Down', value: false },
                { label: 'Count Up', value: true },
              ]}
              value={settings.countUp}
              onChange={v => setCountUp(v)}
            />
          </SettingsRow>
        </SettingsCard>

        {/* ── Sound ── */}
        <SettingsCard icon="volume_up" title="Sound" subtitle="Chimes and audio feedback.">
          <SettingsRow title="Sound Effects" subtitle="Chimes for session start, pause, and completion.">
            <Toggle checked={settings.soundEnabled} onChange={toggleSound} label="Sound effects" />
          </SettingsRow>
          <SettingsRow title="Sound Volume" subtitle="Volume for all sound effects." last>
            <VolumeSlider value={settings.soundVolume} onChange={setSoundVolume} label="Sound volume" />
          </SettingsRow>
        </SettingsCard>

        {/* ── Music ── */}
        <SettingsCard icon="music_note" title="Music" subtitle="Background music for your focus sessions.">
          <div className="rounded-2xl bg-white/70 border border-slate-100 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">Lofi Library · Built-in</p>
            <div className="space-y-1 mb-4">
              {music.tracks.map((t, i) => {
                const active = i === music.activeTrackIndex
                return (
                  <button
                    key={t.id}
                    onClick={() => selectTrack(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl text-left transition-colors ${
                      active ? 'bg-primary/10 border border-primary/30' : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        {active && music.isPlaying ? 'equalizer' : 'music_note'}
                      </span>
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-sm font-semibold truncate ${active ? 'text-primary' : 'text-slate-700'}`}>{t.title}</span>
                      <span className="block text-xs text-slate-400 truncate">{t.artist}</span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono shrink-0">{t.duration}</span>
                  </button>
                )
              })}
              {music.tracks.length === 0 && <p className="text-xs text-slate-400 italic px-2 py-3">Loading library…</p>}
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button onClick={prevTrack} className="w-10 h-10 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors" aria-label="Previous track">
                  <span className="material-symbols-outlined text-xl">skip_previous</span>
                </button>
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-fixed transition-colors shadow-md shadow-primary/25"
                  aria-label={music.isPlaying ? 'Pause music' : 'Play music'}
                >
                  <span className="material-symbols-outlined text-2xl">{music.isPlaying ? 'pause' : 'play_arrow'}</span>
                </button>
                <button onClick={nextTrack} className="w-10 h-10 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors" aria-label="Next track">
                  <span className="material-symbols-outlined text-xl">skip_next</span>
                </button>
                <button
                  onClick={toggleLoop}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    music.loop ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  aria-label={music.loop ? 'Disable loop' : 'Loop current track'}
                  aria-pressed={music.loop}
                >
                  <span className="material-symbols-outlined text-xl">repeat</span>
                </button>
              </div>
              <div className="flex items-center gap-2 min-w-[160px] flex-1 max-w-[220px]">
                <span className="material-symbols-outlined text-slate-400 text-base">volume_down</span>
                <VolumeSlider value={music.volume} onChange={setMusicVolume} label="Music volume" hidePercent />
              </div>
            </div>
          </div>

          <SpotifyPanel connected={settings.spotifyConnected} onConnectionChange={refreshSettings} />
        </SettingsCard>

        {/* ── Data & Privacy ── */}
        <SettingsCard icon="shield" title="Data & Privacy" subtitle="Manage your data">
          <SettingsRow title="Clear focus history" subtitle="Permanently delete all recorded focus sessions.">
            <DangerButton label="Clear" onClick={handleClearHistory} />
          </SettingsRow>
          <SettingsRow title="Clear completed tasks" subtitle="Remove every completed task from the log.">
            <DangerButton label="Clear" onClick={handleClearCompleted} />
          </SettingsRow>
          <SettingsRow title="Export data (JSON)" subtitle="Download a full copy of your data." last>
            <button
              onClick={exportAllData}
              className="flex items-center gap-1.5 px-5 py-2 min-h-[40px] rounded-full bg-primary text-white text-sm font-bold hover:bg-primary-fixed transition-colors shadow-md shadow-primary/25"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Export
            </button>
          </SettingsRow>
        </SettingsCard>

        <div className="text-center mt-8">
          <button
            onClick={closeSettings}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors px-5 py-2.5"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to timer
          </button>
        </div>
      </main>
    </div>
  )
}

// ── Local building blocks ─────────────────────────────────────────────────

function SettingsCard({ icon, title, subtitle, children }: { icon: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="frosted-glass rounded-2xl p-5 sm:p-6 mb-5">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function SettingsRow({ title, subtitle, children, last }: { title: string; subtitle: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 flex-wrap py-4 ${last ? '' : 'border-b border-slate-100'}`}>
      <div className="min-w-[180px]">
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function Segmented<T extends string | boolean>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div className={`flex items-center rounded-full bg-white/80 border border-slate-200 p-1 ${disabled ? 'opacity-60' : ''}`}>
      {options.map(opt => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          disabled={disabled}
          aria-pressed={value === opt.value}
          className={`px-4 py-1.5 min-h-[36px] rounded-full text-sm font-bold transition-all ${
            value === opt.value ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'
          } ${disabled ? 'cursor-not-allowed' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-300'}`}
    >
      <span
        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
        style={{ left: 0 }}
      />
    </button>
  )
}

function VolumeSlider({ value, onChange, label, hidePercent }: { value: number; onChange: (v: number) => void; label: string; hidePercent?: boolean }) {
  return (
    <div className="flex items-center gap-3 flex-1 min-w-[140px] max-w-[260px]">
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        className="pf-slider flex-1"
        style={{ ['--fill' as string]: `${value}%` }}
        aria-label={label}
      />
      {!hidePercent && <span className="text-xs font-bold text-slate-600 tabular-nums w-9 text-right">{value}%</span>}
    </div>
  )
}

function DangerButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-5 py-2 min-h-[40px] rounded-full border border-error/40 text-error text-sm font-bold hover:bg-error/5 transition-colors"
    >
      <span className="material-symbols-outlined text-base">delete</span>
      {label}
    </button>
  )
}
