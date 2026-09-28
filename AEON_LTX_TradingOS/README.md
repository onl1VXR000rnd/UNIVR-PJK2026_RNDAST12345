# ⬡ AEON_LTX TradingOS — WebUI (Phase 1 Mock)

Sci-Fi tactical trading terminal front-end implementing the spec in [`../DESIGN.md`](../DESIGN.md).

**Stack:** Vite + React 19 + TypeScript. Zero API keys, zero backend — all market data is a **client-side simulated feed** (`src/lib/engine.ts`) that mimics WS ticks, order book, JEV cascade & DeepSeek cache states. State structure is swap-ready for a real live feed later without refactoring components.

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
```

## Implemented per DESIGN.md
- Boot screen with fake POST sequence
- TopBar: WS status, symbol chip (cycles XAUUSD/BTCUSD/EURUSD/NAS100), TF pills M15/H1/H4/D1, mode toggle Manual/Semi-Auto/🔮 Full AI Agentic
- Market Feed: big ticker w/ flash animation, spread, animated bid/ask depth bars
- Live Chart: canvas candlesticks (neon cyan bullish / hollow red bearish), SMA20, ENTRY/TP/SL overlays, LIVE badge, volume
- Quantum Core: radar sweep canvas, DeepSeek cache status, JEV Cascade stepper w/ typewriter line, BUY/SELL radial gauges, RISK x/5 bar, red hard-veto alert
- Command Pad: ARM/DISARM kill switch, lot slider, TP/SL preview, 25–100% buttons, BUY/SELL buttons w/ hover glow + veto/disabled states + success toast
- Open Positions table w/ live float PnL
- Telemetry terminal: color-coded auto-scroll logs w/ level filters

> ⚠️ Simulation only. Not connected to any real broker/exchange.
