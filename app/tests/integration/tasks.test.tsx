import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, fireEvent, cleanup, within, act } from '@testing-library/react'
import { renderApp, stubFetch } from './appHarness'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 5, 15, 9, 0, 0))
  stubFetch()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const openTasks = () => fireEvent.click(screen.getByLabelText('Open session plan'))
const drawer = () => screen.getByLabelText('Session Plan')
function addTask(title: string, minutes: string) {
  const d = within(drawer())
  fireEvent.change(d.getByPlaceholderText('Enter task title'), { target: { value: title } })
  fireEvent.change(d.getByPlaceholderText('00'), { target: { value: minutes } })
  fireEvent.click(d.getByRole('button', { name: /Add Task/ }))
}

// AC-13 — Tasks FAB only on Work idle Home; Notes FAB persists into active sessions.
describe('AC-13 Tasks FAB availability', () => {
  it('shows both FABs on idle Home, with no count badge on the Tasks FAB', async () => {
    await renderApp()
    const tasksFab = screen.getByLabelText('Open session plan')
    expect(tasksFab).toBeInTheDocument()
    expect(screen.getByLabelText('Open notes')).toBeInTheDocument()
    // Plain round CTA — no numeric badge.
    openTasks()
    addTask('A', '10'); addTask('B', '20')
    expect(screen.getByLabelText('Open session plan').textContent).not.toMatch(/\d/)
  })

  it('hides the Tasks FAB during an active session but keeps the Notes FAB', async () => {
    await renderApp()
    fireEvent.click(screen.getByRole('button', { name: /Start Session/ }))
    expect(screen.queryByLabelText('Open session plan')).toBeNull()
    expect(screen.getByLabelText('Open notes')).toBeInTheDocument()
  })

  it('shows no FABs on the completion screen', async () => {
    await renderApp()
    fireEvent.click(screen.getByRole('button', { name: /Start Session/ }))
    act(() => { vi.setSystemTime(new Date(2026, 5, 15, 9, 30, 0).getTime()); vi.advanceTimersByTime(250) })
    expect(screen.getByText('Flow Complete')).toBeInTheDocument()
    expect(screen.queryByLabelText('Open session plan')).toBeNull()
    expect(screen.queryByLabelText('Open notes')).toBeNull()
  })

  it('the Start Focused Session CTA is disabled with no valid task and enabled with one', async () => {
    await renderApp()
    openTasks()
    const cta = within(drawer()).getByRole('button', { name: /Start Focused Session/ })
    expect(cta).toBeDisabled()
    addTask('Plan it', '30')
    expect(within(drawer()).getByRole('button', { name: /Start Focused Session/ })).toBeEnabled()
  })
})

// AC-14 — add validation, reorder, delete, duplicates.
describe('AC-14 task CRUD + reorder', () => {
  it('validates before enabling Add Task', async () => {
    await renderApp()
    openTasks()
    const d = within(drawer())
    const add = () => d.getByRole('button', { name: /Add Task/ })
    expect(add()).toBeDisabled() // empty
    fireEvent.change(d.getByPlaceholderText('Enter task title'), { target: { value: 'Task' } })
    expect(add()).toBeDisabled() // no minutes
    fireEvent.change(d.getByPlaceholderText('00'), { target: { value: '0' } })
    expect(add()).toBeDisabled() // minutes must be ≥ 1
    fireEvent.change(d.getByPlaceholderText('00'), { target: { value: 'abc' } })
    expect(add()).toBeDisabled() // non-numeric
    fireEvent.change(d.getByPlaceholderText('00'), { target: { value: '25' } })
    expect(add()).toBeEnabled()
  })

  it('adds tasks (clearing inputs), allows duplicate titles, and deletes', async () => {
    await renderApp()
    openTasks()
    addTask('Write', '25')
    // inputs cleared after add
    expect((within(drawer()).getByPlaceholderText('Enter task title') as HTMLInputElement).value).toBe('')
    addTask('Write', '25') // duplicate allowed
    expect(within(drawer()).getAllByText('Write')).toHaveLength(2)

    // delete the first duplicate
    fireEvent.click(within(drawer()).getAllByLabelText('Delete Write')[0])
    expect(within(drawer()).getAllByText('Write')).toHaveLength(1)
  })

  it('reorders active tasks by drag and drop', async () => {
    await renderApp()
    openTasks()
    addTask('Alpha', '10'); addTask('Beta', '20'); addTask('Gamma', '30')

    const rows = () => within(drawer())
      .getAllByText(/Scheduled for/)
      .map(s => s.closest('[draggable]')!)
    const titlesOf = () => within(drawer()).getAllByText(/Scheduled for/).map(s => s.parentElement!.querySelector('span')!.textContent)

    expect(titlesOf()).toEqual(['Alpha', 'Beta', 'Gamma'])
    // drag Alpha (index 0) onto Gamma (index 2)
    const start = rows()[0]
    const target = rows()[2]
    fireEvent.dragStart(start)
    fireEvent.dragOver(target)
    fireEvent.drop(target)
    expect(titlesOf()).toEqual(['Beta', 'Gamma', 'Alpha'])
  })
})

// AC-15 / AC-16 — complete-on-check + clear-all-only with confirm.
describe('AC-15/16 completed log in the drawer', () => {
  it('checking a task moves it into Completed Tasks with its duration', async () => {
    await renderApp()
    openTasks()
    addTask('Ship it', '45')
    fireEvent.click(within(drawer()).getByLabelText('Mark Ship it complete'))

    // No longer in the active breakdown…
    expect(within(drawer()).queryByText(/Scheduled for 45 min/)).toBeNull()
    // …now in the Completed Tasks log with its duration (45 min → "45m").
    expect(within(drawer()).getByText('Ship it')).toBeInTheDocument()
    expect(within(drawer()).getByText('45m')).toBeInTheDocument()
    expect(within(drawer()).getByText(/1 done|done/)).toBeInTheDocument()
  })

  it('completed entries have no per-row edit/delete; only Clear-all (confirm)', async () => {
    await renderApp()
    openTasks()
    addTask('Done thing', '15')
    fireEvent.click(within(drawer()).getByLabelText('Mark Done thing complete'))

    // The only destructive control is the single clear-all.
    expect(within(drawer()).queryByLabelText('Delete Done thing')).toBeNull()
    const clearBtn = within(drawer()).getByRole('button', { name: /Clear Completed Tasks/ })

    // Cancel keeps the log…
    window.confirm = () => false
    fireEvent.click(clearBtn)
    expect(within(drawer()).getByText('Done thing')).toBeInTheDocument()
    // …confirm wipes it.
    window.confirm = () => true
    fireEvent.click(within(drawer()).getByRole('button', { name: /Clear Completed Tasks/ }))
    expect(within(drawer()).queryByText('Done thing')).toBeNull()
  })
})
