import { test, expect } from '@playwright/test'
import { installClock, advanceTo, jumpTo, NOW } from './helpers'

// The 7 critical journeys (TEST_PLAN_V3 §4). Every spec runs under both the
// desktop (1440) and mobile (390) projects → journeys 1 & 2 (and the rest) are
// exercised at both viewports.

test.beforeEach(async ({ page }) => {
  await installClock(page)
  page.on('dialog', dialog => dialog.accept()) // accept Stop / Clear confirms
  await page.goto('/')
})

// Journey 1 — Work quick session: start → pause/resume → complete → New Session.
test('Journey 1: Work quick session completes and updates the dashboard', async ({ page }) => {
  await expect(page.getByText('25:00')).toBeVisible()
  await page.getByRole('button', { name: '25m' }).click()
  await page.getByRole('button', { name: 'Start Session' }).click()

  // Active session controls.
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible()
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.getByText('Paused')).toBeVisible()
  await page.getByRole('button', { name: 'Resume' }).click()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()

  // Let it run to completion.
  await advanceTo(page, 25 * 60)
  await expect(page.getByRole('heading', { name: 'Flow Complete' })).toBeVisible()
  await expect(page.getByText('Session Focus Time')).toBeVisible()
  await expect(page.getByText('25m', { exact: true })).toBeVisible()

  // Back to a fresh Home — the dashboard now reflects the session.
  await page.getByRole('button', { name: 'New Session' }).click()
  await expect(page.getByRole('button', { name: 'Start Session' })).toBeVisible()
  const dailyTile = page.locator('div.frosted-glass', { hasText: 'Daily Total' })
  await expect(dailyTile.locator('span.text-2xl')).toHaveText('25m')
})

// Journey 2 — Planned session: 3 tasks → start → check 2 → Stop → logged + preserved.
test('Journey 2: Planned session logs completed tasks and preserves the rest', async ({ page }) => {
  await page.getByLabel('Open session plan').click()
  const drawer = page.getByLabel('Session Plan')
  for (const [title, mins] of [['Alpha', '10'], ['Beta', '15'], ['Gamma', '5']] as const) {
    await drawer.getByPlaceholder('Enter task title').fill(title)
    await drawer.getByPlaceholder('00').fill(mins)
    await drawer.getByRole('button', { name: 'Add Task' }).click()
  }
  await expect(drawer.getByText('30m total')).toBeVisible()
  await drawer.getByRole('button', { name: 'Start Focused Session' }).click()

  // 30-minute session (sum). Check two tasks in the live checklist.
  await expect(page.getByText('30:00')).toBeVisible()
  await page.getByRole('button', { name: /Alpha/ }).click()
  await page.getByRole('button', { name: /Beta/ }).click()

  // 5 minutes in, then Stop.
  await jumpTo(page, 5 * 60)
  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(page.getByRole('heading', { name: 'Flow Complete' })).toBeVisible()
  await expect(page.getByText('5m', { exact: true })).toBeVisible() // elapsed, not 30m

  // New Session → checked tasks live in the completed log; Gamma is preserved.
  await page.getByRole('button', { name: 'New Session' }).click()
  await page.getByLabel('Open session plan').click()
  const d2 = page.getByLabel('Session Plan')
  await expect(d2.getByText('2 done')).toBeVisible()
  await expect(d2.getByText('Scheduled for 5 min')).toBeVisible() // Gamma still active
  await expect(d2.getByRole('button', { name: 'Start Focused Session' })).toBeEnabled()
})

// Journey 3 — Break: switch → start → end → Break Done → nothing recorded.
test('Journey 3: Break runs and records nothing', async ({ page }) => {
  await page.getByRole('button', { name: 'Break' }).click()
  await expect(page.getByText('05:00')).toBeVisible()
  await expect(page.getByText('Take a breather')).toBeVisible()
  await page.getByRole('button', { name: 'Start Break' }).click()

  await jumpTo(page, 2 * 60)
  await page.getByRole('button', { name: 'End Break' }).click()
  await expect(page.getByRole('heading', { name: 'Break Done' })).toBeVisible()
  await expect(page.getByText(/to recharge/)).toBeVisible()

  await page.getByRole('button', { name: 'Start Focus Session' }).click()
  // Back on Work Home → dashboard empty, nothing was recorded.
  await expect(page.getByText(/Complete your first session to start tracking/)).toBeVisible()
})

// Journey 4 — Count Up: enable in Settings → timer counts up → completes at target.
test('Journey 4: Count Up shows elapsed and still completes at the target', async ({ page }) => {
  await page.getByLabel('Settings').click()
  await page.getByRole('button', { name: 'Count Up' }).click()
  await page.getByRole('button', { name: 'Back to timer' }).click()

  await page.getByRole('button', { name: 'Start Session' }).click()
  await expect(page.getByText('00:00')).toBeVisible() // counts up from zero
  await jumpTo(page, 60)
  await expect(page.getByText('01:00')).toBeVisible() // 1 minute elapsed

  await advanceTo(page, 25 * 60)
  await expect(page.getByRole('heading', { name: 'Flow Complete' })).toBeVisible()
})

// Journey 5 — Notes: add / edit / delete → persist across reload.
test('Journey 5: Notes persist across a reload', async ({ page }) => {
  await page.getByLabel('Open notes').click()
  const notes = page.getByLabel('Notes', { exact: true })
  await notes.getByPlaceholder('Capture a thought…').fill('First note')
  await notes.getByRole('button', { name: 'Add Note' }).click()
  await notes.getByPlaceholder('Capture a thought…').fill('Second note')
  await notes.getByRole('button', { name: 'Add Note' }).click()

  // Edit the first note.
  await notes.getByLabel('Edit note').first().click()
  const editor = notes.getByDisplayValue(/note/).first()
  await editor.fill('Edited note')
  await editor.blur()
  await expect(notes.getByText('Edited note')).toBeVisible()

  // Delete one note.
  await notes.getByLabel('Delete note').last().click()

  // Reload — notes are persisted locally.
  await page.reload()
  await page.getByLabel('Open notes').click()
  await expect(page.getByLabel('Notes', { exact: true }).getByText('Edited note')).toBeVisible()
})

// Journey 6 — Settings/Data: sound + volume, Export JSON, Clear completed tasks.
test('Journey 6: Settings, export, and clearing completed tasks', async ({ page }) => {
  // Create a completed task so there is something to clear.
  await page.getByLabel('Open session plan').click()
  const drawer = page.getByLabel('Session Plan')
  await drawer.getByPlaceholder('Enter task title').fill('Log me')
  await drawer.getByPlaceholder('00').fill('20')
  await drawer.getByRole('button', { name: 'Add Task' }).click()
  await drawer.getByLabel('Mark Log me complete').click()
  await expect(drawer.getByText('1 done')).toBeVisible()
  await page.keyboard.press('Escape') // (no-op on the drawer) — close via the X
  await drawer.getByLabel('Close').click()

  // Header speaker toggles live.
  await page.getByLabel('Mute sound effects').click()
  await expect(page.getByLabel('Unmute sound effects')).toBeVisible()

  await page.getByLabel('Settings').click()
  // Volumes.
  await page.getByLabel('Sound volume').fill('30')
  await page.getByLabel('Music volume').fill('80')

  // Export downloads a JSON file.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^pomodoro-focus-export-\d{4}-\d{2}-\d{2}\.json$/)

  // Clear completed tasks (confirm auto-accepted).
  const row = page.locator('div', { hasText: /^Clear completed tasks/ }).first()
  await row.getByRole('button', { name: 'Clear' }).click()
  await page.getByRole('button', { name: 'Back to timer' }).click()
  await page.getByLabel('Open session plan').click()
  await expect(page.getByLabel('Session Plan').getByText('Tasks you check off will appear here.')).toBeVisible()
})

// touch NOW so the import is used even if a journey above is trimmed.
void NOW
