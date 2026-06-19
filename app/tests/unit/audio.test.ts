import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  setSoundVolume,
  playClickSound, playStartSound, playPauseSound, playResumeSound,
  playStopSound, playCompletionSound, playBreakStartSound, playBreakEndSound,
} from '../../src/audio'

// tests/setup.ts mocks AudioContext to push every played frequency here.
const freqs = () => globalThis.__playedFreqs

beforeEach(() => {
  vi.useFakeTimers()
  setSoundVolume(70)
})
afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
})

// AC-22 — sound volume scales effects; muted (0) produces no audio at all.
describe('AC-22 sound volume gating', () => {
  it('plays tones when volume > 0', () => {
    playClickSound()
    expect(freqs().length).toBeGreaterThan(0)
    expect(freqs()).toContain(800) // click tone
  })

  it('produces NO audio when master volume is 0', () => {
    setSoundVolume(0)
    playClickSound()
    playStartSound()
    playCompletionSound()
    vi.advanceTimersByTime(5000)
    expect(freqs()).toHaveLength(0)
  })

  it('clamps volume into 0–100', () => {
    setSoundVolume(999)
    playClickSound()
    expect(freqs().length).toBeGreaterThan(0) // still audible (clamped to 100)
    setSoundVolume(-50)
    globalThis.__playedFreqs = []
    playClickSound()
    expect(freqs()).toHaveLength(0) // clamped to 0 → silent
  })
})

// Work session cues (unchanged from v2) — establish the distinct signatures.
describe('Work sound cues', () => {
  it('start = ascending 523 → 659 → 784', () => {
    playStartSound()
    expect(freqs()[0]).toBe(523)
    vi.advanceTimersByTime(250)
    expect(freqs()).toEqual([523, 659, 784])
  })

  it('stop = descending 500 → 350', () => {
    playStopSound()
    vi.advanceTimersByTime(200)
    expect(freqs()).toEqual([500, 350])
  })

  it('resume plays its own cue (523 → 659)', () => {
    playResumeSound()
    vi.advanceTimersByTime(150)
    expect(freqs()).toEqual([523, 659])
  })

  it('pause is a single 440 tone', () => {
    playPauseSound()
    expect(freqs()).toEqual([440])
  })
})

// AC-23 — Break start + end sounds play and are DISTINCT from the Work cues.
describe('AC-23 break sounds', () => {
  it('break start = warm descending 440 → 349 (distinct from Work start 523…)', () => {
    playBreakStartSound()
    expect(freqs()[0]).toBe(440)
    vi.advanceTimersByTime(200)
    expect(freqs()).toEqual([440, 349])
    expect(freqs()).not.toContain(523) // not the Work start signature
  })

  it('break end = gentle ascending 587 → 880 (distinct from Work completion)', () => {
    playBreakEndSound()
    expect(freqs()[0]).toBe(587)
    vi.advanceTimersByTime(300)
    expect(freqs()).toEqual([587, 880])
  })

  it('break sounds are gated on volume like every other effect', () => {
    setSoundVolume(0)
    playBreakStartSound()
    playBreakEndSound()
    vi.advanceTimersByTime(500)
    expect(freqs()).toHaveLength(0)
  })
})
