# PRD — Deep Focus Pomodoro (Frontend Only)

## 1. Product summary

Deep Focus Pomodoro is a frontend-only focus timer web app for desktop and mobile-responsive use. It supports two ways to start a session:

**Quick Start**
The user selects a preset duration or custom duration from Home and starts immediately.

**Planned Session**
The user creates a task list in the Session Plan drawer, assigning minutes to each task, then starts a session based on the total planned duration.

The app also supports **Quick Capture notes**, available from a Notes drawer in both idle and active states. Notes created before or during a session persist into that session and appear in the completion summary.

This product has no backend, accounts, sync, or server persistence. All persistence is local to the browser.

---

## 2. Goals

The implementation must:

* Match the provided designs closely, while allowing minor usability and responsive adaptations.
* Run locally as a web frontend.
* Support distinct UI states rather than a single long page.
* Provide a clear and reliable experience across modern Chromium, Safari, and Firefox browsers.
* Persist active session state across refreshes and browser close/reopen on the same device.
* Work responsively on mobile, even though only desktop designs are provided.

---

## 3. Non-goals

The following are out of scope:

* Backend services
* Authentication or user accounts
* Cloud sync across devices
* Push notifications or system notifications
* Advanced analytics
* Custom audio uploads
* Rich accessibility behaviors beyond solid semantic and keyboard-accessible basics

---

## 4. Supported platforms

### Web support

* Desktop web is the primary target.
* Mobile web must be supported with reasonable responsive adaptations.
* Tablet behavior may follow responsive web rules.

### Browser support

* Latest stable versions of Chromium-based browsers
* Safari
* Firefox

### Responsive guidance

Desktop should follow the mockups closely.
On smaller screens, the layout may adapt, including:

* Side rails becoming more compact controls
* Side panels becoming drawers or full-screen overlays
* Central content stacking vertically
* Reduced whitespace while preserving hierarchy

Minimum viewport width is implementation-defined, but the layout must remain usable on common mobile widths.

---

## 5. Core user flows

### Flow 1: Quick Start

1. User lands on Home.
2. Default duration is 20 minutes.
3. User selects 15m, 20m, 25m, or enters a custom duration.
4. User clicks **Start Session**.
5. Active Session begins using the selected Home duration.
6. If plan tasks exist, they are shown during the session as a checklist, but Home Start still uses the selected Home duration.
7. On completion, the user sees Flow Complete.

### Flow 2: Planned Session

1. User opens **Session Plan** from the left rail.
2. User adds one or more tasks with minute values.
3. User optionally reorders or deletes tasks.
4. User clicks **Start Focused Session**.
5. Drawer closes.
6. Active Session begins using the **sum of all task minutes**.
7. Task list is shown during the session.
8. On completion, the user sees Flow Complete.

### Flow 3: Quick Capture notes

1. User clicks the Notes rail.
2. Notes drawer opens.
3. User adds, edits, or deletes notes.
4. Notes persist into the current session and appear in Flow Complete.
5. Clicking outside the drawer closes it with a smooth transition.

---

## 6. Information architecture and navigation

The app is state-based, not page-scroll-based.

Primary states:

* Home
* Session Plan drawer open
* Notes drawer open
* Active Session
* Flow Complete modal

### Rails and drawers

* Left rail label: **Session Plan**
* Right rail label: **Notes**
* Both rails are visible in idle and active states.
* Rails open drawers/overlays; they do not navigate to separate pages.

### Overlay behavior

* Session Plan opens as an overlay drawer.
* Notes opens as an overlay drawer.
* Clicking outside an open drawer closes it.
* Open and close must be smoothly animated.
* Drawers are closed by default.

### Locked behavior during active session

* Session Plan is locked during an active session.
* Clicking the locked Session Plan control does nothing.
* Notes remains available during active session.

---

## 7. Screens and state definitions

## 7.1 Home (Idle)

### Purpose

Home is the default ready-to-start state.

### UI elements

* Brand: **Deep Focus Pomodoro**
* Large circular timer display
* Subtitle: **READY TO START?**
* Duration pills:

  * 15m
  * 20m
  * 25m
  * Custom duration pill triggered via plus interaction
* Primary CTA: **Start Session**
* Daily stats:

  * Focus time today
  * Sessions
* Left rail: Session Plan
* Right rail: Notes
* Sound toggle icon

### Default state

* Default selected duration: **20 minutes**
* Sound: **ON**
* Notes drawer: closed
* Session Plan drawer: closed

### Custom duration behavior

* Clicking the plus opens an input within the same pill element.
* No explicit upper limit is required.
* Input accepts whole numbers only.
* When custom duration is selected:

  * custom pill becomes selected
  * 15m, 20m, and 25m become unselected
* If the user selects a preset pill afterward, the custom value is discarded.

### Start Session behavior

* Starts an Active Session using the selected Home duration.
* If plan tasks exist, they are displayed during the session, but timer duration remains the Home-selected duration.
* If Session Plan drawer is open, it closes first, then the app returns to Home, then the session starts.

### Daily stats behavior

* Daily stats are always visible on Home, even when both values are zero.
* They appear only on Home.
* They update only after successfully completed sessions.
* They reset at local midnight.
* Sessions that complete after midnight are attributed to the day they started.

---

## 7.2 Session Plan drawer

### Purpose

Allows the user to build a structured task list for a planned session.

### UI elements

* Drawer title: **Session Plan**
* Task title input
* Time (minutes) input
* Button: **Add Task**
* Current breakdown list
* Bottom CTA: **Start Focused Session**

### Task item structure

Each task row includes:

* Drag handle
* Task title
* Minute pill
* Delete control

### Input rules

* Task title is required
* Minutes are required
* Minutes must be whole numbers
* Minutes cannot be zero
* No maximum per-task minute limit
* No maximum number of tasks
* Duplicate task titles are allowed

### Validation behavior

Implementation may choose the exact pattern, but it must be unambiguous and visible. Recommended:

* Disable Add Task until both fields are valid, or
* Show inline error states on invalid submission

### Add Task behavior

* Clicking **Add Task** appends the task to the breakdown list
* Inputs clear immediately after successful add
* Drawer remains open after adding
* Tasks persist if the drawer is closed or the page is refreshed
* Tasks remain available until a successful session completion followed by New Session

### Reordering

* Tasks can be reordered by drag-and-drop using the drag handle

### Deletion

* Clicking delete removes the task immediately

### Start Focused Session behavior

* Disabled until at least one valid task exists
* Starts an Active Session using the **sum of task minutes**
* Drawer closes before the session begins

---

## 7.3 Notes drawer

### Purpose

Allows the user to capture thoughts before or during a session.

### Availability

* Visible via rail in idle and active states
* Closed by default in all states
* Opens only when user clicks the Notes rail

### UI elements

* Drawer title
* Input field
* Add control
* Notes list

### Note behavior

* Empty notes are not allowed
* No maximum character limit
* Notes can be:

  * added
  * edited
  * deleted
* Notes appear in chronological order
* Clicking outside closes the drawer
* Escape key does not close the drawer
* Notes persist across refresh during an active session
* Notes created before session start carry into the session
* Notes are cleared only after a successful completion and the user starts a New Session

### Stop-session behavior for notes

If a session is stopped early:

* notes are preserved for the next session
* they are not cleared automatically

---

## 7.4 Active Session

### Purpose

Displays the running or paused session.

### Applicable session types

* Quick session
* Planned session

### UI elements

* Top status badge: **SESSION ACTIVE**
* Central circular timer
* Label: **FOCUS FLOW**
* Remaining time display
* Controls:

  * Pause / Resume
  * Reset
  * Stop
* Locked Session Plan rail
* Notes rail
* Optional task list, if plan tasks exist

### Timer behavior

#### Running

* Counts down every second

#### Paused

* Timer freezes completely
* Page/tab title continues showing the frozen remaining time

#### Resume

* Resume replaces Pause while paused
* Resumes countdown from current remaining time

#### Reset

* Returns the app to the initial ready-to-start state
* Timer selection returns to default: **20 minutes**
* If there were plan tasks, they remain available but all checkbox states reset
* Notes remain available
* Reset does not increment daily stats

#### Stop

* Shows a browser confirmation dialog
* If confirmed:

  * session ends immediately
  * app goes to Flow Complete
  * daily stats do not increase
  * plan tasks persist for next session
  * notes persist for next session
  * timer selection returns to default 20 minutes for the next idle state

#### Completion

* When timer reaches zero, session completes
* Completion triggers Flow Complete
* Daily stats are updated only on completion

### Task list behavior during active session

If plan tasks exist:

* show them in the active session view
* user can check and uncheck tasks at any time
* checkbox state has no effect on timer logic
* completed tasks appear struck through
* resetting the session clears all checked states but keeps the tasks

### Notes during active session

* Notes drawer remains available
* Notes drawer is closed by default
* User must click the Notes rail to open it

### Browser tab title

* Must reflect the remaining timer value during active and paused sessions

---

## 7.5 Flow Complete modal

### Purpose

Summarizes the just-finished session.

### Presentation

* Displayed as a centered modal
* Modal content is based on the just-finished session
* Minor celebratory visual treatment is allowed, but not required

### UI elements

* Heading: **Flow Complete**
* Session focus time for that completed session only
* Optional tasks accomplished section
* Optional session notes section
* Primary CTA: **New Session**

### Content rules

#### Session focus time

* Shows only the just-finished session duration
* Does not show the cumulative daily total

#### Tasks section

* Shown only if tasks exist
* Includes all tasks from the session
* Checked tasks appear first
* Unchecked tasks appear below
* Checked tasks show checked icon
* Unchecked tasks show unchecked state
* Longer lists may scroll

#### Session notes

* Shown only if notes exist
* Ordered chronologically

### New Session behavior

* Returns the user to Home
* Clears notes from the completed session
* Clears plan tasks from the completed session
* Resets Home to default 20-minute selection
* Preserves daily stats

### Stopped-session behavior

If Flow Complete is reached from Stop instead of true timer completion:

* stats do not increment
* tasks and notes remain available for next session
* Flow Complete still appears

---

## 8. Timer logic

## 8.1 Timer sources

There are two timer sources:

### Home Start

* Uses the selected Home duration:

  * 15m
  * 20m
  * 25m
  * custom whole-number duration
* If plan tasks exist, they are shown during the session as checklist items
* Plan task total does not override Home Start duration

### Session Plan Start

* Uses the sum of all task minute values
* This is always the duration for **Start Focused Session**

## 8.2 Completion rules

* A session is considered completed only when the timer naturally reaches zero
* Pause time does not count toward focus time
* Stopped sessions do not count toward daily stats
* Reset sessions do not count toward daily stats

## 8.3 Daily stats rules

* Focus time today increments only by completed session duration
* Sessions count increments only for completed sessions
* Partial sessions do not contribute
* Stats reset at the user's local midnight
* Sessions crossing midnight count toward the day they started

---

## 9. Audio requirements

## 9.1 Sound toggle

* Global sound setting for the whole app
* Default state: ON
* Speaker icon visually changes when muted
* No tooltip required

## 9.2 Required sounds

Sound plays for:

* primary CTA/button clicks
* session start
* pause
* reset
* stop
* timer completion

Sound does not play for:

* chip selection
* sidebar open/close

## 9.3 Completion sound

* Timer completion plays a ring sound approximately 4 seconds long

## 9.4 Browser restrictions

* It is acceptable for browser autoplay rules to require initial user interaction before sound works

---

## 10. Persistence

Persistence is browser-local only.

Recommended implementation: localStorage or equivalent client-side persistence.

### Must persist

* Active session state across refresh
* Active session state across tab close/reopen on the same device
* Remaining time
* Session type
* Session start-day attribution
* Sound setting
* Notes during active session
* Session Plan tasks before session starts
* Session Plan tasks after stop
* Checked/unchecked task state during active session
* Daily totals

### Must not persist after successful completion + New Session

* Session-specific notes
* Session plan tasks
* Task completion states

---

## 11. Data model

Suggested frontend state shape:

```ts
type AppMode = 'idle' | 'active' | 'complete';

type SessionSource = 'home' | 'plan';

type SessionStatus = 'running' | 'paused' | 'stopped' | 'completed' | null;

type TaskItem = {
  id: string;
  title: string;
  minutes: number;
  checked: boolean;
  order: number;
};

type NoteItem = {
  id: string;
  text: string;
  createdAt: string;
};

type ActiveSession = {
  source: SessionSource;
  status: SessionStatus;
  startedAt: string;
  attributedDay: string;
  initialSeconds: number;
  remainingSeconds: number;
};

type DailyStats = {
  dateKey: string;
  focusSeconds: number;
  sessionsCount: number;
};

type AppState = {
  selectedPreset: 15 | 20 | 25 | null;
  customMinutes: number | null;
  soundEnabled: boolean;
  tasks: TaskItem[];
  notes: NoteItem[];
  activeSession: ActiveSession | null;
  dailyStats: DailyStats;
};
```

This is guidance only. Exact structure may vary.

---

## 12. UX requirements

### General interaction

* All major controls must be keyboard accessible
* Use semantic HTML where reasonable
* Visible focus states are not a product priority, but keyboard operation must still work
* Basic semantic accessibility is sufficient

### Animation

* Session Plan drawer open/close must be smooth
* Notes drawer open/close must be smooth
* Drawers should not abruptly appear/disappear

### Fidelity

* Implement the visuals closely, not pixel-perfectly
* Small spacing/layout improvements are allowed
* Exact shadows, blur, glow, and gradient matching are not mandatory if the overall look and hierarchy remain faithful
* If HTML/CSS from design files is available, use that as the visual source of truth where useful

### Terminology

Use the following final copy:

* Product name: **Deep Focus Pomodoro**
* Left rail / drawer title: **Session Plan**
* Notes rail: **Notes**
* Idle subtitle: **READY TO START?**
* Active label: **FOCUS FLOW**
* Completion heading: **Flow Complete**
* Task terminology: **Task**, not Sub-task

---

## 13. Mobile adaptation guidance

Because no mobile designs are provided, implement a reasonable responsive adaptation:

* Central timer section stacks vertically with controls and task list
* Rails may reduce to icon buttons or compact edge controls
* Drawers may become full-screen side drawers or bottom sheets
* Touch targets must remain comfortable on smaller screens
* Core actions and state behavior must remain consistent with desktop

Desktop behavior remains the primary design reference.

---

## 14. Acceptance criteria

The implementation is complete when all of the following are true:

### App behavior

* App runs locally via npm scripts
* Home, Session Plan, Notes, Active Session, and Flow Complete are implemented as distinct states
* Session Plan opens from the left rail
* Notes opens from the right rail
* Clicking outside open drawers closes them smoothly
* Session Plan is locked during active session
* Notes remains available during active session

### Home

* Default duration is 20 minutes
* Preset durations work
* Custom duration works through the plus pill interaction
* Home Start uses selected Home duration
* Daily stats are visible even at zero

### Session Plan

* User can add valid tasks
* Invalid tasks cannot be added
* User can delete tasks
* User can drag to reorder tasks
* Start Focused Session is disabled unless at least one valid task exists
* Sidebar Start uses sum of task minutes

### Active Session

* Timer counts down every second
* Pause freezes timer
* Resume continues timer
* Reset returns to ready state with default 20 minutes
* Stop requires confirmation and goes to Flow Complete
* Browser tab title shows remaining time
* Task list appears when tasks exist
* Task checking has no effect on timer
* Completed tasks appear struck through

### Notes

* Notes drawer is closed by default
* Notes can be added, edited, and deleted
* Empty notes cannot be added
* Notes persist through refresh and active sessions
* Notes appear in Flow Complete in chronological order

### Completion

* Flow Complete is shown as centered modal
* Completed session duration is shown
* Tasks section is hidden when no tasks exist
* Notes section is hidden when no notes exist
* New Session returns to Home
* Successful completion increments daily stats
* Stop does not increment daily stats

### Persistence

* Active sessions restore after refresh
* Active sessions restore after tab close/reopen
* Daily stats persist locally
* Stopped-session tasks and notes persist into the next attempt
* Successfully completed session data is cleared on New Session

If you want, I can turn this into a cleaner **engineering-ready PRD format** with sections like assumptions, edge cases, and implementation notes for handoff.
