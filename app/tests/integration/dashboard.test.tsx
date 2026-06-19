import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import FocusHistoryDashboard from '../../src/components/FocusHistoryDashboard'
import { formatDuration } from '../../src/utils'
import { buildSeedData, expectedDashboard } from '../fixtures/seedData'
import { renderApp, stubFetch } from './appHarness'

const BASE = new Date(2026, 5, 15, 12, 0, 0).getTime()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(BASE)
  stubFetch()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const seed = () => buildSeedData(new Date(BASE))
function renderDashboard() {
  const s = seed()
  return render(
    <FocusHistoryDashboard focusHistory={{ days: s.days }} todayFocusSeconds={0} completedTasks={s.completed} />,
  )
}
const card = (heading: string) => screen.getByText(heading).closest('div.frosted-glass') as HTMLElement

// AC-25 — dashboard renders on Home (below the fold), Home-only, with an empty state.
describe('AC-25 dashboard placement + empty state', () => {
  it('shows the empty state on a fresh Home with no data', async () => {
    await renderApp()
    expect(screen.getByText('Focus History')).toBeInTheDocument()
    expect(screen.getByText(/Complete your first session to start tracking/)).toBeInTheDocument()
  })

  it('is not rendered during an active session', async () => {
    await renderApp()
    fireEvent.click(screen.getByRole('button', { name: /Start Session/ }))
    expect(screen.queryByText('Focus History')).toBeNull()
  })

  it('renders the full dashboard once there is data', () => {
    renderDashboard()
    expect(screen.getByText('Focus History')).toBeInTheDocument()
    expect(screen.getByText('7-Day Activity')).toBeInTheDocument()
    expect(screen.getByText('7-Day Focus Heatmap — Hourly')).toBeInTheDocument()
    expect(screen.queryByText(/Complete your first session/)).toBeNull()
  })
})

// AC-26 — bar chart (today emphasized, no Weekly View pill) + the four stat tiles.
describe('AC-26 bar chart + stat tiles', () => {
  it('renders four tiles with the correct aggregates from the seed', () => {
    renderDashboard()
    const exp = expectedDashboard(seed())

    const tileValue = (label: string) =>
      (card(label).querySelector('span.text-2xl') as HTMLElement).textContent

    expect(tileValue('Daily Total')).toBe(formatDuration(exp.dailyTotalSeconds, 'tile'))
    expect(tileValue('Daily Avg')).toBe(formatDuration(exp.dailyAvgSeconds, 'tile'))
    expect(tileValue('Weekly Total')).toBe(formatDuration(exp.weeklyTotalSeconds, 'tile'))
    expect(tileValue('Tasks Completed')).toBe(String(exp.tasksCompleted))

    // Sanity: the seed produces these exact figures.
    expect(tileValue('Daily Total')).toBe('1h 36m')
    expect(tileValue('Weekly Total')).toBe('11h 18m')
    expect(tileValue('Tasks Completed')).toBe('14')
  })

  it('emphasizes today in the bar chart and has no Weekly View pill', () => {
    renderDashboard()
    const exp = expectedDashboard(seed())
    const bars = card('7-Day Activity')

    // Today's bar value label is rendered in the primary accent.
    const todayLabel = within(bars).getAllByText(formatDuration(exp.dailyTotalSeconds))
      .find(el => el.className.includes('text-primary'))
    expect(todayLabel).toBeTruthy()

    // The peak day's bar label (3h 30m) is present.
    expect(within(bars).getByText('3h 30m')).toBeInTheDocument()
    // No "Weekly View" pill anywhere.
    expect(screen.queryByText(/Weekly View/i)).toBeNull()
  })
})

// AC-27 — 7×16 hourly heatmap, columns 8 AM → 11 PM, intensity ∝ seconds.
describe('AC-27 hourly heatmap', () => {
  it('renders 7 rows × 16 columns labeled 8AM → 11PM in order', () => {
    renderDashboard()
    const heat = card('7-Day Focus Heatmap — Hourly')

    // 7 day-rows × 16 hour cells = 112 cells.
    const cells = heat.querySelectorAll('div.h-4')
    expect(cells).toHaveLength(7 * 16)

    // Column labels, in DOM order, cover 8 AM → 11 PM (16 of them).
    const labels = within(heat).getAllByText(/^\d{1,2}(AM|PM)$/).map(el => el.textContent)
    expect(labels).toEqual([
      '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM',
      '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM',
    ])
  })

  it('scales cell intensity with focus seconds (empty < light < peak)', () => {
    renderDashboard()
    const heat = card('7-Day Focus Heatmap — Hourly')
    const cells = Array.from(heat.querySelectorAll('div.h-4')) as HTMLElement[]

    const bg = (el: HTMLElement) => el.style.background || el.style.backgroundColor
    const emptyCells = cells.filter(c => !c.getAttribute('title'))
    const filledCells = cells.filter(c => c.getAttribute('title'))

    // Empty (zero-second) cells all share one "empty" tone…
    const emptyTones = new Set(emptyCells.map(bg))
    expect(emptyTones.size).toBe(1)
    const emptyTone = [...emptyTones][0]

    // …and filled cells use several deeper tones (a ramp, scaled to the grid max).
    const filledTones = new Set(filledCells.map(bg))
    expect(filledTones.size).toBeGreaterThanOrEqual(3)
    expect(filledTones.has(emptyTone)).toBe(false)

    // The most intense bucket renders in a different (deeper) tone than the lightest filled bucket.
    const minutesOf = (c: HTMLElement) => {
      const m = /—\s*(?:(\d+)h)?\s*(?:(\d+)m)?/.exec(c.getAttribute('title') || '')
      return (m ? (parseInt(m[1] || '0', 10) * 60 + parseInt(m[2] || '0', 10)) : 0)
    }
    const sorted = [...filledCells].sort((a, b) => minutesOf(a) - minutesOf(b))
    expect(bg(sorted[sorted.length - 1])).not.toBe(bg(sorted[0]))
  })
})

// AC-28 (display) / AC-29 (context) — stopped time shows on the bar/heatmap; durations are Xh Ym.
describe('AC-28/29 durations in the dashboard', () => {
  it('renders all durations as Xh Ym / Ym with no decimals', () => {
    renderDashboard()
    // Every bar value + tile value matches the compact format and has no decimal point.
    for (const el of screen.getAllByText(/^\d+h(\s\d+m)?$|^\d+m$|^\d+h \d+m$/)) {
      expect(el.textContent).not.toMatch(/\./)
    }
    // A representative day total (peak) is shown as hours-minutes, never decimal hours.
    expect(screen.getByText('3h 30m')).toBeInTheDocument()
    expect(screen.queryByText(/3\.5h/)).toBeNull()
  })
})
