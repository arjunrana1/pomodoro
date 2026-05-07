export type SessionMode = 'quick' | 'planned'
export type AppStatus = 'idle' | 'running' | 'paused' | 'complete'

export interface PlanItem {
  id: string
  title: string
  minutes: number
  completed: boolean
}

export interface NoteItem {
  id: string
  text: string
  createdAt: number
}

export interface DayRecord {
  dateKey: string
  totalFocusSeconds: number
  sessionsCount: number
  /** Length 24 — one entry per wall-clock hour (0..23). Legacy length-12 records
   *  (2-hour buckets) are migrated on load by splitting each value across 2 hours. */
  segmentSeconds: number[]
  /** Cumulative count of plan items toggled to completed across sessions
   *  attributed to this day. Increments at session end (natural OR stop). */
  tasksCompleted: number
}

export interface FocusHistory {
  days: Record<string, DayRecord>
}

export interface AppState {
  mode: SessionMode
  status: AppStatus
  selectedPreset: 15 | 20 | 25 | null
  customMinutes: number | null
  customMinutesInputError: string | null
  planItems: PlanItem[]
  secondsRemaining: number
  totalSessionSeconds: number
  notes: NoteItem[]
  todayFocusSeconds: number
  todaySessionsCount: number
  showPlanSidebar: boolean
  showNotesDrawer: boolean
  soundEnabled: boolean
  sessionStoppedEarly: boolean
  attributedDay: string | null
  startedAt: string | null
  initialSeconds: number
  pausedAt: string | null
  totalPausedSeconds: number
  lastSessionElapsedSeconds: number
  focusHistory: FocusHistory
}
