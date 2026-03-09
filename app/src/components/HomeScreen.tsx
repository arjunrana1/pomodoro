import { useState } from 'react'
import { formatTime, formatHours } from '../utils'
import type { AppState } from '../types'
import DeepFocusIcon from './DeepFocusIcon'

interface Props {
  state: AppState
  selectPreset: (m: 15 | 20 | 25) => void
  setCustomMinutes: (m: number | null) => void
  startSession: (source: 'home' | 'plan') => void
  togglePlanSidebar: () => void
  toggleNotesDrawer: () => void
  toggleSound: () => void
  playClick: () => void
}

const presets = [15, 20, 25] as const

export default function HomeScreen({
  state,
  selectPreset,
  setCustomMinutes,
  startSession,
  togglePlanSidebar,
  toggleNotesDrawer,
  toggleSound,
  playClick,
}: Props) {
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customValue, setCustomValue] = useState('')

  const handleCustomSubmit = () => {
    const val = parseInt(customValue)
    if (val > 0) {
      setCustomMinutes(val)
      setShowCustomInput(false)
    }
  }

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCustomSubmit()
    if (e.key === 'Escape') {
      setShowCustomInput(false)
      setCustomValue('')
    }
  }

  const handleStartSession = () => {
    playClick()
    startSession('home')
  }

  return (
    <div className="relative w-full ethereal-bg overflow-y-auto" style={{height: '100%'}}>
      {/* === First fold: Timer area (full viewport height) === */}
      <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 flex items-center px-6 py-4 z-30">
          <div className="flex items-center gap-2.5">
            <div className="shrink-0" style={{width: 35, height: 35}}>
              <DeepFocusIcon />
            </div>
            <h2 className="text-base font-bold tracking-tight text-slate-800">Deep Focus</h2>
          </div>
        </header>

        {/* Left Rail - Session Plan */}
        <aside className="fixed left-0 top-0 h-full flex flex-col items-center z-20 w-auto">
          <div className="flex flex-col h-full items-center justify-center">
            <button
              onClick={togglePlanSidebar}
              className="group flex flex-col items-center gap-4 py-6 px-2.5 transition-all duration-300 hover:bg-white/10 rounded-r-xl"
            >
              <span className="material-symbols-outlined text-primary/70 text-lg transition-transform group-hover:scale-110">
                assignment_turned_in
              </span>
              <span className="[writing-mode:vertical-lr] rotate-180 text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400">
                Plan
              </span>
            </button>
          </div>
        </aside>

        {/* Right Rail - Sound + Notes */}
        <aside className="fixed right-0 top-0 h-full flex flex-col items-center z-20 w-auto">
          <div className="flex flex-col h-full items-center justify-center gap-4">
            <button
              onClick={toggleSound}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <span className="material-symbols-outlined text-primary/60 text-lg">
                {state.soundEnabled ? 'volume_up' : 'volume_off'}
              </span>
            </button>
            <button
              onClick={toggleNotesDrawer}
              className="group flex flex-col items-center gap-4 py-6 px-2.5 transition-all duration-300 hover:bg-white/10 rounded-l-xl"
            >
              <span className="material-symbols-outlined text-primary/50 text-lg transition-transform group-hover:scale-110">
                edit_note
              </span>
              <span className="[writing-mode:vertical-lr] rotate-180 text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400">
                Notes
              </span>
            </button>
          </div>
        </aside>

        {/* Main Content - Glass Orb */}
        <main className="flex flex-col items-center justify-center relative z-10">
          <div className="glass-orb rounded-full w-[420px] h-[420px] md:w-[480px] md:h-[480px] flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Subtle gloss highlight at top */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-white/30 rounded-full blur-lg pointer-events-none" />

            {/* Timer Display */}
            <div className="flex flex-col items-center mb-5">
              <span className="text-slate-900 text-7xl md:text-8xl font-extralight tracking-tighter tabular-nums leading-none">
                {formatTime(state.secondsRemaining)}
              </span>
              <span className="text-slate-400 text-[10px] tracking-[0.25em] font-medium uppercase mt-3">
                Ready to start?
              </span>
            </div>

            {/* Duration Pills */}
            <div className="flex gap-2.5 mb-5 items-center">
              {presets.map(d => (
                <button
                  key={d}
                  onClick={() => selectPreset(d)}
                  className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${
                    state.selectedPreset === d
                      ? 'bg-white/70 border-primary/30 text-primary font-semibold shadow-sm'
                      : 'bg-white/30 hover:bg-white/50 border-white/40 text-slate-600'
                  }`}
                >
                  {d}m
                </button>
              ))}

              {/* Custom duration pill */}
              {showCustomInput ? (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full border bg-white/70 border-primary/30">
                  <input
                    type="number"
                    min="1"
                    value={customValue}
                    onChange={e => setCustomValue(e.target.value)}
                    onKeyDown={handleCustomKeyDown}
                    onBlur={handleCustomSubmit}
                    autoFocus
                    placeholder="min"
                    className="w-10 bg-transparent text-sm text-primary font-semibold focus:outline-none text-center"
                  />
                  <span className="text-sm text-primary font-semibold">m</span>
                </div>
              ) : state.customMinutes ? (
                <button
                  onClick={() => {
                    setShowCustomInput(true)
                    setCustomValue(String(state.customMinutes))
                  }}
                  className="px-4 py-1.5 rounded-full border text-sm font-semibold transition-all bg-white/70 border-primary/30 text-primary shadow-sm"
                >
                  {state.customMinutes}m
                </button>
              ) : (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-8 h-8 rounded-full border bg-white/30 hover:bg-white/50 border-white/40 text-slate-500 flex items-center justify-center transition-all"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                </button>
              )}
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartSession}
              className="group relative flex items-center justify-center overflow-hidden rounded-full px-10 py-3 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all active:scale-95"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-2">
                Start Session
                <span className="material-symbols-outlined text-base">play_arrow</span>
              </span>
            </button>

            {/* Stats inside the orb */}
            <div className="flex items-center gap-6 mt-5">
              <div className="flex flex-col items-center">
                <span className="text-slate-700 font-bold text-xs">{formatHours(state.todayFocusSeconds)}</span>
                <span className="text-slate-400 text-[8px] uppercase font-bold tracking-wider">Focus Time Today</span>
              </div>
              <div className="w-px h-4 bg-slate-300/50" />
              <div className="flex flex-col items-center">
                <span className="text-slate-700 font-bold text-xs">{state.todaySessionsCount}</span>
                <span className="text-slate-400 text-[8px] uppercase font-bold tracking-wider">Sessions</span>
              </div>
            </div>
          </div>
        </main>

        {/* Decorative background orbs */}
        <div className="absolute top-[5%] left-[3%] w-96 h-96 rounded-full blur-[60px] pointer-events-none" style={{background: 'radial-gradient(circle, rgba(139,92,246,0.75) 0%, rgba(139,92,246,0.30) 50%, transparent 70%)'}} />
        <div className="absolute bottom-[5%] right-[3%] w-[420px] h-[420px] rounded-full blur-[65px] pointer-events-none" style={{background: 'radial-gradient(circle, rgba(236,72,153,0.70) 0%, rgba(236,72,153,0.25) 50%, transparent 70%)'}} />
        <div className="absolute top-[2%] right-[18%] w-64 h-64 rounded-full blur-[50px] pointer-events-none" style={{background: 'radial-gradient(circle, rgba(56,189,248,0.65) 0%, rgba(56,189,248,0.22) 50%, transparent 70%)'}} />
        <div className="absolute bottom-[22%] left-[15%] w-72 h-72 rounded-full blur-[55px] pointer-events-none" style={{background: 'radial-gradient(circle, rgba(167,139,250,0.60) 0%, rgba(167,139,250,0.22) 50%, transparent 70%)'}} />
        <div className="absolute top-[40%] right-[1%] w-56 h-56 rounded-full blur-[50px] pointer-events-none" style={{background: 'radial-gradient(circle, rgba(251,146,60,0.50) 0%, rgba(251,146,60,0.18) 50%, transparent 70%)'}} />
      </div>

      {/* === Footer: Below the fold === */}
      <footer className="relative w-full bg-white/60 backdrop-blur-sm border-t border-white/40">
        <div className="max-w-2xl mx-auto px-8 py-16">
          {/* What is Deep Focus */}
          <section className="mb-12">
            <h3 className="text-xl font-bold text-slate-800 mb-1">What is Deep Focus?</h3>
            <div className="w-8 h-0.5 bg-primary/40 mb-4" />
            <p className="text-sm text-slate-600 leading-relaxed">
              Deep Focus is a Pomodoro-inspired focus timer designed to help you work with intention.
              Set a focus duration, plan your tasks, and let the timer keep you accountable — all
              within a calming, distraction-free interface.
            </p>
          </section>

          {/* What is the Pomodoro Technique */}
          <section className="mb-12">
            <h3 className="text-xl font-bold text-slate-800 mb-1">What is the Pomodoro Technique?</h3>
            <div className="w-8 h-0.5 bg-primary/40 mb-4" />
            <p className="text-sm text-slate-600 leading-relaxed">
              The Pomodoro Technique is a time management method developed by Francesco Cirillo.
              It uses a timer to break work into focused intervals — traditionally 25 minutes —
              separated by short breaks. Each interval is called a "pomodoro," named after the
              tomato-shaped kitchen timer Cirillo used as a university student.
            </p>
          </section>

          {/* How to Use */}
          <section className="mb-12">
            <h3 className="text-xl font-bold text-slate-800 mb-1">How to Use Deep Focus</h3>
            <div className="w-8 h-0.5 bg-primary/40 mb-4" />
            <ol className="text-sm text-slate-600 leading-relaxed space-y-2 list-decimal list-inside">
              <li>Choose a focus duration (15, 20, or 25 minutes) or set a custom time</li>
              <li>Optionally add tasks to your session plan</li>
              <li>Click "Start Session" and focus on your work</li>
              <li>Use the pause button if you need a brief interruption</li>
              <li>When the timer ends, review your completed tasks and start a new session</li>
            </ol>
          </section>

          {/* Features */}
          <section className="mb-12">
            <h3 className="text-xl font-bold text-slate-800 mb-1">Features</h3>
            <div className="w-8 h-0.5 bg-primary/40 mb-4" />
            <ul className="text-sm text-slate-600 leading-relaxed space-y-3">
              <li>
                <span className="font-semibold text-slate-700">Flexible Timer</span>
                <span className="text-slate-400 mx-1.5">—</span>
                Choose from preset durations (15, 20, 25 min) or set any custom duration that fits your workflow.
              </li>
              <li>
                <span className="font-semibold text-slate-700">Session Planning</span>
                <span className="text-slate-400 mx-1.5">—</span>
                Add tasks before you begin so you know exactly what to focus on during each session.
              </li>
              <li>
                <span className="font-semibold text-slate-700">Session Notes</span>
                <span className="text-slate-400 mx-1.5">—</span>
                Capture ideas, blockers, or reminders while you work without breaking your flow.
              </li>
              <li>
                <span className="font-semibold text-slate-700">Daily Tracking</span>
                <span className="text-slate-400 mx-1.5">—</span>
                See your total focus time and number of sessions completed today at a glance.
              </li>
              <li>
                <span className="font-semibold text-slate-700">Session Summary</span>
                <span className="text-slate-400 mx-1.5">—</span>
                Review your completed and pending tasks after each session to see your progress.
              </li>
              <li>
                <span className="font-semibold text-slate-700">Sound Cues</span>
                <span className="text-slate-400 mx-1.5">—</span>
                Audio feedback for start, pause, stop, and completion so you can stay heads-down.
              </li>
            </ul>
          </section>

          {/* Bottom attribution */}
          <div className="text-center pt-6 border-t border-slate-200/60">
            <p className="text-xs text-slate-400">Deep Focus Pomodoro Timer</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
