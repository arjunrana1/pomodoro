import { useState, useRef } from 'react'
import type { PlanItem } from '../types'

interface Props {
  isOpen: boolean
  planItems: PlanItem[]
  addPlanItem: (title: string, minutes: number) => void
  removePlanItem: (id: string) => void
  reorderPlanItems: (fromIndex: number, toIndex: number) => void
  startSession: (source: 'home' | 'plan') => void
  onClose: () => void
  playClick: () => void
}

export default function SessionPlanSidebar({
  isOpen,
  planItems,
  addPlanItem,
  removePlanItem,
  reorderPlanItems,
  startSession,
  onClose,
  playClick,
}: Props) {
  const [title, setTitle] = useState('')
  const [minutes, setMinutes] = useState('')
  const dragIndexRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const isValid = title.trim().length > 0 && parseInt(minutes) > 0

  const handleAdd = () => {
    const t = title.trim()
    const m = parseInt(minutes)
    if (t && m > 0) {
      addPlanItem(t, m)
      setTitle('')
      setMinutes('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (index: number) => {
    if (dragIndexRef.current !== null && dragIndexRef.current !== index) {
      reorderPlanItems(dragIndexRef.current, index)
    }
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  const totalMinutes = planItems.reduce((s, i) => s + i.minutes, 0)

  const handleStart = () => {
    playClick()
    startSession('plan')
  }

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/5 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed left-0 top-0 h-full z-50 w-80 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-slate-100 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center justify-center bg-primary/10 rounded-2xl shrink-0" style={{width: 35, height: 35}}>
              <span className="material-symbols-outlined block leading-none text-primary" style={{fontSize: 19}}>assignment_turned_in</span>
            </div>
            <h2 className="text-base font-bold text-slate-800">Session Plan</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-slate-400 text-lg">close</span>
          </button>
        </div>

        {/* Add task form */}
        <div className="px-5 pb-4">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Add task</label>
          <input
            type="text"
            placeholder="Enter task title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 mb-3"
          />
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Time (minutes)</label>
          <div className="mb-4">
            <input
              type="number"
              placeholder="00"
              min="1"
              value={minutes}
              onChange={e => setMinutes(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!isValid}
            className={`w-full font-bold py-2.5 rounded-full transition-all flex items-center justify-center gap-2 text-sm ${
              isValid
                ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add Task
          </button>
        </div>

        {/* Task list */}
        {planItems.length > 0 && (
          <div className="flex-1 px-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Current Breakdown</h3>
              <span className="text-[9px] font-bold text-primary">{totalMinutes}m total</span>
            </div>
            <div className="space-y-2">
              {planItems.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white border group transition-all ${
                    dragOverIndex === index ? 'border-primary/40 bg-primary/5' : 'border-slate-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-slate-300 text-sm cursor-grab active:cursor-grabbing shrink-0">drag_indicator</span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-slate-700 truncate">{item.title}</span>
                    <span className="text-[10px] text-slate-400 italic">
                      {item.minutes > 1 ? `Scheduled for ${item.minutes} min` : 'Scheduled for 1 min'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">{item.minutes}m</span>
                  <button
                    onClick={() => removePlanItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start button */}
        <div className="px-5 py-4 mt-auto">
          <button
            onClick={handleStart}
            disabled={planItems.length === 0}
            className={`w-full font-bold py-3 rounded-full transition-all flex items-center justify-center gap-2 text-sm ${
              planItems.length > 0
                ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-base">play_arrow</span>
            Start Focused Session
          </button>
        </div>
      </aside>
    </>
  )
}
