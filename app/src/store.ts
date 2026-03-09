import { useState, useCallback, useRef, useEffect } from 'react'
import type { AppState, PlanItem, NoteItem } from './types'
import { playClickSound, playStartSound, playPauseSound, playResetSound, playStopSound, playCompletionSound } from './audio'

const STORAGE_KEY = 'deep-focus-state'
const STATS_KEY = 'deep-focus-stats'

function getTodayKey(): string {
  return new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
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
  } catch {}
  return { todayFocusSeconds: 0, todaySessionsCount: 0 }
}

function saveStats(dateKey: string, focusSeconds: number, sessions: number) {
  localStorage.setItem(STATS_KEY, JSON.stringify({ dateKey, focusSeconds, sessionsCount: sessions }))
}

function getDefaultState(): AppState {
  const stats = loadStats()
  return {
    mode: 'quick',
    status: 'idle',
    selectedPreset: 20,
    customMinutes: null,
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
  }
}

function loadPersistedState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<AppState>
      const defaults = getDefaultState()
      const state: AppState = { ...defaults, ...saved }

      // If there was an active session, recalculate elapsed time
      if (state.status === 'running' || state.status === 'paused') {
        // Restore but keep drawers closed
        state.showPlanSidebar = false
        state.showNotesDrawer = false
        return state
      }

      // For idle/complete, just restore relevant pieces
      return {
        ...defaults,
        planItems: state.planItems || [],
        notes: state.notes || [],
        soundEnabled: state.soundEnabled ?? true,
        sessionStoppedEarly: state.sessionStoppedEarly || false,
      }
    }
  } catch {}
  return getDefaultState()
}

function persistState(state: AppState) {
  const toSave: Partial<AppState> = {
    mode: state.mode,
    status: state.status,
    selectedPreset: state.selectedPreset,
    customMinutes: state.customMinutes,
    planItems: state.planItems,
    secondsRemaining: state.secondsRemaining,
    totalSessionSeconds: state.totalSessionSeconds,
    notes: state.notes,
    soundEnabled: state.soundEnabled,
    sessionStoppedEarly: state.sessionStoppedEarly,
    attributedDay: state.attributedDay,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
}

function getSelectedMinutes(state: AppState): number {
  if (state.selectedPreset) return state.selectedPreset
  if (state.customMinutes && state.customMinutes > 0) return state.customMinutes
  return 20
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadPersistedState)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Persist state on every change
  useEffect(() => {
    persistState(state)
  }, [state])

  // Update browser tab title
  useEffect(() => {
    if (state.status === 'running' || state.status === 'paused') {
      const m = Math.floor(state.secondsRemaining / 60)
      const s = state.secondsRemaining % 60
      const time = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      document.title = `${time} - Deep Focus Pomodoro`
    } else if (state.status === 'complete') {
      document.title = 'Flow Complete - Deep Focus Pomodoro'
    } else {
      document.title = 'Deep Focus Pomodoro'
    }
  }, [state.status, state.secondsRemaining])

  // Timer countdown
  useEffect(() => {
    if (state.status === 'running') {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.secondsRemaining <= 1) {
            clearTimer()
            const elapsed = prev.totalSessionSeconds
            const dayKey = prev.attributedDay || getTodayKey()
            const isToday = dayKey === getTodayKey()
            const stats = isToday
              ? { focusSeconds: prev.todayFocusSeconds, sessionsCount: prev.todaySessionsCount }
              : { focusSeconds: loadStats().todayFocusSeconds, sessionsCount: loadStats().todaySessionsCount }
            const newFocus = stats.focusSeconds + elapsed
            const newSessions = stats.sessionsCount + 1
            saveStats(isToday ? dayKey : getTodayKey(), newFocus, newSessions)
            if (prev.soundEnabled) playCompletionSound()
            return {
              ...prev,
              secondsRemaining: 0,
              status: 'complete',
              sessionStoppedEarly: false,
              todayFocusSeconds: newFocus,
              todaySessionsCount: newSessions,
            }
          }
          return { ...prev, secondsRemaining: prev.secondsRemaining - 1 }
        })
      }, 1000)
    } else {
      clearTimer()
    }
    return clearTimer
  }, [state.status, clearTimer])

  const selectPreset = useCallback((m: 15 | 20 | 25) => {
    setState(prev => ({
      ...prev,
      selectedPreset: m,
      customMinutes: null,
      secondsRemaining: m * 60,
      totalSessionSeconds: m * 60,
    }))
  }, [])

  const setCustomMinutes = useCallback((m: number | null) => {
    if (m !== null && m > 0) {
      setState(prev => ({
        ...prev,
        selectedPreset: null,
        customMinutes: m,
        secondsRemaining: m * 60,
        totalSessionSeconds: m * 60,
      }))
    }
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

  // --- Plan Items ---
  const addPlanItem = useCallback((title: string, minutes: number) => {
    const item: PlanItem = { id: crypto.randomUUID(), title, minutes, completed: false }
    setState(prev => ({
      ...prev,
      planItems: [...prev.planItems, item],
    }))
  }, [])

  const removePlanItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      planItems: prev.planItems.filter(i => i.id !== id),
    }))
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

  // --- Notes ---
  const addNote = useCallback((text: string) => {
    const item: NoteItem = { id: crypto.randomUUID(), text, createdAt: Date.now() }
    setState(prev => ({ ...prev, notes: [...prev.notes, item] }))
  }, [])

  const editNote = useCallback((id: string, text: string) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === id ? { ...n, text } : n),
    }))
  }, [])

  const deleteNote = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.filter(n => n.id !== id),
    }))
  }, [])

  // --- Session Controls ---
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
        showPlanSidebar: false,
        sessionStoppedEarly: false,
        attributedDay: getTodayKey(),
      }
    })
  }, [])

  const pauseSession = useCallback(() => {
    setState(prev => {
      if (prev.soundEnabled) playPauseSound()
      return { ...prev, status: prev.status === 'running' ? 'paused' : 'running' }
    })
  }, [])

  const resetSession = useCallback(() => {
    clearTimer()
    setState(prev => {
      if (prev.soundEnabled) playResetSound()
      return {
        ...prev,
        status: 'idle',
        selectedPreset: 20,
        customMinutes: null,
        secondsRemaining: 20 * 60,
        totalSessionSeconds: 20 * 60,
        planItems: prev.planItems.map(item => ({ ...item, completed: false })),
        showPlanSidebar: false,
        showNotesDrawer: false,
        sessionStoppedEarly: false,
        attributedDay: null,
      }
    })
  }, [clearTimer])

  const stopSession = useCallback(() => {
    if (!window.confirm('Are you sure you want to stop this session? Your progress will not count toward daily stats.')) {
      return
    }
    clearTimer()
    setState(prev => {
      if (prev.soundEnabled) playStopSound()
      return {
        ...prev,
        status: 'complete',
        sessionStoppedEarly: true,
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
      }
      // Keep uncompleted tasks and notes for next session, remove completed ones
      const remainingItems = prev.planItems
        .filter(item => !item.completed)
        .map(item => ({ ...item, completed: false }))
      base.planItems = remainingItems
      base.notes = prev.notes
      return base
    })
  }, [clearTimer])

  const playClick = useCallback(() => {
    if (state.soundEnabled) playClickSound()
  }, [state.soundEnabled])

  return {
    state,
    selectPreset,
    setCustomMinutes,
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
    resetSession,
    stopSession,
    addNote,
    editNote,
    deleteNote,
    newSession,
    playClick,
  }
}
