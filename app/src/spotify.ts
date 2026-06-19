import type { SpotifyTokens } from './types'
import { readSettings, writeSettings } from './persistence'

/**
 * Spotify Connect — Authorization Code with PKCE (frontend-only, no secret).
 * REQUIREMENTS_V3 §14. Tokens persist in the settings localStorage key and are
 * silently refreshed on expiry so the connection survives refresh/reopen.
 */

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string
const SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing user-read-private'
const VERIFIER_KEY = 'pomodoro-focus-spotify-verifier'

function redirectUri(): string {
  return `${window.location.origin}/callback`
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function sha256(plain: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain))
  return new Uint8Array(digest)
}

/** Kick off the PKCE flow — generates a verifier and redirects to Spotify. */
export async function connectSpotify() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(64)))
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  const challenge = base64url(await sha256(verifier))
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri(),
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })
  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
}

/** Complete the token exchange on the /callback route. Returns true on success. */
export async function handleSpotifyCallback(code: string): Promise<boolean> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  if (!verifier) return false
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri(),
        code_verifier: verifier,
      }),
    })
    if (!res.ok) return false
    const data = await res.json()
    saveTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    })
    sessionStorage.removeItem(VERIFIER_KEY)
    return true
  } catch {
    return false
  }
}

function saveTokens(tokens: SpotifyTokens) {
  writeSettings({ spotifyConnected: true, spotifyTokens: tokens })
}

export function disconnectSpotify() {
  writeSettings({ spotifyConnected: false, spotifyTokens: undefined })
}

export function isSpotifyConnected(): boolean {
  const s = readSettings()
  return s.spotifyConnected && !!s.spotifyTokens
}

/** Returns a valid access token, silently refreshing if expired. Null if disconnected. */
export async function getAccessToken(): Promise<string | null> {
  const s = readSettings()
  const tokens = s.spotifyTokens
  if (!s.spotifyConnected || !tokens) return null
  if (Date.now() < tokens.expiresAt - 60_000) return tokens.accessToken
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
      }),
    })
    if (!res.ok) {
      disconnectSpotify()
      return null
    }
    const data = await res.json()
    const next: SpotifyTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? tokens.refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    }
    saveTokens(next)
    return next.accessToken
  } catch {
    return null
  }
}

async function spotifyFetch(path: string, init?: RequestInit): Promise<Response | null> {
  const token = await getAccessToken()
  if (!token) return null
  return fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}` },
  })
}

export interface NowPlaying {
  trackName: string
  artistName: string
  albumArtUrl: string | null
  isPlaying: boolean
}

/** Current playback state, or null when nothing is playing / not connected. */
export async function getNowPlaying(): Promise<NowPlaying | null> {
  const res = await spotifyFetch('/me/player')
  if (!res || res.status === 204 || !res.ok) return null
  try {
    const data = await res.json()
    const item = data?.item
    if (!item) return null
    return {
      trackName: item.name,
      artistName: (item.artists || []).map((a: { name: string }) => a.name).join(', '),
      albumArtUrl: item.album?.images?.[2]?.url ?? item.album?.images?.[0]?.url ?? null,
      isPlaying: !!data.is_playing,
    }
  } catch {
    return null
  }
}

/** True if the account is Premium (playback control requires it). */
export async function isPremiumAccount(): Promise<boolean | null> {
  const res = await spotifyFetch('/me')
  if (!res || !res.ok) return null
  try {
    const data = await res.json()
    return data?.product === 'premium'
  } catch {
    return null
  }
}

/** Control endpoints return 403 for non-Premium; callers surface the Premium note. */
export async function spotifyPlay(): Promise<boolean> {
  const res = await spotifyFetch('/me/player/play', { method: 'PUT' })
  return !!res && res.ok
}

export async function spotifyPause(): Promise<boolean> {
  const res = await spotifyFetch('/me/player/pause', { method: 'PUT' })
  return !!res && res.ok
}

export async function spotifyNext(): Promise<boolean> {
  const res = await spotifyFetch('/me/player/next', { method: 'POST' })
  return !!res && res.ok
}

export async function spotifyPrevious(): Promise<boolean> {
  const res = await spotifyFetch('/me/player/previous', { method: 'POST' })
  return !!res && res.ok
}
