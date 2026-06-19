import type { AppStore } from '../store'
import { formatDuration } from '../utils'

interface Props {
  store: AppStore
}

/** Work completion modal — v2 layout, no FABs, hours-min format (build §16.4). */
export default function FlowComplete({ store }: Props) {
  const { state, newSession, playClick } = store

  // Checked first, then unchecked.
  const sortedTasks = [...state.tasks].sort((a, b) => {
    if (a.checked === b.checked) return 0
    return a.checked ? -1 : 1
  })

  const hasTasks = state.tasks.length > 0
  const hasNotes = state.notes.length > 0

  const handleNewSession = () => {
    playClick()
    newSession()
  }

  return (
    <div className="celebratory-gradient min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className="fixed top-[-10%] left-[-10%] w-[280px] h-[280px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6A5AE7 35%, #c0c0c0 55%, transparent 70%)', opacity: 0.5 }}
      />
      <div
        className="fixed bottom-[-10%] right-[-10%] w-[280px] h-[280px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, #EC4899 35%, #c0c0c0 55%, transparent 70%)', opacity: 0.4 }}
      />

      <div className="w-full max-w-lg relative z-10">
        <div className="frosted-glass rounded-2xl shadow-xl p-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Flow Complete</h1>
          <p className="text-slate-400 text-sm mb-5">
            {state.sessionStoppedEarly ? 'Session ended early.' : 'Excellent work! You stayed focused.'}
          </p>

          {/* Elapsed for stopped sessions, initial for natural completion (AC-11). */}
          <div className="mb-6">
            <p className="text-4xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              {formatDuration(state.lastSessionElapsedSeconds || state.initialSeconds)}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mt-1.5">Session Focus Time</p>
          </div>

          {(hasTasks || hasNotes) && (
            <div className={`w-full ${hasTasks && hasNotes ? 'grid grid-cols-1 sm:grid-cols-2 gap-6' : ''} text-left mb-6`}>
              {hasTasks && (
                <div>
                  <h3 className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-3">Tasks Accomplished</h3>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto">
                    {sortedTasks.map(item => (
                      <div key={item.id} className="flex items-center gap-2.5">
                        <span className={`text-sm font-medium flex-1 ${item.checked ? 'text-slate-700' : 'text-slate-400'}`}>
                          {item.title}
                        </span>
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full shrink-0 ${
                            item.checked ? 'border-2 border-primary/60 bg-transparent' : 'border-2 border-slate-200'
                          }`}
                        >
                          {item.checked && (
                            <span className="material-symbols-outlined text-primary/70 leading-none" style={{ fontSize: 13 }}>check</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasNotes && (
                <div>
                  <h3 className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-3">Session Notes</h3>
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {state.notes.map(item => (
                      <li key={item.id} className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed">
                        <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleNewSession}
            className="w-full max-w-xs bg-primary hover:bg-primary/90 text-white font-bold py-3.5 min-h-[48px] rounded-full transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 text-sm"
          >
            <span>New Session</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  )
}
