import { useState, useCallback, useRef, useEffect } from 'react'
import type { AppState, CompletedTask, NoteItem, SessionMode, SettingsState, TaskItem } from './types'
import {
  setSoundVolume as setAudioVolume,
  playClickSound,
  playStartSound,
  playPauseSound,
  playResumeSound,
  playStopSound,
  playCompletionSound,
  playBreakStartSound,
  playBreakEndSound,
} from './audio'
import { getTodayKey, recordFocusedSeconds, formatTime } from './utils'
import {
  purgeLegacyDataIfNeeded,
  readRuntimeState,
  persistRuntimeState,
  readSettings,
  writeSettings,
  readHistory,
  writeHistory,
  readCompletedTasks,
  writeCompletedTasks,
  HISTORY_KEY,
} from './persistence'

function getDefaultState(): AppState {
  return {
    version: 3,
    mode: 'work',
    status: 'idle',
    sessionMode: 'work',
    selectedWorkPreset: 25,
    customWorkMinutes: null,
    selectedBreakPreset: 5,
    customBreakMinutes: null,
    customMinutesInputError: null,
    tasks: [],
    notes: [],
    secondsRemaining: 25 * 60,
    initialSeconds: 25 * 60,
    startedAt: null,
    pausedAt: null,
    totalPausedSeconds: 0,
    attributedDay: null,
    sessionStoppedEarly: false,
    lastSessionElapsedSeconds: 0,
    dailyStats: { dateKey: getTodayKey(), focusSeconds: 0, sessionsCount: 0 },
    focusHistory: { days: {} },
    completedTasks: [],
    showTasksDrawer: false,
    showNotesDrawer: false,
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

function todayStats(stats: AppState['dailyStats']): AppState['dailyStats'] {
  return stats.dateKey === getTodayKey() ? stats : { dateKey: getTodayKey(), focusSeconds: 0, sessionsCount: 0 }
}

function selectedMinutes(state: AppState, mode: SessionMode): number {
  if (mode === 'work') {
    if (state.selectedWorkPreset) return state.selectedWorkPreset
    if (state.customWorkMinutes && state.customWorkMinutes > 0) return state.customWorkMinutes
    return 25
  }
  if (state.selectedBreakPreset) return state.selectedBreakPreset
  if (state.customBreakMinutes && state.customBreakMinutes > 0) return state.customBreakMinutes
  return 5
}

/** Finish a Work session (natural completion): stats + history + summary fields. */
function completeWorkSession(prev: AppState): AppState {
  const attributedDay = prev.attributedDay || getTodayKey()
  const stats = todayStats(prev.dailyStats)
  const isToday = attributedDay === stats.dateKey
  const dailyStats = isToday
    ? { ...stats, focusSeconds: stats.focusSeconds + prev.initialSeconds, sessionsCount: stats.sessionsCount + 1 }
    : stats
  const startedMs = prev.startedAt ? new Date(prev.startedAt).getTime() : Date.now()
  const endedMs = startedMs + prev.initialSeconds * 1000 + prev.totalPausedSeconds * 1000
  const focusHistory = recordFocusedSeconds(prev.focusHistory, startedMs, endedMs, prev.totalPausedSeconds * 1000, attributedDay, true)
  writeHistory(focusHistory)
  return {
    ...prev,
    status: 'complete',
    secondsRemaining: 0,
    sessionStoppedEarly: false,
    lastSessionElapsedSeconds: prev.initialSeconds,
    dailyStats,
    focusHistory,
    showTasksDrawer: false,
    showNotesDrawer: false,
  }
}

/**
 * Boot-state memo: loadPersistedState mutates localStorage when a session
 * completed while the tab was closed, and React StrictMode invokes useState
 * initializers twice in dev — without this the restore double-records.
 */
let bootState: AppState | null = null

function loadPersistedStateOnce(): AppState {
  if (!bootState) bootState = loadPersistedState()
  return bootState
}

function loadPersistedState(): AppState {
  purgeLegacyDataIfNeeded()
  const defaults = getDefaultState()
  try {
    const saved = readRuntimeState()
    const focusHistory = readHistory()
    const completedTasks = readCompletedTasks()
    if (!saved) return { ...defaults, focusHistory, completedTasks }

    const state: AppState = {
      ...defaults,
      ...saved,
      dailyStats: todayStats(saved.dailyStats ?? defaults.dailyStats),
      focusHistory,
      completedTasks,
      showTasksDrawer: false,
      showNotesDrawer: false,
    }

    if (state.status === 'running' && state.startedAt) {
      // Wall-clock restoration: a closed tab keeps "running"; recompute on load.
      const remaining = computeRemainingFromWallClock(state, Date.now())
      if (remaining <= 0) {
        if (state.sessionMode === 'break') {
          // Break finished while closed — straight to Break Done, nothing recorded.
          return {
            ...state,
            status: 'complete',
            secondsRemaining: 0,
            sessionStoppedEarly: false,
            lastSessionElapsedSeconds: state.initialSeconds,
          }
        }
        return completeWorkSession(state)
      }
      return { ...state, secondsRemaining: remaining }
    }

    if (state.status === 'paused') {
      // Paused time does not advance the wall clock; restore literally.
      return state
    }

    // Idle / complete: restore durable pieces, reset session-specific fields.
    return {
      ...defaults,
      mode: state.mode,
      selectedWorkPreset: state.selectedWorkPreset,
      customWorkMinutes: state.customWorkMinutes,
      selectedBreakPreset: state.selectedBreakPreset,
      customBreakMinutes: state.customBreakMinutes,
      tasks: state.tasks || [],
      notes: state.notes || [],
      dailyStats: state.dailyStats,
      focusHistory,
      completedTasks,
      lastSessionElapsedSeconds: state.lastSessionElapsedSeconds || 0,
      secondsRemaining: selectedMinutes(state, state.mode) * 60,
      initialSeconds: selectedMinutes(state, state.mode) * 60,
    }
  } catch {
    return defaults
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadPersistedStateOnce)
  const [settings, setSettings] = useState<SettingsState>(readSettings)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dayKeyRef = useRef<string>(getTodayKey())
  const settingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    persistRuntimeState(state)
  }, [state])

  useEffect(() => {
    writeCompletedTasks(state.completedTasks)
  }, [state.completedTasks])

  useEffect(() => {
    setAudioVolume(settings.soundEnabled ? settings.soundVolume : 0)
  }, [settings.soundEnabled, settings.soundVolume])

  // Tab title reflects remaining (countDown) or elapsed (countUp) — AC-10.
  useEffect(() => {
    if (state.status === 'running' || state.status === 'paused') {
      const display = settings.countUp ? state.initialSeconds - state.secondsRemaining : state.secondsRemaining
      document.title = `${formatTime(display)} - Pomodoro Focus`
    } else if (state.status === 'complete') {
      document.title = state.sessionMode === 'break' ? 'Break Done - Pomodoro Focus' : 'Flow Complete - Pomodoro Focus'
    } else {
      document.title = 'Pomodoro Focus'
    }
  }, [state.status, state.secondsRemaining, state.initialSeconds, state.sessionMode, settings.countUp])

  // Wall-clock-driven tick: source of truth is Date.now(), not a per-tick decrement.
  useEffect(() => {
    if (state.status === 'running') {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.status !== 'running' || !prev.startedAt) return prev
          const remaining = computeRemainingFromWallClock(prev, Date.now())
          if (remaining <= 0) {
            clearTimer()
            const sound = settingsRef.current.soundEnabled
            if (prev.sessionMode === 'break') {
              if (sound) playBreakEndSound()
              return {
                ...prev,
                status: 'complete',
                secondsRemaining: 0,
                sessionStoppedEarly: false,
                lastSessionElapsedSeconds: prev.initialSeconds,
              }
            }
            if (sound) playCompletionSound()
            return completeWorkSession(prev)
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

  // Local-midnight rollover: refresh daily stats / dashboard (AC dashboards re-render).
  useEffect(() => {
    const i = setInterval(() => {
      const today = getTodayKey()
      if (today !== dayKeyRef.current) {
        dayKeyRef.current = today
        setState(prev => ({ ...prev, dailyStats: todayStats(prev.dailyStats) }))
      }
    }, 30_000)
    return () => clearInterval(i)
  }, [])

  // ── Mode & settings ────────────────────────────────────────────────────────

  const setMode = useCallback((mode: SessionMode) => {
    setState(prev => {
      // Mode is locked during any running/paused session (AC-3).
      if (prev.status === 'running' || prev.status === 'paused') return prev
      if (prev.mode === mode) return prev
      const secs = selectedMinutes(prev, mode) * 60
      return {
        ...prev,
        mode,
        status: 'idle',
        customMinutesInputError: null,
        secondsRemaining: secs,
        initialSeconds: secs,
        showTasksDrawer: mode === 'break' ? false : prev.showTasksDrawer,
        showNotesDrawer: mode === 'break' ? false : prev.showNotesDrawer,
      }
    })
  }, [])

  const setCountUp = useCallback((countUp: boolean) => {
    setSettings(writeSettings({ countUp }))
  }, [])

  const toggleSound = useCallback(() => {
    setSettings(prev => writeSettings({ soundEnabled: !prev.soundEnabled }))
  }, [])

  const setSoundVolume = useCallback((soundVolume: number) => {
    setSettings(writeSettings({ soundVolume }))
  }, [])

  /** Re-read settings from storage (used after Spotify connect/disconnect). */
  const refreshSettings = useCallback(() => {
    setSettings(readSettings())
  }, [])

  // ── Presets / custom duration ──────────────────────────────────────────────

  const selectWorkPreset = useCallback((m: 15 | 20 | 25) => {
    setState(prev => ({
      ...prev,
      selectedWorkPreset: m,
      customWorkMinutes: null,
      customMinutesInputError: null,
      secondsRemaining: m * 60,
      initialSeconds: m * 60,
    }))
  }, [])

  const selectBreakPreset = useCallback((m: 5 | 10 | 15) => {
    setState(prev => ({
      ...prev,
      selectedBreakPreset: m,
      customBreakMinutes: null,
      customMinutesInputError: null,
      secondsRemaining: m * 60,
      initialSeconds: m * 60,
    }))
  }, [])

  const commitCustomMinutes = useCallback((raw: string): boolean => {
    const trimmed = raw.trim()
    let error: string | null = null
    if (trimmed === '') error = 'Enter a whole number ≥ 1'
    else if (!/^\d+$/.test(trimmed)) error = 'Whole numbers only — no decimals or letters'
    else if (parseInt(trimmed, 10) < 1) error = 'Enter a whole number ≥ 1'
    if (error) {
      setState(prev => ({ ...prev, customMinutesInputError: error }))
      return false
    }
    const m = parseInt(trimmed, 10)
    setState(prev => ({
      ...prev,
      ...(prev.mode === 'work'
        ? { selectedWorkPreset: null, customWorkMinutes: m }
        : { selectedBreakPreset: null, customBreakMinutes: m }),
      customMinutesInputError: null,
      secondsRemaining: m * 60,
      initialSeconds: m * 60,
    }))
    return true
  }, [])

  const setCustomMinutesError = useCallback((err: string | null) => {
    setState(prev => ({ ...prev, customMinutesInputError: err }))
  }, [])

  // ── Drawers ────────────────────────────────────────────────────────────────

  const toggleTasksDrawer = useCallback(() => {
    setState(prev => ({ ...prev, showTasksDrawer: !prev.showTasksDrawer, showNotesDrawer: false }))
  }, [])

  const closeTasksDrawer = useCallback(() => {
    setState(prev => (prev.showTasksDrawer ? { ...prev, showTasksDrawer: false } : prev))
  }, [])

  const toggleNotesDrawer = useCallback(() => {
    setState(prev => ({ ...prev, showNotesDrawer: !prev.showNotesDrawer, showTasksDrawer: false }))
  }, [])

  const closeNotesDrawer = useCallback(() => {
    setState(prev => (prev.showNotesDrawer ? { ...prev, showNotesDrawer: false } : prev))
  }, [])

  // ── Tasks ──────────────────────────────────────────────────────────────────

  const addTask = useCallback((title: string, minutes: number) => {
    const item: TaskItem = { id: crypto.randomUUID(), title, minutes, checked: false }
    setState(prev => ({ ...prev, tasks: [...prev.tasks, item] }))
  }, [])

  const removeTask = useCallback((id: string) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }))
  }, [])

  const reorderTasks = useCallback((fromIndex: number, toIndex: number) => {
    setState(prev => {
      const active = prev.tasks.filter(t => !t.checked)
      const checked = prev.tasks.filter(t => t.checked)
      const [moved] = active.splice(fromIndex, 1)
      if (!moved) return prev
      active.splice(toIndex, 0, moved)
      return { ...prev, tasks: [...active, ...checked] }
    })
  }, [])

  /**
   * Check/uncheck a task. Checking moves it into the Completed Tasks log with a
   * timestamp (newest-first, AC-15); unchecking pulls its log entry back out.
   */
  const toggleTaskChecked = useCallback((id: string) => {
    setState(prev => {
      const task = prev.tasks.find(t => t.id === id)
      if (!task) return prev
      const nowChecked = !task.checked
      const tasks = prev.tasks.map(t => (t.id === id ? { ...t, checked: nowChecked } : t))
      let completedTasks = prev.completedTasks
      if (nowChecked) {
        const entry: CompletedTask = {
          id: task.id,
          title: task.title,
          minutes: task.minutes,
          completedAt: new Date().toISOString(),
        }
        completedTasks = [entry, ...prev.completedTasks]
      } else {
        completedTasks = prev.completedTasks.filter(c => c.id !== id)
      }
      return { ...prev, tasks, completedTasks }
    })
  }, [])

  const clearCompletedTasks = useCallback(() => {
    setState(prev => ({ ...prev, completedTasks: [] }))
  }, [])

  // ── Notes ──────────────────────────────────────────────────────────────────

  const addNote = useCallback((text: string) => {
    const item: NoteItem = { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() }
    setState(prev => ({ ...prev, notes: [item, ...prev.notes] }))
  }, [])

  const editNote = useCallback((id: string, text: string) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.map(n => (n.id === id ? { ...n, text, editedAt: new Date().toISOString() } : n)),
    }))
  }, [])

  const deleteNote = useCallback((id: string) => {
    setState(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }))
  }, [])

  // ── Sessions ───────────────────────────────────────────────────────────────

  const startSession = useCallback((source: 'home' | 'plan' = 'home') => {
    setState(prev => {
      const mode = prev.mode
      if (settingsRef.current.soundEnabled) {
        if (mode === 'break') playBreakStartSound()
        else playStartSound()
      }
      const minutes =
        source === 'plan'
          ? prev.tasks.filter(t => !t.checked).reduce((s, t) => s + t.minutes, 0)
          : selectedMinutes(prev, mode)
      const seconds = Math.max(60, minutes * 60)
      return {
        ...prev,
        status: 'running',
        sessionMode: mode,
        secondsRemaining: seconds,
        initialSeconds: seconds,
        startedAt: new Date().toISOString(),
        pausedAt: null,
        totalPausedSeconds: 0,
        attributedDay: getTodayKey(),
        sessionStoppedEarly: false,
        showTasksDrawer: false,
        showNotesDrawer: false,
        dailyStats: todayStats(prev.dailyStats),
      }
    })
  }, [])

  const pauseResumeSession = useCallback(() => {
    setState(prev => {
      if (prev.status === 'running') {
        if (settingsRef.current.soundEnabled) playPauseSound()
        return { ...prev, status: 'paused', pausedAt: new Date().toISOString() }
      }
      if (prev.status === 'paused') {
        if (settingsRef.current.soundEnabled) playResumeSound()
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

  /** Work Stop — confirm, then Flow Complete. History updated, daily stats not (AC-11). */
  const stopSession = useCallback(() => {
    if (!window.confirm('Are you sure you want to stop this session? Your progress will not count toward daily stats.')) {
      return
    }
    clearTimer()
    setState(prev => {
      if (settingsRef.current.soundEnabled) playStopSound()
      const now = Date.now()
      const elapsed = computeFocusedElapsedSeconds(prev, now)
      const attributedDay = prev.attributedDay || getTodayKey()
      let focusHistory = prev.focusHistory
      if (prev.startedAt) {
        const startedMs = new Date(prev.startedAt).getTime()
        const pausedMs = prev.totalPausedSeconds * 1000 + (prev.pausedAt ? now - new Date(prev.pausedAt).getTime() : 0)
        focusHistory = recordFocusedSeconds(prev.focusHistory, startedMs, now, pausedMs, attributedDay, false)
        writeHistory(focusHistory)
      }
      // Stopped sessions add their elapsed focus time to today's total so the
      // orb stays consistent with the dashboard; only natural completions
      // increment the sessions counter.
      const stats = todayStats(prev.dailyStats)
      const dailyStats = attributedDay === stats.dateKey
        ? { ...stats, focusSeconds: stats.focusSeconds + elapsed }
        : stats
      return {
        ...prev,
        status: 'complete',
        sessionStoppedEarly: true,
        lastSessionElapsedSeconds: elapsed,
        dailyStats,
        focusHistory,
        showTasksDrawer: false,
        showNotesDrawer: false,
      }
    })
  }, [clearTimer])

  /** Break End — immediate, nothing recorded (REQUIREMENTS §3.4). */
  const endBreak = useCallback(() => {
    clearTimer()
    setState(prev => {
      if (settingsRef.current.soundEnabled) playBreakEndSound()
      const elapsed = computeFocusedElapsedSeconds(prev, Date.now())
      return {
        ...prev,
        status: 'complete',
        sessionStoppedEarly: true,
        lastSessionElapsedSeconds: elapsed,
      }
    })
  }, [clearTimer])

  /**
   * Leave a completion screen. Checked plan tasks drop (they live in the
   * completed log); unchecked tasks and notes always survive (§15.3).
   * `targetMode` forces Work when leaving Break Done via "Start Focus Session".
   */
  const newSession = useCallback((targetMode?: SessionMode) => {
    clearTimer()
    setState(prev => {
      const mode = targetMode ?? prev.mode
      const secs = selectedMinutes(prev, mode) * 60
      return {
        ...prev,
        mode,
        status: 'idle',
        sessionMode: mode,
        tasks: prev.tasks.filter(t => !t.checked),
        secondsRemaining: secs,
        initialSeconds: secs,
        startedAt: null,
        pausedAt: null,
        totalPausedSeconds: 0,
        attributedDay: null,
        customMinutesInputError: null,
        dailyStats: todayStats(prev.dailyStats),
      }
    })
  }, [clearTimer])

  // ── Data & Privacy ─────────────────────────────────────────────────────────

  const clearFocusHistory = useCallback(() => {
    setState(prev => {
      const focusHistory = { days: {} }
      try {
        localStorage.removeItem(HISTORY_KEY)
      } catch { /* degrade silently */ }
      return {
        ...prev,
        focusHistory,
        dailyStats: { dateKey: getTodayKey(), focusSeconds: 0, sessionsCount: 0 },
      }
    })
  }, [])

  const playClick = useCallback(() => {
    if (settingsRef.current.soundEnabled) playClickSound()
  }, [])

  return {
    state,
    settings,
    setMode,
    setCountUp,
    toggleSound,
    setSoundVolume,
    refreshSettings,
    selectWorkPreset,
    selectBreakPreset,
    commitCustomMinutes,
    setCustomMinutesError,
    toggleTasksDrawer,
    closeTasksDrawer,
    toggleNotesDrawer,
    closeNotesDrawer,
    addTask,
    removeTask,
    reorderTasks,
    toggleTaskChecked,
    clearCompletedTasks,
    addNote,
    editNote,
    deleteNote,
    startSession,
    pauseResumeSession,
    stopSession,
    endBreak,
    newSession,
    clearFocusHistory,
    playClick,
  }
}

export type AppStore = ReturnType<typeof useAppState>
