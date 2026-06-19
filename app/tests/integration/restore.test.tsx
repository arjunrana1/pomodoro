import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { freshRTL } from '../fresh'

// These specs need a *fresh boot* from a seeded localStorage snapshot, so they
// reset the module registry (clears store.ts's memoized bootState) before each.

const STATE_KEY = 'pomodoro-focus-state'
const HISTORY_KEY = 'pomodoro-focus-history'
const COMPLETED_KEY = 'pomodoro-focus-completed-tasks'

const BASE = new Date(2026, 5, 15, 12, 0, 0).getTime()
const TODAY = new Date(BASE).toLocaleDateString('en-CA')
const iso = (msAgo: number) => new Date(BASE - msAgo).toISOString()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(BASE)
})
afterEach(() => {
  vi.useRealTimers()
})

function seedState(partial: Record<string, unknown>) {
  localStorage.setItem(STATE_KEY, JSON.stringify({
    version: 3, mode: 'work', status: 'idle', sessionMode: 'work',
    selectedWorkPreset: 25, customWorkMinutes: null,
    selectedBreakPreset: 5, customBreakMinutes: null,
    tasks: [], notes: [],
    secondsRemaining: 1500, initialSeconds: 1500,
    startedAt: null, pausedAt: null, totalPausedSeconds: 0, attributedDay: null,
    sessionStoppedEarly: false, lastSessionElapsedSeconds: 0,
    dailyStats: { dateKey: TODAY, focusSeconds: 0, sessionsCount: 0 },
    ...partial,
  }))
}

async function boot() {
  const { renderHook } = await freshRTL()
  const { useAppState } = await import('../../src/store')
  return renderHook(() => useAppState())
}

// AC-9 — wall-clock restoration on reopen.
describe('AC-9 wall-clock restore', () => {
  it('recomputes remaining for a session still in progress', async () => {
    seedState({ status: 'running', sessionMode: 'work', startedAt: iso(600_000), attributedDay: TODAY, initialSeconds: 1500, secondsRemaining: 1500 })
    const { result } = await boot()
    expect(result.current.state.status).toBe('running')
    // 10 min elapsed of 25 → ~15 min (900 s) remaining.
    expect(result.current.state.secondsRemaining).toBeGreaterThanOrEqual(898)
    expect(result.current.state.secondsRemaining).toBeLessThanOrEqual(901)
  })

  it('a session that would have finished goes straight to completion + increments stats', async () => {
    seedState({ status: 'running', sessionMode: 'work', startedAt: iso(2_000_000), attributedDay: TODAY, initialSeconds: 1500, secondsRemaining: 1500 })
    const { result } = await boot()
    const s = result.current.state
    expect(s.status).toBe('complete')
    expect(s.sessionStoppedEarly).toBe(false)
    expect(s.dailyStats.focusSeconds).toBe(1500)
    expect(s.dailyStats.sessionsCount).toBe(1)
    expect(s.focusHistory.days[TODAY].totalFocusSeconds).toBe(1500)
  })

  it('a paused session restores its remaining time verbatim', async () => {
    seedState({ status: 'paused', sessionMode: 'work', startedAt: iso(300_000), pausedAt: iso(100_000), initialSeconds: 1500, secondsRemaining: 1234, attributedDay: TODAY })
    const { result } = await boot()
    expect(result.current.state.status).toBe('paused')
    expect(result.current.state.secondsRemaining).toBe(1234)
  })

  it('a Break that elapsed while closed completes but records nothing', async () => {
    seedState({ status: 'running', sessionMode: 'break', mode: 'break', startedAt: iso(1_000_000), attributedDay: TODAY, initialSeconds: 300, secondsRemaining: 300 })
    const { result } = await boot()
    const s = result.current.state
    expect(s.status).toBe('complete')
    expect(s.sessionMode).toBe('break')
    expect(s.dailyStats.focusSeconds).toBe(0)
    expect(Object.keys(s.focusHistory.days)).toHaveLength(0)
  })
})

// AC-33 — fresh-start purge on boot, then defaults.
describe('AC-33 fresh-start purge on boot', () => {
  it('purges when a legacy v2 key is present and boots defaults', async () => {
    localStorage.setItem('pomodoro-focus-stats', '{"sessions":3}') // v2
    seedState({ selectedWorkPreset: 15, secondsRemaining: 900 })    // would-be v3 state, also wiped
    const { result } = await boot()
    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.selectedWorkPreset).toBe(25) // back to default
    expect(result.current.state.secondsRemaining).toBe(1500)
    // Legacy key cleared; the v2 state was wiped and re-initialized to v3 defaults.
    expect(localStorage.getItem('pomodoro-focus-stats')).toBeNull()
    const persisted = JSON.parse(localStorage.getItem(STATE_KEY)!)
    expect(persisted.version).toBe(3)
    expect(persisted.selectedWorkPreset).toBe(25)
  })

  it('purges a version-less state blob and re-initializes defaults', async () => {
    localStorage.setItem(STATE_KEY, JSON.stringify({ mode: 'break', selectedWorkPreset: 20 })) // no version
    const { result } = await boot()
    expect(result.current.state.selectedWorkPreset).toBe(25)
    expect(result.current.state.mode).toBe('work')
    // Re-persisted blob is now a v3 default, not the purged v2 shape.
    const persisted = JSON.parse(localStorage.getItem(STATE_KEY)!)
    expect(persisted.version).toBe(3)
    expect(persisted.selectedWorkPreset).toBe(25)
  })
})

// AC-34 / AC-17 / AC-20 — persisted data loads on boot (survives a refresh).
describe('AC-34/17/20 persistence loads on boot', () => {
  it('restores history, completed tasks, notes, plan tasks, and daily stats', async () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify({
      days: { [TODAY]: { dateKey: TODAY, totalFocusSeconds: 1800, sessionsCount: 2, segmentSeconds: new Array(24).fill(0) } },
    }))
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([
      { id: 'c1', title: 'Yesterday task', minutes: 25, completedAt: iso(86_400_000) },
    ]))
    seedState({
      notes: [{ id: 'n1', text: 'persisted note', createdAt: iso(3600_000) }],
      tasks: [{ id: 't1', title: 'leftover', minutes: 30, checked: false }],
      dailyStats: { dateKey: TODAY, focusSeconds: 1800, sessionsCount: 2 },
    })

    const { result } = await boot()
    const s = result.current.state
    // history (AC-34)
    expect(s.focusHistory.days[TODAY].totalFocusSeconds).toBe(1800)
    // completed tasks survive refresh (AC-17)
    expect(s.completedTasks).toHaveLength(1)
    expect(s.completedTasks[0].title).toBe('Yesterday task')
    // notes survive refresh (AC-20)
    expect(s.notes).toHaveLength(1)
    expect(s.notes[0].text).toBe('persisted note')
    // plan tasks + daily stats restored
    expect(s.tasks.map(t => t.title)).toEqual(['leftover'])
    expect(s.dailyStats.focusSeconds).toBe(1800)
    expect(s.dailyStats.sessionsCount).toBe(2)
  })
})
