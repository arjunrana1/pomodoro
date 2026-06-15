import { render, act } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../../src/App'

// Local twin of public/music/manifest.json so SettingsScreen's lofi list renders
// without hitting the network (TEST_PLAN_V3 §2 — no real network/audio).
export const MANIFEST = {
  tracks: [
    { id: '01-morning-coffee', title: 'Morning Coffee', artist: 'HoliznaCC0', duration: '3:11', src: '/music/01-morning-coffee.mp3', license: 'CC0 1.0', source: 'x' },
    { id: '02-vintage', title: 'Vintage', artist: 'HoliznaCC0', duration: '2:53', src: '/music/02-vintage.mp3', license: 'CC0 1.0', source: 'x' },
    { id: '03-a-little-shade', title: 'A Little Shade', artist: 'HoliznaCC0', duration: '2:58', src: '/music/03-a-little-shade.mp3', license: 'CC0 1.0', source: 'x' },
    { id: '04-seasons-change', title: 'Seasons Change', artist: 'HoliznaCC0', duration: '2:15', src: '/music/04-seasons-change.mp3', license: 'CC0 1.0', source: 'x' },
    { id: '05-busted-jazz', title: 'Busted Jazz', artist: 'HoliznaCC0', duration: '2:29', src: '/music/05-busted-jazz.mp3', license: 'CC0 1.0', source: 'x' },
    { id: '06-creature-comforts', title: 'Creature Comforts', artist: 'HoliznaCC0', duration: '2:54', src: '/music/06-creature-comforts.mp3', license: 'CC0 1.0', source: 'x' },
    { id: '07-foggy-headed', title: 'Foggy Headed', artist: 'HoliznaCC0', duration: '4:06', src: '/music/07-foggy-headed.mp3', license: 'CC0 1.0', source: 'x' },
    { id: '08-something-in-the-air', title: 'Something In the Air', artist: 'HoliznaCC0', duration: '2:11', src: '/music/08-something-in-the-air.mp3', license: 'CC0 1.0', source: 'x' },
  ],
}

/** Stub global fetch: serve the manifest, 404 everything else. */
export function stubFetch() {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('manifest.json')) return { ok: true, json: async () => MANIFEST } as Response
    return { ok: false, status: 404, json: async () => ({}) } as Response
  }))
}

/** Render <App/> and flush the boot effects (initMusic manifest fetch, etc.). */
export async function renderApp() {
  const utils = render(<App />)
  await act(async () => { for (let i = 0; i < 6; i++) await Promise.resolve() })
  return utils
}
