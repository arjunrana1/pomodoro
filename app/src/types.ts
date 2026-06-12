export type SessionMode = 'work' | 'break'
export type TimerDirection = 'countDown' | 'countUp'
export type AppStatus = 'idle' | 'running' | 'paused' | 'complete'

export interface TaskItem {
  id: string
  title: string
  minutes: number
  checked: boolean
}

export interface NoteItem {
  id: string
  text: string
  createdAt: string
  editedAt?: string
}

export interface CompletedTask {
  id: string
  title: string
  minutes: number
  completedAt: string
}

export interface DayRecord {
  dateKey: string
  totalFocusSeconds: number
  sessionsCount: number
  /** Length 24 — one entry per wall-clock hour (0..23). */
  segmentSeconds: number[]
}

export interface FocusHistory {
  days: Record<string, DayRecord>
}

export interface SpotifyTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface SettingsState {
  soundEnabled: boolean
  soundVolume: number // 0–100
  musicVolume: number // 0–100
  activeTrackIndex: number
  loop: boolean
  countUp: boolean
  spotifyConnected: boolean
  spotifyTokens?: SpotifyTokens
}

export interface DailyStats {
  dateKey: string
  focusSeconds: number
  sessionsCount: number
}

export interface AppState {
  version: 3
  mode: SessionMode
  status: AppStatus
  /** Mode of the session that is running/paused or just completed. */
  sessionMode: SessionMode
  selectedWorkPreset: 15 | 20 | 25 | null
  customWorkMinutes: number | null
  selectedBreakPreset: 5 | 10 | 15 | null
  customBreakMinutes: number | null
  customMinutesInputError: string | null
  tasks: TaskItem[]
  notes: NoteItem[]
  // Active-session wall-clock fields
  secondsRemaining: number
  initialSeconds: number
  startedAt: string | null
  pausedAt: string | null
  totalPausedSeconds: number
  attributedDay: string | null
  // Completion summary
  sessionStoppedEarly: boolean
  lastSessionElapsedSeconds: number
  dailyStats: DailyStats
  focusHistory: FocusHistory
  completedTasks: CompletedTask[]
  // Transient UI (not persisted)
  showTasksDrawer: boolean
  showNotesDrawer: boolean
}

export interface MusicTrack {
  id: string
  title: string
  artist: string
  duration: string
  src: string
  license: string
  source: string
}
