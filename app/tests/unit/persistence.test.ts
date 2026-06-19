import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  STATE_KEY, HISTORY_KEY, COMPLETED_KEY, SETTINGS_KEY,
  purgeLegacyDataIfNeeded,
  defaultSettings, readSettings, writeSettings,
  readHistory, writeHistory,
  readCompletedTasks, writeCompletedTasks,
  persistRuntimeState, readRuntimeState,
  exportAllData,
} from '../../src/persistence'
import type { AppState } from '../../src/types'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

// AC-33 — fresh-start purge of any v2-shaped localStorage; defaults initialized.
describe('AC-33 purgeLegacyDataIfNeeded', () => {
  it('clears all app keys when a legacy v2 key is present', () => {
    localStorage.setItem('pomodoro-focus-stats', '{"old":true}') // v2 key
    localStorage.setItem(STATE_KEY, JSON.stringify({ version: 3 }))
    localStorage.setItem(HISTORY_KEY, '{"days":{}}')
    localStorage.setItem(COMPLETED_KEY, '[]')
    localStorage.setItem(SETTINGS_KEY, '{}')

    purgeLegacyDataIfNeeded()

    for (const k of [STATE_KEY, HISTORY_KEY, COMPLETED_KEY, SETTINGS_KEY, 'pomodoro-focus-stats']) {
      expect(localStorage.getItem(k)).toBeNull()
    }
  })

  it('purges a state blob missing the version:3 marker', () => {
    localStorage.setItem(STATE_KEY, JSON.stringify({ mode: 'work' })) // no version
    localStorage.setItem(HISTORY_KEY, '{"days":{}}')
    purgeLegacyDataIfNeeded()
    expect(localStorage.getItem(STATE_KEY)).toBeNull()
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull()
  })

  it('purges an unparseable state blob', () => {
    localStorage.setItem(STATE_KEY, '{not json')
    purgeLegacyDataIfNeeded()
    expect(localStorage.getItem(STATE_KEY)).toBeNull()
  })

  it('keeps a valid version:3 state untouched', () => {
    const v3 = JSON.stringify({ version: 3, mode: 'work' })
    localStorage.setItem(STATE_KEY, v3)
    localStorage.setItem(HISTORY_KEY, '{"days":{"2026-06-10":{}}}')
    purgeLegacyDataIfNeeded()
    expect(localStorage.getItem(STATE_KEY)).toBe(v3)
    expect(localStorage.getItem(HISTORY_KEY)).toBe('{"days":{"2026-06-10":{}}}')
  })

  it('after a purge, settings fall back to fresh defaults', () => {
    localStorage.setItem('deep-focus-state', '{}') // legacy
    purgeLegacyDataIfNeeded()
    expect(readSettings()).toEqual(defaultSettings())
    expect(readRuntimeState()).toBeNull()
  })
})

// AC-34 — local persistence round-trips for each store.
describe('AC-34 persistence round-trips', () => {
  it('settings default to sound on / 70% volumes / count down', () => {
    expect(defaultSettings()).toEqual({
      soundEnabled: true, soundVolume: 70, musicVolume: 70,
      activeTrackIndex: 0, loop: false, countUp: false, spotifyConnected: false,
    })
  })

  it('writeSettings is a read-modify-write merge across independent writers', () => {
    writeSettings({ soundVolume: 30 })        // e.g. the store
    writeSettings({ musicVolume: 90 })        // e.g. music.ts
    writeSettings({ spotifyConnected: true }) // e.g. spotify.ts
    const s = readSettings()
    expect(s.soundVolume).toBe(30)
    expect(s.musicVolume).toBe(90)
    expect(s.spotifyConnected).toBe(true)
    expect(s.soundEnabled).toBe(true) // untouched default preserved
  })

  it('history + completed tasks survive a write/read cycle', () => {
    writeHistory({ days: { '2026-06-10': { dateKey: '2026-06-10', totalFocusSeconds: 600, sessionsCount: 1, segmentSeconds: new Array(24).fill(0) } } })
    expect(readHistory().days['2026-06-10'].totalFocusSeconds).toBe(600)

    writeCompletedTasks([{ id: 'a', title: 'Task', minutes: 25, completedAt: '2026-06-10T10:00:00.000Z' }])
    expect(readCompletedTasks()).toHaveLength(1)
    expect(readCompletedTasks()[0].title).toBe('Task')
  })

  it('runtime state persists the durable slice and is read back only when version:3', () => {
    const state = {
      version: 3, mode: 'break', status: 'idle', sessionMode: 'work',
      selectedWorkPreset: 20, customWorkMinutes: null,
      selectedBreakPreset: 10, customBreakMinutes: null,
      tasks: [{ id: 't1', title: 'A', minutes: 5, checked: false }],
      notes: [{ id: 'n1', text: 'hello', createdAt: '2026-06-10T10:00:00.000Z' }],
      secondsRemaining: 600, initialSeconds: 600,
      startedAt: null, pausedAt: null, totalPausedSeconds: 0, attributedDay: null,
      sessionStoppedEarly: false, lastSessionElapsedSeconds: 0,
      dailyStats: { dateKey: '2026-06-10', focusSeconds: 120, sessionsCount: 1 },
    } as unknown as AppState
    persistRuntimeState(state)
    const read = readRuntimeState()!
    expect(read.mode).toBe('break')
    expect(read.selectedWorkPreset).toBe(20)
    expect(read.tasks).toHaveLength(1)
    expect(read.notes?.[0].text).toBe('hello')
    expect(read.dailyStats?.focusSeconds).toBe(120)
  })

  it('readRuntimeState returns null for a non-v3 blob', () => {
    localStorage.setItem(STATE_KEY, JSON.stringify({ version: 2 }))
    expect(readRuntimeState()).toBeNull()
  })
})

// AC-24 — Export downloads a single JSON of all data.
describe('AC-24 exportAllData', () => {
  it('downloads a JSON blob containing every persisted store', async () => {
    // Seed each store so the export is non-trivial.
    writeHistory({ days: { '2026-06-10': { dateKey: '2026-06-10', totalFocusSeconds: 300, sessionsCount: 1, segmentSeconds: new Array(24).fill(0) } } })
    writeCompletedTasks([{ id: 'a', title: 'Done', minutes: 25, completedAt: '2026-06-10T10:00:00.000Z' }])
    writeSettings({ soundVolume: 55 })
    localStorage.setItem(STATE_KEY, JSON.stringify({ version: 3, mode: 'work' }))

    // jsdom's Blob has no .text(); capture the constructor parts instead.
    let parts: string[] = []
    let blobType = ''
    let downloadName = ''
    class CapturingBlob {
      constructor(p: string[], opts?: { type?: string }) { parts = p; blobType = opts?.type ?? '' }
    }
    vi.stubGlobal('Blob', CapturingBlob)
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:export')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloadName = this.download })

    exportAllData()

    expect(blobType).toBe('application/json')
    expect(downloadName).toMatch(/^pomodoro-focus-export-\d{4}-\d{2}-\d{2}\.json$/)

    const json = JSON.parse(parts[0])
    expect(json).toMatchObject({ app: 'Pomodoro Focus', version: 3 })
    expect(json).toHaveProperty('exportedAt')
    expect(json.focusHistory.days['2026-06-10'].totalFocusSeconds).toBe(300)
    expect(json.completedTasks).toHaveLength(1)
    expect(json.settings.soundVolume).toBe(55)
    expect(json.state.mode).toBe('work')
  })
})
