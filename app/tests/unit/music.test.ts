import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readSettings } from '../../src/persistence'
import { MANIFEST } from '../integration/appHarness'

const flush = () => Promise.resolve()

// music.ts is a module singleton (its <audio> + isPlaying state survive forever);
// reset the registry each test so isPlaying/index don't leak between cases.
let music: typeof import('../../src/music')

beforeEach(async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => MANIFEST }) as Response))
  vi.resetModules()
  music = await import('../../src/music')
  await music.initMusic() // loads the 8-track library from the manifest
})
afterEach(() => vi.unstubAllGlobals())

const getMusicState = () => music.getMusicState()
const selectTrack = (...a: Parameters<typeof music.selectTrack>) => music.selectTrack(...a)
const togglePlay = () => music.togglePlay()
const nextTrack = () => music.nextTrack()
const prevTrack = () => music.prevTrack()
const toggleLoop = () => music.toggleLoop()
const setMusicVolume = (v: number) => music.setMusicVolume(v)
const initMusic = () => music.initMusic()

// AC-30 — built-in lofi player: select/play/pause/next/prev/loop, independent volume, persistence.
describe('AC-30 lofi player', () => {
  it('loads the bundled library from the manifest', () => {
    expect(getMusicState().tracks).toHaveLength(8)
    expect(getMusicState().tracks[0].title).toBe('Morning Coffee')
    expect(getMusicState().activeTrackIndex).toBe(0)
    expect(getMusicState().isPlaying).toBe(false)
  })

  it('selects a track and starts playback', async () => {
    selectTrack(2)
    await flush()
    expect(getMusicState().activeTrackIndex).toBe(2)
    expect(getMusicState().isPlaying).toBe(true)
    expect(readSettings().activeTrackIndex).toBe(2) // persisted
  })

  it('play / pause toggles', async () => {
    togglePlay()
    await flush()
    expect(getMusicState().isPlaying).toBe(true)
    togglePlay()
    expect(getMusicState().isPlaying).toBe(false)
  })

  it('next and prev wrap around the library', async () => {
    selectTrack(0)
    await flush()
    nextTrack(); await flush()
    expect(getMusicState().activeTrackIndex).toBe(1)
    prevTrack(); await flush()
    expect(getMusicState().activeTrackIndex).toBe(0)
    prevTrack(); await flush() // wraps to the last track
    expect(getMusicState().activeTrackIndex).toBe(7)
  })

  it('loop toggles and persists', () => {
    expect(getMusicState().loop).toBe(false)
    toggleLoop()
    expect(getMusicState().loop).toBe(true)
    expect(readSettings().loop).toBe(true)
  })

  it('music volume is independent from sound-effects volume', () => {
    setMusicVolume(40)
    expect(getMusicState().volume).toBe(40)
    expect(readSettings().musicVolume).toBe(40)
    expect(readSettings().soundVolume).toBe(70) // sound effects untouched
  })

  it('track / loop / volume choices survive a reload (re-init reads them back)', async () => {
    selectTrack(3); await flush()
    toggleLoop()
    setMusicVolume(55)

    // Simulate an app reload: re-run initMusic from persisted settings.
    await initMusic()
    expect(getMusicState().activeTrackIndex).toBe(3)
    expect(getMusicState().loop).toBe(true)
    expect(getMusicState().volume).toBe(55)
  })
})
