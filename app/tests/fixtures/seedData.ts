import type { CompletedTask, DayRecord } from '../../src/types'

/**
 * Importable twin of app/docs/seed-dashboard.js (TEST_PLAN_V3 §6). Produces the
 * exact same Focus History + Completed Tasks dataset so unit/integration specs
 * and the E2E `addInitScript` seeder assert against one shared shape.
 *
 * Edge cases baked in: a zero day (baseline), a peak day (max intensity / tallest
 * bar), today non-zero, pre-9 AM hours, late-night + evening hours, and completed
 * tasks driving the Tasks Completed tile.
 */

const H = 3600

// Per-day plan, index 0 = today. [hour, weight] pairs distribute the day total.
const PLAN: { total: number; prof: [number, number][] }[] = [
  { total: 1.6 * H, prof: [[9, 2], [10, 3], [14, 2], [16, 1]] },                 // 0  today
  { total: 2.4 * H, prof: [[9, 2], [10, 2], [11, 2], [15, 2], [17, 1]] },        // 1
  { total: 0.0 * H, prof: [] },                                                  // 2  ZERO day
  { total: 3.5 * H, prof: [[8, 1], [9, 3], [10, 3], [13, 2], [14, 3], [16, 2], [21, 1]] }, // 3 PEAK
  { total: 1.2 * H, prof: [[10, 2], [11, 2], [15, 1]] },                         // 4
  { total: 0.7 * H, prof: [[22, 2], [23, 1]] },                                  // 5  late-night
  { total: 1.9 * H, prof: [[9, 2], [12, 2], [14, 2], [18, 1]] },                 // 6
  { total: 1.0 * H, prof: [[7, 2], [8, 2]] },                                    // 7  pre-9 AM
  { total: 2.1 * H, prof: [[9, 2], [10, 2], [13, 2], [16, 2]] },                 // 8
  { total: 0.5 * H, prof: [[11, 1], [15, 1]] },                                  // 9
  { total: 1.4 * H, prof: [[9, 1], [10, 2], [14, 2]] },                          // 10
  { total: 2.7 * H, prof: [[8, 1], [9, 2], [11, 3], [14, 2], [20, 1]] },         // 11
  { total: 0.9 * H, prof: [[16, 2], [17, 1]] },                                  // 12
  { total: 1.7 * H, prof: [[9, 2], [10, 1], [13, 2], [15, 1]] },                 // 13
]

const TASK_TITLES: [string, number][] = [
  ['Interview Prep — Conflict question', 25], ['Draft proposal outline', 45],
  ['Review PR #248', 30], ['Outline Q3 roadmap', 50], ['Write blog draft', 40],
  ['Refactor auth module', 35], ['Sync notes from standup', 15], ['Design review feedback', 25],
  ['Email triage', 20], ['Prep demo script', 30], ['Fix dashboard bug', 45],
  ['Read research paper', 25], ['Plan sprint backlog', 35], ['Update changelog', 15],
]

function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysAgo(n: number, base: Date): Date {
  const d = new Date(base)
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

function spread(totalSec: number, profile: [number, number][]): number[] {
  const seg = new Array(24).fill(0)
  const wsum = profile.reduce((s, [, w]) => s + w, 0) || 1
  for (const [h, w] of profile) seg[h] += Math.round((totalSec * w) / wsum)
  return seg
}

export interface SeedData {
  days: Record<string, DayRecord>
  completed: CompletedTask[]
  /** Day key for "today" (index 0). */
  todayKey: string
  /** All 14 day keys, index 0 = today … 13 = oldest. */
  dayKeys: string[]
}

export function buildSeedData(base: Date = new Date()): SeedData {
  const days: Record<string, DayRecord> = {}
  const dayKeys: string[] = []
  PLAN.forEach((p, i) => {
    const key = dateKey(daysAgo(i, base))
    dayKeys.push(key)
    const total = Math.round(p.total)
    days[key] = {
      dateKey: key,
      totalFocusSeconds: total,
      sessionsCount: total === 0 ? 0 : Math.max(1, Math.round(total / 1500)),
      segmentSeconds: spread(total, p.prof),
    }
  })

  const completed: CompletedTask[] = TASK_TITLES.map(([title, minutes], i) => {
    const d = daysAgo(i % 7, base)
    d.setHours(9 + (i % 8), (i * 7) % 60, 0, 0)
    return { id: `seed-${i}`, title, minutes, completedAt: d.toISOString() }
  })

  return { days, completed, todayKey: dayKeys[0], dayKeys }
}

/** Aggregates the dashboard should derive from the seed (computed independently). */
export function expectedDashboard(seed: SeedData = buildSeedData()) {
  const week = seed.dayKeys.slice(0, 7).map(k => seed.days[k].totalFocusSeconds)
  const weeklyTotalSeconds = week.reduce((a, b) => a + b, 0)
  const dailyTotalSeconds = seed.days[seed.todayKey].totalFocusSeconds
  const windowKeys = new Set(seed.dayKeys.slice(0, 7))
  const tasksCompleted = seed.completed.filter(c => windowKeys.has(dateKey(new Date(c.completedAt)))).length
  return {
    weeklyTotalSeconds,
    dailyTotalSeconds,
    dailyAvgSeconds: weeklyTotalSeconds / 7,
    tasksCompleted,
  }
}
