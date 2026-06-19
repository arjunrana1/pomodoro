import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  connectSpotify, handleSpotifyCallback, getAccessToken,
  isSpotifyConnected, disconnectSpotify,
} from '../../src/spotify'
import { readSettings, writeSettings } from '../../src/persistence'

const VERIFIER_KEY = 'pomodoro-focus-spotify-verifier'

// Local reimplementation of spotify.ts's private base64url, to recompute the
// expected PKCE challenge from the (deterministic) verifier.
function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

let assignedHref = ''

beforeEach(() => {
  assignedHref = ''
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      origin: 'http://127.0.0.1:5173',
      get href() { return 'http://127.0.0.1:5173/' },
      set href(v: string) { assignedHref = v },
    },
  })
  // Deterministic random verifier bytes.
  vi.spyOn(crypto, 'getRandomValues').mockImplementation(<T extends ArrayBufferView | null>(arr: T): T => {
    const u8 = arr as unknown as Uint8Array
    for (let i = 0; i < u8.length; i++) u8[i] = i % 256
    return arr
  })
})

// AC-31 — PKCE: the authorize URL carries an S256 challenge derived from the
// verifier we persist; redirect URI + scopes are correct.
describe('AC-31 Spotify PKCE authorize flow', () => {
  it('builds an S256 authorize URL and stores the matching verifier', async () => {
    await connectSpotify()

    expect(assignedHref).toMatch(/^https:\/\/accounts\.spotify\.com\/authorize\?/)
    const url = new URL(assignedHref)
    const p = url.searchParams

    expect(p.get('client_id')).toBe('test_client_id_123')
    expect(p.get('response_type')).toBe('code')
    expect(p.get('redirect_uri')).toBe('http://127.0.0.1:5173/callback')
    expect(p.get('code_challenge_method')).toBe('S256')

    // Playback-control scopes (REQUIREMENTS §14).
    const scope = p.get('scope') ?? ''
    expect(scope).toContain('user-read-playback-state')
    expect(scope).toContain('user-modify-playback-state')
    expect(scope).toContain('user-read-currently-playing')

    // The challenge must equal base64url(SHA-256(verifier)) of the stored verifier.
    const verifier = sessionStorage.getItem(VERIFIER_KEY)!
    expect(verifier).toBeTruthy()
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
    expect(p.get('code_challenge')).toBe(base64url(digest))
    // base64url charset only (no +/=).
    expect(p.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]+$/)
  })
})

// AC-31 — callback exchanges the code for tokens and marks the session connected.
describe('AC-31 handleSpotifyCallback', () => {
  it('returns false when there is no stored verifier', async () => {
    const ok = await handleSpotifyCallback('any-code')
    expect(ok).toBe(false)
  })

  it('exchanges the code, persists tokens, and clears the verifier', async () => {
    sessionStorage.setItem(VERIFIER_KEY, 'verifier-xyz')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'AT1', refresh_token: 'RT1', expires_in: 3600 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const ok = await handleSpotifyCallback('auth-code')
    expect(ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith('https://accounts.spotify.com/api/token', expect.objectContaining({ method: 'POST' }))

    const s = readSettings()
    expect(s.spotifyConnected).toBe(true)
    expect(s.spotifyTokens?.accessToken).toBe('AT1')
    expect(s.spotifyTokens?.refreshToken).toBe('RT1')
    expect(sessionStorage.getItem(VERIFIER_KEY)).toBeNull()
    expect(isSpotifyConnected()).toBe(true)

    vi.unstubAllGlobals()
  })
})

// AC-31 — silent refresh keeps the connection alive across token expiry.
describe('AC-31 getAccessToken silent refresh', () => {
  it('returns null when disconnected (no network call)', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await getAccessToken()).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('returns the cached token when it is still valid (no refresh)', async () => {
    writeSettings({ spotifyConnected: true, spotifyTokens: { accessToken: 'valid', refreshToken: 'r', expiresAt: Date.now() + 10 * 60_000 } })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await getAccessToken()).toBe('valid')
    expect(fetchMock).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('silently refreshes an expired token and persists the new one', async () => {
    writeSettings({ spotifyConnected: true, spotifyTokens: { accessToken: 'old', refreshToken: 'refresh-1', expiresAt: Date.now() - 1000 } })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'fresh', expires_in: 3600 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    expect(await getAccessToken()).toBe('fresh')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const s = readSettings()
    expect(s.spotifyTokens?.accessToken).toBe('fresh')
    expect(s.spotifyTokens?.refreshToken).toBe('refresh-1') // reused when omitted
    vi.unstubAllGlobals()
  })

  it('disconnects and returns null when the refresh request fails', async () => {
    writeSettings({ spotifyConnected: true, spotifyTokens: { accessToken: 'old', refreshToken: 'bad', expiresAt: Date.now() - 1000 } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }))

    expect(await getAccessToken()).toBeNull()
    expect(readSettings().spotifyConnected).toBe(false)
    vi.unstubAllGlobals()
  })
})

describe('disconnectSpotify', () => {
  it('clears connection + tokens', () => {
    writeSettings({ spotifyConnected: true, spotifyTokens: { accessToken: 'a', refreshToken: 'b', expiresAt: Date.now() + 1000 } })
    disconnectSpotify()
    const s = readSettings()
    expect(s.spotifyConnected).toBe(false)
    expect(s.spotifyTokens).toBeUndefined()
    expect(isSpotifyConnected()).toBe(false)
  })
})
