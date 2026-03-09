# Visual Parity Log — V2

## Source of Truth
- **PRD.md** — behavior and flows
- **reference_designs/v2/** — visual truth (6 screenshots)
- **design_tokens.md** — unified styling system
- **design_assets/*.css** — Figma exports (reference only)

---

## State 1: Home (Idle)
**Reference:** `v2/Home_ Minimal Start with Sidebar Speaker On.png`, `...Speaker Off.png`

### V2 Changes Applied:
- Added header with Deep Focus logo (purple icon + bold text)
- Left rail label changed from "Plan" to **"Session Plan"**
- Right rail changed from person/notification icons to **"Notes"** vertical label + edit_note icon
- Added **sound toggle** (volume_up/volume_off) on right rail
- Default duration changed to **20m** (from 25m)
- Glass orb blur corrected to **20px** (was 40px)
- Timer font size bumped to **128px** on desktop

### Remaining tokens to verify:
- Orb size: 500x500px on md+ — matched
- Duration pills: 15/20/25 — matched (custom pill not in v2 screenshot)

---

## State 2: Session Plan (Sidebar Overlay)
**Reference:** `v2/Tasks.png`

### V2 Changes Applied:
- Sidebar width increased to **384px** (w-96, was w-80/320px)
- Labels changed from "Add Sub-task" to **"Add Task"**
- Added **drag handles** (drag_indicator icon) on each task item
- Added **close button** in sidebar header
- Task items use **24px border radius** (rounded-3xl)
- Added total minutes display in breakdown header
- All buttons use rounded-3xl for consistency

---

## State 3: Active Session — Notes Closed
**Reference:** `v2/Active Session_ Notes not opened.png`

### V2 Changes Applied:
- Removed settings button from header
- Active orb sized to **384x384px** with **blur(6px)** (was 320/384 with blur(12px))
- Added **Stop** button alongside Pause/Reset (3 buttons total)
- Stop button triggers **confirmation dialog** per PRD
- Right side shows **collapsed rail** with sound toggle + "Notes" label
- Left sidebar simplified to small **lock indicator** (was w-64 sidebar)
- Session Plan tasks shown below timer with **checkboxes**
- Clicking checkbox toggles **strikethrough** on task text
- "SESSION ACTIVE" badge simplified (removed settings button)
- Timer font size set to **96px** on desktop

---

## State 4: Active Session — Notes Open
**Reference:** `v2/Active Session Notes Open.png`

### V2 Changes Applied:
- Right rail expands to **Notes drawer** (w-72) when clicked
- Drawer has **close button** to collapse back to rail
- Quick Capture input + captured items list
- Drawer replaces collapsed rail (not stacked)

---

## State 5: Flow Complete
**Reference:** `v2/Flow Complete.png`

### V2 Changes Applied:
- Heading uses **Sora** font family (loaded via Google Fonts)
- **Two-column layout**: tasks left, session notes right
- Decorative background **orbs** (blue top-left, pink bottom-right with radial gradients)
- Removed "Return to Dashboard" secondary link (only "New Session →" CTA)
- Card max-width increased to **672px** (max-w-2xl)
- Card uses **rounded-2xl** (was rounded-xl)
- Check icon changed from "verified" to **"check_circle"**

---

## Behavioral Changes (store.ts)
- Default `selectedQuickMinutes` → **20** (was 25)
- Added `showNotesDrawer` state toggle
- Added `soundEnabled` state toggle
- Added `togglePlanItemCompleted` for task checkboxes
- Added `stopSession` with early-end flow (saves partial progress)
- `resetSession` now also resets task completion states
- Browser **tab title** updates with countdown during session
- `newSession` resets to 20m default
