import type { DayRecord, FocusHistory } from './types'

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatHoursDecimal(seconds: number): string {
  return `${(seconds / 3600).toFixed(1)}h`
}

export function getTodayKey(d: Date = new Date()): string {
  return d.toLocaleDateString('en-CA')
}

export function dateKeyFromDate(d: Date): string {
  return d.toLocaleDateString('en-CA')
}

export function emptyDayRecord(dateKey: string): DayRecord {
  return {
    dateKey,
    totalFocusSeconds: 0,
    sessionsCount: 0,
    segmentSeconds: new Array(24).fill(0),
    tasksCompleted: 0,
  }
}

export function bucketIndexForDate(d: Date): number {
  return d.getHours()
}

/** Migrate a possibly-legacy DayRecord to the current 24-bucket shape and ensure
 *  tasksCompleted exists. Splits each 2-hour bucket evenly across its 2 hours. */
export function migrateDayRecord(rec: Partial<DayRecord> & { dateKey: string }): DayRecord {
  const segs = rec.segmentSeconds ?? []
  let segmentSeconds: number[]
  if (segs.length === 24) {
    segmentSeconds = segs.slice()
  } else if (segs.length === 12) {
    segmentSeconds = new Array(24).fill(0)
    for (let i = 0; i < 12; i++) {
      const half = Math.floor((segs[i] || 0) / 2)
      const remainder = (segs[i] || 0) - half
      segmentSeconds[i * 2] = half
      segmentSeconds[i * 2 + 1] = remainder
    }
  } else {
    segmentSeconds = new Array(24).fill(0)
  }
  return {
    dateKey: rec.dateKey,
    totalFocusSeconds: rec.totalFocusSeconds ?? 0,
    sessionsCount: rec.sessionsCount ?? 0,
    segmentSeconds,
    tasksCompleted: rec.tasksCompleted ?? 0,
  }
}

export function dayInitial(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'narrow' })
}

export function lastNDayKeys(n: number, today: Date = new Date()): string[] {
  const keys: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    keys.push(dateKeyFromDate(d))
  }
  return keys
}

export function lastNDates(n: number, today: Date = new Date()): Date[] {
  const out: Date[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    out.push(d)
  }
  return out
}

/**
 * Walk the focused (non-paused) interval one second at a time and bucket each
 * second into its 2-hour wall-clock segment. attributedDay anchors the row;
 * post-midnight buckets are still recorded against the start day's row per PRD §7.6.
 */
export function recordFocusedSeconds(
  history: FocusHistory,
  startedAtMs: number,
  endedAtMs: number,
  totalPausedMs: number,
  attributedDay: string,
  isCompletedSession: boolean,
  tasksCompletedThisSession: number = 0,
): FocusHistory {
  const focusedMs = Math.max(0, endedAtMs - startedAtMs - totalPausedMs)
  const focusedSeconds = Math.floor(focusedMs / 1000)
  if (focusedSeconds <= 0 && !isCompletedSession && tasksCompletedThisSession <= 0) return history

  const days = { ...history.days }
  const existing = days[attributedDay]
  const day: DayRecord = existing
    ? migrateDayRecord({ ...existing, segmentSeconds: [...existing.segmentSeconds] })
    : emptyDayRecord(attributedDay)

  if (focusedSeconds > 0) {
    day.totalFocusSeconds += focusedSeconds
    // Walk seconds and bucket — pause time is one block, so we approximate by
    // distributing focused seconds linearly from start. Good enough for visual fidelity.
    for (let i = 0; i < focusedSeconds; i++) {
      const at = new Date(startedAtMs + i * 1000)
      const bucket = bucketIndexForDate(at)
      day.segmentSeconds[bucket] = (day.segmentSeconds[bucket] || 0) + 1
    }
  }
  if (isCompletedSession) day.sessionsCount += 1
  if (tasksCompletedThisSession > 0) day.tasksCompleted += tasksCompletedThisSession

  days[attributedDay] = day

  // Prune to the last 14 day-keys to keep storage modest (PRD §10).
  const ordered = Object.keys(days).sort()
  while (ordered.length > 14) {
    const oldest = ordered.shift()!
    delete days[oldest]
  }

  return { days }
}
