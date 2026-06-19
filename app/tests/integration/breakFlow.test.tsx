import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, fireEvent, cleanup, act } from '@testing-library/react'
import { renderApp, stubFetch } from './appHarness'

const BASE = new Date(2026, 5, 15, 9, 0, 0).getTime()

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

// AC-2 / AC-4 — the Break flow: Start Break → End Break → Break Done → Start Focus Session.
describe('Break flow + Break Done card', () => {
  it('ends a break to the Break Done card, then returns to Work Home', async () => {
    await renderApp()
    fireEvent.click(screen.getAllByRole('button', { name: /Break/ })[0]) // switch to Break
    fireEvent.click(screen.getByRole('button', { name: /Start Break/ }))

    // Run ~2 minutes, then End Break.
    act(() => { vi.setSystemTime(BASE + 120_000) })
    fireEvent.click(screen.getByRole('button', { name: /End Break/ }))

    // Break Done card.
    expect(screen.getByRole('heading', { name: 'Break Done' })).toBeInTheDocument()
    expect(screen.getByText(/to recharge/)).toBeInTheDocument()

    // Start Focus Session → back to Work idle Home.
    fireEvent.click(screen.getByRole('button', { name: /Start Focus Session/ }))
    expect(screen.getByRole('button', { name: /Start Session/ })).toBeInTheDocument()
    expect(screen.getByText('Focus Time Today')).toBeInTheDocument() // Work stats visible again
  })

  it('a natural break completion records nothing in the dashboard', async () => {
    await renderApp()
    fireEvent.click(screen.getAllByRole('button', { name: /Break/ })[0])
    fireEvent.click(screen.getByRole('button', { name: /Start Break/ })) // 5 min default
    act(() => { vi.setSystemTime(BASE + 5 * 60_000 + 1000); vi.advanceTimersByTime(250) })

    expect(screen.getByRole('heading', { name: 'Break Done' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Start Focus Session/ }))
    // Dashboard still empty — break time was never recorded (AC-4).
    expect(screen.getByText(/Complete your first session to start tracking/)).toBeInTheDocument()
  })
})
