# UIUX_DESIGN.md — Tactical FUI Design System

> Self-contained specification. Everything needed to reproduce the look is written here in words, numbers, and code. Nothing in this document depends on any image, file, product, brand, or external reference. If you cannot see, rely on the exact values and descriptions below.

---

## 0. How to use this document

1. Treat every value here as a token. Do not invent colors, sizes, or fonts outside the tokens.
2. Build the CSS variable block in section 16 first, then components (section 9), then layouts (section 12).
3. When uncertain, choose the option that is **denser, flatter, sharper, darker, and more instrument-like**.
4. Validate the result against the checklist in section 17.

---

## 1. Identity in one paragraph

A dark, high-density command console. It looks like the display of a military-grade instrument: near-black canvas, hairline borders, angular corners, monospace numerals, thin luminous data lines, segmented bars, corner brackets, tick marks, dotted grids, and small status lamps. Two luminous accents share the screen: **signal cyan** for structure, data, and system state, and **ember orange** for action, emphasis, and danger-adjacent energy. Every panel feels like a bolted-on module of a larger machine. The interface is never decorative; every line, label, and glyph carries information.

### Design principles

| # | Principle | Meaning in practice |
|---|-----------|---------------------|
| P1 | Dark and quiet | Canvas is almost black. Light comes only from data, accents, and status. |
| P2 | Dense but ordered | Pack information tightly, but keep a strict grid and a strict type scale. |
| P3 | Hairlines over fills | Structure is drawn with 1px lines, not with big colored blocks. |
| P4 | Angular, not round | Radii are 0–4px. Corners get notches, brackets, or cuts. |
| P5 | Numbers are heroes | Metrics use monospace tabular numerals; units and labels are small and dim. |
| P6 | Everything is live | Timestamps, status lamps, tickers, blinking cursors, streaming logs imply a running system. |
| P7 | One glow per view | Reserve strong glow for a single focal element; everything else is matte. |
| P8 | Machine voice | Copy is terse, factual, uppercase for labels, sentence case for descriptions. |

---

## 2. Color system

### 2.1 Base (neutrals, cool-tinted)

| Token | Hex | Use |
|-------|-----|-----|
| `--void` | `#05070A` | App background, deepest layer |
| `--surface-0` | `#080B10` | Sidebar, top bar, page sections |
| `--surface-1` | `#0B1017` | Default panel background |
| `--surface-2` | `#101720` | Raised panel, hovered row, input background |
| `--surface-3` | `#16202B` | Selected row, active tab, pressed state |
| `--line-faint` | `rgba(150,180,205,0.08)` | Inner grid lines, row separators |
| `--line` | `rgba(150,180,205,0.16)` | Default panel border |
| `--line-strong` | `rgba(150,180,205,0.32)` | Focused/active borders, brackets |
| `--text-hi` | `#E8EEF4` | Primary numbers, titles |
| `--text-mid` | `#9AA9B8` | Body, secondary values |
| `--text-lo` | `#5E6C7A` | Labels, units, captions, disabled |

### 2.2 Accents

| Token | Hex | Role |
|-------|-----|------|
| `--cyan` | `#5CE6EB` | Primary signal: lines, active nav, selected, links, live data |
| `--cyan-dim` | `#2A8F94` | Secondary lines, gridlines of charts, inactive series |
| `--cyan-glow` | `rgba(92,230,235,0.28)` | Glow and soft fills behind cyan elements |
| `--ember` | `#FF5A1F` | Primary action, emphasis bars, focused metric, E-stop |
| `--ember-dim` | `#A63A14` | Ember at rest / gradient base |
| `--ember-glow` | `rgba(255,90,31,0.30)` | Glow behind ember elements |
| `--amber` | `#E5B84B` | Gold data line, caution highlights, secondary chart series |

### 2.3 Status (semantic only, never decorative)

| Token | Hex | Meaning |
|-------|-----|---------|
| `--ok` | `#3DDC84` | Nominal, success, positive delta |
| `--warn` | `#FFB020` | Degraded, attention needed |
| `--crit` | `#FF3B30` | Failure, critical alarm, negative delta |
| `--info` | `#4C9AFF` | Informational log level |

### 2.4 Color rules

- Backgrounds: only tokens from 2.1. Never pure `#000` for panels, never white.
- Text on dark: `--text-hi` for values, `--text-mid` for content, `--text-lo` for labels.
- Accent usage ratio per screen: about 90% neutrals, 7% cyan, 2% ember, 1% status/amber.
- Positive/negative deltas use `--ok` / `--crit` with an arrow glyph (▲ ▼), never color alone.
- Gradients are allowed only as: (a) ember bar fill fading from `--ember-dim` at the bottom to `--ember` at the top, (b) a faint radial vignette on `--void`, (c) a 1px line fading to transparent at its ends.
- Fill under line charts: cyan at 12% opacity fading to 0% at the baseline.

---

## 3. Typography

### 3.1 Families

| Role | Stack | Character |
|------|-------|-----------|
| Display / labels / nav | `"Chakra Petch", "Rajdhani", "Bahnschrift", "Arial Narrow", sans-serif` | Angular, squared, technical, military |
| Data / logs / numerals | `"JetBrains Mono", "IBM Plex Mono", "SF Mono", ui-monospace, Menlo, monospace` | Monospace, tabular figures |
| Optional long text | `"Inter", system-ui, sans-serif` | Only for paragraph descriptions inside alarms/help |

Always set `font-variant-numeric: tabular-nums;` on anything numeric. Enable `font-feature-settings: "zero" 1;` on mono to get slashed/dotted zero when available.

### 3.2 Scale (px / line-height / weight / tracking)

| Token | Size | LH | Weight | Tracking | Family | Use |
|-------|------|----|--------|----------|--------|-----|
| `--fs-hero` | 44 | 1.0 | 500 | -0.02em | Display | One focal number per view |
| `--fs-metric` | 28 | 1.05 | 500 | -0.01em | Mono | KPI values |
| `--fs-title` | 15 | 1.2 | 600 | 0.04em | Display | Panel titles, page title |
| `--fs-body` | 12 | 1.5 | 400 | 0 | Inter/Mono | Descriptions, log messages |
| `--fs-data` | 11 | 1.35 | 400 | 0 | Mono | Table cells, key-value rows |
| `--fs-label` | 10 | 1.2 | 500 | 0.14em | Display | UPPERCASE field labels, section headers |
| `--fs-micro` | 9 | 1.2 | 500 | 0.12em | Mono | Units, tick labels, coordinates, IDs |

### 3.3 Type rules

- Labels are UPPERCASE with wide tracking, color `--text-lo`.
- Metric values are large mono in `--text-hi`; the unit or denominator beside it is `--fs-data` in `--text-lo` (example: `54` large, `/60` small and dim).
- A denominator pattern (`102 / 109`) renders the first number at metric size in a status or accent color and the second at label size in `--text-lo`.
- Never bold body text. Emphasis comes from color and size.
- Truncate with ellipsis; never wrap table cells or nav labels.
- Timestamps are `HH:MM:SS` in mono, `--text-lo`, wrapped in square brackets in logs: `[08:42:01]`.

---

## 4. Spacing, grid, and density

- Base unit: **4px**. Allowed spacing: 2, 4, 6, 8, 12, 16, 24. Do not use 10, 14, 20.
- Panel inner padding: 12px (dense), 16px (comfortable). Default 12px.
- Gap between panels: 1px (panels share hairline borders) or 8px (floating modules). Default: **1px gap on a `--line` colored container**, so borders look shared.
- Row height: table 24px, list item 28px, nav item 32px, input 28px, button 28px, top bar 40px.
- Layout is a **12-column grid** with fixed sidebar(s). Content area uses CSS grid with named areas.
- Density target: a 1440×900 viewport should show 8–14 distinct data modules at once. Empty space is a defect; fill with secondary telemetry.

---

## 5. Surfaces, borders, and shape

### 5.1 Radius
- `--r-0: 0` for panels and tables.
- `--r-1: 2px` for buttons, inputs, pills.
- `--r-2: 4px` maximum, only for modal containers.
- Circles only for status lamps, dials, radial gauges, and round icon buttons.

### 5.2 Borders
- Default panel: `1px solid var(--line)`.
- Active/focused: `1px solid var(--cyan)` plus `box-shadow: 0 0 0 1px var(--cyan-glow), 0 0 12px var(--cyan-glow)`.
- Dividers inside panels: `1px solid var(--line-faint)`.
- Dashed border `1px dashed var(--line)` for placeholders, drop zones, and disabled modules.

### 5.3 Corner treatments (signature look)
Use at least one on every major panel.

1. **Corner brackets**: four L-shaped marks, each 8px long and 1px thick, in `--line-strong` (or `--cyan` when active), placed at the outer corners of the panel, sitting slightly outside or flush with the border.
2. **Notched corner**: one corner (usually top-right or bottom-left) cut at 45° with `clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)`.
3. **Corner dots**: 2px squares in each corner in `--line-strong`.
4. **Edge tick strip**: a 1px line along an edge with small perpendicular ticks every 8px (4px tall) and every 40px (8px tall), like a ruler, in `--line`.

### 5.4 Shadows and glow
- No soft drop shadows for elevation. Depth is expressed by surface tokens and borders.
- Glow is allowed only on: active cyan elements, the ember primary action, the focal metric, live lamps. Glow spec: `0 0 12px <color>-glow`.

---

## 6. Background and atmosphere layers

Stack from bottom to top on the app root:

1. `--void` solid color.
2. **Dot grid**: `radial-gradient(circle, rgba(150,180,205,0.10) 1px, transparent 1px)` at `24px 24px`, opacity 0.6.
3. **Fine line grid** (optional, only inside chart/map/viewport areas): 1px lines every 40px in `--line-faint`.
4. **Vignette**: `radial-gradient(ellipse at 50% 30%, rgba(92,230,235,0.05), transparent 60%)` plus edge darkening `rgba(0,0,0,0.5)`.
5. **Scanlines** (very subtle): `repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0 1px, transparent 1px 3px)`; pointer-events none.
6. **Noise** (optional): 2–3% opacity monochrome noise texture.
7. Ambient glow: one large blurred ember or cyan radial (opacity ≤ 0.10) placed behind the focal panel.

Live viewports (camera, map, 3D/model render, waveform) sit on `--void`, are desaturated and high-contrast, and carry overlay UI (reticle, labels, coordinates).

---

## 7. Iconography and glyphs

- Icon style: 1.25px stroke, square caps, square joins, 14px or 16px, single color (`--text-mid`; `--cyan` when active).
- Never filled multicolor icons.
- Text glyphs used as UI: `▲ ▼ ● ○ ■ □ ◆ ▸ ▾ ⟨ ⟩ ⌖ ⏻ ⚠`, and box-drawing characters `┌ ┐ └ ┘ ─ │` for fallback brackets.
- Status lamp: 6px circle; nominal = `--ok` with 8px glow; idle = `--text-lo`; warn = `--warn`; crit = `--crit` blinking.
- Every metric card has a small icon in its top-right corner, 14px, `--text-lo`.

---

## 8. Data visualization language

| Element | Spec |
|---------|------|
| Line series | 1.5px stroke, `--cyan` primary, `--amber` secondary, `--cyan-dim` tertiary; no markers except the last point (4px filled circle with glow) |
| Area fill | Under primary line only, 12% → 0% vertical gradient |
| Axes | Left/bottom only, tick labels `--fs-micro` `--text-lo`; gridlines `--line-faint`, dashed horizontal |
| Reference line | 1px dashed `--text-lo` with a small label at the end (start/baseline/threshold marker) |
| Bar chart | Vertical **segmented/tall columns** 16–24px wide, 6–8px gaps. Track (background) is `--surface-2`. Fill uses ember gradient for the "success/primary" group and flat `--surface-3` gray for the "muted/failure" group. Header above shows label left, percentage right |
| Progress bar | 4px tall, track `--surface-2`, fill `--cyan` or `--ember`; percentage right-aligned above in mono |
| Segmented meter | Row of 10–20 tiny 2px-wide vertical ticks, filled ones colored, unfilled `--line` |
| Mini sparkline | 40×12px, 1px cyan line, no axes, placed beside a metric |
| Radial gauge | Ring of 2px stroke, background ring `--line`, value arc `--cyan`, with 60–120 tiny radial tick marks around the outside and a centered mono value |
| Dial / model viewport | Circular frame with a dotted outer ring, thin rotating tick ring, center visualization (point cloud, mesh, or waveform) in cyan on void |
| Node matrix | Grid of small squares/dots (3–4px) on a 12–16px pitch, some highlighted with a 1px cyan outline box, connected by thin lines; used for topology or heatmap |
| Heat cells | 12–16px squares, opacity ramp of cyan or ember from 10% to 100% |

Rules: no 3D charts, no pie charts (use radial gauge or segmented bar), no rainbow palettes, no legend boxes; label series directly at line ends or with 6px colored dashes.

---

## 9. Component library

### 9.1 App shell
- Full viewport, `--void` background, layered atmosphere from section 6.
- Structure: **top bar** (40px) / **left sidebar** (200–220px) / **main canvas** / **right rail** (260–300px, optional) / **bottom dock or status bar** (24px, optional).
- The whole app can be framed by a 1px `--line` outer border with corner brackets at the four extremes of the viewport and a faint faded horizontal rule under the top bar.

### 9.2 Top bar
- Left: logo mark (square outline glyph, 18px, cyan) + product wordmark in display font `--fs-title`, then a context selector (dropdown showing current site/sector/scope with a caret ▾).
- Center (optional): tab strip.
- Right: shift/clock block (label `SHIFT` micro above `HH:MM:SS` mono), a live status pill, an outlined danger button (E-STOP style: 1px `--ember` border, ember text, small hollow circle icon, uppercase label).
- Bottom edge: 1px `--line`.

### 9.3 Sidebar navigation
- Section headers: `--fs-label`, `--text-lo`, uppercase, 12px top margin (examples: MONITOR, ANALYSIS).
- Item: 32px tall, 12px horizontal padding, 16px icon + label in `--fs-data` display font.
- Default: `--text-mid`. Hover: `--surface-2` background, `--text-hi`.
- **Active**: `--surface-3` background, `--text-hi`, 2px left bar in `--ember` (or `--cyan`), icon tinted the same color.
- Optional count badge on the right: mono, 9px, `--surface-2` background, 1px `--line` border.
- Top of sidebar: a "view context" block: micro label VIEW CONTEXT, then a bold title with a small grid icon.
- Bottom of sidebar: a compact status widget (label left, value right in ember, thin progress bar below).
- Nested groups collapse with ▾ / ▸ carets, indented 16px.

### 9.4 Breadcrumb / page header
- Path segments in `--text-lo`, separated by `/`, the last segment in `--ember` or `--text-hi`.
- On the far right, a status pill: 1px border in `--ok` at 40% alpha, text `--ok`, 9px uppercase mono, leading 4px dot (example text: `SYSTEM OPTIMAL`).

### 9.5 Panel (the core container)
```
┌ TITLE (label style)                     [actions/tabs] ┐
│ 1px faint divider                                       │
│  content                                                │
└ footer meta (micro, optional)                    ⟩⟩ ────┘
```
- Background `--surface-1`, border `--line`, corner bracket or notch per 5.3.
- Header height 28–32px: title in `--fs-label` uppercase `--text-lo` (or `--fs-title` for major panels), right side holds a segmented control, live badge, or icon buttons.
- Optional tag chip on top-left that sits on the border (small filled block in `--cyan` with `--void` text, 9px uppercase) to name a region or mode.
- Optional ID caption in the top-right corner in `--fs-micro` (`ID: 00-000`).

### 9.6 KPI strip / metric cell
- Horizontal row of 4–6 cells separated by 1px vertical `--line`.
- Cell: label (uppercase, `--text-lo`) at top-left, icon top-right, value (`--fs-metric` mono `--text-hi`) below, denominator/unit small and dim on the same baseline, and a delta or caption line (`▲ 1.2%` in `--ok`) under or beside it.
- Focal cell can have the value in `--ember` or `--cyan` with glow.

### 9.7 Key-value table (telemetry list)
- Two or four columns: KEY (mono, `--text-mid`, uppercase or lowercase snake_case) | VALUE (mono, `--text-hi`, right-aligned) | UNIT (`--fs-micro`, `--text-lo`).
- Row height 20–22px, zebra none, `--line-faint` separators, one highlighted row (`--surface-3` with 1px `--cyan` outline) to indicate selection.
- Long lists scroll inside the panel with a 4px custom scrollbar (`--line-strong` thumb on `--surface-0` track, thumb square).

### 9.8 Data table
- Header row: 24px, `--fs-label`, `--text-lo`, uppercase, bottom border `--line`; sortable columns show ▲/▼ in cyan.
- Body rows: 26px, `--fs-data` mono, separators `--line-faint`, hover `--surface-2`.
- Side/verdict cells use small tinted chips: `BUY`/`OK` chip = `--ok` text on 12% `--ok` background; `SELL`/`FAIL` chip = `--crit` on 12% `--crit`. Chips are 2px radius, 9px uppercase.
- Numeric columns right-aligned; positive numbers `--ok`, negative `--crit`; zero/neutral `--text-mid`.
- The last visible rows fade to transparent (mask gradient) when the table overflows.

### 9.9 Log console
- Background `--void`, border `--line`, mono `--fs-data`.
- Line format: `[HH:MM:SS]  LEVEL  message`. Timestamp `--text-lo`; level colored (`INFO` `--info`, `WARN` `--warn`, `ERR` `--crit`, `OK`/`SUCCESS` `--ok`); message `--text-mid`.
- Bottom: command prompt row: `>` prompt glyph in `--ember`, placeholder text `--text-lo`, blinking block cursor (1s steps).
- New lines append at the bottom with a 120ms opacity fade; the list auto-scrolls unless the user scrolled up.

### 9.10 Alert / timeline list
- Vertical 1px line at the left with 6px nodes; node colors indicate state (`--text-lo` past, `--ember` highlighted/latest, `--crit` critical).
- Each item: title `--fs-data` `--text-hi`, relative time `--fs-micro` `--text-lo` beneath.

### 9.11 Alarm card
```
▲ ID:42953                          [ chip grid ]
  MAIN_BEARING_TEMP
  DUE DATE: 2024-01-28
  ───────────────────── (cyan 1px line, 40% width)
  DESC: descriptive paragraph in Inter 11px --text-mid …
```
- Warning triangle in `--crit` or `--warn`, ID in `--fs-micro`, title in display font 14px `--text-hi`, uppercase snake_case.
- Right side: a 4×N chip grid of tiny codes (mono 8px); some cells filled with `--cyan` at 20% and cyan text, some with `--crit` text, the rest `--text-lo`.
- Stacked cards separated by `--line`; the list scrolls.

### 9.12 Status pill / badge
- Height 18px, padding 0 8px, radius 2px, 1px border at 40% alpha of its color, background 8% alpha of its color, text 9px mono uppercase, optional 4px leading dot.
- Variants: ok, warn, crit, info, neutral, ember, cyan.

### 9.13 Buttons
| Variant | Style |
|---------|-------|
| Primary | Background transparent or `--ember` at 10%, 1px `--ember` border, `--ember` text, uppercase 10px tracking 0.14em; hover fills `--ember` at 20% with ember glow |
| Secondary | 1px `--line-strong` border, `--text-mid` text; hover border `--cyan`, text `--text-hi` |
| Ghost | No border, `--text-mid`; hover `--surface-2` |
| Danger (E-stop) | 1px `--crit`/`--ember` border, hollow circle icon left, uppercase label; hover solid fill at 20% |
| Quick action tile | 56–64px tall bordered tile, icon (+, upload) above uppercase label, centered |
| Icon button | 28×28 square, 1px `--line`, centered 14px icon |

All buttons: 28px height, radius 2px, no shadow, `transition: 120ms`, pressed state translates 1px and darkens to `--surface-3`.

### 9.14 Segmented control / tabs
- Tab strip: uppercase 10px labels, inactive `--text-lo`, active `--text-hi` with a 2px bottom line in `--cyan` and a faint cyan glow strip.
- Segmented control (e.g. camera or mode switch): joined 1px-border cells, active cell filled `--surface-3` with `--text-hi`, others `--text-lo`.
- Time-range chips (1D 1W 1M …): small 22px squares/rectangles, active filled `--surface-3` with cyan text.

### 9.15 Inputs, selects, sliders, toggles
- Input: 28px, `--surface-2` background, 1px `--line`, mono 11px, placeholder `--text-lo`; focus border `--cyan` + glow. Prefix label in micro caps inside the field.
- Select: same as input with ▾ caret at right; dropdown menu is a panel with `--surface-1`, 1px `--line-strong`, items 26px, hovered item `--surface-3`.
- Slider: 2px track `--line`, filled portion `--cyan`, thumb 10px square rotated 45° (diamond) in `--cyan`, value readout mono above the thumb.
- Toggle: 28×14 rectangle, 2px radius; off = `--surface-2` with `--text-lo` square knob; on = `--cyan` at 20% with cyan knob and glow.
- Checkbox/radio: 12px square (radio: circle), 1px `--line-strong`, checked = cyan fill with `--void` glyph.
- Search field: leading magnifier icon, optional keyboard hint chip at the right (`/`).

### 9.16 Live viewport with overlay (camera / render / map)
- Frame on `--void`, content desaturated, contrast up.
- Overlay elements: top-left red-dot `LIVE` label; top-right source switch chips (`CAM-01` `CAM-02` `LIDAR`); a **reticle box** (1px `--ember` rectangle with 4 tiny corner ticks) around detected objects, with a small ID tag beneath it in `--ember` mono 9px; crosshair `+` at center in `--line-strong`; coordinate and FPS readouts at bottom corners in micro caps.
- Under the viewport a 4-cell telemetry footer (label micro above, value mono below; the one value that needs attention is colored `--ember`).

### 9.17 Floor map / topology
- Dotted grid canvas; rectangles for zones (1px `--line-strong`, no fill); nodes as 6px white/cyan circles; connectors as 1px lines with 90° or 45° bends; the "active" node has an ember ring and label.

### 9.18 Job/queue cards
- Stacked cards 44px tall, 2px left color bar (`--ember` in progress, `--line-strong` queued), title mono `--text-hi`, subtitle `--fs-micro` `--text-lo`, status caps and percentage right-aligned (`IN PROGRESS` in ember).

### 9.19 Modal / popup / tooltip
- Modal: centered `--surface-1` panel, 1px `--line-strong`, corner brackets in cyan, backdrop `rgba(5,7,10,0.72)` with 2px blur, header with title + close `✕`, footer with right-aligned buttons.
- Tooltip: `--surface-3`, 1px `--line-strong`, 10px mono, 6px 8px padding, no arrow or a 4px square notch.
- Toast: bottom-right, 280px wide, 2px left bar in status color, auto-dismiss 4s.

### 9.20 Floating dock (optional)
- Pill-shaped bottom-center bar (only allowed circle/pill exception), `--surface-2` at 85% with backdrop blur, 1px `--line`, 5–7 icon buttons 32px, the active one highlighted with `--surface-3` and cyan icon.

### 9.21 Ticker / marquee strip
- 20–24px full-width strip under the top bar or above the footer, mono 10px, items separated by `│`, values colored by delta, continuous slow left scroll (60s loop), pauses on hover.

---

## 10. Motion

| Interaction | Spec |
|-------------|------|
| Hover | 120ms, color/border only, no scale |
| Press | 60ms, 1px translate, darker surface |
| Panel mount | 240ms: border draws in (stroke-dash from corners), content fades in, staggered 40ms per panel, plays once at load |
| Value change | Number flashes to `--text-hi` with a 200ms cyan underline pulse, then settles |
| Live lamp | Nominal: 2.4s slow pulse of glow (opacity 1 → 0.5). Critical: 0.8s hard blink |
| Cursor | Block cursor, 1s `steps(2)` blink |
| Ring/dial | Thin outer tick ring rotates 1 turn per 60s, linear |
| Scan sweep | Optional single 1px cyan line traveling across a viewport every 6s at 30% opacity |
| Charts | Line draws left to right over 600ms on first render; afterwards updates are smooth 250ms tweens |
| Log/ticker | New line fade-in 120ms |

Easing: `cubic-bezier(0.2, 0, 0, 1)` for entrances, `linear` for continuous loops. Respect `prefers-reduced-motion`: disable rotation, sweep, marquee, blink, and draw-in; keep instant state changes.

---

## 11. States and feedback

| State | Visual |
|-------|--------|
| Default | Tokens above |
| Hover | Surface up one step (`--surface-2`), text to `--text-hi` |
| Active/selected | `--surface-3`, cyan or ember marker, glow only on the marker |
| Focus (keyboard) | 1px `--cyan` outline + 2px offset ring in `--cyan-glow`; always visible |
| Disabled | 40% opacity, dashed border, `not-allowed` cursor |
| Loading | Skeleton bars 8px tall in `--surface-2` with a moving 30% cyan shimmer; or text `LOADING…` with blinking block cursor |
| Empty | Dashed panel border, centered micro-caps message stating what is missing and the action to take (example: `NO SIGNAL — CONNECT A SOURCE`) |
| Error | Border `--crit` at 60%, crit icon, message: what failed + how to fix; no apologies |
| Success | `--ok` pill or 2px left bar, message repeats the action verb (example: `Deployed`) |
| Stale data | Value dims to `--text-lo`, timestamp turns `--warn` |

---

## 12. Layout blueprints

### 12.1 Command dashboard (default)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ▢ LOGO  [Scope ▾]                     TABS          SHIFT 12:00:00  [ E-STOP ]│  40px
├─────────┬──────────────────────────────────────────────────────┬─────────────┤
│ CONTEXT │ Breadcrumb / Path                        [STATUS PILL]│ SYSTEM      │
│ ─────── ├──────────┬──────────┬──────────┬─────────────────────┤ HEALTH      │
│ MONITOR │ KPI 1    │ KPI 2    │ KPI 3    │ KPI 4               │ (3 meters)  │
│  ▸ item │          │          │          │                     ├─────────────┤
│  ▸ item ├──────────┴──────────┴──────────┴─────────────────────┤ ALERTS      │
│ ANALYSIS│ LIVE VIEWPORT + overlay       │ PRIMARY CHART / BARS   │ (timeline)  │
│  ▸ item │ (reticle, chips, telemetry)   ├────────────────────────┤             │
│  ▸ item │                               │ LOG CONSOLE            │             │
│ ─────── ├───────────────────────────────┴────────┬───────────────┤ QUICK       │
│ STATUS  │ MAP / TOPOLOGY                         │ JOB QUEUE     │ ACTIONS     │
└─────────┴────────────────────────────────────────┴───────────────┴─────────────┘
```
Grid template: `grid-template-columns: 208px 1fr 280px; grid-template-rows: 40px 1fr;` Main area is itself a 12-col grid with `gap: 1px` on a `--line` background so panel borders merge.

### 12.2 Analytics wall (maximum density)
```
┌ HEADER + tag chip ───────────────────────────────────────────────────────────┐
├──────────────┬────────────────────────────┬──────────────────────────────────┤
│ MODEL DIAL   │ HEALTH LINE CHART (wide)   │ RUNTIME METRICS                  │
│ (round view) │ axes + live badge          │ 2 progress bars + 2 KV tables    │
├──────────────┼────────────────────────────┼──────────────────────────────────┤
│ ACTIVE NODES │ STAT TRIPLET (102/109 ...) │ ALARM LIST (scrolling cards)     │
│ node matrix  │ ALARM CARD                 │                                  │
└──────────────┴────────────────────────────┴──────────────────────────────────┘
```
Use when the brief asks for "everything at once". Three equal-ish columns, two rows, every panel with a corner treatment and a caption ID.

### 12.3 Data-first workspace (account / performance / history)
```
┌────────┬─────────────────────────────────────────────────────────────────────┐
│ SIDE   │ TITLE + subtitle          [filters] [primary action]                │
│ NAV    ├───────────────────────────────┬─────────────────────────────────────┤
│ groups │ P/L block + bar histogram     │ BALANCE / VALUE big line chart      │
│ list   ├───────────────────────────────┴─────────────────────────────────────┤
│ watch  │ 7-cell OBJECTIVES strip (metric + mini sparkline each)              │
│ list   ├─────────────────────────────────────────────────────────────────────┤
│        │ HISTORY TABLE (fading bottom rows)                                  │
└────────┴──────────────────────────── floating dock ───────────────────────────┘
```

### 12.4 Alignment
- Labels, keys, text: left-aligned. Numbers: right-aligned in tables, left-aligned in KPI cells.
- Headers and page titles: left-aligned. Never center body content, except empty states and the dial center value.

---

## 13. Copywriting voice

- Labels: uppercase, 1–3 words (`ACTIVE UNITS`, `CYCLE TIME`, `LAST 24H`).
- Descriptions: sentence case, factual, active voice, no marketing tone.
- Status words: `NOMINAL`, `DEGRADED`, `CRITICAL`, `ONLINE`, `QUEUED`, `IN PROGRESS`, `SYNCED`.
- IDs and codes in mono: `ID: 42953`, `UNIT_K9-22`, `NODE 4`.
- Buttons name the exact action: `Deploy`, `Add unit`, `Save changes`; the confirmation repeats it: `Deployed`.
- Errors: what happened + what to do. Example: `Link lost on node 4. Check the connection and retry.`
- Placeholder content must look real: plausible numbers with units, timestamps, IDs. Never lorem ipsum.

---

## 14. Responsive behavior

| Breakpoint | Behavior |
|------------|----------|
| ≥ 1440 | Full layout, right rail visible |
| 1024–1439 | Right rail collapses into a top drawer; KPI strip stays 4-across |
| 768–1023 | Sidebar becomes 48px icon rail; panels stack in 2 columns |
| < 768 | Single column; top bar shrinks; sidebar becomes bottom dock; tables scroll horizontally inside their own container; viewports keep 16:9 |

Body never scrolls sideways. Wide content scrolls inside its own panel.

---

## 15. Accessibility floor

- Text contrast ≥ 4.5:1 for `--text-mid` and above; `--text-lo` is only for non-essential labels and must stay ≥ 3:1 against its surface.
- Never rely on color alone: pair status color with a glyph (▲ ▼ ● ⚠) or text.
- Visible keyboard focus everywhere (see section 11).
- Minimum hit area 28×28px (dense mode), 36×36px on touch.
- ARIA live regions for logs, alerts, toasts. Charts get a text summary or accessible data table.
- Honor `prefers-reduced-motion` and `prefers-color-scheme` (this system is dark-only; do not auto-switch to light).

---

## 16. Reference tokens (copy-paste CSS)

```css
:root {
  /* base */
  --void: #05070A;
  --surface-0: #080B10;
  --surface-1: #0B1017;
  --surface-2: #101720;
  --surface-3: #16202B;
  --line-faint: rgba(150,180,205,0.08);
  --line: rgba(150,180,205,0.16);
  --line-strong: rgba(150,180,205,0.32);
  --text-hi: #E8EEF4;
  --text-mid: #9AA9B8;
  --text-lo: #5E6C7A;

  /* accents */
  --cyan: #5CE6EB;
  --cyan-dim: #2A8F94;
  --cyan-glow: rgba(92,230,235,0.28);
  --ember: #FF5A1F;
  --ember-dim: #A63A14;
  --ember-glow: rgba(255,90,31,0.30);
  --amber: #E5B84B;

  /* status */
  --ok: #3DDC84;
  --warn: #FFB020;
  --crit: #FF3B30;
  --info: #4C9AFF;

  /* type */
  --font-display: "Chakra Petch","Rajdhani","Bahnschrift","Arial Narrow",sans-serif;
  --font-mono: "JetBrains Mono","IBM Plex Mono","SF Mono",ui-monospace,Menlo,monospace;
  --font-text: "Inter",system-ui,sans-serif;

  /* shape + space */
  --r-1: 2px;
  --r-2: 4px;
  --u: 4px;
  --row-table: 24px;
  --row-nav: 32px;
  --control-h: 28px;
  --topbar-h: 40px;

  /* motion */
  --t-fast: 120ms;
  --t-mid: 240ms;
  --ease: cubic-bezier(0.2, 0, 0, 1);
}

html, body {
  background: var(--void);
  color: var(--text-mid);
  font: 400 12px/1.5 var(--font-text);
  -webkit-font-smoothing: antialiased;
}

.num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; color: var(--text-hi); }
.label {
  font: 500 10px/1.2 var(--font-display);
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-lo);
}

.panel {
  position: relative;
  background: var(--surface-1);
  border: 1px solid var(--line);
}
/* corner brackets */
.panel::before, .panel::after {
  content: ""; position: absolute; width: 8px; height: 8px;
  border: 1px solid var(--line-strong); pointer-events: none;
}
.panel::before { top: -1px; left: -1px; border-right: 0; border-bottom: 0; }
.panel::after  { bottom: -1px; right: -1px; border-left: 0; border-top: 0; }
.panel.is-active::before, .panel.is-active::after { border-color: var(--cyan); }

.panel--notch {
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
}

.dot-grid {
  background-image: radial-gradient(circle, rgba(150,180,205,0.10) 1px, transparent 1px);
  background-size: 24px 24px;
}

.btn {
  height: var(--control-h); padding: 0 12px; border-radius: var(--r-1);
  font: 500 10px/1 var(--font-display); letter-spacing: 0.14em; text-transform: uppercase;
  background: transparent; color: var(--text-mid); border: 1px solid var(--line-strong);
  transition: all var(--t-fast) var(--ease);
}
.btn:hover { border-color: var(--cyan); color: var(--text-hi); }
.btn--primary { color: var(--ember); border-color: var(--ember); background: rgba(255,90,31,0.10); }
.btn--primary:hover { background: rgba(255,90,31,0.20); box-shadow: 0 0 12px var(--ember-glow); }
.btn:focus-visible { outline: 1px solid var(--cyan); outline-offset: 2px; }

.pill {
  display: inline-flex; align-items: center; gap: 6px; height: 18px; padding: 0 8px;
  border-radius: var(--r-1); font: 500 9px/1 var(--font-mono); text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ok); border: 1px solid rgba(61,220,132,0.4); background: rgba(61,220,132,0.08);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

---

## 17. Final checklist (agent must verify before shipping)

- [ ] Background is `--void`; panels use `--surface-*`; no pure black or white.
- [ ] Only two luminous accents dominate: cyan (structure/data) and ember (action/emphasis).
- [ ] Every major panel has a 1px border and at least one corner treatment.
- [ ] All numbers are monospace with tabular figures; labels are uppercase with wide tracking.
- [ ] Radii ≤ 4px (circles only for lamps, gauges, dials, the dock).
- [ ] At least 8 distinct data modules are visible at 1440×900; no dead space.
- [ ] Charts use thin lines, segmented bars, radial gauges, node matrices; no pie or 3D.
- [ ] Status is always color + glyph/text.
- [ ] Live cues exist: clock, status lamp, streaming log, cursor, or ticker.
- [ ] Only one focal glow element per view.
- [ ] Keyboard focus visible; reduced motion respected.
- [ ] Placeholder copy is realistic, terse, and in machine voice.

If any box is unchecked, the result is not yet on-spec.
