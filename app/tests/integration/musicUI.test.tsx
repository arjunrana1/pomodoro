import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, fireEvent, cleanup, act } from '@testing-library/react'
import { renderApp, stubFetch } from './appHarness'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 5, 15, 9, 0, 0))
  stubFetch()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

// AC-30 (UI) — the Settings lofi panel lists the library and drives transport.
describe('AC-30 lofi player UI', () => {
  it('lists the bundled tracks and toggles play/pause + loop from Settings', async () => {
    await renderApp()
    fireEvent.click(screen.getByLabelText('Settings'))
    await act(async () => { for (let i = 0; i < 4; i++) await Promise.resolve() })

    // Library renders (8 bundled tracks).
    expect(screen.getByText('Morning Coffee')).toBeInTheDocument()
    expect(screen.getByText('Something In the Air')).toBeInTheDocument()
    expect(screen.getByText('Lofi Library · Built-in')).toBeInTheDocument()

    // Play → Pause affordance flips live.
    expect(screen.getByLabelText('Play music')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Play music'))
    await act(async () => { await Promise.resolve() })
    expect(screen.getByLabelText('Pause music')).toBeInTheDocument()

    // Transport + loop controls present and toggle.
    expect(screen.getByLabelText('Previous track')).toBeInTheDocument()
    expect(screen.getByLabelText('Next track')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Loop current track'))
    expect(screen.getByLabelText('Disable loop')).toBeInTheDocument()
  })

  it('selecting a track in the list switches the active track', async () => {
    await renderApp()
    fireEvent.click(screen.getByLabelText('Settings'))
    await act(async () => { for (let i = 0; i < 4; i++) await Promise.resolve() })

    fireEvent.click(screen.getByText('Vintage'))
    await act(async () => { await Promise.resolve() })
    // The now-active track plays → Pause affordance shows.
    expect(screen.getByLabelText('Pause music')).toBeInTheDocument()
  })
})
