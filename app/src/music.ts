import { useSyncExternalStore } from 'react'
import type { MusicTrack } from './types'
import { readSettings, writeSettings } from './persistence'

/**
 * Built-in Lofi player. Lives at module scope so playback survives every app
 * state change (Work↔Break, idle↔active, Settings open/close) — components
 * subscribe via useMusic() but never own the <audio> element.
 */

export interface MusicState {
  tracks: MusicTrack[]
  activeTrackIndex: number
  isPlaying: boolean
  loop: boolean
  volume: number // 0–100
}

const audio = typeof Audio !== 'undefined' ? new Audio() : null

let state: MusicState = {
  tracks: [],
  activeTrackIndex: 0,
  isPlaying: false,
  loop: false,
  volume: 70,
}

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach(l => l())
}

function setState(partial: Partial<MusicState>) {
  state = { ...state, ...partial }
  emit()
}

export function subscribeMusic(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getMusicState(): MusicState {
  return state
}

export function useMusic(): MusicState {
  return useSyncExternalStore(subscribeMusic, getMusicState)
}

/** Load manifest + restore persisted settings. Called once at app boot. */
export async function initMusic() {
  const settings = readSettings()
  setState({
    activeTrackIndex: settings.activeTrackIndex,
    loop: settings.loop,
    volume: settings.musicVolume,
  })
  if (audio) {
    audio.volume = settings.musicVolume / 100
    audio.addEventListener('ended', handleEnded)
  }
  try {
    const res = await fetch('/music/manifest.json')
    const data = await res.json()
    if (Array.isArray(data?.tracks)) {
      const index = Math.min(settings.activeTrackIndex, Math.max(0, data.tracks.length - 1))
      setState({ tracks: data.tracks, activeTrackIndex: index })
    }
  } catch (e) {
    console.error('Failed to load music manifest', e)
  }
}

function handleEnded() {
  if (state.loop) {
    // Loop current track
    if (audio) {
      audio.currentTime = 0
      void audio.play()
    }
    return
  }
  // Advance; stop after the last track.
  if (state.activeTrackIndex < state.tracks.length - 1) {
    selectTrack(state.activeTrackIndex + 1, true)
  } else {
    setState({ isPlaying: false })
  }
}

function loadTrack(index: number) {
  if (!audio || !state.tracks[index]) return
  audio.src = state.tracks[index].src
}

export function selectTrack(index: number, autoplay = true) {
  if (!state.tracks[index]) return
  setState({ activeTrackIndex: index })
  writeSettings({ activeTrackIndex: index })
  loadTrack(index)
  if (autoplay) {
    void audio?.play().then(() => setState({ isPlaying: true })).catch(() => setState({ isPlaying: false }))
  }
}

export function togglePlay() {
  if (!audio || state.tracks.length === 0) return
  if (state.isPlaying) {
    audio.pause()
    setState({ isPlaying: false })
  } else {
    if (!audio.src) loadTrack(state.activeTrackIndex)
    void audio.play().then(() => setState({ isPlaying: true })).catch(() => setState({ isPlaying: false }))
  }
}

export function nextTrack() {
  if (state.tracks.length === 0) return
  selectTrack((state.activeTrackIndex + 1) % state.tracks.length, state.isPlaying)
}

export function prevTrack() {
  if (state.tracks.length === 0) return
  selectTrack((state.activeTrackIndex - 1 + state.tracks.length) % state.tracks.length, state.isPlaying)
}

export function toggleLoop() {
  const loop = !state.loop
  setState({ loop })
  writeSettings({ loop })
}

export function setMusicVolume(v: number) {
  const volume = Math.max(0, Math.min(100, v))
  setState({ volume })
  if (audio) audio.volume = volume / 100
  writeSettings({ musicVolume: volume })
}
