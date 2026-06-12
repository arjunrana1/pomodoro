import { useState } from 'react'
import type { AppStore } from '../store'
import { formatTime, formatDuration } from '../utils'
import Header from './Header'
import Fabs from './Fabs'
import FocusHistoryDashboard from './FocusHistoryDashboard'
import MarketingFooter from './MarketingFooter'

interface Props {
  store: AppStore
  openSettings: () => void
}

const WORK_PRESETS = [15, 20, 25] as const
const BREAK_PRESETS = [5, 10, 15] as const

export default function HomeScreen({ store, openSettings }: Props) {
  const {
    state,
    settings,
    setMode,
    toggleSound,
    selectWorkPreset,
    selectBreakPreset,
    commitCustomMinutes,
    setCustomMinutesError,
    startSession,
    toggleTasksDrawer,
    toggleNotesDrawer,
    playClick,
  } = store

  const isBreak = state.mode === 'break'
  const [showCustomInputState, setShowCustomInput] = useState(false)
  const customMinutes = isBreak ? state.customBreakMinutes : state.customWorkMinutes
  const selectedPreset = isBreak ? state.selectedBreakPreset : state.selectedWorkPreset
  const [customValue, setCustomValue] = useState(customMinutes != null ? String(customMinutes) : '')

  const showCustomInput = showCustomInputState || !!state.customMinutesInputError
  const customSelected = selectedPreset === null && (customMinutes != null || !!state.customMinutesInputError)
  const startDisabled = customSelected && (state.customMinutesInputError !== null || customMinutes == null)

  // Idle always previews the chosen target duration; count direction only
  // changes the displayed number during a session (§4.2 is display-only).
  const displaySeconds = state.secondsRemaining

  const handleCustomCommit = () => {
    const ok = commitCustomMinutes(customValue)
    if (ok) setShowCustomInput(false)
  }

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCustomCommit()
    if (e.key === 'Escape') {
      setShowCustomInput(false)
      setCustomValue(customMinutes != null ? String(customMinutes) : '')
      setCustomMinutesError(null)
    }
  }

  const handlePresetClick = (m: number) => {
    if (isBreak) selectBreakPreset(m as 5 | 10 | 15)
    else selectWorkPreset(m as 15 | 20 | 25)
    setCustomValue('')
    setShowCustomInput(false)
  }

  const handleStart = () => {
    if (startDisabled) return
    playClick()
    startSession('home')
  }

  const accentText = isBreak ? 'text-break' : 'text-primary'
  const presets = isBreak ? BREAK_PRESETS : WORK_PRESETS

  return (
    <div className={`relative w-full overflow-y-auto ${isBreak ? 'break-bg' : 'ethereal-bg'}`} style={{ height: '100%' }}>
      {/* === First fold === */}
      <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">
        <Header
          mode={state.mode}
          sessionActive={false}
          soundEnabled={settings.soundEnabled}
          setMode={setMode}
          toggleSound={toggleSound}
          openSettings={openSettings}
        />

        <main className="flex flex-col items-center justify-center relative z-10 px-4">
          <div
            className={`${isBreak ? 'glass-orb-break' : 'glass-orb'} rounded-full w-[min(88vw,420px)] h-[min(88vw,420px)] md:w-[480px] md:h-[480px] flex flex-col items-center justify-center text-center relative overflow-hidden`}
          >
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-white/30 rounded-full blur-lg pointer-events-none" />

            <div className="flex flex-col items-center mb-5">
              <span
                className="text-slate-900 text-6xl sm:text-7xl md:text-8xl tracking-tighter tabular-nums leading-none"
                style={{ fontFamily: 'Sora, sans-serif', fontWeight: 200 }}
              >
                {formatTime(displaySeconds)}
              </span>
              <span className={`text-[10px] tracking-[0.25em] font-semibold uppercase mt-3 ${isBreak ? 'text-break' : 'text-slate-400'}`}>
                {isBreak ? 'Take a breather' : 'Ready to start?'}
              </span>
            </div>

            <div className="flex flex-col items-center gap-2 mb-5">
              <div className="flex gap-2 sm:gap-2.5 items-center">
                {presets.map(d => (
                  <button
                    key={d}
                    onClick={() => handlePresetClick(d)}
                    className={`px-4 py-1.5 min-h-[36px] rounded-full border text-sm font-medium transition-all ${
                      selectedPreset === d
                        ? isBreak
                          ? 'bg-white/70 border-break/40 text-break font-semibold shadow-sm'
                          : 'bg-white/70 border-primary/30 text-primary font-semibold shadow-sm'
                        : 'bg-white/30 hover:bg-white/50 border-white/40 text-slate-600'
                    }`}
                  >
                    {d}m
                  </button>
                ))}

                {showCustomInput ? (
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full border bg-white/70 ${
                      state.customMinutesInputError ? 'border-red-400 ring-1 ring-red-300' : isBreak ? 'border-break/40' : 'border-primary/30'
                    }`}
                  >
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={customValue}
                      onChange={e => {
                        setCustomValue(e.target.value)
                        if (state.customMinutesInputError) setCustomMinutesError(null)
                      }}
                      onKeyDown={handleCustomKeyDown}
                      onBlur={handleCustomCommit}
                      autoFocus
                      placeholder="min"
                      className={`w-12 bg-transparent text-sm font-semibold focus:outline-none text-center font-mono ${
                        state.customMinutesInputError ? 'text-red-500' : accentText
                      }`}
                    />
                    <span className={`text-sm font-semibold ${state.customMinutesInputError ? 'text-red-500' : accentText}`}>m</span>
                  </div>
                ) : customMinutes ? (
                  <button
                    onClick={() => {
                      setShowCustomInput(true)
                      setCustomValue(String(customMinutes))
                    }}
                    className={`px-4 py-1.5 min-h-[36px] rounded-full border text-sm font-semibold transition-all bg-white/70 shadow-sm ${
                      isBreak ? 'border-break/40 text-break' : 'border-primary/30 text-primary'
                    }`}
                  >
                    {customMinutes}m
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="w-9 h-9 rounded-full border bg-white/30 hover:bg-white/50 border-white/40 text-slate-500 flex items-center justify-center transition-all"
                    aria-label="Custom duration"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                  </button>
                )}
              </div>
              {state.customMinutesInputError && (
                <span className="text-[10px] font-medium text-red-500">{state.customMinutesInputError}</span>
              )}
            </div>

            <button
              onClick={handleStart}
              disabled={startDisabled}
              className={`group relative flex items-center justify-center overflow-hidden rounded-full px-10 py-3 min-h-[48px] text-white text-sm font-bold transition-all ${
                startDisabled
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : isBreak
                    ? 'bg-break shadow-lg shadow-break/25 hover:shadow-xl hover:shadow-break/35 active:scale-95'
                    : 'bg-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 active:scale-95'
              }`}
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-2">
                {isBreak ? 'Start Break' : 'Start Session'}
                <span className="material-symbols-outlined text-base">play_arrow</span>
              </span>
            </button>

            {/* Daily stats — Work only (hidden in Break, AC-2) */}
            {!isBreak && (
              <div className="flex items-center gap-6 mt-5">
                <div className="flex flex-col items-center">
                  <span className="text-slate-700 font-bold text-xs">{formatDuration(state.dailyStats.focusSeconds)}</span>
                  <span className="text-slate-400 text-[8px] uppercase font-bold tracking-wider">Focus Time Today</span>
                </div>
                <div className="w-px h-4 bg-slate-300/50" />
                <div className="flex flex-col items-center">
                  <span className="text-slate-700 font-bold text-xs">{state.dailyStats.sessionsCount}</span>
                  <span className="text-slate-400 text-[8px] uppercase font-bold tracking-wider">Sessions</span>
                </div>
              </div>
            )}
          </div>
        </main>

        <DecorativeOrbs isBreak={isBreak} />
      </div>

      {/* FABs — Work mode only */}
      {!isBreak && (
        <Fabs toggleNotesDrawer={toggleNotesDrawer} toggleTasksDrawer={toggleTasksDrawer} />
      )}

      {/* === Below the fold: dashboard + footer (reachable by scroll in both modes) === */}
      <FocusHistoryDashboard
        focusHistory={state.focusHistory}
        todayFocusSeconds={state.dailyStats.focusSeconds}
        completedTasks={state.completedTasks}
      />
      <MarketingFooter />
    </div>
  )
}

function DecorativeOrbs({ isBreak }: { isBreak: boolean }) {
  // Break swaps the violet/pink orbs for teal tints (DESIGN_V3 §1.3).
  const a = isBreak ? 'rgba(94,234,212,0.70)' : 'rgba(139,92,246,0.75)'
  const aSoft = isBreak ? 'rgba(94,234,212,0.28)' : 'rgba(139,92,246,0.30)'
  const b = isBreak ? 'rgba(45,212,191,0.60)' : 'rgba(236,72,153,0.70)'
  const bSoft = isBreak ? 'rgba(45,212,191,0.22)' : 'rgba(236,72,153,0.25)'
  return (
    <>
      <div className="absolute top-[5%] left-[3%] w-96 h-96 rounded-full blur-[60px] pointer-events-none" style={{ background: `radial-gradient(circle, ${a} 0%, ${aSoft} 50%, transparent 70%)` }} />
      <div className="absolute bottom-[5%] right-[3%] w-[420px] h-[420px] rounded-full blur-[65px] pointer-events-none" style={{ background: `radial-gradient(circle, ${b} 0%, ${bSoft} 50%, transparent 70%)` }} />
      <div className="absolute top-[2%] right-[18%] w-64 h-64 rounded-full blur-[50px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.65) 0%, rgba(56,189,248,0.22) 50%, transparent 70%)' }} />
      <div className="absolute bottom-[22%] left-[15%] w-72 h-72 rounded-full blur-[55px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.60) 0%, rgba(167,139,250,0.22) 50%, transparent 70%)' }} />
      <div className="absolute top-[40%] right-[1%] w-56 h-56 rounded-full blur-[50px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.50) 0%, rgba(251,146,60,0.18) 50%, transparent 70%)' }} />
    </>
  )
}
