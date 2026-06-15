import type { Page } from '@playwright/test'
import { buildSeedData, expectedDashboard } from '../tests/fixtures/seedData'

// Fixed "now" shared by the fake clock and the seeded dataset so the dashboard's
// notion of "today" lines up with the seed (TEST_PLAN_V3 §6).
export const NOW = new Date('2026-06-15T12:00:00')

/** Install a controllable clock so wall-clock timers complete without real waits. */
export async function installClock(page: Page) {
  await page.clock.install({ time: NOW })
}

/** Seed the dashboard stores (history + completed tasks) before the app boots. */
export async function seedDashboard(page: Page) {
  const seed = buildSeedData(new Date(NOW))
  await page.addInitScript((data) => {
    localStorage.setItem('pomodoro-focus-history', JSON.stringify({ days: data.days }))
    localStorage.setItem('pomodoro-focus-completed-tasks', JSON.stringify(data.completed))
  }, { days: seed.days, completed: seed.completed })
}

export const seedExpectations = () => expectedDashboard(buildSeedData(new Date(NOW)))

/**
 * Jump the fake clock so a session that started at NOW reaches `elapsedSeconds`
 * of *unpaused* time, then fire one tick to settle completion. `pausedSeconds`
 * accounts for any time spent paused.
 */
export async function advanceTo(page: Page, elapsedSeconds: number, pausedSeconds = 0) {
  await page.clock.setSystemTime(new Date(NOW.getTime() + (elapsedSeconds + pausedSeconds + 2) * 1000))
  await page.clock.runFor(300)
}

/** Move a running session to exactly `elapsedSeconds` of elapsed time (no completion). */
export async function jumpTo(page: Page, elapsedSeconds: number) {
  await page.clock.setSystemTime(new Date(NOW.getTime() + elapsedSeconds * 1000))
  await page.clock.runFor(300)
}

/** Advance the fake clock by N seconds, firing timers along the way. */
export async function tickForward(page: Page, seconds: number) {
  await page.clock.runFor(seconds * 1000)
}
