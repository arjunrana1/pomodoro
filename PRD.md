# PRD — Pomodoro Focus (Frontend Only)

## 1. Product summary

Pomodoro Focus is a frontend-only focus timer web app for desktop and mobile-responsive use. It supports two ways to start a session:

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
* Analytics or telemetry beyond the local Focus History dashboard described in section 7.6
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

* Home (idle, includes Focus History dashboard below the fold)
* Session Plan drawer open
* Notes drawer open
* Active Session
* Flow Complete modal

### Rails and drawers

* Left rail label: **Session Plan** (the vertical rail label must read "Session Plan" in full, not an abbreviated "Plan")
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
* The locked rail must continue to display its normal label (**Session Plan**), with a lock icon indicating the locked state. It must not be relabeled to "Locked" or any other generic string.
* Clicking the locked Session Plan control does nothing.
* Notes remains available during active session.

---

## 7. Screens and state definitions

## 7.1 Home (Idle)

### Purpose

Home is the default ready-to-start state.

### UI elements

* Brand: **Pomodoro Focus**
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

#### Custom duration validation

* Valid input: a whole positive integer (>= 1).
* Invalid input includes: empty value, zero, negative numbers, decimals, non-numeric characters, or values that overflow the input.
* When the user enters an invalid value and tabs away, presses Enter, or otherwise tries to commit:

  * the input must remain open (must not silently close or revert)
  * the pill must show a visible error state (e.g., red border, error message, or both)
  * the error must clearly indicate why the input is invalid
  * **Start Session** must be disabled while the custom value is invalid
* The error state clears when the user enters a valid value.

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

### Below-the-fold content on Home

The idle Home screen extends below the visible fold. Scrolling down on Home reveals, in order:

1. The **Focus History dashboard** (see section 7.6)
2. The **Marketing footer** (see section 7.7)

These below-the-fold sections are visible only on Home and are hidden in Active Session and Flow Complete.

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
* Clicking the Notes rail button while the drawer is open must close the drawer (toggle behavior). The rail button is a toggle: open → close, close → open, with no intermediate broken states.
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

#### Restoration after refresh, tab close, or sleep

The timer must be wall-clock-driven, not tick-count-driven, so that real elapsed time is reflected when the tab/browser is closed and reopened.

* On every state persistence, the app must persist the absolute timestamps required to reconstruct timer state (e.g., `startedAt`, `initialSeconds`, accumulated paused time, paused-at timestamp).
* On reload, the remaining time for a **running** session must be recomputed against `Date.now()` and the persisted timestamps. The timer must not simply resume from the last persisted `remainingSeconds` value (which would freeze the timer for the duration the tab was closed).
* Example: A 20-minute session is started, the user closes the tab after 5 minutes (15:00 remaining persisted), and reopens 10 minutes later. On reopen, the timer must show approximately 5:00 remaining, not 15:00. If the recomputed remaining time is `<= 0`, the session must transition directly to Flow Complete on reopen, with stats incremented as if it completed normally.
* For a **paused** session, the persisted remaining time is preserved literally on reload (paused time does not advance the wall clock).

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
* For naturally completed sessions, this equals the initial duration (e.g., a 20-minute session shows `20:00`)
* For stopped (partial) sessions, this must show the **elapsed focused time** when Stop was confirmed, not the initial duration. A 20-minute session stopped after 4 minutes must show `04:00` (or equivalent), not `20:00`. Pause time is excluded from elapsed time, consistent with focus-time accounting.

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
* Resets Home to default 20-minute selection
* Preserves daily stats

#### Task and notes persistence on New Session

The behavior of tasks and notes on **New Session** depends on how the previous session ended:

**If the previous session completed successfully:**

* Notes from the completed session are cleared
* Checked (completed) tasks are cleared
* Unchecked (uncompleted) tasks are preserved and remain available in the Session Plan for the next session
* Preserved tasks retain their original minute values
* Preserved tasks reset to unchecked state (which they already were)

**If the previous session was stopped early:**

* Notes are preserved for the next session
* Checked (completed) tasks are dropped
* Unchecked tasks are preserved and remain available in the Session Plan
* Preserved tasks retain their original minute values

### Stopped-session behavior

If Flow Complete is reached from Stop instead of true timer completion:

* stats do not increment
* Flow Complete still appears
* Flow Complete must show the **elapsed time** of the partial session, not the original initial duration (see "Flow Complete focus time display" below)
* tasks and notes follow the persistence rules described under "Task and notes persistence on New Session"

---

## 7.6 Focus History dashboard

### Purpose

Provides the user with longitudinal feedback on their focus habits — total time, daily averages, and the time-of-day distribution of focused work.

### Placement

* The dashboard lives **below the Home fold**.
* From idle Home, the user scrolls down and the dashboard becomes visible.
* It is **only rendered on Home (idle state)**. It does not appear in Active Session or in the Flow Complete modal.
* No separate route or navigation entry exists for it.

### Section heading

* Title: **Focus History** (centered above the dashboard area).

### Layout

The dashboard contains three components arranged in a two-row grid:

**Top row:**

* Left card: **7-Day Activity** bar chart (occupies roughly the left two-thirds of the row)
* Right card: **Stats grid** (4 tiles in a 2×2 layout, occupying roughly the right one-third)

**Bottom row:**

* Full-width card: **7-Day Focus Heatmap (2hr Segments)**

On smaller / mobile widths, all three cards stack vertically.

### Component 1 — 7-Day Activity bar chart

* Card title: **7-Day Activity**
* No "Weekly View" pill or toggle — it must not be rendered.
* X-axis: the last 7 days, oldest on the left, today on the right. Labels are single-letter day initials (`S M T W T F S` style), localized to the user's week. The label for today is visually emphasized (e.g., colored / bolded).
* Y-axis: total focus hours per day. Y-axis tick labels are not required, but bars must be sized proportionally to the day's `totalFocusSeconds`.
* Each bar represents one day's `totalFocusSeconds` (converted to hours), including both completed and stopped/partial sessions.
* If a day has zero focus time, render a minimal baseline indicator (a thin line at the axis), not a missing column.
* Hovering / tapping a bar may optionally show a tooltip with the exact hours; not required.

### Component 2 — Stats grid

A 2×2 grid of tiles. Each tile shows a small label (top) and a large value (bottom). Values are formatted as hours with one decimal, e.g. `3.2h`, `24.5h`.

| Tile | Label | Value |
|---|---|---|
| Top-left | **Daily Total** | Total focus hours attributed to **today** (the current local date). |
| Top-right | **Daily Avg** | Average daily focus hours over the **last 7 days** (= `Weekly Total` / 7). Includes today. |
| Bottom-left | **Weekly Total** | Sum of focus hours over the **last 7 days**, including today. |
| Bottom-right | **Weekly Avg** | Same as Daily Avg, expressed as average daily hours over the last 7 days. (Both averages use the same window; the duplication is intentional and matches the design.) |

Notes:

* "Last 7 days" means the 7-day window ending on (and including) today, computed in the user's local timezone.
* Days with zero activity in the window still count as 0 toward the average (denominator is always 7).
* All four values come from `focusHistory.days` plus today's `dailyStats`.

### Component 3 — 7-Day Focus Heatmap

* Card title: **7-Day Focus Heatmap (2hr Segments)**
* Grid: 7 rows × 12 columns.
  * Rows: the last 7 days, with the oldest at the top. Row labels are single-letter day initials (M, T, W, T, F, S, S based on the actual day of week each row represents — labels follow the dates, they are not fixed Mon–Sun).
  * Columns: 12 two-hour segments covering 24 hours: `12a, 2a, 4a, 6a, 8a, 10a, 12p, 2p, 4p, 6p, 8p, 10p`. The label marks the start of the 2-hour segment.
* Each cell is colored by intensity proportional to focus seconds spent in that day × segment bucket. Use the brand purple, ramping from a near-empty/very-light shade (no activity) to a saturated shade (the maximum bucket value across the visible 7×12 grid).
* The intensity scale is computed per-render against the current visible window's max; an empty grid (max = 0) renders as all near-empty cells.

### Data sources for the dashboard

* `focusHistory.days[dateKey]` provides each day's `totalFocusSeconds` and 12-element `segmentSeconds`.
* On every session end (completed or stopped), the app must update the appropriate day's record:
  * `totalFocusSeconds` is incremented by the focused (non-paused) elapsed seconds of that session, including stopped/partial sessions.
  * `segmentSeconds` is incremented bucket-by-bucket: each focused second is attributed to the 2-hour bucket of its wall-clock time. A session that spans multiple buckets (e.g., 7:50–8:10 AM) splits its seconds across the relevant buckets accordingly.
  * The day used for `dateKey` is the session's `attributedDay` (the day the session started), even for cross-midnight sessions. Per-segment attribution still uses the actual wall-clock time of each second; this means a session started at 23:55 and ending at 00:15 contributes seconds to the `22:00–24:00` bucket of the start day and to the `00:00–02:00` bucket — implementations must decide whether the post-midnight bucket is recorded against the start day's row or the next day's row, and **must record it against the start day's row** to keep attribution consistent with daily stats.
  * `sessionsCount` increments only for completed sessions, matching daily stats rules.

### Empty state

* If `focusHistory` contains no days with any focused seconds AND today's `dailyStats.focusSeconds` is 0, the dashboard renders an **empty state** in place of the three components.
* Empty state shows:
  * The "Focus History" title
  * A friendly message such as **"Complete your first session to start tracking your focus history."**
  * No charts, no stats tiles, no heatmap.
* As soon as any session contributes focus time (completed or stopped/partial), the empty state is replaced by the full dashboard on the next render.

### Refresh behavior

* The dashboard re-renders when returning to Home from Flow Complete (so newly-completed session data appears immediately).
* The dashboard re-renders at local-midnight rollover (the same trigger as `dailyStats` reset) so today's column shifts and the 7-day window slides forward.

---

## 7.7 Home marketing footer

### Purpose

A static informational section at the bottom of the Home page that introduces the product, the Pomodoro Technique, usage instructions, and a feature list. This is reference / onboarding content; it is not interactive beyond standard text rendering.

### Placement

* Renders below the Focus History dashboard on Home.
* Visible only on Home (idle).
* Hidden in Active Session and in the Flow Complete modal.
* Static content — no per-user state, no persistence.

### Sections and copy

The footer contains four content blocks, in this order. The copy below is the canonical text. Headings should render as visible section headings.

#### What is Pomodoro Focus?

> Pomodoro Focus is a Pomodoro-inspired focus timer designed to help you work with intention. Set a focus duration, plan your tasks, and let the timer keep you accountable — all within a calming, distraction-free interface.

#### What is the Pomodoro Technique?

> The Pomodoro Technique is a time management method developed by Francesco Cirillo. It uses a timer to break work into focused intervals — traditionally 25 minutes — separated by short breaks. Each interval is called a "pomodoro," named after the tomato-shaped kitchen timer Cirillo used as a university student.

#### How to Use Pomodoro Focus

A numbered list:

1. Choose a focus duration (15, 20, or 25 minutes) or set a custom time
2. Optionally add tasks to your session plan
3. Click "Start Session" and focus on your work
4. Use the pause button if you need a brief interruption
5. When the timer ends, review your completed tasks and start a new session

#### Features

A bulleted list. Each bullet is a feature name (bold) followed by a short description.

* **Flexible Timer** — Choose from preset durations (15, 20, 25 min) or set any custom duration that fits your workflow.
* **Session Planning** — Add tasks before you begin so you know exactly what to focus on during each session.
* **Session Notes** — Capture ideas, blockers, or reminders while you work without breaking your flow.
* **Daily Tracking** — See your total focus time and number of sessions completed today at a glance.
* **Focus History** — Visualize your last 7 days of focus time, including a 2-hour-segment heatmap of when you do your best work.
* **Session Summary** — Review your completed and pending tasks after each session to see your progress.
* **Sound Cues** — Audio feedback for start, pause, resume, stop, and completion so you can stay heads-down.

### Styling

* Use a calm, readable layout consistent with the rest of Home.
* No CTAs, no buttons, no links to external pages required.
* Section headings use a smaller hierarchy than the main timer / dashboard headings.
* Copy must reference **Pomodoro Focus** as the product name (not "Deep Focus" or any prior brand). The "Sound Cues" feature must include "resume" in its list of cues, consistent with the audio requirements update.

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

## 8.3 Daily stats rules

* Focus time today increments only by completed session duration
* Sessions count increments only for completed sessions
* Partial sessions do not contribute
* Stats reset at the user's local midnight
* Sessions that cross midnight count toward the day they **started**, regardless of when they complete. A session started at 23:55 on Day 1 that finishes at 00:15 on Day 2 contributes its full focus time to Day 1's stats (and to Day 1's row in the Focus History dashboard).
* This start-day attribution must be set at session-start time and persisted with the active session, so a refresh or close/reopen near midnight does not change attribution.

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
* resume
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

Recommended implementation: localStorage or equivalent client-side persistence (cookies are also acceptable for the dashboard / Focus History data; size remains modest because we only need the last ~14 days).

### Must persist

* Active session state across refresh, including:

  * `startedAt` (absolute timestamp)
  * `initialSeconds`
  * `pausedAt` and `totalPausedSeconds`
  * `attributedDay`
  * `status`
  * `source`
* Active session state across tab close/reopen on the same device
* Sound setting
* Notes during active session
* Session Plan tasks before session starts
* Session Plan tasks after stop, excluding any tasks that were checked off during the stopped session (which are dropped on New Session)
* Checked/unchecked task state during active session
* Daily totals
* **Focus History** (`focusHistory.days` for the last 14+ days) — used to render the dashboard. Each entry includes `totalFocusSeconds`, `sessionsCount`, and the 12-element `segmentSeconds` array.

### Must not persist after successful completion + New Session

* Session-specific notes
* Checked (completed) plan tasks
* Task completion states on preserved tasks (preserved tasks reset to unchecked, though all preserved tasks were unchecked anyway)

### Must not persist after stopped session + New Session

* Checked (completed) plan tasks (dropped)

### Must persist after stopped session + New Session

* Notes
* Unchecked plan tasks (with their original minutes)

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
  startedAt: string;          // ISO timestamp; used for wall-clock restoration
  attributedDay: string;      // YYYY-MM-DD; locked at session start, used for cross-midnight attribution
  initialSeconds: number;
  remainingSeconds: number;   // last-known remaining; recomputed on reload for running sessions
  pausedAt: string | null;    // ISO timestamp when current pause began, or null if running
  totalPausedSeconds: number; // cumulative paused seconds across all pauses in this session
};

type DailyStats = {
  dateKey: string;            // YYYY-MM-DD
  focusSeconds: number;
  sessionsCount: number;
};

// Dashboard / Focus History data
type DayRecord = {
  dateKey: string;            // YYYY-MM-DD (local), the attributedDay
  totalFocusSeconds: number;  // sum of focus seconds attributed to this day (completed + stopped/partial)
  sessionsCount: number;      // count of completed sessions only
  // 12 segments per day, one per 2-hour bucket: [00-02, 02-04, ..., 22-24]
  // Each value is total focus seconds spent in that bucket on this day.
  segmentSeconds: number[];   // length = 12
};

type FocusHistory = {
  // Keyed by dateKey. Maintained for at least the last 14 days
  // (needed to render 7-day window and any future historical views).
  days: Record<string, DayRecord>;
};

type AppState = {
  selectedPreset: 15 | 20 | 25 | null;
  customMinutes: number | null;
  customMinutesInputError: string | null; // error state for invalid custom duration input
  soundEnabled: boolean;
  tasks: TaskItem[];
  notes: NoteItem[];
  activeSession: ActiveSession | null;
  dailyStats: DailyStats;
  focusHistory: FocusHistory;
};
```

This is guidance only. Exact structure may vary, but the wall-clock timestamps (`startedAt`, `pausedAt`, `totalPausedSeconds`, `attributedDay`) and the per-day 12-segment array are required to satisfy the timer-restoration, cross-midnight, and dashboard requirements.

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

* Product name: **Pomodoro Focus**
* Left rail / drawer title: **Session Plan**
* Notes rail: **Notes**
* Idle subtitle: **READY TO START?**
* Active label: **FOCUS FLOW**
* Completion heading: **Flow Complete**
* Task terminology: **Task** (never "Sub-task" or "sub-task" in any casing)
* The button to add a task in the Session Plan drawer must be labeled **Add Task**. Any existing copy reading "Add sub-task" or "Add Sub-task" must be replaced with "Add Task".

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
* The Home page contains, below the fold: Focus History dashboard, then Marketing footer
* Brand name shown everywhere is **Pomodoro Focus**
* Session Plan opens from the left rail
* Notes opens from the right rail
* Clicking the Notes rail button while the Notes drawer is open closes the drawer (toggle behavior)
* Clicking outside open drawers closes them smoothly
* Session Plan is locked during active session and continues to display the label "Session Plan" with a lock icon (not a generic "Locked" label)
* The left rail label reads "Session Plan" in full (not abbreviated to "Plan")
* Notes remains available during active session

### Home

* Default duration is 20 minutes
* Preset durations work
* Custom duration works through the plus pill interaction
* Invalid custom duration values keep the input open and show a visible error state; Start Session is disabled while invalid
* Home Start uses selected Home duration
* Daily stats are visible even at zero
* The marketing footer text references "Pomodoro Focus" and includes the four sections (What is Pomodoro Focus?, What is the Pomodoro Technique?, How to Use Pomodoro Focus, Features)

### Session Plan

* Drawer title and rail label both read "Session Plan"
* The add-task button reads **Add Task** (no occurrence of "Add Sub-task" or "Add sub-task" anywhere in the UI)
* User can add valid tasks
* Invalid tasks cannot be added
* User can delete tasks
* User can drag to reorder tasks
* Start Focused Session is disabled unless at least one valid task exists
* Sidebar Start uses sum of task minutes

### Active Session

* Timer counts down every second
* Pause freezes timer
* Resume continues timer and plays a sound (in addition to pause playing a sound)
* No Reset button or `resetSession()` function exists; users cannot reset the timer mid-session
* Stop requires confirmation and goes to Flow Complete
* Browser tab title shows remaining time
* Task list appears when tasks exist
* Task checking has no effect on timer
* Completed tasks appear struck through

### Timer restoration

* Closing the tab while a session is running and reopening later results in remaining time recomputed against wall-clock elapsed time, not frozen at the persisted value
* If wall-clock recomputation shows the session would have completed during the closure, the app transitions to Flow Complete on reopen and increments daily stats accordingly
* Paused sessions reopen with the same remaining time as when the tab was closed (paused time does not advance the wall clock)
* Sessions that cross midnight are attributed to the day they started in both daily stats and Focus History

### Notes

* Notes drawer is closed by default
* Notes can be added, edited, and deleted
* Empty notes cannot be added
* Notes persist through refresh and active sessions
* Clicking the Notes rail toggles the drawer open ↔ closed
* Notes appear in Flow Complete in chronological order

### Completion

* Flow Complete is shown as centered modal
* Completed session duration is shown
* For naturally completed sessions, the displayed duration equals the initial duration
* For stopped sessions, the displayed duration shows elapsed focused time, not the initial duration
* Tasks section is hidden when no tasks exist
* Notes section is hidden when no notes exist
* New Session returns to Home
* On New Session after a successful completion: notes and checked tasks clear; unchecked tasks are preserved
* On New Session after a stopped session: notes are preserved; checked tasks are dropped; unchecked tasks are preserved
* Successful completion increments daily stats and updates Focus History
* Stop does not increment daily stats but still updates Focus History (elapsed seconds, including segment buckets)

### Focus History dashboard

* Renders below the Home fold on idle Home only
* Title "Focus History" appears above the dashboard
* "7-Day Activity" bar chart shows the last 7 days, today emphasized, no Weekly View pill
* Stats grid shows Daily Total, Daily Avg, Weekly Total, Weekly Avg with values formatted as `N.Nh`
* Daily Total = today's focus hours; Weekly Total = sum of last 7 days; Daily Avg = Weekly Avg = Weekly Total / 7
* "7-Day Focus Heatmap (2hr Segments)" renders 7 rows × 12 columns; cells colored by intensity proportional to per-bucket focus seconds
* Stopped/partial sessions contribute their elapsed focused seconds to both the bar chart and the heatmap (but not to the sessions count)
* Empty state ("Complete your first session to start tracking your focus history.") shows when no focus seconds have ever been recorded
* Dashboard refreshes when returning to Home and at local-midnight rollover

### Persistence

* Active sessions restore after refresh, with wall-clock-correct remaining time
* Active sessions restore after tab close/reopen, with wall-clock-correct remaining time
* Daily stats persist locally
* Focus History persists locally for at least the last 14 days
* Stopped-session unchecked tasks and notes persist into the next attempt; checked tasks from a stopped session do not
* Successfully completed session data (notes, checked tasks) is cleared on New Session; unchecked tasks survive
