import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import SpotifyPanel from '../../src/components/SpotifyPanel'
import SpotifyMiniPlayer from '../../src/components/SpotifyMiniPlayer'

// Mock the Spotify API layer (TEST_PLAN_V3 §2 — no live account). vi.hoisted keeps
// the mock object available to the hoisted vi.mock factory.
const mockApi = vi.hoisted(() => ({
  connectSpotify: vi.fn(),
  disconnectSpotify: vi.fn(),
  getNowPlaying: vi.fn(),
  isPremiumAccount: vi.fn(),
  spotifyPlay: vi.fn(),
  spotifyPause: vi.fn(),
  spotifyNext: vi.fn(),
  spotifyPrevious: vi.fn(),
}))
vi.mock('../../src/spotify', () => mockApi)

beforeEach(() => {
  // restoreMocks resets implementations between tests — re-establish them here.
  mockApi.getNowPlaying.mockResolvedValue({ trackName: 'Lo-Fi Beats', artistName: 'Chillhop', albumArtUrl: null, isPlaying: true })
  mockApi.isPremiumAccount.mockResolvedValue(false)
  mockApi.spotifyPlay.mockResolvedValue(true)
  mockApi.spotifyPause.mockResolvedValue(true)
  mockApi.spotifyNext.mockResolvedValue(true)
  mockApi.spotifyPrevious.mockResolvedValue(true)
})
afterEach(() => cleanup())

// AC-31 — Spotify panel UI: disconnected vs connected states.
describe('AC-31 Spotify panel UI', () => {
  it('disconnected → shows Connect + the Premium note', () => {
    render(<SpotifyPanel connected={false} onConnectionChange={() => {}} />)
    expect(screen.getByText('Spotify Connect')).toBeInTheDocument()
    expect(screen.getByText('Not connected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Connect Spotify/ })).toBeInTheDocument()
    expect(screen.getByText(/Playback control requires Spotify Premium/)).toBeInTheDocument()
  })

  it('clicking Connect kicks off the PKCE flow', () => {
    render(<SpotifyPanel connected={false} onConnectionChange={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /Connect Spotify/ }))
    expect(mockApi.connectSpotify).toHaveBeenCalled()
  })

  it('connected → shows now-playing, transport, Disconnect, and the Premium note', async () => {
    render(<SpotifyPanel connected onConnectionChange={() => {}} />)

    await waitFor(() => expect(screen.getByText('Lo-Fi Beats')).toBeInTheDocument())
    expect(screen.getByText('Chillhop')).toBeInTheDocument()
    expect(screen.getByText('Connected')).toBeInTheDocument()

    expect(screen.getByLabelText('Previous track')).toBeInTheDocument()
    expect(screen.getByLabelText('Next track')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument() // isPlaying → Pause

    await waitFor(() => expect(screen.getByText(/this account is not Premium/)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Disconnect/ })).toBeInTheDocument()
  })

  it('Disconnect clears the token and notifies the parent', async () => {
    const onChange = vi.fn()
    render(<SpotifyPanel connected onConnectionChange={onChange} />)
    await waitFor(() => expect(screen.getByText('Lo-Fi Beats')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Disconnect/ }))
    expect(mockApi.disconnectSpotify).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalled()
  })
})

// AC-31 — the active-session mini-player.
describe('AC-31 Spotify mini-player', () => {
  it('renders nothing when there is no playback', async () => {
    mockApi.getNowPlaying.mockResolvedValue(null)
    const { container } = render(<SpotifyMiniPlayer />)
    await waitFor(() => expect(container).toBeEmptyDOMElement())
    expect(screen.queryByLabelText('Next track')).toBeNull()
  })

  it('shows the current track + transport when playing', async () => {
    render(<SpotifyMiniPlayer />)
    await waitFor(() => expect(screen.getByText('Lo-Fi Beats')).toBeInTheDocument())
    expect(screen.getByText('Chillhop')).toBeInTheDocument()
    expect(screen.getByLabelText('Previous track')).toBeInTheDocument()
    expect(screen.getByLabelText('Next track')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
  })
})
