import { useEffect, useState } from 'react'
import { useAppState } from './store'
import { initMusic } from './music'
import { handleSpotifyCallback } from './spotify'
import HomeScreen from './components/HomeScreen'
import ActiveSession from './components/ActiveSession'
import FlowComplete from './components/FlowComplete'
import BreakDone from './components/BreakDone'
import SettingsScreen from './components/SettingsScreen'
import TasksDrawer from './components/TasksDrawer'
import NotesDrawer from './components/NotesDrawer'

let musicInitialized = false

export default function App() {
  const store = useAppState()
  const { state, refreshSettings } = store

  const [screen, setScreen] = useState<'home' | 'settings'>('home')
  const [connectingSpotify, setConnectingSpotify] = useState(
    () => window.location.pathname === '/callback'
  )

  // Lofi player boots once at app start (module singleton survives re-renders).
  useEffect(() => {
    if (!musicInitialized) {
      musicInitialized = true
      void initMusic()
    }
  }, [])

  // Spotify PKCE redirect lands on /callback — finish the token exchange,
  // clean the URL, and drop the user back in Settings.
  useEffect(() => {
    if (window.location.pathname !== '/callback') return
    const code = new URLSearchParams(window.location.search).get('code')
    const finish = () => {
      window.history.replaceState(null, '', '/')
      refreshSettings()
      setScreen('settings')
      setConnectingSpotify(false)
    }
    if (!code) {
      finish()
      return
    }
    void handleSpotifyCallback(code).then(finish)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (connectingSpotify) {
    return (
      <div className="h-screen w-screen ethereal-bg flex items-center justify-center">
        <div className="frosted-glass rounded-2xl px-8 py-6 text-center">
          <p className="text-sm font-bold text-slate-700">Connecting Spotify…</p>
        </div>
      </div>
    )
  }

  const isWork = state.sessionMode === 'work'
  const openSettings = () => setScreen('settings')
  const closeSettings = () => setScreen('home')

  // Notes/Tasks drawers exist in all Work states except completion screens
  // (AC-13/AC-18); both are hidden entirely in Break mode.
  const drawersAvailable =
    state.mode === 'work' && state.status !== 'complete' && screen === 'home'

  return (
    <div className="h-screen w-screen overflow-auto font-[Inter,sans-serif]">
      {screen === 'settings' ? (
        <SettingsScreen store={store} closeSettings={closeSettings} />
      ) : (
        <>
          {state.status === 'idle' && <HomeScreen store={store} openSettings={openSettings} />}

          {(state.status === 'running' || state.status === 'paused') && (
            <ActiveSession store={store} openSettings={openSettings} />
          )}

          {state.status === 'complete' &&
            (isWork ? <FlowComplete store={store} /> : <BreakDone store={store} openSettings={openSettings} />)}
        </>
      )}

      {drawersAvailable && (
        <>
          <TasksDrawer store={store} />
          <NotesDrawer store={store} />
        </>
      )}
    </div>
  )
}
