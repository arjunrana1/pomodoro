import { useState, useCallback, useRef, useEffect } from 'react'
import type { AppState, PlanItem, NoteItem, FocusHistory } from './types'
import {
  playClickSound,
  playStartSound,
  playPauseSound,
  playResumeSound,
  playStopSound,
  playCompletionSound,
} from './audio'
import { getTodayKey, recordFocusedSeconds, migrateDayRecord } from './utils'

const STORAGE_KEY = 'pomodoro-focus-state'
const STATS_KEY = 'pomodoro-focus-stats'
const HISTORY_KEY = 'pomodoro-focus-history'

// Legacy keys (for one-shot migration from earlier "Deep Focus" build)
const LEGACY_STORAGE_KEY = 'deep-focus-state'
const LEGACY_STATS_KEY = 'deep-focus-stats'

function migrateLegacyKeys() {
  try {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
      if (legacy) {
        localStorage.setItem(STORAGE_KEY, legacy)
        localStorage.removeItem(LEGACY_STORAGE_KEY)
      }
    }
    if (!localStorage.getItem(STATS_KEY)) {
      const legacy = localStorage.getItem(LEGACY_STATS_KEY)
      if (legacy) {
        localStorage.setItem(STATS_KEY, legacy)
        localStorage.removeItem(LEGACY_STATS_KEY)
      }
    }
  } catch { /* localStorage unavailable — degrade silently */ }
}

function loadStats(): { todayFocusSeconds: number; todaySessionsCount: number } {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data.dateKey === getTodayKey()) {
        return { todayFocusSeconds: data.focusSeconds || 0, todaySessionsCount: data.sessionsCount || 0 }
      }
    }
  } catch { /* localStorage unavailable — degrade silently */ }
  return { todayFocusSeconds: 0, todaySessionsCount: 0 }
}

function saveStats(dateKey: string, focusSeconds: number, sessions: number) {
  localStorage.setItem(STATS_KEY, JSON.stringify({ dateKey, focusSeconds, sessionsCount: sessions }))
}

function loadHistory(): FocusHistory {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as FocusHistory
      if (parsed && parsed.days) {
        // Migrate any legacy 12-bucket records to the new 24-bucket shape and
        // ensure tasksCompleted is always defined.
        const days: Record<string, ReturnType<typeof migrateDayRecord>> = {}
        for (const [k, v] of Object.entries(parsed.days)) {
          days[k] = migrateDayRecord({ ...(v as object), dateKey: k })
        }
        return { days }
      }
    }
  } catch { /* localStorage unavailable — degrade silently */ }
  return { days: {} }
}

function saveHistory(history: FocusHistory) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch { /* localStorage unavailable — degrade silently */ }
}

function getDefaultState(): AppState {
  const stats = loadStats()
  return {
    mode: 'quick',
    status: 'idle',
    selectedPreset: 20,
    customMinutes: null,
    customMinutesInputError: null,
    planItems: [],
    secondsRemaining: 20 * 60,
    totalSessionSeconds: 20 * 60,
    notes: [],
    todayFocusSeconds: stats.todayFocusSeconds,
    todaySessionsCount: stats.todaySessionsCount,
    showPlanSidebar: false,
    showNotesDrawer: false,
    soundEnabled: true,
    sessionStoppedEarly: false,
    attributedDay: null,
    startedAt: null,
    initialSeconds: 20 * 60,
    pausedAt: null,
    totalPausedSeconds: 0,
    lastSessionElapsedSeconds: 0,
    focusHistory: loadHistory(),
  }
}

function computeRemainingFromWallClock(state: AppState, nowMs: number): number {
  if (!state.startedAt || !state.initialSeconds) return state.secondsRemaining
  const startedMs = new Date(state.startedAt).getTime()
  const pausedExtraMs = state.pausedAt ? nowMs - new Date(state.pausedAt).getTime() : 0
  const elapsedSec = Math.floor((nowMs - startedMs - state.totalPausedSeconds * 1000 - pausedExtraMs) / 1000)
  return Math.max(0, state.initialSeconds - elapsedSec)
}

function computeFocusedElapsedSeconds(state: AppState, nowMs: number): number {
  if (!state.startedAt || !state.initialSeconds) return 0
  const startedMs = new Date(state.startedAt).getTime()
  const pausedExtraMs = state.pausedAt ? nowMs - new Date(state.pausedAt).getTime() : 0
  const elapsedSec = Math.floor((nowMs - startedMs - state.totalPausedSeconds * 1000 - pausedExtraMs) / 1000)
  return Math.max(0, Math.min(state.initialSeconds, elapsedSec))
}

function loadPersistedState(): AppState {
  migrateLegacyKeys()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<AppState>
      const defaults = getDefaultState()
      const state: AppState = { ...defaults, ...saved, focusHistory: loadHistory() }

      if (state.status === 'running' && state.startedAt) {
        // Wall-clock recomputation: the timer is driven by Date.now() not by ticks,
        // so a tab close/reopen reflects real elapsed time.
        const now = Date.now()
        const remaining = computeRemainingFromWallClock(state, now)
        state.showPlanSidebar = false
        state.showNotesDrawer = false
        if (remaining <= 0) {
          // Session would have completed during the closure: transition straight
          // to Flow Complete and update stats + history as if completed normally.
          const attributedDay = state.attributedDay || getTodayKey()
          const dailyStats = loadStats()
          const isToday = attributedDay === getTodayKey()
          const focusBase = isToday ? dailyStats.todayFocusSeconds : 0
          const sessionsBase = isToday ? dailyStats.todaySessionsCount : 0
          const newFocus = focusBase + state.initialSeconds
          const newSessions = sessionsBase + 1
          saveStats(getTodayKey(), isToday ? newFocus : dailyStats.todayFocusSeconds, isToday ? newSessions : dailyStats.todaySessionsCount)
          const startedMs = new Date(state.startedAt).getTime()
          const endedMs = startedMs + state.initialSeconds * 1000 + state.totalPausedSeconds * 1000
          const tasksDoneOnRestore = state.planItems.filter(p => p.completed).length
          const updatedHistory = recordFocusedSeconds(
            state.focusHistory,
            startedMs,
            endedMs,
            state.totalPausedSeconds * 1000,
            attributedDay,
            true,
            tasksDoneOnRestore,
          )
          saveHistory(updatedHistory)
          return {
            ...state,
            status: 'complete',
            secondsRemaining: 0,
            sessionStoppedEarly: false,
            lastSessionElapsedSeconds: state.initialSeconds,
            todayFocusSeconds: isToday ? newFocus : dailyStats.todayFocusSeconds,
            todaySessionsCount: isToday ? newSessions : dailyStats.todaySessionsCount,
            focusHistory: updatedHistory,
          }
        }
        return { ...state, secondsRemaining: remaining }
      }

      if (state.status === 'paused') {
        // Paused time does not advance the wall clock; restore literally.
        state.showPlanSidebar = false
        state.showNotesDrawer = false
        return state
      }

      // For idle/complete, restore non-session-specific pieces and reset the rest.
      return {
        ...defaults,
        planItems: state.planItems || [],
        notes: state.notes || [],
        soundEnabled: state.soundEnabled ?? true,
        sessionStoppedEarly: state.sessionStoppedEarly || false,
        focusHistory: state.focusHistory || defaults.focusHistory,
        lastSessionElapsedSeconds: state.lastSessionElapsedSeconds || 0,
      }
    }
  } catch { /* localStorage unavailable — degrade silently */ }
  return getDefaultState()
}

function persistState(state: AppState) {
  const toSave: Partial<AppState> = {
    mode: state.mode,
    status: state.status,
    selectedPreset: state.selectedPreset,
    customMinutes: state.customMinutes,
    customMinutesInputError: state.customMinutesInputError,
    planItems: state.planItems,
    secondsRemaining: state.secondsRemaining,
    totalSessionSeconds: state.totalSessionSeconds,
    notes: state.notes,
    soundEnabled: state.soundEnabled,
    sessionStoppedEarly: state.sessionStoppedEarly,
    attributedDay: state.attributedDay,
    startedAt: state.startedAt,
    initialSeconds: state.initialSeconds,
    pausedAt: state.pausedAt,
    totalPausedSeconds: state.totalPausedSeconds,
    lastSessionElapsedSeconds: state.lastSessionElapsedSeconds,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  saveHistory(state.focusHistory)
}

function getSelectedMinutes(state: AppState): number {
  if (state.selectedPreset) return state.selectedPreset
  if (state.customMinutes && state.customMinutes > 0) return state.customMinutes
  return 20
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadPersistedState)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dayKeyRef = useRef<string>(getTodayKey())

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    persistState(state)
  }, [state])

  useEffect(() => {
    if (state.status === 'running' || state.status === 'paused') {
      const m = Math.floor(state.secondsRemaining / 60)
      const s = state.secondsRemaining % 60
      const time = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      document.title = `${time} - Pomodoro Focus`
    } else if (state.status === 'complete') {
      document.title = 'Flow Complete - Pomodoro Focus'
    } else {
      document.title = 'Pomodoro Focus'
    }
  }, [state.status, state.secondsRemaining])

  // Wall-clock-driven tick: source of truth is Date.now(), not a per-tick decrement.
  useEffect(() => {
    if (state.status === 'running') {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.status !== 'running' || !prev.startedAt) return prev
          const now = Date.now()
          const remaining = computeRemainingFromWallClock(prev, now)
          if (remaining <= 0) {
            clearTimer()
            const attributedDay = prev.attributedDay || getTodayKey()
            const isToday = attributedDay === getTodayKey()
            const focusBase = isToday ? prev.todayFocusSeconds : loadStats().todayFocusSeconds
            const sessionsBase = isToday ? prev.todaySessionsCount : loadStats().todaySessionsCount
            const newFocus = focusBase + prev.initialSeconds
            const newSessions = sessionsBase + 1
            saveStats(getTodayKey(), isToday ? newFocus : loadStats().todayFocusSeconds, isToday ? newSessions : loadStats().todaySessionsCount)
            if (prev.soundEnabled) playCompletionSound()
            const startedMs = new Date(prev.startedAt).getTime()
            const endedMs = startedMs + prev.initialSeconds * 1000 + prev.totalPausedSeconds * 1000
            const tasksDoneNatural = prev.planItems.filter(p => p.completed).length
            const updatedHistory = recordFocusedSeconds(
              prev.focusHistory,
              startedMs,
              endedMs,
              prev.totalPausedSeconds * 1000,
              attributedDay,
              true,
              tasksDoneNatural,
            )
            return {
              ...prev,
              secondsRemaining: 0,
              status: 'complete',
              sessionStoppedEarly: false,
              lastSessionElapsedSeconds: prev.initialSeconds,
              todayFocusSeconds: isToday ? newFocus : prev.todayFocusSeconds,
              todaySessionsCount: isToday ? newSessions : prev.todaySessionsCount,
              focusHistory: updatedHistory,
            }
          }
          if (remaining === prev.secondsRemaining) return prev
          return { ...prev, secondsRemaining: remaining }
        })
      }, 250)
    } else {
      clearTimer()
    }
    return clearTimer
  }, [state.status, clearTimer])

  // Local-midnight rollover refresh: bumps daily stats / dashboard to the new day.
  useEffect(() => {
    const i = setInterval(() => {
      const today = getTodayKey()
      if (today !== dayKeyRef.current) {
        dayKeyRef.current = today
        const fresh = loadStats()
        setState(prev => ({
          ...prev,
          todayFocusSeconds: fresh.todayFocusSeconds,
          todaySessionsCount: fresh.todaySessionsCount,
        }))
      }
    }, 30_000)
    return () => clearInterval(i)
  }, [])

  const selectPreset = useCallback((m: 15 | 20 | 25) => {
    setState(prev => ({
      ...prev,
      selectedPreset: m,
      customMinutes: null,
      customMinutesInputError: null,
      secondsRemaining: m * 60,
      totalSessionSeconds: m * 60,
      initialSeconds: m * 60,
    }))
  }, [])

  /**
   * Commit a custom-minutes value from the pill input. Invalid input keeps the
   * pill open with an error state per PRD §7.1; valid input becomes the active
   * selection and clears any preset.
   */
  const commitCustomMinutes = useCallback((raw: string): boolean => {
    const trimmed = raw.trim()
    if (trimmed === '') {
      setState(prev => ({ ...prev, customMinutesInputError: 'Enter a whole number ≥ 1' }))
      return false
    }
    if (!/^\d+$/.test(trimmed)) {
      setState(prev => ({ ...prev, customMinutesInputError: 'Whole numbers only — no decimals or letters' }))
      return false
    }
    const m = parseInt(trimmed, 10)
    if (!Number.isFinite(m) || m < 1) {
      setState(prev => ({ ...prev, customMinutesInputError: 'Enter a whole number ≥ 1' }))
      return false
    }
    setState(prev => ({
      ...prev,
      selectedPreset: null,
      customMinutes: m,
      customMinutesInputError: null,
      secondsRemaining: m * 60,
      totalSessionSeconds: m * 60,
      initialSeconds: m * 60,
    }))
    return true
  }, [])

  const setCustomMinutesError = useCallback((err: string | null) => {
    setState(prev => ({ ...prev, customMinutesInputError: err }))
  }, [])

  const togglePlanSidebar = useCallback(() => {
    setState(prev => ({ ...prev, showPlanSidebar: !prev.showPlanSidebar }))
  }, [])

  const toggleNotesDrawer = useCallback(() => {
    setState(prev => ({ ...prev, showNotesDrawer: !prev.showNotesDrawer }))
  }, [])

  const closeNotesDrawer = useCallback(() => {
    setState(prev => ({ ...prev, showNotesDrawer: false }))
  }, [])

  const toggleSound = useCallback(() => {
    setState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))
  }, [])

  const addPlanItem = useCallback((title: string, minutes: number) => {
    const item: PlanItem = { id: crypto.randomUUID(), title, minutes, completed: false }
    setState(prev => ({ ...prev, planItems: [...prev.planItems, item] }))
  }, [])

  const removePlanItem = useCallback((id: string) => {
    setState(prev => ({ ...prev, planItems: prev.planItems.filter(i => i.id !== id) }))
  }, [])

  const reorderPlanItems = useCallback((fromIndex: number, toIndex: number) => {
    setState(prev => {
      const items = [...prev.planItems]
      const [moved] = items.splice(fromIndex, 1)
      items.splice(toIndex, 0, moved)
      return { ...prev, planItems: items }
    })
  }, [])

  const togglePlanItemCompleted = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      planItems: prev.planItems.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }))
  }, [])

  const addNote = useCallback((text: string) => {
    const item: NoteItem = { id: crypto.randomUUID(), text, createdAt: Date.now() }
    setState(prev => ({ ...prev, notes: [...prev.notes, item] }))
  }, [])

  const editNote = useCallback((id: string, text: string) => {
    setState(prev => ({ ...prev, notes: prev.notes.map(n => n.id === id ? { ...n, text } : n) }))
  }, [])

  const deleteNote = useCallback((id: string) => {
    setState(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }))
  }, [])

  const startSession = useCallback((source: 'home' | 'plan' = 'home') => {
    setState(prev => {
      if (prev.soundEnabled) playStartSound()
      const minutes = source === 'plan'
        ? prev.planItems.reduce((s, i) => s + i.minutes, 0)
        : getSelectedMinutes(prev)
      const seconds = minutes * 60
      return {
        ...prev,
        mode: source === 'plan' ? 'planned' : 'quick',
        status: 'running',
        secondsRemaining: seconds,
        totalSessionSeconds: seconds,
        initialSeconds: seconds,
        startedAt: new Date().toISOString(),
        pausedAt: null,
        totalPausedSeconds: 0,
        showPlanSidebar: false,
        sessionStoppedEarly: false,
        attributedDay: getTodayKey(),
      }
    })
  }, [])

  const pauseSession = useCallback(() => {
    setState(prev => {
      if (prev.status === 'running') {
        if (prev.soundEnabled) playPauseSound()
        return { ...prev, status: 'paused', pausedAt: new Date().toISOString() }
      }
      if (prev.status === 'paused') {
        if (prev.soundEnabled) playResumeSound()
        const pausedExtraMs = prev.pausedAt ? Date.now() - new Date(prev.pausedAt).getTime() : 0
        return {
          ...prev,
          status: 'running',
          pausedAt: null,
          totalPausedSeconds: prev.totalPausedSeconds + Math.floor(pausedExtraMs / 1000),
        }
      }
      return prev
    })
  }, [])

  const stopSession = useCallback(() => {
    if (!window.confirm('Are you sure you want to stop this session? Your progress will not count toward daily stats.')) {
      return
    }
    clearTimer()
    setState(prev => {
      if (prev.soundEnabled) playStopSound()
      const now = Date.now()
      const elapsed = computeFocusedElapsedSeconds(prev, now)
      let updatedHistory = prev.focusHistory
      if (prev.startedAt) {
        const startedMs = new Date(prev.startedAt).getTime()
        const pausedMs = prev.totalPausedSeconds * 1000 + (prev.pausedAt ? now - new Date(prev.pausedAt).getTime() : 0)
        const attributedDay = prev.attributedDay || getTodayKey()
        // Stop still updates Focus History (elapsed seconds + segments) but NOT
        // dailyStats (sessionsCount/focusSeconds) per PRD §8.2/8.3.
        const tasksDoneStop = prev.planItems.filter(p => p.completed).length
        updatedHistory = recordFocusedSeconds(prev.focusHistory, startedMs, now, pausedMs, attributedDay, false, tasksDoneStop)
      }
      return {
        ...prev,
        status: 'complete',
        sessionStoppedEarly: true,
        lastSessionElapsedSeconds: elapsed,
        focusHistory: updatedHistory,
      }
    })
  }, [clearTimer])

  const newSession = useCallback(() => {
    clearTimer()
    setState(prev => {
      const base: AppState = {
        ...getDefaultState(),
        todayFocusSeconds: prev.todayFocusSeconds,
        todaySessionsCount: prev.todaySessionsCount,
        soundEnabled: prev.soundEnabled,
        focusHistory: prev.focusHistory,
      }
      // Unchecked tasks always survive; checked tasks always drop. Notes follow
      // PRD §7.5: cleared after natural completion, preserved after a stop.
      const unchecked = prev.planItems
        .filter(item => !item.completed)
        .map(item => ({ ...item, completed: false }))
      base.planItems = unchecked
      base.notes = prev.sessionStoppedEarly ? prev.notes : []
      return base
    })
  }, [clearTimer])

  const playClick = useCallback(() => {
    if (state.soundEnabled) playClickSound()
  }, [state.soundEnabled])

  return {
    state,
    selectPreset,
    commitCustomMinutes,
    setCustomMinutesError,
    togglePlanSidebar,
    toggleNotesDrawer,
    closeNotesDrawer,
    toggleSound,
    addPlanItem,
    removePlanItem,
    reorderPlanItems,
    togglePlanItemCompleted,
    startSession,
    pauseSession,
    stopSession,
    addNote,
    editNote,
    deleteNote,
    newSession,
    playClick,
  }
}
