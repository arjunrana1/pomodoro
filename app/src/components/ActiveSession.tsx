import { useState } from 'react'
import type { AppStore } from '../store'
import { formatTime, formatDuration } from '../utils'
import Header from './Header'
import Fabs from './Fabs'
import SpotifyMiniPlayer from './SpotifyMiniPlayer'

interface Props {
  store: AppStore
  openSettings: () => void
}

export default function ActiveSession({ store, openSettings }: Props) {
  const { state, settings, setMode, toggleSound, pauseResumeSession, stopSession, endBreak, toggleTaskChecked, toggleTasksDrawer, toggleNotesDrawer } = store
  const isPaused = state.status === 'paused'
  const isBreak = state.sessionMode === 'break'
  const [expanded, setExpanded] = useState(false)

  // Count direction is display-only (AC-7).
  const displaySeconds = settings.countUp ? state.initialSeconds - state.secondsRemaining : state.secondsRemaining

  const tasks = state.tasks
  const checkedCount = tasks.filter(t => t.checked).length
  const totalSeconds = tasks.reduce((s, t) => s + t.minutes, 0) * 60
  const COLLAPSED_COUNT = 3
  const visibleTasks = expanded ? tasks : tasks.slice(0, COLLAPSED_COUNT)
  const hiddenCount = tasks.length - visibleTasks.length

  return (
    <div className={`relative w-full overflow-y-auto ${isBreak ? 'break-bg' : 'session-bg'}`} style={{ height: '100%' }}>
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden py-24">
        <Header
          mode={state.mode}
          sessionActive
          soundEnabled={settings.soundEnabled}
          setMode={setMode}
          toggleSound={toggleSound}
          openSettings={openSettings}
          badge={
            <div className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full mr-1 ${isBreak ? 'bg-break/10 border border-break/20' : 'bg-primary/10 border border-primary/20'}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isBreak ? 'bg-break' : 'bg-primary'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isBreak ? 'bg-break' : 'bg-primary'}`} />
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isBreak ? 'text-break' : 'text-primary'}`}>
                {isBreak ? 'Break Active' : 'Session Active'}
              </span>
            </div>
          }
        />

        <main className="flex flex-col items-center justify-center relative z-10 px-4">
          <div
            className={`${isBreak ? 'glass-orb-break' : 'glass-orb'} rounded-full w-[min(88vw,420px)] h-[min(88vw,420px)] md:w-[440px] md:h-[440px] flex flex-col items-center justify-center text-center relative overflow-hidden`}
          >
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-white/30 rounded-full blur-lg pointer-events-none" />
            <div className={`absolute inset-0 bg-gradient-to-tr pointer-events-none ${isBreak ? 'from-break/5 via-transparent to-break/10' : 'from-primary/5 via-transparent to-primary/10'}`} />
            <div
              className="absolute inset-[-50%] pointer-events-none orb-shimmer"
              style={{
                background: isBreak
                  ? 'conic-gradient(from 0deg, transparent 0%, rgba(20,184,166,0.12) 10%, transparent 20%, rgba(94,234,212,0.08) 30%, transparent 40%, rgba(56,189,248,0.06) 50%, transparent 60%, rgba(45,212,191,0.08) 70%, transparent 80%, rgba(94,234,212,0.1) 90%, transparent 100%)'
                  : 'conic-gradient(from 0deg, transparent 0%, rgba(106,90,231,0.12) 10%, transparent 20%, rgba(139,92,246,0.08) 30%, transparent 40%, rgba(236,72,153,0.06) 50%, transparent 60%, rgba(56,189,248,0.08) 70%, transparent 80%, rgba(167,139,250,0.1) 90%, transparent 100%)',
                animationPlayState: isPaused ? 'paused' : 'running',
              }}
            />

            <div className="flex flex-col items-center mb-6">
              <span
                className="text-slate-900 text-6xl sm:text-7xl md:text-8xl tracking-tighter tabular-nums leading-none"
                style={{ fontFamily: 'Sora, sans-serif', fontWeight: 200 }}
              >
                {formatTime(displaySeconds)}
              </span>
              <span className={`text-[10px] tracking-[0.25em] font-semibold uppercase mt-3 ${isBreak ? 'text-break' : 'text-slate-400'}`}>
                {isPaused ? 'Paused' : isBreak ? 'Take a breather' : 'Focus Flow'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isBreak ? (
                <>
                  <button
                    onClick={endBreak}
                    className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-white/70 border border-white/60 text-slate-700 hover:bg-white transition-all group shadow-sm"
                  >
                    <span className="material-symbols-outlined text-lg transition-transform group-active:scale-90">stop</span>
                    <span className="text-sm font-bold">End Break</span>
                  </button>
                  <button
                    onClick={pauseResumeSession}
                    className="flex items-center gap-2 px-6 py-2.5 min-h-[44px] rounded-full bg-break text-white hover:bg-break-fixed transition-all group shadow-lg shadow-break/25"
                  >
                    <span className="material-symbols-outlined text-lg transition-transform group-active:scale-90">
                      {isPaused ? 'play_arrow' : 'pause'}
                    </span>
                    <span className="text-sm font-bold">{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={pauseResumeSession}
                    className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full glass-pill text-slate-700 hover:bg-primary/20 transition-all group shadow-sm"
                  >
                    <span className="material-symbols-outlined text-lg transition-transform group-active:scale-90">
                      {isPaused ? 'play_arrow' : 'pause'}
                    </span>
                    <span className="text-sm font-bold">{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    onClick={stopSession}
                    className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full glass-pill text-slate-700 hover:bg-red-500/10 hover:border-red-500/20 transition-all group shadow-sm"
                  >
                    <span className="material-symbols-outlined text-lg transition-transform group-active:scale-90">stop</span>
                    <span className="text-sm font-bold">Stop</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Session plan checklist — Work only (§5.3) */}
          {!isBreak && tasks.length > 0 && (
            <div className="mt-6 w-full max-w-sm relative z-10">
              <div className="flex items-center justify-between mb-2 px-1">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Session Plan</h4>
                <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                  {checkedCount} of {tasks.length} · {formatDuration(totalSeconds)}
                </span>
              </div>
              <div className="space-y-1.5">
                {visibleTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => toggleTaskChecked(task.id)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 min-h-[44px] rounded-xl glass-70 group cursor-pointer text-left transition-all hover:bg-white/90 shadow-sm ${
                      task.checked ? 'opacity-70' : ''
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-[2.5px] flex items-center justify-center shrink-0 transition-all ${
                        task.checked ? 'border-primary bg-primary/15' : 'border-primary/60 bg-white/70'
                      }`}
                    >
                      {task.checked && (
                        <span className="material-symbols-outlined text-primary leading-none font-bold" style={{ fontSize: 14 }}>check</span>
                      )}
                    </div>
                    <span className={`text-sm font-medium transition-all flex-1 ${task.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {task.title}
                    </span>
                    <span className={`text-[10px] font-bold tabular-nums shrink-0 px-2 py-0.5 rounded-full ${task.checked ? 'text-slate-400 bg-slate-100' : 'text-primary bg-primary/10'}`}>
                      {task.minutes}m
                    </span>
                  </button>
                ))}
              </div>
              {hiddenCount > 0 && (
                <button
                  onClick={() => setExpanded(true)}
                  className="w-full mt-1.5 text-center text-xs font-semibold text-slate-500 hover:text-slate-700 py-2"
                >
                  +{hiddenCount} more <span className="material-symbols-outlined align-middle" style={{ fontSize: 14 }}>expand_more</span>
                </button>
              )}
              {expanded && tasks.length > COLLAPSED_COUNT && (
                <button
                  onClick={() => setExpanded(false)}
                  className="w-full mt-1.5 text-center text-xs font-semibold text-slate-500 hover:text-slate-700 py-2"
                >
                  Show less <span className="material-symbols-outlined align-middle" style={{ fontSize: 14 }}>expand_less</span>
                </button>
              )}
            </div>
          )}

          {/* Spotify mini-player when connected (§14) */}
          {settings.spotifyConnected && <SpotifyMiniPlayer />}
        </main>

        <DecorativeSessionOrbs isBreak={isBreak} />
      </div>

      {/* FABs — Work sessions only (AC-13, AC-18) */}
      {!isBreak && (
        <Fabs toggleNotesDrawer={toggleNotesDrawer} toggleTasksDrawer={toggleTasksDrawer} showTasks={false} />
      )}
    </div>
  )
}

function DecorativeSessionOrbs({ isBreak }: { isBreak: boolean }) {
  const a = isBreak ? 'rgba(94,234,212,0.65)' : 'rgba(139,92,246,0.75)'
  const aSoft = isBreak ? 'rgba(94,234,212,0.25)' : 'rgba(139,92,246,0.30)'
  const b = isBreak ? 'rgba(45,212,191,0.55)' : 'rgba(236,72,153,0.65)'
  const bSoft = isBreak ? 'rgba(45,212,191,0.20)' : 'rgba(236,72,153,0.22)'
  return (
    <>
      <div className="absolute top-[3%] left-[2%] w-96 h-96 rounded-full blur-[60px] pointer-events-none" style={{ background: `radial-gradient(circle, ${a} 0%, ${aSoft} 50%, transparent 70%)` }} />
      <div className="absolute bottom-[5%] right-[2%] w-[420px] h-[420px] rounded-full blur-[65px] pointer-events-none" style={{ background: `radial-gradient(circle, ${b} 0%, ${bSoft} 50%, transparent 70%)` }} />
      <div className="absolute top-[2%] right-[20%] w-64 h-64 rounded-full blur-[50px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.60) 0%, rgba(56,189,248,0.20) 50%, transparent 70%)' }} />
      <div className="absolute bottom-[20%] left-[12%] w-72 h-72 rounded-full blur-[55px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.58) 0%, rgba(167,139,250,0.20) 50%, transparent 70%)' }} />
    </>
  )
}
