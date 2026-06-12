import { useEffect, useState } from 'react'
import { getNowPlaying, spotifyPlay, spotifyPause, spotifyNext, spotifyPrevious, type NowPlaying } from '../spotify'

/**
 * Compact Spotify now-playing strip shown on the active-session screen when
 * connected (REQUIREMENTS_V3 §14). Renders nothing while idle/no playback.
 */
export default function SpotifyMiniPlayer() {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null)

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      const np = await getNowPlaying()
      if (!cancelled) setNowPlaying(np)
    }
    void refresh()
    const i = setInterval(() => void refresh(), 8000)
    return () => {
      cancelled = true
      clearInterval(i)
    }
  }, [])

  if (!nowPlaying) return null

  const control = async (fn: () => Promise<boolean>) => {
    await fn()
    setTimeout(() => void getNowPlaying().then(setNowPlaying), 350)
  }

  return (
    <div className="mt-5 flex items-center gap-3 glass-70 rounded-full pl-3 pr-2 py-2 shadow-sm max-w-xs w-full relative z-10">
      <span className="w-6 h-6 rounded-full bg-[#1DB954] flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-white" style={{ fontSize: 13 }}>graphic_eq</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-700 truncate leading-tight">{nowPlaying.trackName}</p>
        <p className="text-[10px] text-slate-500 truncate leading-tight">{nowPlaying.artistName}</p>
      </div>
      <div className="flex items-center shrink-0">
        <button onClick={() => void control(spotifyPrevious)} className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-800 flex items-center justify-center" aria-label="Previous track">
          <span className="material-symbols-outlined text-lg">skip_previous</span>
        </button>
        <button
          onClick={() => void control(nowPlaying.isPlaying ? spotifyPause : spotifyPlay)}
          className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-fixed transition-colors"
          aria-label={nowPlaying.isPlaying ? 'Pause' : 'Play'}
        >
          <span className="material-symbols-outlined text-lg">{nowPlaying.isPlaying ? 'pause' : 'play_arrow'}</span>
        </button>
        <button onClick={() => void control(spotifyNext)} className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-800 flex items-center justify-center" aria-label="Next track">
          <span className="material-symbols-outlined text-lg">skip_next</span>
        </button>
      </div>
    </div>
  )
}
