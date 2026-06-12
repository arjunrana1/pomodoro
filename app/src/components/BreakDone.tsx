import type { AppStore } from '../store'
import { formatDuration } from '../utils'

interface Props {
  store: AppStore
  openSettings: () => void
}

/**
 * Break completion card (DESIGN_V3 §3.5). No FABs, no header toggle —
 * "Start Focus Session" returns to Work Home; otherwise the mode stays Break.
 */
export default function BreakDone({ store, openSettings }: Props) {
  const { state, newSession, playClick } = store
  const took = formatDuration(state.lastSessionElapsedSeconds || state.initialSeconds)

  const handleStartFocus = () => {
    playClick()
    newSession('work')
  }

  return (
    <div className="break-bg min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[5%] left-[3%] w-96 h-96 rounded-full blur-[60px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(94,234,212,0.65) 0%, rgba(94,234,212,0.25) 50%, transparent 70%)' }} />
      <div className="absolute bottom-[5%] right-[3%] w-[420px] h-[420px] rounded-full blur-[65px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.55) 0%, rgba(167,139,250,0.20) 50%, transparent 70%)' }} />

      <button
        onClick={openSettings}
        className="fixed top-4 right-4 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/40 hover:bg-white/60 transition-colors shadow-sm"
        aria-label="Settings"
      >
        <span className="material-symbols-outlined text-primary text-xl">settings</span>
      </button>

      <div className="w-full max-w-lg relative z-10">
        <div className="frosted-glass rounded-2xl shadow-xl px-8 py-12 flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-break-container text-break">
            <span className="material-symbols-outlined text-3xl">coffee</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Break Done</h1>
          <p className="text-slate-500 text-sm mb-8">You took {took} to recharge.</p>

          <button
            onClick={handleStartFocus}
            className="bg-primary hover:bg-primary-fixed text-white font-bold px-8 py-3.5 min-h-[48px] rounded-full transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-base">target</span>
            <span>Start Focus Session</span>
          </button>
        </div>
      </div>
    </div>
  )
}
