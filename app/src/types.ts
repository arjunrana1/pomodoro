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

export interface AppState {
  mode: SessionMode
  status: AppStatus
  selectedPreset: 15 | 20 | 25 | null
  customMinutes: number | null
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
}
