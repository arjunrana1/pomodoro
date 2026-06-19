import { describe, it, expect } from 'vitest'
import {
  formatDuration,
  formatTime,
  getTodayKey,
  dateKeyFromDate,
  emptyDayRecord,
  lastNDates,
  recordFocusedSeconds,
  formatCompletedTimestamp,
} from '../../src/utils'
import type { FocusHistory } from '../../src/types'

// AC-29 — global duration format: `Xh Ym` / `Ym` / `Xh`, no decimals, seconds round up.
describe('AC-29 formatDuration', () => {
  it('renders the compact Xh Ym / Ym / Xh shapes', () => {
    expect(formatDuration(0)).toBe('0m')
    expect(formatDuration(0, 'tile')).toBe('0h 0m')
    expect(formatDuration(45 * 60)).toBe('45m')
    expect(formatDuration(60 * 60)).toBe('1h')
    expect(formatDuration(2 * 3600)).toBe('2h')
    expect(formatDuration(90 * 60)).toBe('1h 30m')
    expect(formatDuration(75 * 60)).toBe('1h 15m')
    expect(formatDuration(61 * 60)).toBe('1h 1m')
  })

  it('rounds seconds UP to the next minute and never shows seconds', () => {
    expect(formatDuration(1)).toBe('1m')
    expect(formatDuration(59)).toBe('1m')
    expect(formatDuration(60)).toBe('1m')
    expect(formatDuration(61)).toBe('2m')
    expect(formatDuration(3601)).toBe('1h 1m') // 60m + 1s → rounds the stray second up
  })

  it('never emits a decimal anywhere (no 1.5h)', () => {
    for (const s of [5400, 1.5 * 3600, 9000, 12345, 99999]) {
      expect(formatDuration(s)).not.toMatch(/\./)
      expect(formatDuration(s, 'tile')).not.toMatch(/\./)
    }
    expect(formatDuration(1.5 * 3600)).toBe('1h 30m')
  })

  it('clamps negative input to zero', () => {
    expect(formatDuration(-100)).toBe('0m')
  })
})

describe('formatTime (MM:SS clock)', () => {
  it('zero-pads minutes and seconds', () => {
    expect(formatTime(1500)).toBe('25:00')
    expect(formatTime(90)).toBe('01:30')
    expect(formatTime(5)).toBe('00:05')
    expect(formatTime(0)).toBe('00:00')
  })
})

describe('date helpers', () => {
  it('getTodayKey / dateKeyFromDate emit local YYYY-MM-DD', () => {
    const d = new Date(2026, 5, 10, 14, 0, 0) // Jun 10 2026 local
    expect(dateKeyFromDate(d)).toBe('2026-06-10')
    expect(getTodayKey(d)).toBe('2026-06-10')
  })

  it('lastNDates returns N dates oldest-first ending today', () => {
    const today = new Date(2026, 5, 10)
    const dates = lastNDates(7, today)
    expect(dates).toHaveLength(7)
    expect(dateKeyFromDate(dates[0])).toBe('2026-06-04')
    expect(dateKeyFromDate(dates[6])).toBe('2026-06-10')
  })

  it('emptyDayRecord has 24 hourly buckets', () => {
    const rec = emptyDayRecord('2026-06-10')
    expect(rec.segmentSeconds).toHaveLength(24)
    expect(rec.segmentSeconds.every(v => v === 0)).toBe(true)
  })

  it('formatCompletedTimestamp uses `Mon D · HH:MM` 24h', () => {
    const iso = new Date(2026, 5, 11, 14, 32, 0).toISOString()
    expect(formatCompletedTimestamp(iso)).toBe('Jun 11 · 14:32')
  })
})

const empty = (): FocusHistory => ({ days: {} })

// AC-12 — cross-midnight Work session attributes to the START day.
describe('AC-12 recordFocusedSeconds — cross-midnight attribution', () => {
  it('records every focused second against the start day, bucketed by wall-clock hour', () => {
    const start = new Date(2026, 5, 10, 23, 59, 30).getTime() // 30s before midnight
    const end = start + 60_000 // 60 focused seconds, crossing midnight
    const h = recordFocusedSeconds(empty(), start, end, 0, '2026-06-10', true)

    // Only the start day exists; nothing leaks into Jun 11.
    expect(Object.keys(h.days)).toEqual(['2026-06-10'])
    const day = h.days['2026-06-10']
    expect(day.totalFocusSeconds).toBe(60)
    expect(day.segmentSeconds[23]).toBe(30) // before midnight
    expect(day.segmentSeconds[0]).toBe(30)  // after midnight, still the start day's row
    expect(day.sessionsCount).toBe(1)
  })
})

// AC-28 — stopped sessions add elapsed to totals but NOT to sessionsCount.
describe('AC-28 recordFocusedSeconds — stopped vs completed', () => {
  it('completed sessions increment sessionsCount', () => {
    const start = new Date(2026, 5, 10, 9, 0, 0).getTime()
    const h = recordFocusedSeconds(empty(), start, start + 120_000, 0, '2026-06-10', true)
    expect(h.days['2026-06-10'].totalFocusSeconds).toBe(120)
    expect(h.days['2026-06-10'].sessionsCount).toBe(1)
  })

  it('stopped sessions add focus seconds to the bar/heatmap but leave sessionsCount at 0', () => {
    const start = new Date(2026, 5, 10, 9, 0, 0).getTime()
    const h = recordFocusedSeconds(empty(), start, start + 120_000, 0, '2026-06-10', false)
    expect(h.days['2026-06-10'].totalFocusSeconds).toBe(120)
    expect(h.days['2026-06-10'].segmentSeconds[9]).toBe(120)
    expect(h.days['2026-06-10'].sessionsCount).toBe(0)
  })

  it('excludes paused time from recorded focus seconds', () => {
    const start = new Date(2026, 5, 10, 9, 0, 0).getTime()
    // 120s wall clock, 40s of it paused → 80 focused seconds.
    const h = recordFocusedSeconds(empty(), start, start + 120_000, 40_000, '2026-06-10', false)
    expect(h.days['2026-06-10'].totalFocusSeconds).toBe(80)
  })
})

// AC-34 — focus history is bounded to the most recent 14 day-keys.
describe('AC-34 recordFocusedSeconds — 14-day retention', () => {
  it('keeps only the newest 14 days', () => {
    let h = empty()
    // Seed 16 distinct days (Jun 1..16 2026), 60 focused seconds each.
    for (let day = 1; day <= 16; day++) {
      const start = new Date(2026, 5, day, 9, 0, 0).getTime()
      const key = `2026-06-${String(day).padStart(2, '0')}`
      h = recordFocusedSeconds(h, start, start + 60_000, 0, key, true)
    }
    const keys = Object.keys(h.days).sort()
    expect(keys).toHaveLength(14)
    expect(keys[0]).toBe('2026-06-03') // Jun 1 & 2 pruned
    expect(keys[13]).toBe('2026-06-16')
  })
})
