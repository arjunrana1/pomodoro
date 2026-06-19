import { vi, afterEach } from 'vitest'

/**
 * store.ts memoizes its boot state in a module-scope `bootState`, and music.ts /
 * audio.ts keep module singletons. Specs that need a *fresh boot* from a specific
 * localStorage snapshot (wall-clock restore, fresh-start purge, persist-across-
 * refresh) reset the whole module registry first.
 *
 * Critical: RTL and the app modules must be imported AFTER the reset so they bind
 * to the same fresh React instance (otherwise hooks throw "invalid hook call").
 */

type RTL = typeof import('@testing-library/react')
let current: RTL | null = null

afterEach(() => {
  current?.cleanup()
  current = null
})

/** Reset modules and return a fresh React Testing Library bound to fresh React. */
export async function freshRTL(): Promise<RTL> {
  vi.resetModules()
  current = await import('@testing-library/react')
  return current
}
