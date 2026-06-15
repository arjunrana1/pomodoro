import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useAppState } from '../../src/store'
import { readCompletedTasks, readHistory, readRuntimeState } from '../../src/persistence'
import { getTodayKey } from '../../src/utils'

// Deterministic clock: Jun 15 2026, 09:00 local.
const BASE = new Date(2026, 5, 15, 9, 0, 0).getTime()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(BASE)
})
afterEach(() => {
  cleanup() // unmounts → clears the store's tick + rollover intervals
  vi.useRealTimers()
})

function mount() {
  return renderHook(() => useAppState())
}

/** Jump the wall clock forward and fire one 250 ms tick so the timer settles. */
function elapse(seconds: number) {
  act(() => {
    vi.setSystemTime(BASE + seconds * 1000 + 1000)
    vi.advanceTimersByTime(250)
  })
}

// AC-5 — Home Start uses the selected preset; default is 25m.
describe('AC-5 Home start duration', () => {
  it('defaults to 25m selected', () => {
    const { result } = mount()
    expect(result.current.state.selectedWorkPreset).toBe(25)
    expect(result.current.state.secondsRemaining).toBe(25 * 60)
    expect(result.current.state.initialSeconds).toBe(25 * 60)
  })

  it('selecting a preset drives the timer; Home start uses it', () => {
    const { result } = mount()
    act(() => result.current.selectWorkPreset(15))
    expect(result.current.state.secondsRemaining).toBe(15 * 60)
    act(() => result.current.startSession('home'))
    expect(result.current.state.status).toBe('running')
    expect(result.current.state.initialSeconds).toBe(15 * 60)
    expect(result.current.state.sessionMode).toBe('work')
  })

  it('a custom whole-minute value sets the duration; invalid input is rejected', () => {
    const { result } = mount()
    act(() => { expect(result.current.commitCustomMinutes('40')).toBe(true) })
    expect(result.current.state.customWorkMinutes).toBe(40)
    expect(result.current.state.secondsRemaining).toBe(40 * 60)
    act(() => { expect(result.current.commitCustomMinutes('1.5')).toBe(false) })
    expect(result.current.state.customMinutesInputError).toBeTruthy()
  })
})

// AC-6 — Start Focused Session uses the sum of *active* (unchecked) task minutes.
describe('AC-6 plan start = sum of active task minutes', () => {
  it('starts a session of the summed minutes', () => {
    const { result } = mount()
    act(() => { result.current.addTask('A', 10); result.current.addTask('B', 15) })
    act(() => result.current.startSession('plan'))
    expect(result.current.state.initialSeconds).toBe((10 + 15) * 60)
  })

  it('excludes checked tasks from the sum', () => {
    const { result } = mount()
    act(() => { result.current.addTask('A', 10); result.current.addTask('B', 15) })
    const bId = result.current.state.tasks.find(t => t.title === 'B')!.id
    act(() => result.current.toggleTaskChecked(bId)) // B → completed, excluded
    act(() => result.current.startSession('plan'))
    expect(result.current.state.initialSeconds).toBe(10 * 60)
  })
})

// AC-7 — count direction is display-only: completion + stats identical either way.
describe('AC-7 count direction is display-only', () => {
  it('completion stats are identical regardless of countUp', () => {
    // Count Down
    const a = mount()
    act(() => a.result.current.selectWorkPreset(15))
    act(() => a.result.current.startSession('home'))
    elapse(15 * 60)
    const down = a.result.current.state.dailyStats
    a.unmount()

    // Count Up — reset the clock so this session starts at BASE too.
    act(() => vi.setSystemTime(BASE))
    const b = mount()
    act(() => b.result.current.setCountUp(true))
    act(() => b.result.current.selectWorkPreset(15))
    act(() => b.result.current.startSession('home'))
    elapse(15 * 60)
    const up = b.result.current.state.dailyStats

    expect(up.focusSeconds).toBe(down.focusSeconds)
    expect(up.sessionsCount).toBe(down.sessionsCount)
    expect(up.focusSeconds).toBe(15 * 60)
  })
})

// AC-8 — pause freezes the clock; resume continues + plays its cue; no Reset exists.
describe('AC-8 pause / resume / no reset', () => {
  it('pause freezes remaining; resume continues and excludes paused time', () => {
    const { result } = mount()
    act(() => result.current.selectWorkPreset(25))
    act(() => result.current.startSession('home'))

    elapse(60)            // 1 min in → 24:00 remaining
    act(() => result.current.pauseResumeSession())
    expect(result.current.state.status).toBe('paused')
    const frozen = result.current.state.secondsRemaining

    // Time passes while paused — remaining must not move.
    act(() => { vi.setSystemTime(BASE + 5 * 60 * 1000); vi.advanceTimersByTime(250) })
    expect(result.current.state.secondsRemaining).toBe(frozen)

    globalThis.__playedFreqs = []
    act(() => result.current.pauseResumeSession()) // resume
    expect(result.current.state.status).toBe('running')
    expect(globalThis.__playedFreqs).toContain(523) // resume cue
    expect(result.current.state.totalPausedSeconds).toBeGreaterThan(0)
  })

  it('exposes no reset control', () => {
    const { result } = mount()
    expect((result.current as Record<string, unknown>).resetSession).toBeUndefined()
    expect(Object.keys(result.current)).not.toContain('resetSession')
  })
})

// AC-11 + AC-28 — Work Stop: Flow Complete, history gets elapsed, daily stats DO NOT
// move, sessionsCount stays put; elapsed (not initial) is surfaced.
describe('AC-11 / AC-28 Work stop', () => {
  it('stop records elapsed to history but never to daily stats or sessionsCount', () => {
    const { result } = mount()
    act(() => result.current.selectWorkPreset(25))
    act(() => result.current.startSession('home'))

    // 10 minutes of focus, then Stop (confirm defaults to OK).
    act(() => { vi.setSystemTime(BASE + 600 * 1000) })
    act(() => result.current.stopSession())

    const s = result.current.state
    expect(s.status).toBe('complete')
    expect(s.sessionStoppedEarly).toBe(true)
    expect(s.lastSessionElapsedSeconds).toBe(600) // elapsed, not the 1500 initial

    // Focus History (bar + heatmap) DID get the elapsed seconds…
    const today = getTodayKey()
    expect(s.focusHistory.days[today].totalFocusSeconds).toBe(600)
    expect(s.focusHistory.days[today].segmentSeconds[9]).toBe(600) // all in the 9 AM bucket
    // …but sessionsCount stays 0 (only natural completions count) — AC-28.
    expect(s.focusHistory.days[today].sessionsCount).toBe(0)

    // Daily stats are NOT incremented on Stop — REQUIREMENTS §4.4 / AC-11.
    expect(s.dailyStats.focusSeconds).toBe(0)
    expect(s.dailyStats.sessionsCount).toBe(0)
  })

  it('a cancelled confirm leaves the session running', () => {
    window.confirm = () => false
    const { result } = mount()
    act(() => result.current.startSession('home'))
    act(() => result.current.stopSession())
    expect(result.current.state.status).toBe('running')
  })

  it('natural completion DOES increment daily stats + sessionsCount', () => {
    const { result } = mount()
    act(() => result.current.selectWorkPreset(15))
    act(() => result.current.startSession('home'))
    elapse(15 * 60)
    const s = result.current.state
    expect(s.status).toBe('complete')
    expect(s.sessionStoppedEarly).toBe(false)
    expect(s.dailyStats.focusSeconds).toBe(15 * 60)
    expect(s.dailyStats.sessionsCount).toBe(1)
    expect(s.focusHistory.days[getTodayKey()].sessionsCount).toBe(1)
  })
})

// AC-4 — Break is never recorded to stats / history / dashboard.
describe('AC-4 break records nothing', () => {
  it('natural break completion leaves stats + history untouched', () => {
    const { result } = mount()
    act(() => result.current.setMode('break'))
    expect(result.current.state.selectedBreakPreset).toBe(5)
    act(() => result.current.startSession('home'))
    expect(result.current.state.sessionMode).toBe('break')
    elapse(5 * 60)
    const s = result.current.state
    expect(s.status).toBe('complete')
    expect(s.dailyStats.focusSeconds).toBe(0)
    expect(s.dailyStats.sessionsCount).toBe(0)
    expect(Object.keys(s.focusHistory.days)).toHaveLength(0)
  })

  it('ending a break early records nothing', () => {
    const { result } = mount()
    act(() => result.current.setMode('break'))
    act(() => result.current.startSession('home'))
    act(() => { vi.setSystemTime(BASE + 90 * 1000) })
    act(() => result.current.endBreak())
    const s = result.current.state
    expect(s.status).toBe('complete')
    expect(s.dailyStats.focusSeconds).toBe(0)
    expect(Object.keys(s.focusHistory.days)).toHaveLength(0)
  })
})

// AC-15 / AC-16 / AC-17 — completed-tasks log behavior.
describe('AC-15/16/17 completed tasks log', () => {
  it('checking moves a task to the log with timestamp + minutes, newest-first', () => {
    const { result } = mount()
    act(() => { result.current.addTask('First', 25); result.current.addTask('Second', 10) })
    const ids = result.current.state.tasks.map(t => t.id)
    act(() => result.current.toggleTaskChecked(ids[0]))
    act(() => result.current.toggleTaskChecked(ids[1]))

    const log = result.current.state.completedTasks
    expect(log).toHaveLength(2)
    expect(log[0].title).toBe('Second') // newest first
    expect(log[1].title).toBe('First')
    expect(log[0].minutes).toBe(10)
    expect(() => new Date(log[0].completedAt).toISOString()).not.toThrow()
    // persisted to its own key (AC-17)
    expect(readCompletedTasks()).toHaveLength(2)
  })

  it('unchecking pulls the entry back out of the log', () => {
    const { result } = mount()
    act(() => result.current.addTask('Task', 25))
    const id = result.current.state.tasks[0].id
    act(() => result.current.toggleTaskChecked(id))
    expect(result.current.state.completedTasks).toHaveLength(1)
    act(() => result.current.toggleTaskChecked(id))
    expect(result.current.state.completedTasks).toHaveLength(0)
  })

  it('exposes only a clear-all (no per-row edit/delete/undo) and never auto-clears', () => {
    const { result } = mount()
    const api = result.current as Record<string, unknown>
    expect(typeof api.clearCompletedTasks).toBe('function')
    expect(api.editCompletedTask).toBeUndefined()
    expect(api.deleteCompletedTask).toBeUndefined()
    expect(api.undoCompletedTask).toBeUndefined()

    act(() => { result.current.addTask('T', 25) })
    const id = result.current.state.tasks[0].id
    act(() => result.current.toggleTaskChecked(id))
    // New session after completion must NOT auto-clear the log (AC-17).
    act(() => result.current.startSession('home'))
    elapse(25 * 60)
    act(() => result.current.newSession())
    expect(result.current.state.completedTasks).toHaveLength(1)

    act(() => result.current.clearCompletedTasks())
    expect(result.current.state.completedTasks).toHaveLength(0)
  })
})

// AC-20 — notes persist across sessions, survive completing/stopping, are independent.
describe('AC-20 notes independence + persistence', () => {
  it('notes survive completing and stopping a session', () => {
    const { result } = mount()
    act(() => result.current.addNote('remember this'))
    expect(result.current.state.notes).toHaveLength(1)
    // persisted into runtime state
    expect(readRuntimeState()?.notes?.[0].text).toBe('remember this')

    act(() => result.current.startSession('home'))
    elapse(25 * 60)
    act(() => result.current.newSession())
    expect(result.current.state.notes).toHaveLength(1) // survived completion + new session

    act(() => result.current.startSession('home'))
    act(() => { vi.setSystemTime(BASE + 30 * 60 * 1000 + 60_000) })
    act(() => result.current.stopSession())
    expect(result.current.state.notes).toHaveLength(1) // survived stop
  })

  it('editing and deleting notes works and is not tied to tasks', () => {
    const { result } = mount()
    act(() => result.current.addNote('original'))
    const id = result.current.state.notes[0].id
    act(() => result.current.editNote(id, 'edited'))
    expect(result.current.state.notes[0].text).toBe('edited')
    expect(result.current.state.notes[0].editedAt).toBeTruthy()
    // adding/removing tasks does not touch notes
    act(() => result.current.addTask('unrelated', 5))
    expect(result.current.state.notes).toHaveLength(1)
    act(() => result.current.deleteNote(id))
    expect(result.current.state.notes).toHaveLength(0)
  })
})

// §15.3 — New Session keeps unchecked plan tasks, drops checked ones.
describe('newSession task handling', () => {
  it('keeps unchecked tasks and drops checked (logged) ones', () => {
    const { result } = mount()
    act(() => { result.current.addTask('done', 10); result.current.addTask('todo', 20) })
    const doneId = result.current.state.tasks.find(t => t.title === 'done')!.id
    act(() => result.current.toggleTaskChecked(doneId))
    act(() => result.current.startSession('home'))
    elapse(25 * 60)
    act(() => result.current.newSession())
    const titles = result.current.state.tasks.map(t => t.title)
    expect(titles).toEqual(['todo'])
    expect(result.current.state.completedTasks.map(c => c.title)).toContain('done')
  })
})
