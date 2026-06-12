import { useState, useRef } from 'react'
import type { AppStore } from '../store'
import { formatDuration, formatCompletedTimestamp } from '../utils'

interface Props {
  store: AppStore
}

/**
 * Session Plan drawer (DESIGN_V3 §3.7/§3.9): add/validate tasks, drag-reorder,
 * COMPLETED TASKS log with clear-all, Start Focused Session CTA. Opens from the
 * Tasks FAB in any Work state.
 */
export default function TasksDrawer({ store }: Props) {
  const { state, addTask, removeTask, reorderTasks, toggleTaskChecked, clearCompletedTasks, startSession, closeTasksDrawer, playClick } = store
  const isOpen = state.showTasksDrawer

  const [title, setTitle] = useState('')
  const [minutes, setMinutes] = useState('')
  const dragIndexRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const activeTasks = state.tasks.filter(t => !t.checked)
  const completed = state.completedTasks
  const totalMinutes = activeTasks.reduce((s, t) => s + t.minutes, 0)
  const isValid = title.trim().length > 0 && /^\d+$/.test(minutes.trim()) && parseInt(minutes, 10) >= 1
  const sessionRunning = state.status === 'running' || state.status === 'paused'

  const handleAdd = () => {
    if (!isValid) return
    addTask(title.trim(), parseInt(minutes, 10))
    setTitle('')
    setMinutes('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  const handleDrop = (index: number) => {
    if (dragIndexRef.current !== null && dragIndexRef.current !== index) {
      reorderTasks(dragIndexRef.current, index)
    }
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  const handleStart = () => {
    if (activeTasks.length === 0) return
    playClick()
    startSession('plan')
  }

  const handleClearCompleted = () => {
    if (window.confirm('Clear all completed tasks? This cannot be undone.')) {
      clearCompletedTasks()
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/10 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeTasksDrawer}
      />

      <aside
        className={`fixed left-0 top-0 h-full z-50 w-full max-w-[360px] sm:w-80 bg-white/90 backdrop-blur-xl shadow-2xl border-r border-white/40 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Session Plan"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center justify-center bg-primary/10 rounded-2xl shrink-0" style={{ width: 35, height: 35 }}>
              <span className="material-symbols-outlined block leading-none text-primary" style={{ fontSize: 19 }}>checklist</span>
            </div>
            <h2 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Sora, sans-serif' }}>Session Plan</h2>
          </div>
          <button onClick={closeTasksDrawer} className="p-2 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Close">
            <span className="material-symbols-outlined text-slate-400 text-lg">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Add task form */}
          <div className="px-5 pb-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Add task</label>
            <input
              type="text"
              placeholder="Enter task title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 mb-3"
            />
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Time (minutes)</label>
            <input
              type="number"
              placeholder="00"
              min="1"
              step="1"
              value={minutes}
              onChange={e => setMinutes(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 mb-4 font-mono"
            />
            <button
              onClick={handleAdd}
              disabled={!isValid}
              className={`w-full font-bold py-2.5 min-h-[44px] rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
                isValid
                  ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-base">add</span>
              Add Task
            </button>
          </div>

          {/* Current breakdown */}
          <div className="px-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Current Breakdown</h3>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{totalMinutes}m total</span>
            </div>
            {activeTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No tasks yet — add one above.</p>
            ) : (
              <div className="space-y-2">
                {activeTasks.map((task, index) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => { dragIndexRef.current = index }}
                    onDragOver={e => { e.preventDefault(); setDragOverIndex(index) }}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={() => { dragIndexRef.current = null; setDragOverIndex(null) }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-white border group transition-all ${
                      dragOverIndex === index ? 'border-primary/40 bg-primary/5' : 'border-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-slate-300 text-sm cursor-grab active:cursor-grabbing shrink-0 touch-none">drag_indicator</span>
                    <button
                      onClick={() => toggleTaskChecked(task.id)}
                      className="w-5 h-5 rounded-full border-[2.5px] border-primary/60 bg-white/70 shrink-0 hover:bg-primary/10 transition-colors"
                      aria-label={`Mark ${task.title} complete`}
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-medium text-slate-700 truncate">{task.title}</span>
                      <span className="text-[10px] text-slate-400 italic">Scheduled for {task.minutes} min</span>
                    </div>
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">{task.minutes}m</span>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="sm:opacity-0 sm:group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all shrink-0 p-1"
                      aria-label={`Delete ${task.title}`}
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed tasks log */}
          <div className="px-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Completed Tasks</h3>
              <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">{completed.length} done</span>
            </div>
            {completed.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Tasks you check off will appear here.</p>
            ) : (
              <>
                <div className="space-y-2 mb-3">
                  {completed.map(c => (
                    <div key={`${c.id}-${c.completedAt}`} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/70 border border-slate-100">
                      <span className="w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white leading-none" style={{ fontSize: 13 }}>check</span>
                      </span>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium text-slate-700 truncate">{c.title}</span>
                        <span className="text-[10px] text-slate-400">{formatCompletedTimestamp(c.completedAt)}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 font-mono shrink-0">{formatDuration(c.minutes * 60)}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleClearCompleted}
                  className="w-full font-bold py-2.5 min-h-[44px] rounded-xl border border-error/40 text-error hover:bg-error/5 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  Clear Completed Tasks
                </button>
              </>
            )}
          </div>
        </div>

        {/* Start CTA — hidden while a session is already running */}
        {!sessionRunning && (
          <div className="px-5 py-4 shrink-0 border-t border-slate-100">
            <button
              onClick={handleStart}
              disabled={activeTasks.length === 0}
              className={`w-full font-bold py-3 min-h-[48px] rounded-full transition-all flex items-center justify-center gap-2 text-sm ${
                activeTasks.length > 0
                  ? 'bg-primary text-white hover:bg-primary-fixed shadow-lg shadow-primary/25'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              Start Focused Session
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
