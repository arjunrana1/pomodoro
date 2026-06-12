import type { CompletedTask, FocusHistory } from '../types'
import { dateKeyFromDate, dayInitial, formatDuration, getTodayKey, lastNDates } from '../utils'

interface Props {
  focusHistory: FocusHistory
  todayFocusSeconds: number
  completedTasks: CompletedTask[]
}

// Work-life-friendly heatmap window: 8 AM through 11 PM only (16 hourly columns).
const HOUR_ORDER = [...Array(16).keys()].map(i => i + 8)

function hourLabel(h: number): string {
  if (h === 0) return '12AM'
  if (h === 12) return '12PM'
  return h < 12 ? `${h}AM` : `${h - 12}PM`
}

function getDayTotal(history: FocusHistory, key: string, fallbackTodaySeconds = 0): number {
  if (key === getTodayKey()) {
    const stored = history.days[key]?.totalFocusSeconds ?? 0
    return Math.max(stored, fallbackTodaySeconds)
  }
  return history.days[key]?.totalFocusSeconds ?? 0
}

function getDaySegments(history: FocusHistory, key: string): number[] {
  const segs = history.days[key]?.segmentSeconds
  return segs && segs.length === 24 ? segs : new Array(24).fill(0)
}

export default function FocusHistoryDashboard({ focusHistory, todayFocusSeconds, completedTasks }: Props) {
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

  // Tasks Completed = entries in the completed log within the last-7-day window.
  const windowKeys = new Set(dayTotals.map(d => d.key))
  const tasksCompleted7Days = completedTasks.filter(c => windowKeys.has(dateKeyFromDate(new Date(c.completedAt)))).length

  const isEmpty = weeklyTotalSeconds === 0 && todayFocusSeconds === 0

  if (isEmpty) {
    return (
      <section className="relative w-full px-4 sm:px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-800 mb-6" style={{ fontFamily: 'Sora, sans-serif' }}>
          Focus History
        </h2>
        <div className="max-w-xl mx-auto frosted-glass rounded-2xl px-8 py-10 text-center">
          <p className="text-sm text-slate-600 leading-relaxed">
            Complete your first session to start tracking your focus history.
          </p>
        </div>
      </section>
    )
  }

  const maxDaySeconds = Math.max(1, ...dayTotals.map(d => d.seconds))

  const segmentRows = dayTotals.map(d => ({
    date: d.date,
    key: d.key,
    segments: getDaySegments(focusHistory, d.key),
  }))
  const maxBucket = Math.max(1, ...segmentRows.flatMap(r => r.segments))

  // Discrete intensity bins: empty + 5 levels of the brand-purple ramp.
  function intensityClass(sec: number): { bg: string; border: string } {
    if (sec === 0) return { bg: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.4)' }
    const r = sec / maxBucket
    if (r <= 0.2) return { bg: 'hsl(248 70% 88%)', border: 'hsl(248 60% 80%)' }
    if (r <= 0.4) return { bg: 'hsl(248 72% 76%)', border: 'hsl(248 60% 68%)' }
    if (r <= 0.6) return { bg: 'hsl(248 75% 64%)', border: 'hsl(248 60% 55%)' }
    if (r <= 0.8) return { bg: 'hsl(248 78% 52%)', border: 'hsl(248 60% 42%)' }
    return { bg: 'hsl(248 82% 40%)', border: 'hsl(248 70% 30%)' }
  }

  const legendTones = ['rgba(255,255,255,0.5)', 'hsl(248 70% 88%)', 'hsl(248 72% 76%)', 'hsl(248 75% 64%)', 'hsl(248 82% 40%)']

  return (
    <section className="relative w-full px-4 sm:px-6 py-12">
      <h2 className="text-center text-2xl font-bold text-slate-800 mb-6 flex items-center justify-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
        <span className="material-symbols-outlined text-primary">monitoring</span>
        Focus History
      </h2>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 7-Day Activity bar chart */}
        <div className="md:col-span-2 frosted-glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">7-Day Activity</h3>
            <span className="text-[10px] font-semibold text-slate-400">Hours · Minutes</span>
          </div>
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
                        <span className={`absolute -top-4 left-0 right-0 text-center text-[9px] font-bold tabular-nums whitespace-nowrap ${isToday ? 'text-primary' : 'text-slate-400'}`}>
                          {formatDuration(seconds)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-slate-400'}`}>
                    {dayInitial(date)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats grid 2×2 */}
        <div className="grid grid-cols-2 grid-rows-2 gap-3">
          <StatTile label="Daily Total" icon="timer" value={formatDuration(dailyTotalSeconds, 'tile')} />
          <StatTile label="Daily Avg" icon="trending_up" value={formatDuration(dailyAvgSeconds, 'tile')} />
          <StatTile label="Weekly Total" icon="calendar_month" value={formatDuration(weeklyTotalSeconds, 'tile')} />
          <StatTile label="Tasks Completed" icon="task_alt" value={String(tasksCompleted7Days)} />
        </div>
      </div>

      {/* 7-Day Focus Heatmap — Hourly, columns start 9 AM, pre-9am wraps to the end */}
      <div className="max-w-5xl mx-auto mt-4 frosted-glass rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">7-Day Focus Heatmap — Hourly</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Work-life friendly!</p>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-amber-500" style={{ fontSize: 13 }}>light_mode</span>
            8 AM
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>arrow_forward</span>
            11 PM
            <span className="material-symbols-outlined text-primary/60" style={{ fontSize: 13 }}>dark_mode</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {segmentRows.map(row => (
              <div key={row.key} className="grid grid-cols-[24px_repeat(16,minmax(0,1fr))] gap-[3px] mb-[3px] items-center">
                <span className={`text-[10px] font-bold uppercase ${row.key === todayKey ? 'text-primary' : 'text-slate-400'}`}>
                  {dayInitial(row.date)}
                </span>
                {HOUR_ORDER.map(h => {
                  const sec = row.segments[h] || 0
                  const tone = intensityClass(sec)
                  return (
                    <div
                      key={h}
                      className="h-4 rounded-[3px] border"
                      style={{ background: tone.bg, borderColor: tone.border }}
                      title={sec > 0 ? `${hourLabel(h)} — ${formatDuration(sec)}` : ''}
                    />
                  )
                })}
              </div>
            ))}
            {/* Column labels — every hour, written out in full */}
            <div className="grid grid-cols-[24px_repeat(16,minmax(0,1fr))] gap-[3px] mt-1">
              <span />
              {HOUR_ORDER.map(h => (
                <span key={h} className="text-[8px] font-semibold text-slate-400 text-center tracking-tight leading-none whitespace-nowrap">
                  {hourLabel(h)}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-1.5 mt-3">
          <span className="text-[10px] font-semibold text-slate-400">Less</span>
          {legendTones.map((t, i) => (
            <span key={i} className="w-3 h-3 rounded-[3px] border border-white/50" style={{ background: t }} />
          ))}
          <span className="text-[10px] font-semibold text-slate-400">More</span>
        </div>
      </div>
    </section>
  )
}

function StatTile({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="frosted-glass rounded-2xl p-4 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{label}</span>
        <span className="material-symbols-outlined text-primary/60" style={{ fontSize: 16 }}>{icon}</span>
      </div>
      <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums mt-2" style={{ fontFamily: 'Sora, sans-serif' }}>
        {value}
      </span>
    </div>
  )
}
