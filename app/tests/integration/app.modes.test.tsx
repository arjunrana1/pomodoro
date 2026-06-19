import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, fireEvent, cleanup, within } from '@testing-library/react'
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

const focusButtons = () => screen.getAllByRole('button', { name: /Focus/ })
const breakButtons = () => screen.getAllByRole('button', { name: /Break/ })

// AC-1 — Focus/Break toggle present on the timer screens; fresh load defaults to Focus.
describe('AC-1 mode toggle + default', () => {
  it('renders the Focus/Break toggle on the idle Home and defaults to Focus', async () => {
    await renderApp()
    expect(focusButtons().length).toBeGreaterThan(0)
    expect(breakButtons().length).toBeGreaterThan(0)
    // default = Focus pressed, Break not.
    expect(focusButtons().some(b => b.getAttribute('aria-pressed') === 'true')).toBe(true)
    expect(breakButtons().every(b => b.getAttribute('aria-pressed') === 'false')).toBe(true)
    // Work orb default duration 25:00.
    expect(screen.getByText('25:00')).toBeInTheDocument()
  })

  it('keeps the toggle present on the active session screen', async () => {
    await renderApp()
    fireEvent.click(screen.getByRole('button', { name: /Start Session/ }))
    // Now in the active session — toggle still rendered (locked).
    expect(focusButtons().length).toBeGreaterThan(0)
    expect(breakButtons().length).toBeGreaterThan(0)
  })
})

// AC-2 — switching to Break swaps presets/copy and hides Work-only UI.
describe('AC-2 Break mode swap', () => {
  it('swaps to 5/10/15 presets (default 5m), break copy, and hides Tasks/Notes/FABs/stats', async () => {
    await renderApp()
    fireEvent.click(breakButtons()[0])

    // Presets → 5/10/15, Work presets gone.
    expect(screen.getByRole('button', { name: '5m' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '10m' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '15m' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '25m' })).toBeNull()

    // Default 5m → orb shows 05:00; break copy + CTA.
    expect(screen.getByText('05:00')).toBeInTheDocument()
    expect(screen.getByText('Take a breather')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Break/ })).toBeInTheDocument()

    // Work-only UI hidden: FABs + daily stats gone.
    expect(screen.queryByLabelText('Open notes')).toBeNull()
    expect(screen.queryByLabelText('Open session plan')).toBeNull()
    expect(screen.queryByText('Focus Time Today')).toBeNull()
  })
})

// AC-3 — during an active session the toggle is disabled + locked.
describe('AC-3 mode lock mid-session', () => {
  it('disables both toggle buttons, shows a lock, and ignores clicks', async () => {
    await renderApp()
    fireEvent.click(screen.getByRole('button', { name: /Start Session/ }))

    // Both buttons disabled.
    expect(focusButtons().every(b => (b as HTMLButtonElement).disabled)).toBe(true)
    expect(breakButtons().every(b => (b as HTMLButtonElement).disabled)).toBe(true)
    // Lock glyph present.
    expect(screen.getAllByLabelText('Mode locked during session').length).toBeGreaterThan(0)

    // Clicking Break does nothing — still an active Work session (Pause/Stop visible).
    fireEvent.click(breakButtons()[0])
    expect(screen.getByRole('button', { name: /Pause/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Stop/ })).toBeInTheDocument()
    // Session badge still says Session Active (Work), not a break.
    expect(within(document.body).getByText('Session Active')).toBeInTheDocument()
  })
})
