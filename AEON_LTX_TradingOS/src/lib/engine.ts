/* ============ AEON_LTX — Dummy Market Engine (no API keys, all client-side) ============ */

export type Candle = { o: number; h: number; l: number; c: number };
export type LogEntry = { id: number; t: string; lv: 'INFO'|'WARN'|'VETO'|'EXEC'|'AI'; msg: string };
export type Toast = { id: number; kind: 'ok'|'err'|'info'; msg: string };
export type Position = { sym: Sym; side: 'BUY'|'SELL'; lot: number; entry: number; tp: number; sl: number; openedAt: string };
export type Mode = 'manual' | 'semi' | 'ai';
export type CascadeStage = 0 | 1 | 2 | 3; // idle, gatekeeper, sniper, execution-ready

export const SYMBOLS = ['XAUUSD', 'BTCUSD', 'EURUSD', 'NAS100'] as const;
export type Sym = typeof SYMBOLS[number];

const SEED_PRICE: Record<Sym, number> = { XAUUSD: 2645.5, BTCUSD: 97420, EURUSD: 1.0872, NAS100: 21340 };
/** Live mark prices per symbol (updated by the tick engine). */
const livePrices: Record<Sym, number> = { ...SEED_PRICE };
const TICK_PCT: Record<Sym, number> = { XAUUSD: 0.00035, BTCUSD: 0.0006, EURUSD: 0.00008, NAS100: 0.0004 };
export const DECIMALS: Record<Sym, number> = { XAUUSD: 2, BTCUSD: 1, EURUSD: 4, NAS100: 1 };

export function fmt(sym: Sym, v: number): string {
  return v.toLocaleString('en-US', { minimumFractionDigits: DECIMALS[sym], maximumFractionDigits: DECIMALS[sym] });
}

/* ---------- Observable store (tiny pub/sub, swap-ready for live feed later) ---------- */
type Listener = () => void;
class Store<T extends object> {
  state: T; private ls = new Set<Listener>();
  constructor(init: T) { this.state = init; }
  set(patch: Partial<T>) { this.state = { ...this.state, ...patch }; this.ls.forEach(f => f()); }
  subscribe(f: Listener) { this.ls.add(f); return () => { this.ls.delete(f); }; }
}

export interface OSState {
  sym: Sym; tf: string; mode: Mode; price: number; prevPrice: number; dayOpen: number;
  spreadPts: number; latencyMs: number; candles: Candle[];
  bids: { p: number; q: number }[]; asks: { p: number; q: number }[];
  buyProb: number; sellProb: number; riskScore: number; veto: string | null;
  cascade: CascadeStage; cascadePct: number; cacheAgeMin: number; thinking: boolean;
  armed: boolean; positions: Position[]; logs: LogEntry[]; toasts: Toast[];
  typeline: string; tickCount: number;
  /** Live mark price per symbol (simulated feed). */
  priceOf(sym: Sym): number;
}

export const os = new Store<OSState>({
  sym: 'XAUUSD', tf: 'M15', mode: 'semi',
  price: SEED_PRICE.XAUUSD, prevPrice: SEED_PRICE.XAUUSD, dayOpen: SEED_PRICE.XAUUSD - 3.2,
  spreadPts: 12, latencyMs: 12, candles: [], bids: [], asks: [],
  buyProb: 62, sellProb: 24, riskScore: 2, veto: null,
  cascade: 0, cascadePct: 0, cacheAgeMin: 12, thinking: false,
  armed: true, positions: [
    { sym: 'XAUUSD', side: 'BUY', lot: 0.25, entry: 2641.1, tp: 2658.0, sl: 2634.0, openedAt: '09:41:22' },
    { sym: 'BTCUSD', side: 'SELL', lot: 0.05, entry: 97980, tp: 96200, sl: 98750, openedAt: '11:02:57' },
  ],
  logs: [], toasts: [], typeline: '', tickCount: 0,
  priceOf: (sym: Sym): number => livePrices[sym],
});

let logId = 0, toastId = 0;
const stamp = () => new Date().toLocaleTimeString('en-GB', { hour12: false });

export function log(lv: LogEntry['lv'], msg: string) {
  const e: LogEntry = { id: ++logId, t: stamp(), lv, msg };
  os.set({ logs: [...os.state.logs.slice(-199), e] });
}
export function toast(kind: Toast['kind'], msg: string) {
  const id = ++toastId;
  os.set({ toasts: [...os.state.toasts, { id, kind, msg }] });
  setTimeout(() => os.set({ toasts: os.state.toasts.filter(t => t.id !== id) }), 3600);
}

/* ---------- Candle seeding & random-walk ticks ---------- */
function seedCandles(sym: Sym): Candle[] {
  const out: Candle[] = []; let p = SEED_PRICE[sym] * (1 - 0.004);
  for (let i = 0; i < 60; i++) {
    const drift = (Math.random() - 0.42) * p * 0.0022;
    const o = p, c = p + drift;
    out.push({ o, c, h: Math.max(o, c) + Math.random() * p * 0.0007, l: Math.min(o, c) - Math.random() * p * 0.0007 });
    p = c;
  }
  return out;
}

function buildBook(price: number, sym: Sym) {
  const step = price * 0.00012;
  const bids = Array.from({ length: 7 }, (_, i) => ({ p: price - step * (i + 1), q: +(Math.random() * 9 + 1).toFixed(1) })).reverse();
  const asks = Array.from({ length: 7 }, (_, i) => ({ p: price + step * (i + 1), q: +(Math.random() * 9 + 1).toFixed(1) }));
  return { bids, asks };
}

/* ---------- JEV Cascade simulation ---------- */
const TYPE_PHRASES = [
  '>> ANALYZING CONFLUENCE... [OK]', '>> SCANNING LIQUIDITY POOLS...', '>> GATEKEEPER: MACRO FILTER PASS',
  '>> SNIPAR: PATTERN MATCH 87%', '>> DEEPSEEK: MACRO = CAUTIOUS_BEARISH', '>> ATR VOLATILITY WINDOW WIDENING',
  '>> ORDERFLOW DELTA: +412', '>> EXECUTION LAYER ARMED', '>> RECALIBRATING CONFIDENCE MATRIX',
];
let typeTimer: ReturnType<typeof setInterval> | null = null;
function startTyping() {
  if (typeTimer) return;
  let full = TYPE_PHRASES[Math.floor(Math.random() * TYPE_PHRASES.length)], i = 0;
  typeTimer = setInterval(() => {
    i++;
    os.set({ typeline: full.slice(0, i) });
    if (i >= full.length) { clearInterval(typeTimer!); typeTimer = null; }
  }, 38);
}

function advanceCascade() {
  const s = os.state;
  if (s.cascade === 0 && Math.random() < 0.25) {
    os.set({ cascade: 1, thinking: true });
    log('AI', '🧠 JEV Gatekeeper initiated scan sequence');
    startTyping();
  } else if (s.cascade === 1) os.set({ cascade: 2, cascadePct: 40 });
  else if (s.cascade === 2) {
    os.set({ cascade: 3, cascadePct: 80 });
    const bp = Math.round(35 + Math.random() * 60);
    const sp = Math.round(Math.max(5, 100 - bp - Math.random() * 15));
    const rs = Math.random() < 0.18 ? 4 : Math.ceil(Math.random() * 3);
    const vetoHit = Math.random() < 0.14 || s.spreadPts > 30;
    os.set({
      buyProb: bp, sellProb: sp, riskScore: rs,
      veto: vetoHit ? `VETO: Spread > ${s.spreadPts}pts` : null,
    });
    log('AI', `✅ Signal ready | BUY:${bp}% SELL:${sp}% RISK:${rs}/5`);
    if (vetoHit) { log('VETO', `🛑 Python hard-veto engaged — spread ${s.spreadPts}pts exceeds limit`); toast('err', '🛑 HARD VETO ENGAGED'); }
    else if (s.mode === 'ai' && bp > 72) { log('EXEC', `🤖 Agentic auto-order queued @ ${fmt(s.sym, s.price)} (simulated)`); toast('info', '🤖 AI AGENT: order queued (simulation)'); }
    setTimeout(() => os.set({ cascade: 0, cascadePct: 0, thinking: false }), 5200);
  }
}

/* ---------- Main tick loop (rAF-throttled ~ every 900ms data tick) ---------- */
let rafH = 0, lastTick = 0, tickN = 0;
export function startEngine() {
  os.set({ candles: seedCandles(os.state.sym) });
  const b = buildBook(os.state.price, os.state.sym);
  os.set({ bids: b.bids, asks: b.asks });
  log('INFO', '🟢 Live Feed Active — WS handshake OK (simulated stream)');
  log('INFO', 'DeepSeek research cache loaded | Macro regime: CAUTIOUS_BEARISH');

  const loop = (ts: number) => {
    if (ts - lastTick > 900) {
      lastTick = ts; tickN++;
      const s = os.state;
      const vol = TICK_PCT[s.sym];
      const next = s.price * (1 + (Math.random() - 0.5) * 2 * vol);
      const dirUp = next >= s.price;
      const cs = [...s.candles];
      const cur = { ...cs[cs.length - 1] };
      cur.c = next; cur.h = Math.max(cur.h, next); cur.l = Math.min(cur.l, next);
      cs[cs.length - 1] = cur;
      if (tickN % 12 === 0) { cs.push({ o: next, h: next, l: next, c: next }); if (cs.length > 60) cs.shift(); }
      const book = buildBook(next, s.sym);
      livePrices[s.sym] = next;
      const spread = Math.max(4, Math.round(10 + Math.sin(Date.now() / 9000) * 14 + Math.random() * 10));
      os.set({
        price: next, prevPrice: s.price, candles: cs, bids: book.bids, asks: book.asks,
        spreadPts: spread, latencyMs: 8 + Math.floor(Math.random() * 22),
        cacheAgeMin: tickN % 40 === 0 ? 0 : s.cacheAgeMin + 0.015,
        tickCount: s.tickCount + 1,
      });
      if (tickN % 40 === 0) log('AI', '🧠 DeepSeek cache refreshed | Macro: CAUTIOUS_BEARISH');
      if (spread > 30) log('WARN', `⚠ Spread widened: ${spread}pts — approaching veto threshold`);
      // update open position PnL implicitly via price render; occasional telemetry noise
      if (Math.random() < 0.12) log('INFO', ['Heartbeat OK', 'Orderflow delta sampled', 'Depth rebalanced', 'Risk engine sync'][Math.floor(Math.random() * 4)]);
      advanceCascade();
    }
    rafH = requestAnimationFrame(loop);
  };
  rafH = requestAnimationFrame(loop);
}
export function stopEngine() { cancelAnimationFrame(rafH); }

/* ---------- Actions ---------- */
export function switchSymbol() {
  const list = SYMBOLS; const idx = list.indexOf(os.state.sym);
  const ns = list[(idx + 1) % list.length];
  livePrices[ns] = SEED_PRICE[ns];
  os.set({ sym: ns, price: SEED_PRICE[ns], prevPrice: SEED_PRICE[ns], dayOpen: SEED_PRICE[ns] * 0.998, candles: seedCandles(ns) });
  log('INFO', `Feed switched → ${ns}`);
}
export function setTf(tf: string) { os.set({ tf, candles: seedCandles(os.state.sym) }); log('INFO', `Timeframe → ${tf}`); }
export function setMode(mode: Mode) {
  os.set({ mode, armed: mode !== 'ai' ? os.state.armed : true });
  log('INFO', `Trading mode → ${mode.toUpperCase()}${mode === 'ai' ? ' 🔮 Full AI Agentic' : ''}`);
}
export function toggleArm() {
  os.set({ armed: !os.state.armed });
  log(os.state.armed ? 'EXEC' : 'WARN', os.state.armed ? '🔓 SYSTEM DISARMED by operator' : '🔒 SYSTEM ARMED — execution layer hot');
}
export function execute(side: 'BUY' | 'SELL', lot: number) {
  const s = os.state;
  if (!s.armed) { toast('err', 'SYSTEM DISARMED — arm the terminal first'); return; }
  if (s.veto) { toast('err', `🛑 ${s.veto} — execution blocked`); log('VETO', `Manual ${side} blocked by hard-veto`); return; }
  if (s.cascade === 1 || s.cascade === 2) { toast('info', '⏳ Awaiting Jev signal resolution...'); return; }
  const px = s.price;
  const atr = px * 0.004;
  const pos: Position = {
    sym: s.sym, side, lot, entry: px,
    tp: side === 'BUY' ? px + atr * 2 : px - atr * 2,
    sl: side === 'BUY' ? px - atr : px + atr,
    openedAt: stamp(),
  };
  os.set({ positions: [...s.positions, pos] });
  log('EXEC', `${side} ${lot.toFixed(2)} lots ${s.sym} FILLED @ ${fmt(s.sym, px)} | TP ${fmt(s.sym, pos.tp)} SL ${fmt(s.sym, pos.sl)}`);
  toast('ok', `✅ Order Filled @ ${fmt(s.sym, px)}`);
}
export function closePosition(idx: number) {
  const p = os.state.positions[idx]; if (!p) return;
  const pnl = (os.state.price - p.entry) * (p.side === 'BUY' ? 1 : -1) * p.lot * 100;
  os.set({ positions: os.state.positions.filter((_, i) => i !== idx) });
  log('EXEC', `CLOSE ${p.side} ${p.sym} @ ${fmt(p.sym, os.state.price)} | Realized PnL ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
  toast('info', `Position closed — PnL ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
}
