---
name: Glassy Focus Design System
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e4'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f2fe'
  surface-container: '#f0ecf8'
  surface-container-high: '#ebe6f2'
  surface-container-highest: '#e5e0ed'
  on-surface: '#1c1b23'
  on-surface-variant: '#474554'
  inverse-surface: '#312f38'
  inverse-on-surface: '#f3effb'
  outline: '#787586'
  outline-variant: '#c8c4d7'
  surface-tint: '#5847d2'
  primary: '#5341cd'
  on-primary: '#ffffff'
  primary-container: '#6c5ce7'
  on-primary-container: '#faf6ff'
  inverse-primary: '#c6bfff'
  secondary: '#246293'
  on-secondary: '#ffffff'
  secondary-container: '#8fc6fd'
  on-secondary-container: '#075283'
  tertiary: '#884800'
  on-tertiary: '#ffffff'
  tertiary-container: '#ac5d00'
  on-tertiary-container: '#fff5f1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4dfff'
  primary-fixed-dim: '#c6bfff'
  on-primary-fixed: '#160066'
  on-primary-fixed-variant: '#4029ba'
  secondary-fixed: '#cfe5ff'
  secondary-fixed-dim: '#98cbff'
  on-secondary-fixed: '#001d33'
  on-secondary-fixed-variant: '#004a77'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#fcf8ff'
  on-background: '#1c1b23'
  surface-variant: '#e5e0ed'
  dawn-lavender: '#E0C3FC'
  haze-blue: '#8EC5FC'
  blush-rose: '#FFDEE9'
  glass-surface: rgba(255, 255, 255, 0.15)
  glass-border: rgba(255, 255, 255, 0.3)
  glass-highlight: rgba(255, 255, 255, 0.6)
  text-primary: '#2D3436'
  text-muted: '#636E72'
  accent-violet: '#6C5CE7'
  trap-overlay: rgba(0, 0, 0, 0.05)
typography:
  timer-display:
    fontFamily: Epilogue
    fontSize: 120px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.02em
  heading-lg:
    fontFamily: Epilogue
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  heading-md:
    fontFamily: Epilogue
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-ui:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  input-text:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '300'
    lineHeight: '1.2'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  edge-strip: 60px
  edge-strip-hover: 80px
  sidebar-width: 320px
  orb-size: 400px
  gutter: 24px
  container-max: 500px
---

# Glassy Focus

## Product Overview

**The Pitch:** A hyper-minimalist productivity dashboard that replaces anxiety-inducing to-do lists with a calm, atmospheric flow state. By treating distractions and tasks as ephemeral, edge-dwelling entities, users maintain undivided visual attention on the passage of time itself.

**For:** Knowledge workers, writers, and developers who suffer from "tab fatigue" and need a single, serene surface for deep work sessions.

**Device:** desktop

**Design Direction:** **"Ethereal Frost."** Heavy reliance on backdrop-blur, ultra-thin high-contrast borders (`1px solid rgba(255,255,255,0.3)`), and slow-moving fluid gradients. The UI feels like ice floating on water.

**Inspired by:** *Linear* (blur effects), *Endel* (ambient mood), *Amie* (joyful utility).

---

## Screens

- **[Screen 1] The Deep State:** The primary view featuring the central timer orb and collapsed edge controls.
- **[Screen 2] Task Distribution (Left Expanded):** Interactive timeline for allocating minutes to specific sub-goals.
- **[Screen 3] Distraction Trap (Right Expanded):** Quick-entry scratchpad for offloading mental clutter instantly.
- **[Screen 4] Session Complete:** A momentary, celebratory overlay summarizing focus time before the break begins.

---

## Key Flows

**[Flow 1] The Focus Ritual:** Entering tasks and starting the day.

1.  User loads app -> sees pulsating central orb + calm gradient.
2.  User hovers Left Strip -> Sidebar slides out with glass blur.
3.  User inputs "Write PRD" (15m) and "Review designs" (10m) -> Total time syncs to 25m.
4.  User clicks central "Flow" button -> Timer fills orb, sidebar collapses, audio cue plays.

**[Flow 2] Catching a Distraction:** Offloading a thought without breaking flow.

1.  Timer is running -> User has a sudden thought: "Email Sarah."
2.  User flicks mouse to Right Edge -> "Distraction Trap" pane glides open over the gradient.
3.  User types "Email Sarah" -> hits Enter -> Pane auto-collapses instantly.
4.  Focus remains unbroken.

---

<details>
<summary>Design System</summary>

## Color Palette

**Atmosphere (Gradients)**
*Background is a live CSS animation shifting between these stops:*
- **Dawn:** `#E0C3FC` (Soft Lavender)
- **Haze:** `#8EC5FC` (Baby Blue)
- **Blush:** `#FFDEE9` (Pale Rose)

**UI Elements**
- **Glass Surface:** `rgba(255, 255, 255, 0.1)` - The base for panels.
- **Glass Border:** `rgba(255, 255, 255, 0.4)` - The definition.
- **Glass Highlight:** `rgba(255, 255, 255, 0.6)` - Top edge shine.
- **Text Primary:** `#2D3436` - Slate charcoal (never black).
- **Text Muted:** `#636E72` - Labels and timestamps.
- **Accent:** `#6C5CE7` - Active states (soft violet).

## Typography

**Font Family 1: *Sora*** (Headings/Timer)
*Distinctive, geometric but soft.*
- **Timer Display:** 700, 120px, -2% tracking.
- **Headings:** 600, 24px.

**Font Family 2: *Inter Tight*** (UI/Inputs)
*Legible, tall x-height, precise.*
- **Body:** 400, 15px.
- **Inputs:** 300, 16px.

## Design Tokens

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.15);
  --glass-border: 1px solid rgba(255, 255, 255, 0.3);
  --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
  --backdrop-blur: blur(12px);
  --ease-fluid: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --font-display: 'Sora', sans-serif;
  --font-ui: 'Inter Tight', sans-serif;
}
```

</details>

---

<details>
<summary>Screen Specifications</summary>

### [Screen 1] The Deep State

**Purpose:** The default view. Maximizes negative space to reduce cognitive load.

**Layout:**
- **Background:** Full viewport animated gradient (slow pan, 60s loop).
- **Center:** 400x400px Glass Orb containing the timer.
- **Left Edge:** 60px wide vertical glass strip (collapsed task pane).
- **Right Edge:** 60px wide vertical glass strip (collapsed note pane).
- **Bottom:** 32px high pill showing "Session 3 of 4".

**Key Elements:**
- **Timer Orb:** 400px circle. `backdrop-filter: blur(20px)`. 1px white border.
    - **Content:** "25:00" centered. Below it, a subtle "Start" icon (Play triangle).
    - **Progress:** The border of the circle fills with white as time passes.
- **Left Strip Handle:** 60px wide, 100vh height. Frosted. Vertical text: "TASKS". Opacity 0.6.
- **Right Strip Handle:** 60px wide, 100vh height. Frosted. Vertical text: "NOTES". Opacity 0.6.

**States:**
- **Idle:** Timer shows default duration.
- **Running:** Timer counts down. Border progress animates. "Start" becomes "Pause".
- **Break:** Background shifts to cooler tones (Teal/Mint). Orb text says "Breathe".

**Interactions:**
- **Hover Orb:** Scale up 1.02x, border brightens.
- **Hover Edges:** Strips expand slightly (60px -> 80px) to invite click.

---

### [Screen 2] Task Distribution (Left Expanded)

**Purpose:** Defining the work structure before or during the timer.

**Layout:**
- **Sidebar:** Slides out from left. Width: 320px. Height: 100vh.
- **Style:** Heavy glassmorphism. Covers the "Left Strip Handle".

**Key Elements:**
- **Header:** "Session Plan" (Sora, 24px).
- **Input Row:** "Add sub-task..." input field + Time selector (5m, 10m, 15m pills).
- **Task List:** Vertical stack of tasks.
    - **Task Item:** Text label left, allocated minutes right. Drag handle to reorder.
- **Visualizer:** A vertical bar next to the list showing how the 25m is filled (e.g., 10m block + 15m block).

**Components:**
- **Task Input:** `bg-white/20`, rounded-lg, `placeholder-white/60`.
- **Time Pill:** 24px height, `border-white/40`, hover fills white.

**Interactions:**
- **Add Task:** Enter key adds to list. Total time updates. If >25m, warns user.
- **Click Outside:** Sidebar slides back to collapsed state (Left Strip).

---

### [Screen 3] Distraction Trap (Right Expanded)

**Purpose:** rapid capture of intrusive thoughts.

**Layout:**
- **Sidebar:** Slides out from right. Width: 320px. Height: 100vh.
- **Style:** Darker glass tint (`rgba(0,0,0,0.05)`) to differentiate from tasks.

**Key Elements:**
- **Header:** "Brain Dump" (Sora, 24px).
- **Input Area:** Large textarea, auto-focuses on open. Transparent background.
- **List:** Bulleted list of captured thoughts below the input.
- **Clear Button:** "Clear all" text link at bottom.

**Interactions:**
- **Type + Enter:** Moves text from input to the list below immediately with a "slide down" animation.
- **Hover List Item:** Show "Delete" (x) icon.

---

### [Screen 4] Session Complete

**Purpose:** Transition state between Focus and Break.

**Layout:**
- **Overlay:** Full screen glass layer, slightly darker (20% black).
- **Center Modal:** 500px wide card.

**Key Elements:**
- **Title:** "Flow Complete" (Sora, 32px).
- **Summary:** "You focused for 25 minutes."
- **Checklist:** Displays the tasks set in Screen 2.
    - **Action:** User checks off what they actually finished.
- **CTA:** "Start Break" (Large button, solid white, dark text).

**Interactions:**
- **Check Box:** Strikethrough text, satisfying "ding" sound.
- **Click CTA:** Modal fades out, Main Timer (Screen 1) resets to 5:00 Break mode.

</details>

---

<details>
<summary>Build Guide</summary>

**Stack:** React + Tailwind CSS v3 + Framer Motion (animations)

**Build Order:**
1.  **[Screen 1] The Deep State:** Establish the `bg-gradient` animation and the central Glass Orb. Get the countdown logic working.
2.  **[Screen 2] Task Logic:** Build the left sidebar state management. Connect task time summing to the main timer duration.
3.  **[Screen 3] Distraction Trap:** Implement the right sidebar. Focus management is crucial here (auto-focus textarea).
4.  **[Screen 4] Session Logic:** Build the state machine for Focus -> Complete -> Break -> Focus cycles.

**Tailwind Config:**
Extend theme with:
- `colors`: `glass-white`: `rgba(255,255,255, 0.1)`
- `fontFamily`: `sora`, `inter-tight`
- `backdropBlur`: `xs`: `2px`, `xl`: `20px`

</details>