interface Props {
  toggleNotesDrawer: () => void
  toggleTasksDrawer: () => void
  /** Tasks FAB is idle-only: hidden during a live session (Notes FAB stays). */
  showTasks?: boolean
}

/**
 * Floating action buttons: Notes bottom-left (glass), Tasks bottom-right
 * (primary) — plain round CTAs, no badges. Each drawer slides in from its
 * FAB's side. Hidden in Break and on completion screens (callers decide);
 * the Tasks FAB additionally disappears while a session is running/paused.
 */
export default function Fabs({ toggleNotesDrawer, toggleTasksDrawer, showTasks = true }: Props) {
  return (
    <>
      <button
        onClick={toggleNotesDrawer}
        className="fixed bottom-5 left-5 z-30 w-13 h-13 min-w-[52px] min-h-[52px] rounded-full glass-70 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="Open notes"
      >
        <span className="material-symbols-outlined text-primary text-2xl">edit_note</span>
      </button>

      {showTasks && (
        <button
          onClick={toggleTasksDrawer}
          className="fixed bottom-5 right-5 z-30 w-13 h-13 min-w-[52px] min-h-[52px] rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          aria-label="Open session plan"
        >
          <span className="material-symbols-outlined text-white text-2xl">checklist</span>
        </button>
      )}
    </>
  )
}
