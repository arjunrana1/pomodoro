import { useState, useRef, useEffect } from 'react'
import type { NoteItem } from '../types'

interface Props {
  isOpen: boolean
  notes: NoteItem[]
  onClose: () => void
  addNote: (text: string) => void
  editNote: (id: string, text: string) => void
  deleteNote: (id: string) => void
}

export default function NotesDrawer({ isOpen, notes, onClose, addNote, editNote, deleteNote }: Props) {
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const drawerRef = useRef<HTMLDivElement>(null)

  const handleAdd = () => {
    const t = text.trim()
    if (t) {
      addNote(t)
      setText('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
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

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') {
      setEditingId(null)
      setEditText('')
    }
  }

  // Click outside to close (but not on Escape)
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay to avoid catching the opening click
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [isOpen, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/5 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        className={`fixed right-0 top-0 h-full z-50 w-80 bg-white/95 backdrop-blur-xl shadow-2xl border-l border-slate-100 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center justify-center bg-primary/10 rounded-2xl shrink-0" style={{width: 35, height: 35}}>
              <span className="material-symbols-outlined block leading-none text-primary" style={{fontSize: 19}}>edit_note</span>
            </div>
            <h2 className="text-base font-bold text-slate-800">Notes</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-slate-400 text-lg">close</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 italic px-5 mb-4">Capture thoughts to stay in flow</p>

        {/* Add note input */}
        <div className="relative px-5 mb-5">
          <input
            type="text"
            placeholder="Capture a thought..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 pr-10"
          />
          <button onClick={handleAdd} className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6">
            <span className="material-symbols-outlined text-primary/50 hover:text-primary text-xl leading-none transition-colors">add</span>
          </button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {notes.length > 0 && (
            <div className="space-y-1">
              {notes.map(note => (
                <div key={note.id} className="group flex items-center gap-2.5 py-2 pl-3 pr-1 rounded-lg hover:bg-slate-50 transition-colors">
                  {editingId === note.id ? (
                    <div className="flex-1 pl-4">
                      <input
                        type="text"
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        onBlur={saveEdit}
                        autoFocus
                        className="w-full bg-transparent text-sm text-slate-700 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                      <span className="flex-1 text-sm text-slate-600 leading-relaxed">{note.text}</span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => startEdit(note)} className="p-0.5 text-slate-300 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={() => deleteNote(note.id)} className="p-0.5 text-slate-300 hover:text-red-400 transition-colors">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
