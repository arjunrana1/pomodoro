import { beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

// We manage React Testing Library cleanup explicitly (some specs re-import RTL
// under vi.resetModules() to get a fresh store boot — see tests/fresh.ts).
process.env.RTL_SKIP_AUTO_CLEANUP = 'true'

// ── Audio layer mocks (TEST_PLAN_V3 §2 — no real audio) ─────────────────────
// audio.ts builds Web-Audio oscillators; record every played frequency so the
// sound specs (AC-22/AC-23) can assert intent without producing sound.
declare global {
  // eslint-disable-next-line no-var
  var __playedFreqs: number[]
}
globalThis.__playedFreqs = []

class FakeOscillator {
  type = 'sine'
  frequency = { setValueAtTime: (v: number) => { globalThis.__playedFreqs.push(v) } }
  connect() {}
  start() {}
  stop() {}
}
class FakeGain {
  gain = { setValueAtTime() {}, exponentialRampToValueAtTime() {} }
  connect() {}
}
class FakeAudioContext {
  currentTime = 0
  destination = {}
  createOscillator() { return new FakeOscillator() }
  createGain() { return new FakeGain() }
  close() { return Promise.resolve() }
}
;(globalThis as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext
;(globalThis as unknown as { webkitAudioContext: unknown }).webkitAudioContext = FakeAudioContext

// music.ts holds a module-scope <audio>; jsdom leaves these methods unimplemented.
if (typeof HTMLMediaElement !== 'undefined') {
  HTMLMediaElement.prototype.play = function () { return Promise.resolve() }
  HTMLMediaElement.prototype.pause = function () {}
  HTMLMediaElement.prototype.load = function () {}
}

// ── crypto.randomUUID (store uses it for task/note ids) ─────────────────────
if (!globalThis.crypto || typeof globalThis.crypto.randomUUID !== 'function') {
  let n = 0
  const uuid = () => `test-uuid-${Date.now().toString(36)}-${n++}`
  try {
    if (!globalThis.crypto) {
      Object.defineProperty(globalThis, 'crypto', { value: {}, configurable: true })
    }
    Object.defineProperty(globalThis.crypto, 'randomUUID', { value: uuid, configurable: true })
  } catch {
    /* environment already provides a usable crypto */
  }
}

// ── Web Storage ─────────────────────────────────────────────────────────────
// jsdom under Vitest 4 / Node 25 exposes a non-functional `localStorage` stub
// (no setItem/clear). persistence.ts is built entirely on Web Storage, so install
// a spec-compliant in-memory implementation on the jsdom global.
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() { return this.store.size }
  clear() { this.store.clear() }
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null }
  setItem(key: string, value: string) { this.store.set(key, String(value)) }
  removeItem(key: string) { this.store.delete(key) }
  key(i: number) { return Array.from(this.store.keys())[i] ?? null }
  [name: string]: unknown
}

function installStorage(name: 'localStorage' | 'sessionStorage') {
  const value = new MemoryStorage()
  for (const target of [globalThis, window] as object[]) {
    try {
      Object.defineProperty(target, name, { value, configurable: true, writable: true })
    } catch {
      ;(target as Record<string, unknown>)[name] = value
    }
  }
}
installStorage('localStorage')
installStorage('sessionStorage')

// ── Misc jsdom gaps used by persistence.exportAllData ───────────────────────
if (typeof URL.createObjectURL !== 'function') URL.createObjectURL = () => 'blob:mock'
if (typeof URL.revokeObjectURL !== 'function') URL.revokeObjectURL = () => {}

// confirm() defaults to "OK" so destructive flows proceed; specs that test the
// cancel path override window.confirm themselves.
window.confirm = () => true

beforeEach(() => {
  if (typeof localStorage?.clear === 'function') localStorage.clear()
  if (typeof sessionStorage?.clear === 'function') sessionStorage.clear()
  globalThis.__playedFreqs = []
  window.confirm = () => true
})
