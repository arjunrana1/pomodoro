import type { DayRecord, FocusHistory } from './types'

/** MM:SS clock readout for the timer orb and tab title. */
export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Global compact duration format (REQUIREMENTS_V3 §11): `Xh Ym` / `Xh` / `Ym`.
 * Seconds round UP to the next minute; never shows decimals or seconds.
 * `zeroStyle` controls the zero rendering: stat tiles show `0h 0m`, everything
 * else shows `0m`.
 */
export function formatDuration(seconds: number, zeroStyle: 'compact' | 'tile' = 'compact'): string {
  const totalMin = Math.ceil(Math.max(0, seconds) / 60)
  if (totalMin === 0) return zeroStyle === 'tile' ? '0h 0m' : '0m'
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
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
  }
}

export function dayInitial(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'narrow' })
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

/** `Today · 2:14 PM` for today's timestamps, otherwise `Jun 11 · 2:14 PM`. */
export function formatNoteTimestamp(iso: string): string {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (dateKeyFromDate(d) === getTodayKey()) return `Today · ${time}`
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${day} · ${time}`
}

/** `Jun 11 · 14:32` — completed-task timestamps (24h per design). */
export function formatCompletedTimestamp(iso: string): string {
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${day} · ${hh}:${mm}`
}

/**
 * Record a finished/stopped Work session into focus history. Walks the focused
 * (non-paused) seconds from start and buckets each into its wall-clock hour;
 * everything is attributed to the start day's row (cross-midnight included).
 */
export function recordFocusedSeconds(
  history: FocusHistory,
  startedAtMs: number,
  endedAtMs: number,
  totalPausedMs: number,
  attributedDay: string,
  isCompletedSession: boolean,
): FocusHistory {
  const focusedMs = Math.max(0, endedAtMs - startedAtMs - totalPausedMs)
  const focusedSeconds = Math.floor(focusedMs / 1000)
  if (focusedSeconds <= 0 && !isCompletedSession) return history

  const days = { ...history.days }
  const existing = days[attributedDay]
  const day: DayRecord = existing
    ? { ...existing, segmentSeconds: [...existing.segmentSeconds] }
    : emptyDayRecord(attributedDay)
  if (day.segmentSeconds.length !== 24) day.segmentSeconds = new Array(24).fill(0)

  if (focusedSeconds > 0) {
    day.totalFocusSeconds += focusedSeconds
    // Pause time is treated as one block, so focused seconds are distributed
    // linearly from start — good enough for visual fidelity.
    for (let i = 0; i < focusedSeconds; i++) {
      const at = new Date(startedAtMs + i * 1000)
      const bucket = at.getHours()
      day.segmentSeconds[bucket] = (day.segmentSeconds[bucket] || 0) + 1
    }
  }
  if (isCompletedSession) day.sessionsCount += 1

  days[attributedDay] = day

  // Keep the last 14 day-keys to bound storage.
  const ordered = Object.keys(days).sort()
  while (ordered.length > 14) {
    const oldest = ordered.shift()!
    delete days[oldest]
  }

  return { days }
}
