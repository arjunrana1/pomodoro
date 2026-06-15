import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, fireEvent, cleanup, within, act } from '@testing-library/react'
import { renderApp, stubFetch } from './appHarness'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 5, 15, 14, 5, 0))
  stubFetch()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const notesDrawer = () => screen.getByLabelText('Notes')
const openNotes = () => fireEvent.click(screen.getByLabelText('Open notes'))
function addNote(text: string) {
  const d = within(notesDrawer())
  fireEvent.change(d.getByPlaceholderText('Capture a thought…'), { target: { value: text } })
  fireEvent.click(d.getByRole('button', { name: /Add Note/ }))
}

// AC-18 — Notes FAB on idle Home + active Work; hidden in Break + on completion.
describe('AC-18 Notes availability', () => {
  it('is available on idle Home and during an active Work session', async () => {
    await renderApp()
    expect(screen.getByLabelText('Open notes')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Start Session/ }))
    expect(screen.getByLabelText('Open notes')).toBeInTheDocument() // still there while running
  })

  it('is hidden in Break mode', async () => {
    await renderApp()
    fireEvent.click(screen.getAllByRole('button', { name: /Break/ })[0])
    expect(screen.queryByLabelText('Open notes')).toBeNull()
  })

  it('is hidden on the completion screen', async () => {
    await renderApp()
    fireEvent.click(screen.getByRole('button', { name: /Start Session/ }))
    act(() => { vi.setSystemTime(new Date(2026, 5, 15, 14, 35, 0).getTime()); vi.advanceTimersByTime(250) })
    expect(screen.getByText('Flow Complete')).toBeInTheDocument()
    expect(screen.queryByLabelText('Open notes')).toBeNull()
  })
})

// AC-19 — add (non-empty) / edit / delete / timestamps / FAB toggle / click-outside / Esc no-op.
describe('AC-19 Notes CRUD + drawer behavior', () => {
  it('requires non-empty text to add, and stamps each note', async () => {
    await renderApp()
    openNotes()
    const d = within(notesDrawer())
    expect(d.getByRole('button', { name: /Add Note/ })).toBeDisabled() // empty
    addNote('Refactor the store')
    expect(d.getByText('Refactor the store')).toBeInTheDocument()
    expect(d.getByText(/Today ·/)).toBeInTheDocument() // per-note timestamp
    expect(d.getByText('1')).toBeInTheDocument()        // saved-notes count
  })

  it('edits and deletes a note', async () => {
    await renderApp()
    openNotes()
    addNote('original text')
    fireEvent.click(within(notesDrawer()).getByLabelText('Edit note'))
    const editor = screen.getByDisplayValue('original text')
    fireEvent.change(editor, { target: { value: 'edited text' } })
    fireEvent.blur(editor)
    expect(within(notesDrawer()).getByText('edited text')).toBeInTheDocument()

    fireEvent.click(within(notesDrawer()).getByLabelText('Delete note'))
    expect(within(notesDrawer()).queryByText('edited text')).toBeNull()
  })

  it('FAB toggles the drawer open and closed', async () => {
    await renderApp()
    expect(notesDrawer().className).toContain('-translate-x-full') // closed
    openNotes()
    expect(notesDrawer().className).toContain('translate-x-0')     // open
    openNotes() // toggle closed again
    expect(notesDrawer().className).toContain('-translate-x-full')
  })

  it('click-outside closes the drawer; Escape does NOT', async () => {
    await renderApp()
    openNotes()
    expect(notesDrawer().className).toContain('translate-x-0')

    // Escape is a no-op (AC-19).
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(notesDrawer().className).toContain('translate-x-0')

    // Click-outside closes (listener attaches after a 50 ms guard).
    act(() => { vi.advanceTimersByTime(60) })
    fireEvent.mouseDown(document.body)
    expect(notesDrawer().className).toContain('-translate-x-full')
  })
})
