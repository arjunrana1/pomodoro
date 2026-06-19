import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
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

// AC-32 — expanded SEO footer on Work idle Home, all required sections, "Pomodoro Focus".
describe('AC-32 marketing footer', () => {
  it('renders all seven required sections on the Work idle Home', async () => {
    await renderApp()
    for (const heading of [
      'What is Pomodoro Focus?',
      'What is the Pomodoro Technique?',
      'How to Use Pomodoro Focus',
      'Focus & Break Sessions',
      'Tasks & Session Planning',
      'Focus Music',
      'Features',
    ]) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }
  })

  it('references Pomodoro Focus and lists the Sound Cues feature mentioning resume', async () => {
    await renderApp()
    // Brand referenced (header + footer copy).
    expect(screen.getAllByText(/Pomodoro Focus/).length).toBeGreaterThan(1)
    expect(screen.getByText(/free online pomodoro timer/)).toBeInTheDocument()

    // Features include the canonical entries; Sound Cues must mention "resume".
    expect(screen.getByText('Sound Cues')).toBeInTheDocument()
    expect(screen.getByText(/start, pause, resume, stop, and completion/)).toBeInTheDocument()
    expect(screen.getByText('Count Up / Count Down')).toBeInTheDocument()
    expect(screen.getByText('Work & Break Modes')).toBeInTheDocument()
  })
})
