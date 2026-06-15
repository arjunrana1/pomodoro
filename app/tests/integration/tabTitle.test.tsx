import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useAppState } from '../../src/store'

const BASE = new Date(2026, 5, 15, 9, 0, 0).getTime()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(BASE)
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

// AC-10 — browser tab title reflects the timer during active/paused (Work + Break).
describe('AC-10 tab title', () => {
  it('is the bare brand while idle', () => {
    renderHook(() => useAppState())
    expect(document.title).toBe('Pomodoro Focus')
  })

  it('shows remaining MM:SS during a running Work session (count down)', () => {
    const { result } = renderHook(() => useAppState())
    act(() => result.current.selectWorkPreset(25))
    act(() => result.current.startSession('home'))
    expect(document.title).toBe('25:00 - Pomodoro Focus')

    // 1 minute in → 24:00, still reflected while running.
    act(() => { vi.setSystemTime(BASE + 60_000); vi.advanceTimersByTime(250) })
    expect(document.title).toBe('24:00 - Pomodoro Focus')
  })

  it('freezes the title when paused', () => {
    const { result } = renderHook(() => useAppState())
    act(() => result.current.startSession('home'))
    act(() => { vi.setSystemTime(BASE + 60_000); vi.advanceTimersByTime(250) })
    act(() => result.current.pauseResumeSession())
    const paused = document.title
    act(() => { vi.setSystemTime(BASE + 5 * 60_000); vi.advanceTimersByTime(250) })
    expect(document.title).toBe(paused) // unchanged while paused
  })

  it('shows ELAPSED MM:SS when count up is on', () => {
    const { result } = renderHook(() => useAppState())
    act(() => result.current.setCountUp(true))
    act(() => result.current.selectWorkPreset(25))
    act(() => result.current.startSession('home'))
    expect(document.title).toBe('00:00 - Pomodoro Focus') // counting up from zero
  })

  it('reflects a Break timer too', () => {
    const { result } = renderHook(() => useAppState())
    act(() => result.current.setMode('break'))
    act(() => result.current.startSession('home'))
    expect(document.title).toBe('05:00 - Pomodoro Focus')
  })

  it('switches to the completion titles', () => {
    const { result } = renderHook(() => useAppState())
    act(() => result.current.selectWorkPreset(15))
    act(() => result.current.startSession('home'))
    act(() => { vi.setSystemTime(BASE + 15 * 60_000 + 1000); vi.advanceTimersByTime(250) })
    expect(document.title).toBe('Flow Complete - Pomodoro Focus')
  })

  it('shows Break Done when a break completes', () => {
    const { result } = renderHook(() => useAppState())
    act(() => result.current.setMode('break'))
    act(() => result.current.startSession('home'))
    act(() => { vi.setSystemTime(BASE + 5 * 60_000 + 1000); vi.advanceTimersByTime(250) })
    expect(document.title).toBe('Break Done - Pomodoro Focus')
  })
})
