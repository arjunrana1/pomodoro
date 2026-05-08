import { useAppState } from './store'
import HomeScreen from './components/HomeScreen'
import SessionPlanSidebar from './components/SessionPlanSidebar'
import ActiveSession from './components/ActiveSession'
import FlowComplete from './components/FlowComplete'
import NotesDrawer from './components/NotesDrawer'

export default function App() {
  const {
    state,
    selectPreset,
    commitCustomMinutes,
    setCustomMinutesError,
    togglePlanSidebar,
    toggleNotesDrawer,
    closeNotesDrawer,
    toggleSound,
    addPlanItem,
    removePlanItem,
    reorderPlanItems,
    togglePlanItemCompleted,
    startSession,
    pauseSession,
    stopSession,
    addNote,
    editNote,
    deleteNote,
    newSession,
    playClick,
  } = useAppState()

  return (
    <div className="h-screen w-screen overflow-auto font-[Inter,sans-serif]">
      {state.status === 'idle' && (
        <HomeScreen
          state={state}
          selectPreset={selectPreset}
          commitCustomMinutes={commitCustomMinutes}
          setCustomMinutesError={setCustomMinutesError}
          startSession={startSession}
          togglePlanSidebar={togglePlanSidebar}
          toggleNotesDrawer={toggleNotesDrawer}
          toggleSound={toggleSound}
          playClick={playClick}
        />
      )}

      {(state.status === 'running' || state.status === 'paused') && (
        <ActiveSession
          state={state}
          pauseSession={pauseSession}
          stopSession={stopSession}
          toggleNotesDrawer={toggleNotesDrawer}
          toggleSound={toggleSound}
          togglePlanItemCompleted={togglePlanItemCompleted}
        />
      )}

      {state.status === 'complete' && (
        <FlowComplete state={state} newSession={newSession} playClick={playClick} />
      )}

      {/* Session Plan drawer - only in idle */}
      {state.status === 'idle' && (
        <SessionPlanSidebar
          isOpen={state.showPlanSidebar}
          planItems={state.planItems}
          addPlanItem={addPlanItem}
          removePlanItem={removePlanItem}
          reorderPlanItems={reorderPlanItems}
          startSession={startSession}
          onClose={togglePlanSidebar}
          playClick={playClick}
        />
      )}

      {/* Notes drawer - available in idle and active states */}
      {state.status !== 'complete' && (
        <NotesDrawer
          isOpen={state.showNotesDrawer}
          notes={state.notes}
          onClose={closeNotesDrawer}
          addNote={addNote}
          editNote={editNote}
          deleteNote={deleteNote}
        />
      )}
    </div>
  )
}
