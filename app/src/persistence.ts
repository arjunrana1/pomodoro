import type { AppState, CompletedTask, FocusHistory, SettingsState } from './types'

export const STATE_KEY = 'pomodoro-focus-state'
export const HISTORY_KEY = 'pomodoro-focus-history'
export const COMPLETED_KEY = 'pomodoro-focus-completed-tasks'
export const SETTINGS_KEY = 'pomodoro-focus-settings'

// v2 / legacy keys — presence of any of these (or a v3-marker-less state blob)
// means we purge everything and start fresh (REQUIREMENTS_V3 §15, AC-33).
const LEGACY_KEYS = ['pomodoro-focus-stats', 'deep-focus-state', 'deep-focus-stats']

export function purgeLegacyDataIfNeeded() {
  try {
    let legacy = LEGACY_KEYS.some(k => localStorage.getItem(k) !== null)
    if (!legacy) {
      const raw = localStorage.getItem(STATE_KEY)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (parsed?.version !== 3) legacy = true
        } catch {
          legacy = true
        }
      }
    }
    if (legacy) {
      for (const k of [STATE_KEY, HISTORY_KEY, COMPLETED_KEY, SETTINGS_KEY, ...LEGACY_KEYS]) {
        localStorage.removeItem(k)
      }
    }
  } catch { /* localStorage unavailable — degrade silently */ }
}

export function defaultSettings(): SettingsState {
  return {
    soundEnabled: true,
    soundVolume: 70,
    musicVolume: 70,
    activeTrackIndex: 0,
    loop: false,
    countUp: false,
    spotifyConnected: false,
  }
}

export function readSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...defaultSettings(), ...(JSON.parse(raw) as Partial<SettingsState>) }
  } catch { /* degrade silently */ }
  return defaultSettings()
}

/** Read-modify-write so independent writers (store, music, spotify) can share the key. */
export function writeSettings(partial: Partial<SettingsState>): SettingsState {
  const merged = { ...readSettings(), ...partial }
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
  } catch { /* degrade silently */ }
  return merged
}

export function readHistory(): FocusHistory {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as FocusHistory
      if (parsed && parsed.days) return parsed
    }
  } catch { /* degrade silently */ }
  return { days: {} }
}

export function writeHistory(history: FocusHistory) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch { /* degrade silently */ }
}

export function readCompletedTasks(): CompletedTask[] {
  try {
    const raw = localStorage.getItem(COMPLETED_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch { /* degrade silently */ }
  return []
}

export function writeCompletedTasks(tasks: CompletedTask[]) {
  try {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(tasks))
  } catch { /* degrade silently */ }
}

export function persistRuntimeState(state: AppState) {
  const toSave = {
    version: 3,
    mode: state.mode,
    status: state.status,
    sessionMode: state.sessionMode,
    selectedWorkPreset: state.selectedWorkPreset,
    customWorkMinutes: state.customWorkMinutes,
    selectedBreakPreset: state.selectedBreakPreset,
    customBreakMinutes: state.customBreakMinutes,
    tasks: state.tasks,
    notes: state.notes,
    secondsRemaining: state.secondsRemaining,
    initialSeconds: state.initialSeconds,
    startedAt: state.startedAt,
    pausedAt: state.pausedAt,
    totalPausedSeconds: state.totalPausedSeconds,
    attributedDay: state.attributedDay,
    sessionStoppedEarly: state.sessionStoppedEarly,
    lastSessionElapsedSeconds: state.lastSessionElapsedSeconds,
    dailyStats: state.dailyStats,
  }
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(toSave))
  } catch { /* degrade silently */ }
}

export function readRuntimeState(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.version === 3) return parsed as Partial<AppState>
    }
  } catch { /* degrade silently */ }
  return null
}

/** AC-24: single JSON download of every persisted piece of app data. */
export function exportAllData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'Pomodoro Focus',
    version: 3,
    state: readRuntimeState(),
    focusHistory: readHistory(),
    completedTasks: readCompletedTasks(),
    settings: readSettings(),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pomodoro-focus-export-${getDateStamp()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function getDateStamp(): string {
  return new Date().toLocaleDateString('en-CA')
}
