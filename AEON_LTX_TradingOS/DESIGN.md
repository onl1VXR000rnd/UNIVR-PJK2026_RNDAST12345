# 🎨 AEON_LTX TradingOS — WebUI Design & UX Blueprint (v1.0)

> **Status:** 🟢 Locked for Phase 1 UI/UX Implementation  
> **Coding:** OOP Architecture, Next Gen Framework, Modern UI/UX
> **Target Vibe:** Sci-Fi Quant Terminal | Dark Mode Native | Glassmorphism | Real-Time Reactive  
> **Design Philosophy:** _Tactical HUD, High-Contrast Data Density, "Glass & Neon" Aesthetics._  
   **Visual Style:** Institutional Grade, Industrial Sci-Fi, Zero-Trust Visualization.
> **Audience:** Retail Quant Traders, Algorithmic Devs, AI Trading Enthusiasts

---

## 🧱 1. Design System (Sci-Fi Terminal Vibe)

| Properti | Nilai / Token | Keterangan |
|----------|--------------|------------|
| **Background Base** | `#0B0F19` (Deep Space) | Warna utama canvas & body |
| **Panel BG** | `#111827` + `backdrop-blur-md` + `bg-opacity-80` | Glassmorphism halus, depth layer |
| **Border / Divider** | `rgba(255,255,255,0.08)` + `1px solid` | Subtle grid lines, panel separation |
| **Primary Accent** | `#06B6D4` (Cyan Neon) | Tombol aktif, WS indicator, highlight focus |
| **Profit / BUY** | `#10B981` (Neon Green) | PnL positif, sinyal beli, success state |
| **Loss / SELL / VETO** | `#EF4444` (Neon Red) | PnL negatif, hard veto, error/alert state |
| **AI / Logic** | `#8B5CF6` (Electric Purple) | Panel DeepSeek & Jev Cascade, AI badges |
| **Typography UI** | `Inter` (400–600) | Label, navigation, buttons, tooltips |
| **Typography Data** | `JetBrains Mono` (500) | Angka, log, JSON preview, timestamps |
| **Grid / Spacing** | `8px` base unit, `gap-4` panel spacing | Consistent rhythm, bento alignment |
| **Effects** | `shadow-[0_0_12px_rgba(6,182,212,0.25)]`, `hover:scale-[1.02]`, `transition-all duration-300` | Futuristic glow & micro-interactions |

> Alih-alih sekadar "Dark Mode", kita masuk ke _Deep Space_ dengan aksen _Neon Tactical_.

|Properti|Hex / Tailwind Token|Fungsi & Kesan|
|---|---|---|
|**Deep Space BG**|`#02040A` (`bg-[#02040A]`)|_Void black_. Kanvas utama tanpa batas.|
|**HUD Panel**|`#0A0F1C` (`bg-[#0A0F1C]/80`)|Panel transparan dengan `backdrop-blur` tipis.|
|**Grid / Borders**|`#1E293B` (`border-slate-800`)|Garis tipis `0.5px` atau `1px` untuk struktur teknikal.|
|**Neon Cyan (Active)**|`#00F0FF` (`text-cyan-400`)|Sinyal _BUY_, _Online_, _System OK_. Glowing effect.|
|**Neon Amber (Logic)**|`#FFBF00` (`text-amber-400`)|Sinyal _AI THINKING_, _Pending_, _Warning_.|
|**Neon Red (Critical)**|`#FF003C` (`text-rose-500`)|Sinyal _SELL_, _VETO_, _ERROR_. Pulse animation.|
|**Data Text**|`#E2E8F0` (`text-slate-200`)|Teks utama yang sangat kontras dan mudah dibaca.|
|**Sub-Data**|`#94A3B8` (`text-slate-400`)|Label, timestamp, data sekunder.|

---

### Typography: "Industrial Tech"
Kombinasi font buat ngasih kesan "mesin canggih yang terbaca".

- **Headers / Labels:** `Rajdhani` atau `Chakra Petch` (Squared, Tech feel).
    - _Class:_ `font-sans uppercase tracking-widest text-xs font-bold`.
- **Data / Numbers:** `JetBrains Mono` atau `Space Mono`.
    - _Class:_ `font-mono tabular-nums tracking-tight`.
- **Terminal Logs:** `Fira Code` (untuk log system).


---

## 📐 2. Layout Architecture (Bento Grid + Responsive)

Menggunakan **CSS Grid 12 kolom** dengan breakpoint adaptif:
- `Desktop (≥1440px)`: 3-panel utama (`col-span-3 / col-span-6 / col-span-3`)
- `Tablet (1024px–1439px)`: 2 kolom (Chart full width, side panels stacked)
- `Mobile (<768px)`: Single column, collapsible panels, bottom nav for trade actions

### 🔹 Top Bar (`fixed top-0 left-0 right-0 h-16 z-50`)
- **Left:** Logo `AEON_LTX` + Connection Status (` WS Connected | 12ms`)
- **Center:** Symbol Switcher (`XAUUSD ▼`) + Timeframe Pills (`M15 • H1 • H4 • D1`)
- **Right:** Trading Mode Toggle (`Manual | Semi-Auto | 🔮 Full AI Agentic`) + User/Settings

###  Main Content (`grid grid-cols-12 gap-4 p-4 pt-20`)
| Kolom | Panel | Fungsi |
|-------|-------|--------|
| `col-span-3` | 📊 Market & Order Book | Live depth, bid/ask bars, volume profile |
| `col-span-6` | 📈 Live Chart & AI Nexus | TradingView chart + stacked AI decision panel |
| `col-span-3` |  Quick Trade & Telemetry | Lot/TP/SL controls, execution log, system status |

---

## 🧩 3. Core Panels Breakdown (Component Specs)

### 🔹 A. AI Nexus Panel (The Brain)
- **DeepSeek Research Status:** Pill indicator (`🔍 Researching...` → `✅ Cached (2h ago)`)
- **JEV Cascade Visualizer:** 3-step progress bar (`Gatekeeper → Sniper → Execution`) dengan animasi sequential fill
- **Confidence Meters:** 
  - `BUY Probability`: Radial gauge (0–100%), warna dinamis (`<50% gray`, `50–75% yellow`, `>75% green`)
  - `Risk Score`: 1–5 bar indicator dengan tooltip penjelasan
- **Veto Indicator:** Red pulsing badge jika Python hard-veto aktif (`🛑 VETO: Spread > 30pts`)

### 🔹 B. Live Chart & Market Data
- **Chart:** `@tradingview/lightweight-charts` dengan tema custom dark, candlestick + SMA20 overlay
- **Controls:** Timeframe selector, crosshair sync, zoom/pan smooth
- **Live Price Ticker:** Floating badge top-right chart, pulse animation on new tick

### 🔹 C. Order Book & Depth
- **Visual:** Horizontal bar chart (left=bid green, right=ask red), real-time update via WebSocket
- **Data:** Price, Amount, Total columns, hover tooltip untuk cumulative depth
- **Animation:** Smooth width transition (`framer-motion` `layout` prop)

### 🔹 D. Quick Trade & Execution
- **Mode Switcher:** Toggle yang mengubah layout (Manual: full controls, Semi: auto-TP/SL, AI: read-only + override button)
- **Inputs:** Lot slider (0.01–1.0), TP/SL auto-calc based on ATR, percentage buttons (25%, 50%, 75%, 100%)
- **Execute Button:** 
  - `BUY`: Green gradient, `SELL`: Red gradient
  - Click: Ripple effect + loading spinner → success toast (` Order Filled @ 2645.50`)
  - Disabled state: Grayed out + tooltip reason (`⏳ Awaiting Jev Signal...`)

### 🔹 E. Telemetry & System Logs
- **Style:** Terminal-like, `bg-black/40`, `font-mono`, `text-xs`
- **Color Coding:** `INFO` (cyan), `WARN` (yellow), `VETO` (red), `EXEC` (green)
- **Features:** Auto-scroll, filter by type, copy JSON payload, virtualized list (1000+ entries smooth)
- **Sample Entry:** `[14:32:10] 🧠 DeepSeek cache refreshed | Macro: CAUTIOUS_BEARISH`

---

## 🧩 Component Concept: "Tactical Trading"

### 🔹 A. AI Nexus Panel → "Quantum Core Visualizer"

- **Bukan lagi progress bar biasa**, tapi **Radar / Sonar**.
- Saat Jev AI mikir (Stage 1 -> Stage 2), muncul animasi _circular sweep_ (garis radar muter) di tengah panel.
- Tampilkan probabilitas sebagai **Hexagonal Data Cluster** atau **Radial Gauge** yang pucuknya berdenyut (glowing).
- Teks status: `>> ANALYZING CONFLUENCE... [OK]` dengan efek _typing_.

### 🔹 B. Live Chart → "Tactical Overlay"

- Hapus _grid lines_ bawaan TradingView.
- Candlestick diwarnain _Neon Cyan_ (Bullish) & _Hollow Red_ (Bearish) dengan _outline_ tipis.
- Tambahin elemen visual: Garis horizontal tipis di harga _Entry_ dan _TP/SL_ dengan label kecil di ujung kanan.

### 🔹 C. Quick Trade → "Command Pads"

- Tombol BUY/SELL bentuknya bukan bulat, tapi **Polygonal / Cut-corner buttons**.
- Hover effect: Tombol jadi lebih terang + _glitch effect_ dikit (geser 1px).
- Tambahin indikator **"SYSTEM ARMED"** (Green Dot) sebelum tombol bisa diklik.
- Saat eksekusi: Muncul overlay _flash_ putih sekilas + suara _click_ mekanis (opsional).

### 🔹 D. Telemetry / Logs → "Data Stream"

- Tampilan seperti **Terminal Linux** di film hacker.
- Background hitam pekat, teks hijau/amber.
- Scrollbar kustom yang tipis dan transparan.
- Ada timestamp `[HH:MM:SS]` di setiap baris log dengan font _monospace_.

---

## 🎬 Interaction: "Boot Sequence" & Feedback

- **Page Load:** Jangan langsung muncul semua. Ada animasi "System Booting..." 0.5 detik, baru panel muncul satu per satu dengan efek _slide-down_ cepat.
- **New Data:** Angka harga yang berubah, warnanya _flash_ sejenak (kuning/merah) sebelum kembali normal, biar user sadar ada tick baru.
- **AI Decision:** Pas Jev AI kasih sinyal, panel "Quantum Core" meledak _pulse_ warna cyan/merah sesuai arah sinyal.


---

## 🎬 4. Interaction & Animation Guidelines

| Event | Animation / UX Behavior |
|-------|------------------------|
| **Page Load** | Staggered `fade-in + slide-up` (0.1s delay per panel) |
| **WebSocket Connect** | Top bar status pulse green + toast `🟢 Live Feed Active` |
| **New Tick / Price Update** | Number count-up animation, subtle background flash on changed cells |
| **AI Decision Ready** | Cascade steps light up sequentially, confidence gauge sweeps to value |
| **Trade Execution** | Button ripple → spinner → success toast + log entry slides in from right |
| **Veto / Error** | Panel border pulses red, shake animation on execute button, modal explanation |
| **Mode Switch** | Smooth layout transition (`framer-motion` `layout`), controls fade/slide accordingly |

---

## 🛠️ 5. Tech Stack & Implementation Notes

| Layer | Recommendation | Alasan |
|-------|---------------|--------|
| **Framework** | `Next.js 14 (App Router)` atau `Vite + React` | SSR/SSG optional, fast HMR, ecosystem matang |
| **Styling** | `Tailwind CSS` + `clsx`/`tailwind-merge` | Utility-first, consistent design tokens, easy dark mode |
| **State** | `Zustand` (UI state) + `React Query` (async) + `WebSocket hook` | Lightweight, predictable, real-time ready |
| **Charts** | `@tradingview/lightweight-charts` | Performant, native canvas, easy theming |
| **Animations** | `framer-motion` + `@react-spring/web` | Declarative, GPU-accelerated, layout transitions |
| **UI Primitives** | `shadcn/ui` (headless) + custom overrides | Accessible, unstyled base, mudah di-theming sci-fi |
| **Icons** | `lucide-react` | Clean, consistent stroke, tree-shakeable |
| **Performance** | Virtualized logs (`@tanstack/react-virtual`), memoized chart updates, WebSocket throttling (100ms min) | Prevents render thrashing, smooth 60fps |

---

## 📦 6. Suggested File Structure

```
src/
├── app/                  # Next.js routes or Vite entry
├── components/
│   ├── layout/           # TopBar, GridWrapper, ResponsiveBreakpoints
│   ├── panels/
│   │   ├── ai-nexus.tsx  # DeepSeek status, Jev cascade, confidence gauges
│   │   ├── live-chart.tsx# TradingView wrapper, timeframe sync
│   │   ├── order-book.tsx# Bid/ask bars, depth visualization
│   │   ├── quick-trade.tsx# Mode toggle, lot/TP/SL, execute button
│   │   └── telemetry.tsx # Virtualized log, color-coded entries
│   ├── ui/               # shadcn primitives + sci-fi overrides (Button, Badge, Gauge, Toast)
│   └── shared/           # WebSocketProvider, ThemeToggle, LoadingSkeleton
├── hooks/                # useWebSocket, useMarketData, useJevCascade
├── store/                # zustand slices (ui, trade, system)
├── lib/                  # utils, formatters, constants, types
└── styles/               # globals.css, theme.css, animations.css
```


---

## 🤖 7. Ready-to-Use Prompt for Coding Agent / Tim

> *"Build a production-ready React WebUI for 'AEON_LTX TradingOS' using Vite + TypeScript + Tailwind CSS + shadcn/ui + framer-motion. Implement a sci-fi dark theme with cyan/neon accents, glassmorphism panels, and a 12-column bento grid layout. Include: TopBar with WS status & mode toggle, AI Nexus panel (DeepSeek cache status, Jev cascade visualizer, confidence radial gauges, veto indicator), Live Chart using @tradingview/lightweight-charts with dark theme, Order Book with animated bid/ask bars, Quick Trade widget with mode-aware controls (Manual/Semi/AI), and a virtualized Telemetry log with color-coded entries. Use Zustand for state, React Query for async, and a custom WebSocket hook for real-time ticks. Ensure all animations are GPU-accelerated, components are memoized, and the UI is fully responsive. Follow the attached DESIGN.md spec strictly. Output clean, typed, and documented code."*

---


> **Catatan Tim:**  
> 🔹 Semua komponen wajib `memoized` & `debounced` untuk prevent render thrashing.  
> 🔹 Gunakan `requestAnimationFrame` untuk gauge/animations, hindari `setInterval` berat.  
>  WS reconnect logic wajib ada + fallback polling 2s jika WS drop.  
>  Mock data boleh dipakai di Phase 1, tapi struktur state harus siap swap ke live feed tanpa refactor besar.

---
📜 *Generated for AEON_LTX TradingOS Team | v1.0 | Sci-Fi Quant UI Spec*
