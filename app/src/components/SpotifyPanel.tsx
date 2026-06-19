import { useEffect, useState, useCallback } from 'react'
import {
  connectSpotify,
  disconnectSpotify,
  getNowPlaying,
  isPremiumAccount,
  spotifyPlay,
  spotifyPause,
  spotifyNext,
  spotifyPrevious,
  type NowPlaying,
} from '../spotify'

interface Props {
  connected: boolean
  /** Called after connect/disconnect so the store re-reads settings. */
  onConnectionChange: () => void
}

/** Spotify Connect panel inside Settings (DESIGN_V3 §3.11/§3.12). */
export default function SpotifyPanel({ connected, onConnectionChange }: Props) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null)
  const [premium, setPremium] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (!connected) return
    setNowPlaying(await getNowPlaying())
  }, [connected])

  useEffect(() => {
    if (!connected) return
    const t = setTimeout(() => {
      void refresh()
      void isPremiumAccount().then(setPremium)
    }, 0)
    const i = setInterval(() => void refresh(), 5000)
    return () => {
      clearTimeout(t)
      clearInterval(i)
    }
  }, [connected, refresh])

  const control = async (fn: () => Promise<boolean>) => {
    setBusy(true)
    await fn()
    setTimeout(() => void refresh().finally(() => setBusy(false)), 350)
  }

  const handleDisconnect = () => {
    disconnectSpotify()
    setNowPlaying(null)
    onConnectionChange()
  }

  if (!connected) {
    return (
      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-2">Spotify · Not connected</p>
        <div className="rounded-2xl bg-white/70 border border-slate-100 p-5 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <SpotifyMark />
            <span className="font-bold text-slate-800">Spotify Connect</span>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">Not connected</span>
          </div>
          <p className="text-sm text-slate-500 my-3">
            Connect your Spotify account to control playback right from Settings.
          </p>
          <button
            onClick={() => void connectSpotify()}
            className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] rounded-full bg-[#1DB954] hover:bg-[#1aa64b] text-white text-sm font-bold transition-colors shadow-md shadow-[#1DB954]/25"
          >
            <span className="material-symbols-outlined text-base">link</span>
            Connect Spotify
          </button>
          <p className="text-xs text-slate-400 mt-3 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>info</span>
            Playback control requires Spotify Premium.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="rounded-2xl bg-white/70 border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <SpotifyMark />
            <span className="font-bold text-slate-800">Spotify Connect</span>
          </div>
          <span className="text-[10px] font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
            Connected
          </span>
        </div>

        {nowPlaying ? (
          <div className="flex items-center gap-3 mb-4">
            {nowPlaying.albumArtUrl ? (
              <img src={nowPlaying.albumArtUrl} alt="" className="w-12 h-12 rounded-lg object-cover shadow-sm" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/60 to-pink-400/60" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 truncate">{nowPlaying.trackName}</p>
              <p className="text-xs text-slate-500 truncate">{nowPlaying.artistName}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <TransportButton icon="skip_previous" onClick={() => void control(spotifyPrevious)} disabled={busy} />
              <button
                onClick={() => void control(nowPlaying.isPlaying ? spotifyPause : spotifyPlay)}
                disabled={busy}
                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-fixed transition-colors disabled:opacity-50"
                aria-label={nowPlaying.isPlaying ? 'Pause' : 'Play'}
              >
                <span className="material-symbols-outlined text-xl">{nowPlaying.isPlaying ? 'pause' : 'play_arrow'}</span>
              </button>
              <TransportButton icon="skip_next" onClick={() => void control(spotifyNext)} disabled={busy} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 mb-4">
            Nothing playing right now — start playback in any Spotify app and control it here.
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>info</span>
            {premium === false
              ? 'Playback control requires Spotify Premium — this account is not Premium.'
              : 'Playback control requires Spotify Premium.'}
          </p>
          <button
            onClick={handleDisconnect}
            className="text-xs font-bold text-error border border-error/40 hover:bg-error/5 px-4 py-2 rounded-full transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  )
}

function TransportButton({ icon, onClick, disabled }: { icon: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-9 h-9 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors disabled:opacity-50"
      aria-label={icon === 'skip_previous' ? 'Previous track' : 'Next track'}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
    </button>
  )
}

function SpotifyMark() {
  return (
    <span className="w-7 h-7 rounded-full bg-[#1DB954] flex items-center justify-center shrink-0">
      <span className="material-symbols-outlined text-white" style={{ fontSize: 16 }}>graphic_eq</span>
    </span>
  )
}
