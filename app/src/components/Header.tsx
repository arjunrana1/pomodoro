import type { SessionMode } from '../types'
import BrandMark from './BrandMark'

interface Props {
  mode: SessionMode
  /** Toggle locks while a session is running/paused (AC-3). */
  sessionActive: boolean
  soundEnabled: boolean
  setMode: (m: SessionMode) => void
  toggleSound: () => void
  openSettings: () => void
  /** Hide the mode toggle (e.g. Settings screen has its own mirror). */
  hideToggle?: boolean
  /** Right-side extra (e.g. SESSION ACTIVE badge on mobile active session). */
  badge?: React.ReactNode
}

export default function Header({
  mode,
  sessionActive,
  soundEnabled,
  setMode,
  toggleSound,
  openSettings,
  hideToggle,
  badge,
}: Props) {
  const accent = mode === 'break' ? 'text-break' : 'text-primary'

  const toggle = !hideToggle && (
    <div
      className={`relative flex items-center rounded-full glass-40 p-1 shadow-sm ${sessionActive ? 'opacity-60' : ''}`}
      role="group"
      aria-label="Session mode"
    >
      <ModeButton
        label="Work"
        icon="target"
        active={mode === 'work'}
        activeClass="bg-primary text-white shadow-md shadow-primary/25"
        disabled={sessionActive}
        onClick={() => setMode('work')}
      />
      <ModeButton
        label="Break"
        icon="coffee"
        active={mode === 'break'}
        activeClass="bg-break text-white shadow-md shadow-break/25"
        disabled={sessionActive}
        onClick={() => setMode('break')}
      />
      {sessionActive && (
        <span className="material-symbols-outlined text-slate-400 mx-1.5" style={{ fontSize: 14 }} aria-label="Mode locked during session">
          lock
        </span>
      )}
    </div>
  )

  return (
    <>
      <header className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 sm:px-6 py-3.5 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0" style={{ width: 35, height: 35 }}>
            <BrandMark accent={mode === 'break' ? '#14B8A6' : '#6A5AE7'} />
          </div>
          <h2 className="text-base font-bold tracking-tight text-slate-800 truncate">Pomodoro Focus</h2>
        </div>

        {/* Desktop: toggle centered */}
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2">{toggle}</div>

        <div className="flex items-center gap-1.5 shrink-0">
          {badge}
          <button
            onClick={toggleSound}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/40 transition-colors"
            aria-label={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
          >
            <span className={`material-symbols-outlined ${accent} text-xl`}>
              {soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
          </button>
          <button
            onClick={openSettings}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 hover:bg-white/60 transition-colors shadow-sm"
            aria-label="Settings"
          >
            <span className={`material-symbols-outlined ${accent} text-xl`}>settings</span>
          </button>
        </div>
      </header>

      {/* Mobile: full-width pill below the brand (absolute → scrolls away with the fold) */}
      {!hideToggle && (
        <div className="sm:hidden absolute top-16 left-4 right-4 z-30 flex justify-center [&>div]:w-full [&>div]:justify-center">
          {toggle}
        </div>
      )}
    </>
  )
}

function ModeButton({
  label,
  icon,
  active,
  activeClass,
  disabled,
  onClick,
}: {
  label: string
  icon: string
  active: boolean
  activeClass: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex flex-1 items-center justify-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold transition-all min-h-[36px] ${
        active ? activeClass : 'text-slate-500 hover:text-slate-700'
      } ${disabled ? 'cursor-not-allowed' : ''}`}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </button>
  )
}
