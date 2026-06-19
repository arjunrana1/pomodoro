import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, fireEvent, cleanup, within, act } from '@testing-library/react'
import { renderApp, stubFetch } from './appHarness'
import { readSettings, readCompletedTasks } from '../../src/persistence'

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

const openSettings = () => fireEvent.click(screen.getByLabelText('Settings'))

// AC-21 — Settings is a full screen reached via the gear, with all sections.
describe('AC-21 Settings screen', () => {
  it('opens full-screen with Timer / Sound / Music / Data & Privacy sections', async () => {
    await renderApp()
    openSettings()
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    for (const section of ['Timer', 'Sound', 'Music', 'Data & Privacy']) {
      expect(screen.getByRole('heading', { name: section })).toBeInTheDocument()
    }
    // Timer Direction control present (Count Down / Count Up).
    expect(screen.getByRole('button', { name: 'Count Down' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Count Up' })).toBeInTheDocument()
    // Full screen, not a modal → has its own "Back to timer".
    expect(screen.getByRole('button', { name: /Back to timer/ })).toBeInTheDocument()
  })

  it('Count Up toggle updates the persisted setting', async () => {
    await renderApp()
    openSettings()
    fireEvent.click(screen.getByRole('button', { name: 'Count Up' }))
    expect(readSettings().countUp).toBe(true)
  })
})

// AC-22 — header speaker reflects the master toggle live; volumes are independent.
describe('AC-22 sound toggle + volume independence', () => {
  it('the header speaker toggles sound on/off live and persists it', async () => {
    await renderApp()
    // Sound on by default → "Mute" affordance + volume_up glyph.
    expect(screen.getByLabelText('Mute sound effects')).toBeInTheDocument()
    expect(screen.getByText('volume_up')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Mute sound effects'))
    // Live update → now an "Unmute" affordance + volume_off glyph.
    expect(screen.getByLabelText('Unmute sound effects')).toBeInTheDocument()
    expect(screen.getByText('volume_off')).toBeInTheDocument()
    expect(readSettings().soundEnabled).toBe(false)
  })

  it('sound volume and music volume are independent sliders', async () => {
    await renderApp()
    openSettings()
    const soundSlider = screen.getByLabelText('Sound volume')
    const musicSlider = screen.getByLabelText('Music volume')

    fireEvent.change(soundSlider, { target: { value: '30' } })
    expect(readSettings().soundVolume).toBe(30)
    expect(readSettings().musicVolume).toBe(70) // unchanged

    fireEvent.change(musicSlider, { target: { value: '90' } })
    expect(readSettings().musicVolume).toBe(90)
    expect(readSettings().soundVolume).toBe(30) // unchanged
  })
})

// AC-24 — Data & Privacy: confirm-gated clears wipe the right data; export downloads JSON.
describe('AC-24 Data & Privacy', () => {
  it('Clear focus history wipes recorded sessions (dashboard returns to empty state)', async () => {
    await renderApp()
    // Record one Work session so there is history to clear.
    fireEvent.click(screen.getByRole('button', { name: /Start Session/ }))
    act(() => { vi.setSystemTime(BASE + 26 * 60_000); vi.advanceTimersByTime(250) })
    fireEvent.click(screen.getByRole('button', { name: /New Session/ }))
    // Dashboard now has data (no empty-state copy).
    expect(screen.queryByText(/Complete your first session/)).toBeNull()

    openSettings()
    // Scope to the "Clear focus history" row and click its Clear button (confirm defaults OK).
    const row = screen.getByText('Clear focus history').closest('div')!.parentElement!
    fireEvent.click(within(row).getByRole('button', { name: /Clear/ }))
    fireEvent.click(screen.getByRole('button', { name: /Back to timer/ }))

    // Back on Home → dashboard shows the empty state again.
    expect(screen.getByText(/Complete your first session/)).toBeInTheDocument()
  })

  it('Clear completed tasks wipes the log from Settings', async () => {
    await renderApp()
    // Create a completed task via the Tasks drawer.
    fireEvent.click(screen.getByLabelText('Open session plan'))
    const d = within(screen.getByLabelText('Session Plan'))
    fireEvent.change(d.getByPlaceholderText('Enter task title'), { target: { value: 'Logged task' } })
    fireEvent.change(d.getByPlaceholderText('00'), { target: { value: '20' } })
    fireEvent.click(d.getByRole('button', { name: /Add Task/ }))
    fireEvent.click(d.getByLabelText('Mark Logged task complete'))
    expect(readCompletedTasks()).toHaveLength(1)

    openSettings()
    const row = screen.getByText('Clear completed tasks').closest('div')!.parentElement!
    fireEvent.click(within(row).getByRole('button', { name: /Clear/ }))
    expect(readCompletedTasks()).toHaveLength(0)
  })

  it('Export downloads a JSON file', async () => {
    await renderApp()
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    openSettings()
    fireEvent.click(screen.getByRole('button', { name: /Export/ }))
    expect(createUrl).toHaveBeenCalledTimes(1)
  })
})
