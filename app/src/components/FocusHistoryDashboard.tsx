import type { FocusHistory } from '../types'
import { dateKeyFromDate, dayInitial, formatHoursDecimal, getTodayKey, lastNDates, migrateDayRecord } from '../utils'

interface Props {
  focusHistory: FocusHistory
  todayFocusSeconds: number
}

// 24 single-hour buckets. Labels rendered every 3 hours; intermediate columns
// remain unlabelled to keep the strip compact.
const HOUR_LABELS = ['12a','','','3a','','','6a','','','9a','','','12p','','','3p','','','6p','','','9p','','']

function getDayTotal(history: FocusHistory, key: string, fallbackTodaySeconds = 0): number {
  if (key === getTodayKey()) {
    const stored = history.days[key]?.totalFocusSeconds ?? 0
    return Math.max(stored, fallbackTodaySeconds)
  }
  return history.days[key]?.totalFocusSeconds ?? 0
}

function getDaySegments(history: FocusHistory, key: string): number[] {
  const rec = history.days[key]
  if (!rec) return new Array(24).fill(0)
  // Defensive migration in case a legacy record sneaks through.
  return migrateDayRecord({ ...rec, dateKey: key }).segmentSeconds
}

function getDayTasksCompleted(history: FocusHistory, key: string): number {
  const rec = history.days[key]
  if (!rec) return 0
  return migrateDayRecord({ ...rec, dateKey: key }).tasksCompleted
}

export default function FocusHistoryDashboard({ focusHistory, todayFocusSeconds }: Props) {
  const today = new Date()
  const dates = lastNDates(7, today)
  const todayKey = getTodayKey()

  const dayTotals = dates.map(d => {
    const key = dateKeyFromDate(d)
    return { date: d, key, seconds: getDayTotal(focusHistory, key, key === todayKey ? todayFocusSeconds : 0) }
  })

  const weeklyTotalSeconds = dayTotals.reduce((s, x) => s + x.seconds, 0)
  const dailyTotalSeconds = dayTotals[dayTotals.length - 1].seconds
  const dailyAvgSeconds = weeklyTotalSeconds / 7

  const tasksCompleted7Days = dayTotals.reduce((sum, { key }) => sum + getDayTasksCompleted(focusHistory, key), 0)

  const isEmpty = weeklyTotalSeconds === 0 && todayFocusSeconds === 0

  if (isEmpty) {
    return (
      <section className="relative w-full px-6 py-16">
        <h2 className="text-center text-xl font-bold text-slate-800 mb-6">Focus History</h2>
        <div className="max-w-xl mx-auto frosted-glass rounded-2xl px-8 py-10 text-center">
          <p className="text-sm text-slate-600 leading-relaxed">
            Complete your first session to start tracking your focus history.
          </p>
        </div>
      </section>
    )
  }

  // Bar chart: heights proportional to the max day in the visible window.
  const maxDaySeconds = Math.max(1, ...dayTotals.map(d => d.seconds))

  // Heatmap: per-render max across the visible 7×24 grid.
  const segmentRows = dayTotals.map(d => ({
    date: d.date,
    key: d.key,
    segments: getDaySegments(focusHistory, d.key),
  }))
  const maxBucket = Math.max(1, ...segmentRows.flatMap(r => r.segments))

  // Discrete intensity bins for richer shading: empty / 5 levels.
  // Each bucket maps to one of 6 visual states based on its share of maxBucket.
  function intensityClass(sec: number): { bg: string; border: string } {
    if (sec === 0) return { bg: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.4)' }
    const r = sec / maxBucket
    // 5 progressively darker tones in brand purple family
    if (r <= 0.2) return { bg: 'hsl(248 70% 88%)', border: 'hsl(248 60% 80%)' }
    if (r <= 0.4) return { bg: 'hsl(248 72% 76%)', border: 'hsl(248 60% 68%)' }
    if (r <= 0.6) return { bg: 'hsl(248 75% 64%)', border: 'hsl(248 60% 55%)' }
    if (r <= 0.8) return { bg: 'hsl(248 78% 52%)', border: 'hsl(248 60% 42%)' }
    return { bg: 'hsl(248 82% 40%)', border: 'hsl(248 70% 30%)' }
  }

  return (
    <section className="relative w-full px-6 py-12">
      <h2 className="text-center text-xl font-bold text-slate-800 mb-6">Focus History</h2>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 7-Day Activity bar chart */}
        <div className="md:col-span-2 frosted-glass rounded-2xl p-5">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-4">
            7-Day Activity
          </h3>
          <div className="flex items-end justify-between gap-2 h-40 pt-5">
            {dayTotals.map(({ date, key, seconds }) => {
              const isToday = key === todayKey
              const heightPct = seconds === 0 ? 0 : Math.max(4, (seconds / maxDaySeconds) * 100)
              return (
                <div key={key} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div className="relative w-full flex items-end justify-center h-full">
                    {seconds === 0 ? (
                      <div className="w-full h-px bg-slate-300/60" />
                    ) : (
                      <div
                        className="relative w-full rounded-t-md transition-all"
                        style={{
                          height: `${heightPct}%`,
                          background: isToday
                            ? 'linear-gradient(180deg, rgba(106,90,231,0.95) 0%, rgba(106,90,231,0.65) 100%)'
                            : 'linear-gradient(180deg, rgba(167,139,250,0.55) 0%, rgba(167,139,250,0.25) 100%)',
                          border: isToday ? '1px solid rgba(106,90,231,0.45)' : '1px solid rgba(167,139,250,0.35)',
                        }}
                      >
                        <span className={`absolute -top-4 left-0 right-0 text-center text-[9px] font-bold tabular-nums ${isToday ? 'text-primary' : 'text-slate-400'}`}>
                          {formatHoursDecimal(seconds)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
                      isToday ? 'text-primary' : 'text-slate-400'
                    }`}
                  >
                    {dayInitial(date)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 grid-rows-2 gap-3">
          <StatTile label="Daily Total" value={formatHoursDecimal(dailyTotalSeconds)} />
          <StatTile label="Daily Avg" value={formatHoursDecimal(dailyAvgSeconds)} />
          <StatTile label="Weekly Total" value={formatHoursDecimal(weeklyTotalSeconds)} />
          <StatTile label="Tasks Completed (7d)" value={String(tasksCompleted7Days)} />
        </div>
      </div>

      {/* 7-Day Focus Heatmap — hourly resolution, compact rows */}
      <div className="max-w-5xl mx-auto mt-4 frosted-glass rounded-2xl p-5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-4">
          7-Day Focus Heatmap (Hourly)
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            {/* Column headers — 24 narrow columns, labels every 3 hours */}
            <div className="grid grid-cols-[20px_repeat(24,minmax(0,1fr))] gap-[2px] mb-1">
              <span />
              {HOUR_LABELS.map((h, i) => (
                <span key={i} className="text-[8px] font-semibold text-slate-400 text-center tracking-tight leading-none">
                  {h}
                </span>
              ))}
            </div>
            {segmentRows.map(row => (
              <div
                key={row.key}
                className="grid grid-cols-[20px_repeat(24,minmax(0,1fr))] gap-[2px] mb-[2px] items-center"
              >
                <span
                  className={`text-[10px] font-bold uppercase ${
                    row.key === todayKey ? 'text-primary' : 'text-slate-400'
                  }`}
                >
                  {dayInitial(row.date)}
                </span>
                {row.segments.map((sec, i) => {
                  const tone = intensityClass(sec)
                  return (
                    <div
                      key={i}
                      className="h-2.5 rounded-[2px] border"
                      style={{ background: tone.bg, borderColor: tone.border }}
                      title={sec > 0 ? `${Math.round(sec / 60)} min` : ''}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="frosted-glass rounded-2xl p-4 flex flex-col justify-between">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{label}</span>
      <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums mt-2">{value}</span>
    </div>
  )
}
