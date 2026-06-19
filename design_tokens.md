# Deep Focus — Unified Design Tokens

Extracted from 6 Figma-exported CSS files in `/design_assets/`, validated against `/reference_designs/` screenshots. Screenshots are the final visual truth.

---

## 1. Colors

### Brand
| Token              | Value                        | Usage                              |
|--------------------|------------------------------|------------------------------------|
| `primary`          | `#6A5AE7`                    | CTAs, active indicators, icons     |
| `primary-light`    | `rgba(106, 90, 231, 0.1)`   | Badges, chip backgrounds, pills    |
| `primary-border`   | `rgba(106, 90, 231, 0.2)`   | Badge/pill borders, glass-pill     |
| `primary-glow`     | `rgba(106, 90, 231, 0.3)`   | Button shadows, orb glow           |
| `primary-muted`    | `rgba(106, 90, 231, 0.6)`   | "FOCUS FLOW" label, capture icons  |

### Break Mode Accent
Used when the session mode is **Break** instead of **Focus**. Soft teal differentiates rest from focus without leaving the cool-tone family.
| Token              | Value                        | Usage                                          |
|--------------------|------------------------------|------------------------------------------------|
| `break`            | `#14B8A6`                    | Break-mode CTAs, active toggle segment, accent |
| `break-light`      | `rgba(20, 184, 166, 0.1)`   | Subtle break-tinted backgrounds                |
| `break-border`     | `rgba(20, 184, 166, 0.2)`   | Preset pill border (selected, Break mode)      |
| `break-glow`       | `rgba(20, 184, 166, 0.3)`   | Break CTA shadow, break orb glow               |
| `break-muted`      | `rgba(20, 184, 166, 0.6)`   | Secondary break labels / icons                 |
| `break-fixed`      | `#0E8C7E`                    | Pressed/active Break CTA                       |
| `break-container`  | `#CCFBF1`                    | Soft tint behind Break elements                |

### Neutral Text
| Token              | Value       | Usage                                      |
|--------------------|-------------|--------------------------------------------|
| `text-darkest`     | `#0F172A`   | Timer digits (Home), time display (Complete)|
| `text-dark`        | `#1E293B`   | Brand heading (Home), task text (Complete)  |
| `text-body`        | `#2D3436`   | Sidebar headings, task titles, body text    |
| `text-secondary`   | `#334155`   | Chip text (unselected), button labels       |
| `text-tertiary`    | `#475569`   | Rail labels ("PLAN", "NOTES")               |
| `text-muted`       | `#64748B`   | Subtitle, "Ready to start?", descriptions   |
| `text-placeholder` | `#94A3B8`   | Input placeholders, section headers, icons  |
| `text-divider`     | `#CBD5E1`   | Dividers, drag handles, delete icons        |
| `text-border`      | `#F1F5F9`   | Sidebar section separator                   |

### Surfaces
| Token                  | Value                           | Usage                           |
|------------------------|---------------------------------|---------------------------------|
| `surface-bg`           | `#F6F6F8`                       | App background fallback         |
| `glass-white-15`       | `rgba(255, 255, 255, 0.15)`    | Home orb background             |
| `glass-white-10`       | `rgba(255, 255, 255, 0.1)`     | Active session orb, right panel |
| `glass-white-05`       | `rgba(255, 255, 255, 0.05)`    | Rail backgrounds, capture input |
| `glass-white-40`       | `rgba(255, 255, 255, 0.4)`     | Unselected chips, sidebar bg    |
| `glass-white-50`       | `rgba(255, 255, 255, 0.5)`     | Task items (Complete)           |
| `glass-white-60`       | `rgba(255, 255, 255, 0.6)`     | Selected chip                   |
| `glass-white-70`       | `rgba(255, 255, 255, 0.7)`     | Complete card                   |
| `glass-white-30`       | `rgba(255, 255, 255, 0.3)`     | Sidebar bg, input bg, borders   |
| `glass-border-white-20`| `rgba(255, 255, 255, 0.2)`     | Orb border, glass borders       |
| `glass-border-white-10`| `rgba(255, 255, 255, 0.1)`     | Rail borders                    |
| `glass-border-white-30`| `rgba(255, 255, 255, 0.3)`     | Complete card border             |
| `glass-border-white-40`| `rgba(255, 255, 255, 0.4)`     | Task items (Complete) border    |

### Decorative
| Token               | Value                        | Usage                     |
|----------------------|------------------------------|---------------------------|
| `blur-blue`          | `rgba(96, 165, 250, 0.1)`   | Right decorative blur     |
| `blur-pink`          | `rgba(249, 168, 212, 0.2)`  | Complete screen blur      |

---

## 2. Gradients

| Token                  | Value                                                                  | Usage                       |
|------------------------|------------------------------------------------------------------------|-----------------------------|
| `gradient-ethereal`    | `linear-gradient(128.66deg, #E0E7FF 0%, #F3E8FF 50%, #E0E7FF 100%)`  | Home background             |
| `gradient-session`     | `linear-gradient(135deg, #F0F0FF 0%, #E8E6FF 50%, #F6F6F8 100%)`     | Active session background   |
| `gradient-session-alt` | `linear-gradient(128.66deg, #E0E7FF 0%, #F5F3FF 50%, #E0F2FE 100%)` | Tasks/sidebar background    |
| `gradient-celebration` | `linear-gradient(128.63deg, #FEF3C7 0%, #FCE7F3 50%, #FAE8FF 100%)` | Flow Complete background    |
| `gradient-orb-inner`   | `linear-gradient(45deg, rgba(106,90,231,0.05) 0%, transparent 50%, rgba(106,90,231,0.1) 100%)` | Orb inner overlay |

---

## 3. Typography

All text uses `'Inter', sans-serif`. The Flow Complete heading uses `'Sora', sans-serif`.

### Scale (from Figma CSS)

| Token             | Size   | Weight | Line-height | Letter-spacing | Usage                        |
|-------------------|--------|--------|-------------|----------------|------------------------------|
| `timer-home`      | 128px  | 200    | 128px       | -6.4px         | Home idle timer digits       |
| `timer-active`    | 96px   | 900    | 96px        | -4.8px         | Active session timer digits  |
| `timer-complete`  | 60px   | 900    | 60px        | -1.5px         | Flow Complete time display   |
| `heading-complete`| 36px   | 700    | 40px        | 0              | "Flow Complete" (Sora)       |
| `heading-brand`   | 20px   | 700    | 28px        | -0.5px         | "Deep Focus" / sidebar title |
| `heading-button`  | 18px   | 700    | 28px        | 0              | "Start Session" CTA text     |
| `body-task`       | 16px   | 500    | 24px        | 0              | Task text (Complete), inputs |
| `body-default`    | 14px   | 500-700| 20px        | varies         | Chips, buttons, task titles  |
| `label-section`   | 12px   | 700    | 16px        | 1.2-2.4px      | Section headers, uppercase   |
| `label-subtitle`  | 14px   | 300    | 20px        | 1.4px          | "READY TO START?" uppercase  |
| `label-badge`     | 12px   | 600    | 16px        | 0.6px          | "SESSION ACTIVE" badge       |
| `label-rail`      | 11px   | 700    | 16px        | 3.3-4.4px      | Rail labels, vertical text   |
| `caption`         | 11px   | 400    | 16-18px     | 0              | Quick capture items, desc    |
| `stat-label`      | 10px   | 700    | 15px        | 0              | Footer stats labels          |
| `micro`           | 10px   | 700    | 15px        | varies         | Minute pills, progress text  |

---

## 4. Spacing Scale

Derived from Figma padding/gap values:

| Token   | Value | Usage                                      |
|---------|-------|--------------------------------------------|
| `sp-1`  | 4px   | Tight gaps (icon-text, label-input)         |
| `sp-2`  | 8px   | Small gaps (icon containers, chip gaps)     |
| `sp-3`  | 12px  | Medium gaps (task item gaps, input gaps)    |
| `sp-4`  | 16px  | Standard gaps (task list, section spacing)  |
| `sp-6`  | 24px  | Large gaps (sections, sidebar padding)      |
| `sp-8`  | 32px  | XL gaps (header-to-content, sidebar top)    |
| `sp-10` | 40px  | Rail padding, chip-to-button margin         |
| `sp-12` | 48px  | Orb padding, card padding, header absolute  |

---

## 5. Border Radius

| Token           | Value    | Usage                                     |
|-----------------|----------|--------------------------------------------|
| `radius-full`   | 9999px   | Orbs, pills, chips, badges, buttons        |
| `radius-3xl`    | 24px     | Cards (Complete), sidebar panel, task items |
| `radius-2xl`    | 16px     | Inputs, locked badge, buttons (sidebar)    |
| `radius-xl`     | 16px     | Logo icon container, rail buttons          |
| `radius-lg`     | 8px      | Checkboxes                                 |

---

## 6. Shadows

| Token                | Value                                                                     | Usage                    |
|----------------------|---------------------------------------------------------------------------|--------------------------|
| `shadow-orb`         | `0px 8px 32px rgba(106, 90, 231, 0.1)`                                  | Home glass orb           |
| `shadow-orb-glow`    | `0px 0px 60px 10px rgba(106, 90, 231, 0.3)`                             | Active session orb       |
| `shadow-button-primary` | `0px 20px 25px -5px rgba(106,90,231,0.2), 0px 8px 10px -6px rgba(106,90,231,0.2)` | Start Session button |
| `shadow-button-sidebar` | `0px 20px 25px -5px rgba(106,90,231,0.3), 0px 8px 10px -6px rgba(106,90,231,0.3)` | Sidebar CTA buttons |
| `shadow-card`        | `0px 25px 50px -12px rgba(0, 0, 0, 0.25)`                               | Sidebar panel, Complete card |
| `shadow-input`       | `0px 1px 2px rgba(0, 0, 0, 0.05)`                                       | Capture input            |
| `shadow-logo`        | `0px 10px 15px -3px rgba(106,90,231,0.2), 0px 4px 6px -4px rgba(106,90,231,0.2)` | Logo icon |
| `shadow-inset-orb`   | `inset 0px 2px 4px 1px rgba(0, 0, 0, 0.05)`                            | Blurred timer placeholder |

---

## 7. Backdrop Blur

| Token           | Value       | Usage                                |
|-----------------|-------------|--------------------------------------|
| `blur-orb-home` | `blur(20px)`| Home glass orb                       |
| `blur-orb`      | `blur(6px)` | Active session orb                   |
| `blur-sidebar`  | `blur(12px)`| Sidebar panel, right sidebar         |
| `blur-rail`     | `blur(5px)` | Left/right rails                     |
| `blur-pill`     | `blur(4px)` | Glass pill buttons, task items       |
| `blur-card`     | `blur(6px)` | Flow Complete card                   |
| `blur-locked`   | `blur(6px)` | Locked sidebar during session        |
| `blur-decor`    | `blur(60px)`| Background decorative blurs          |

---

## 8. Component Specs

### 8.1 Glass Orb (Home)
- Size: 500x500px
- Background: `glass-white-15`
- Border: 1px solid `glass-border-white-20`
- Shadow: `shadow-orb`
- Blur: `blur-orb-home` (20px)
- Radius: `radius-full`
- Padding: 48px

### 8.2 Glass Orb (Active)
- Size: 384x384px
- Background: `glass-white-10`
- Border: 1px solid `glass-border-white-20`
- Shadow: `shadow-orb-glow`
- Blur: `blur-orb` (6px)
- Radius: `radius-full`
- Inner gradient overlay: `gradient-orb-inner`
- Inner shine: 64x32px white/20 blur(12px) rotated -30deg

### 8.3 Duration Chips
- Padding: 8px 20px
- Height: 38px
- Radius: `radius-full`
- Gap between chips: 12px
- **Unselected:** bg `glass-white-40`, border `glass-border-white-20`, color `text-secondary`, weight 500
- **Selected:** bg `glass-white-60`, border `primary-border`, color `primary`, weight 600
- Font: 14px Inter

### 8.4 Primary CTA Button (Start Session)
- Padding: 16px 48px
- Height: 60px
- Radius: `radius-full`
- Background: `primary`
- Shadow: `shadow-button-primary`
- Text: 18px/28px, weight 700, white
- Icon gap: 8px

### 8.5 Glass Pill Buttons (Pause/Reset)
- Padding: 12px 24px
- Height: 46px
- Radius: `radius-full`
- Background: `primary-light`
- Border: 1px solid `primary-border`
- Blur: `blur-pill` (4px)
- Text: 14px, weight 700, `text-secondary`
- Icon gap: 8px

### 8.6 Session Plan Sidebar
- Width: 384px
- Background: `glass-white-40`
- Blur: `blur-sidebar` (12px)
- Shadow: `shadow-card`
- Padding: 32px
- Header margin-bottom: 40px

### 8.7 Task Item (Sidebar)
- Padding: 16px
- Height: 70px
- Gap: 12px
- Radius: `radius-3xl` (24px)
- Background: `glass-white-30`
- Border: 1px solid `glass-white-30`
- Title: 14px, weight 700, `text-body`
- Subtitle: 12px, weight 400, `text-placeholder`
- Minute pill: bg `primary-light`, radius `radius-full`, 10px weight 700, `primary`

### 8.8 Task Item (Active Session)
- Padding: 12px 16px
- Height: 46px
- Gap: 12px
- Radius: `radius-3xl` (24px)
- Background: `primary-light`
- Border: 1px solid `primary-border`
- Blur: `blur-pill` (4px)
- Checkbox: 16px, radius 8px, border 1px solid `rgba(45,52,54,0.2)`
- Checked: bg `rgba(106,90,231,0.2)`, border `primary`, check icon `primary`
- Text: 14px, weight 500, `text-body`

### 8.9 Task Item (Flow Complete)
- Padding: 16px
- Height: 58px
- Radius: `radius-2xl` (16px)
- Background: `glass-white-50`
- Border: 1px solid `glass-border-white-40`
- Text: 16px, weight 500, `text-dark`
- Check circle: 24px, bg `primary`, white check icon

### 8.10 Right Sidebar (Quick Capture)
- Width: 288px
- Padding: 48px 24px 24px
- Background: `glass-white-10`
- Border-left: 1px solid `glass-border-white-20`
- Blur: `blur-sidebar` (12px)
- Heading: 14px, weight 700, `text-secondary`
- Description: 11px, weight 400, `text-muted`

### 8.11 Capture Input
- Padding: 11px 16px
- Height: 38px
- Radius: `radius-3xl` (24px)
- Background: `glass-white-05`
- Border: 1px solid `glass-border-white-20`
- Shadow: `shadow-input`
- Blur: `blur-orb` (6px)
- Placeholder: 12px, weight 400, `text-placeholder`

### 8.12 Capture List Item
- Dot: 4px circle, `primary-muted`
- Text gap from dot: 12px (left offset 12px)
- Text: 11px, weight 400, `text-tertiary` (#475569)

### 8.13 Flow Complete Card
- Max-width: 768px
- Padding: 48px
- Radius: `radius-3xl` (24px)
- Background: `glass-white-70`
- Border: 1px solid `glass-border-white-30`
- Blur: `blur-card` (6px)
- Shadow: `shadow-card`
- Heading font: Sora 36px/40px weight 700
- Sub-heading: Inter 16px/24px weight 500, `text-muted`

### 8.14 Header (Active Session)
- Padding: 16px 32px
- Height: 67px
- Logo box: 35px, bg `primary`, radius 16px
- Logo icon: 19px white
- Title: 20px/28px, weight 700, `text-body`, letter-spacing -0.5px

### 8.15 Status Badge
- Padding: 6px 12px
- Radius: `radius-full`
- Background: `primary-light`
- Border: 1px solid `primary-border`
- Ping dot: 8px `primary`
- Text: 12px, weight 600, `primary`, letter-spacing 0.6px, uppercase

### 8.16 Left Rail (Home)
- Width: 37-45px (varies slightly between screens)
- Button height: ~160px
- Radius: 0 24px 24px 0 (right side rounded)
- Background: `glass-white-05`
- Border-right: 1px solid `glass-border-white-10`
- Blur: `blur-rail` (5px)
- Icon: 15px, `primary`
- Label: 11px, weight 700, letter-spacing 3.3-4.4px, uppercase, `text-tertiary`, rotated vertical

### 8.17 Right Rail (Home)
- Width: 43px
- Same glass styling as left rail but mirrored
- Border-left instead of border-right
- Radius: 16px 0 0 16px

### 8.18 Locked Sidebar (Active)
- Width: 256px
- Background: white, opacity 0.3
- Blur: `blur-locked` (6px)
- Greyscale filter applied
- Badge: bg `rgba(226,232,240,0.5)`, border `rgba(203,213,225,0.2)`, radius 16px

### 8.19 New Session Button (Complete)
- Full width
- Height: 56px
- Radius: `radius-2xl` (16px)
- Background: `primary`
- Shadow: `shadow-logo`
- Text: 16px/24px, weight 700, white
- Icon gap: 8px

### 8.20 Progress Bar
- Height: 4px (from Figma, rendered as thin bar)
- Track: `#E2E8F0` (slate-200)
- Fill: `primary`
- Radius: full
- Label below: 10px, weight 700, `text-placeholder`, opacity 0.6
