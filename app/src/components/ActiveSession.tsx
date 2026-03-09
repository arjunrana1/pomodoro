import { formatTime } from '../utils'
import type { AppState } from '../types'
import DeepFocusIcon from './DeepFocusIcon'

interface Props {
  state: AppState
  pauseSession: () => void
  stopSession: () => void
  toggleNotesDrawer: () => void
  toggleSound: () => void
  togglePlanItemCompleted: (id: string) => void
}

export default function ActiveSession({
  state,
  pauseSession,
  stopSession,
  toggleNotesDrawer,
  toggleSound,
  togglePlanItemCompleted,
}: Props) {
  const isPaused = state.status === 'paused'

  return (
    <div className="relative flex h-full w-full session-bg items-center justify-center overflow-hidden">
      {/* Decorative background orbs */}
      <div className="absolute top-[3%] left-[2%] w-96 h-96 rounded-full blur-[60px] pointer-events-none" style={{background: 'radial-gradient(circle, rgba(139,92,246,0.75) 0%, rgba(139,92,246,0.30) 50%, transparent 70%)'}} />
      <div className="absolute bottom-[5%] right-[2%] w-[420px] h-[420px] rounded-full blur-[65px] pointer-events-none" style={{background: 'radial-gradient(circle, rgba(236,72,153,0.65) 0%, rgba(236,72,153,0.22) 50%, transparent 70%)'}} />
      <div className="absolute top-[2%] right-[20%] w-64 h-64 rounded-full blur-[50px] pointer-events-none" style={{background: 'radial-gradient(circle, rgba(56,189,248,0.60) 0%, rgba(56,189,248,0.20) 50%, transparent 70%)'}} />
      <div className="absolute bottom-[20%] left-[12%] w-72 h-72 rounded-full blur-[55px] pointer-events-none" style={{background: 'radial-gradient(circle, rgba(167,139,250,0.58) 0%, rgba(167,139,250,0.20) 50%, transparent 70%)'}} />

      {/* Header - fixed like HomeScreen */}
      <header className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-30">
        <div className="flex items-center gap-2.5">
          <div className="shrink-0" style={{width: 35, height: 35}}>
            <DeepFocusIcon />
          </div>
          <h2 className="text-base font-bold tracking-tight text-slate-800">Deep Focus</h2>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Session Active</span>
        </div>
      </header>

      {/* Left Rail - fixed */}
      <aside className="fixed left-0 top-0 h-full flex flex-col items-center z-20 w-auto">
        <div className="flex flex-col h-full items-center justify-center">
          <div className="flex items-center gap-1.5 px-2.5">
            <span className="material-symbols-outlined text-slate-400 text-xs">lock</span>
            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap [writing-mode:vertical-lr] rotate-180">
              Locked
            </span>
          </div>
        </div>
      </aside>

      {/* Right Rail - fixed */}
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

      {/* Main Content - centered like HomeScreen */}
      <main className="flex flex-col items-center justify-center relative z-10">
        <div className="glass-orb rounded-full w-[420px] h-[420px] md:w-[480px] md:h-[480px] flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Subtle gloss highlight at top */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-white/30 rounded-full blur-lg pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/10 pointer-events-none" />
          {/* Shimmer animation - rotating gradient glow */}
          <div
            className="absolute inset-[-50%] pointer-events-none orb-shimmer"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, rgba(106,90,231,0.12) 10%, transparent 20%, rgba(139,92,246,0.08) 30%, transparent 40%, rgba(236,72,153,0.06) 50%, transparent 60%, rgba(56,189,248,0.08) 70%, transparent 80%, rgba(167,139,250,0.1) 90%, transparent 100%)',
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          />

          {/* Timer Display */}
          <div className="flex flex-col items-center mb-5">
            <span className="text-slate-900 text-7xl md:text-8xl font-extralight tracking-tighter tabular-nums leading-none">
              {formatTime(state.secondsRemaining)}
            </span>
            <span className="text-slate-400 text-[10px] tracking-[0.25em] font-medium uppercase mt-3">
              {isPaused ? 'Paused' : 'Focus Flow'}
            </span>
          </div>

          {/* Pause / Stop buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={pauseSession}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full glass-pill text-slate-700 hover:bg-primary/20 transition-all group shadow-sm"
            >
              <span className="material-symbols-outlined text-lg transition-transform group-active:scale-90">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
              <span className="text-sm font-bold">{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
            <button
              onClick={stopSession}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full glass-pill text-slate-700 hover:bg-red-500/10 hover:border-red-500/20 transition-all group shadow-sm"
            >
              <span className="material-symbols-outlined text-lg transition-transform group-active:scale-90">stop</span>
              <span className="text-sm font-bold">Stop</span>
            </button>
          </div>

          {/* Session Plan tasks */}
          {state.planItems.length > 0 && (
            <div className="mt-5 w-full max-w-xs">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 text-center">
                Session Plan
              </h4>
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {state.planItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => togglePlanItemCompleted(item.id)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-xl glass-pill group cursor-pointer text-left transition-all hover:bg-primary/15 shadow-sm ${
                      item.completed ? 'opacity-70' : ''
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      item.completed
                        ? 'border-primary/60 bg-transparent'
                        : 'border-slate-300/70'
                    }`}>
                      {item.completed && (
                        <span className="material-symbols-outlined text-primary/70 leading-none" style={{fontSize: '11px'}}>check</span>
                      )}
                    </div>
                    <span className={`text-xs font-medium transition-all ${
                      item.completed ? 'line-through text-slate-400' : 'text-slate-700'
                    }`}>
                      {item.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
