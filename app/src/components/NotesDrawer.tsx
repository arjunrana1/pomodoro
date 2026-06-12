import { useState, useRef, useEffect } from 'react'
import type { AppStore } from '../store'
import type { NoteItem } from '../types'
import { formatNoteTimestamp } from '../utils'

interface Props {
  store: AppStore
}

/**
 * Notes drawer (DESIGN_V3 §3.8) — standalone notes with timestamps and
 * edit/delete. FAB toggles open↔closed; click-outside closes; Escape doesn't.
 */
export default function NotesDrawer({ store }: Props) {
  const { state, addNote, editNote, deleteNote, closeNotesDrawer } = store
  const isOpen = state.showNotesDrawer
  const notes = state.notes

  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const drawerRef = useRef<HTMLElement>(null)

  const handleAdd = () => {
    const t = text.trim()
    if (t) {
      addNote(t)
      setText('')
    }
  }

  const startEdit = (note: NoteItem) => {
    setEditingId(note.id)
    setEditText(note.text)
  }

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      editNote(editingId, editText.trim())
    }
    setEditingId(null)
    setEditText('')
  }

  // Click outside to close (Escape intentionally does not close — AC-19).
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        closeNotesDrawer()
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [isOpen, closeNotesDrawer])

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/10 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        ref={drawerRef}
        className={`fixed right-0 top-0 h-full z-50 w-full max-w-[360px] sm:w-80 bg-white/90 backdrop-blur-xl shadow-2xl border-l border-white/40 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Notes"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center justify-center bg-primary/10 rounded-2xl shrink-0" style={{ width: 35, height: 35 }}>
              <span className="material-symbols-outlined block leading-none text-primary" style={{ fontSize: 19 }}>edit_note</span>
            </div>
            <h2 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Sora, sans-serif' }}>Notes</h2>
          </div>
          <button onClick={closeNotesDrawer} className="p-2 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Close">
            <span className="material-symbols-outlined text-slate-400 text-lg">close</span>
          </button>
        </div>

        {/* Add note */}
        <div className="px-5 pb-4 shrink-0">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Add note</label>
          <textarea
            placeholder="Capture a thought…"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleAdd()
              }
            }}
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 mb-3 resize-none"
          />
          <button
            onClick={handleAdd}
            disabled={!text.trim()}
            className={`w-full font-bold py-2.5 min-h-[44px] rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
              text.trim()
                ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add Note
          </button>
        </div>

        {/* Saved notes */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Saved Notes</h3>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{notes.length}</span>
          </div>
          <div className="space-y-2.5">
            {notes.map(note => (
              <div key={note.id} className="group rounded-xl bg-white/80 border border-slate-100 px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-slate-400">{formatNoteTimestamp(note.createdAt)}</span>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(note)} className="p-1 text-slate-300 hover:text-primary transition-colors" aria-label="Edit note">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button onClick={() => deleteNote(note.id)} className="p-1 text-slate-300 hover:text-red-400 transition-colors" aria-label="Delete note">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
                {editingId === note.id ? (
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        saveEdit()
                      }
                      if (e.key === 'Escape') {
                        setEditingId(null)
                        setEditText('')
                      }
                    }}
                    onBlur={saveEdit}
                    autoFocus
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                ) : (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}
