import { memo, useEffect, useRef } from 'react';
import { useOS } from '../hooks';
import { fmt } from '../lib/engine';
import { C, rgba } from '../lib/palette';

/** Tactical candlestick chart — plasma-cyan bullish / kill-red bearish, SMA20 gold,
 *  volume histogram, animated scan line, live crosshair with price/time tags. */
export const ChartPanel = memo(function ChartPanel() {
  const s = useOS();
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef<{ x: number; y: number } | null>(null);
  const stateRef = useRef(s);
  stateRef.current = s;

  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    let raf = 0;
    const draw = (ts: number) => {
      const st = stateRef.current;
      const dpr = window.devicePixelRatio || 1;
      const W = cv.clientWidth * dpr, H = cv.clientHeight * dpr;
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      const ctx = cv.getContext('2d')!;
      ctx.clearRect(0, 0, W, H);
      const cs = st.candles; if (cs.length < 2) { raf = requestAnimationFrame(draw); return; }
      const hi = Math.max(...cs.map(c => c.h)), lo = Math.min(...cs.map(c => c.l));
      const pad = (hi - lo) * 0.08;
      const volH = H * 0.16;                     // bottom band for volume
      const priceH = H - volH - 4 * dpr;
      const y = (v: number) => priceH - ((v - (lo - pad)) / ((hi + pad) - (lo - pad))) * priceH;
      const bw = W / cs.length;

      /* faint horizontal HUD levels + vertical time grid */
      ctx.strokeStyle = rgba(C.blue, 0.18); ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) { const yy = (priceH / 5) * i; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
      ctx.strokeStyle = rgba(C.violet, 0.12);
      for (let i = 1; i < 6; i++) { const xx = (W / 6) * i; ctx.beginPath(); ctx.moveTo(xx, 0); ctx.lineTo(xx, priceH); ctx.stroke(); }

      /* volume histogram (bottom band) */
      cs.forEach((c, i) => {
        const x = i * bw + bw / 2;
        const bull = c.c >= c.o;
        const range = Math.max(1e-9, c.h - c.l);
        const vh = Math.min(volH, (range / (hi - lo)) * volH * 2.2);
        ctx.fillStyle = bull ? rgba(C.cyan, 0.3) : rgba(C.red, 0.3);
        ctx.fillRect(x - bw * 0.28, H - vh, bw * 0.56, vh);
      });

      /* candles with glow */
      cs.forEach((c, i) => {
        const x = i * bw + bw / 2;
        const bull = c.c >= c.o;
        const col = bull ? C.cyan : C.red;
        ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, dpr);
        ctx.shadowColor = col; ctx.shadowBlur = 4 * dpr;
        ctx.beginPath(); ctx.moveTo(x, y(c.h)); ctx.lineTo(x, y(c.l)); ctx.stroke();
        const top = y(Math.max(c.o, c.c)), bh = Math.max(1.5 * dpr, Math.abs(y(c.o) - y(c.c)));
        if (bull) { ctx.fillStyle = rgba(C.cyan, 0.22); ctx.fillRect(x - bw * 0.32, top, bw * 0.64, bh); ctx.strokeRect(x - bw * 0.32, top, bw * 0.64, bh); }
        else { ctx.strokeRect(x - bw * 0.32, top, bw * 0.64, bh); }
        ctx.shadowBlur = 0;
      });

      /* VWAP-style dotted violet curve */
      ctx.strokeStyle = rgba(C.violet, 0.8); ctx.lineWidth = 1.1 * dpr; ctx.setLineDash([1 * dpr, 4 * dpr]); ctx.beginPath();
      let cumPV = 0, cumV = 0;
      cs.forEach((c, i) => {
        const tp = (c.h + c.l + c.c) / 3, v = Math.abs(c.c - c.o) + 1e-9;
        cumPV += tp * v; cumV += v;
        const x = i * bw + bw / 2;
        if (i === 0) ctx.moveTo(x, y(cumPV / cumV)); else ctx.lineTo(x, y(cumPV / cumV));
      });
      ctx.stroke(); ctx.setLineDash([]);

      /* SMA20 overlay (gold) */
      ctx.strokeStyle = rgba(C.gold, 0.85); ctx.lineWidth = 1.4 * dpr; ctx.beginPath();
      let started = false;
      for (let i = 19; i < cs.length; i++) {
        const avg = cs.slice(i - 19, i + 1).reduce((a, c) => a + c.c, 0) / 20;
        const x = i * bw + bw / 2;
        if (!started) { ctx.moveTo(x, y(avg)); started = true; } else ctx.lineTo(x, y(avg));
      }
      ctx.stroke();

      /* entry/TP/SL lines of first open position on this symbol */
      const pos = st.positions.find(p => p.sym === st.sym);
      if (pos) {
        const line = (v: number, col: string, label: string) => {
          ctx.strokeStyle = col; ctx.setLineDash([6 * dpr, 5 * dpr]); ctx.lineWidth = dpr;
          ctx.beginPath(); ctx.moveTo(0, y(v)); ctx.lineTo(W, y(v)); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = col; ctx.font = `${9 * dpr}px "JetBrains Mono"`; ctx.fillText(label, 8 * dpr, y(v) - 4 * dpr);
        };
        line(pos.entry, rgba(C.cyan, 0.7), `ENTRY ${fmt(st.sym, pos.entry)}`);
        line(pos.tp, rgba(C.green, 0.7), `TP ${fmt(st.sym, pos.tp)}`);
        line(pos.sl, rgba(C.red, 0.75), `SL ${fmt(st.sym, pos.sl)}`);
      }

      /* live price line + right-edge tag */
      const upTick = st.price >= st.prevPrice;
      const lpCol = upTick ? C.cyan : C.red;
      ctx.strokeStyle = lpCol; ctx.lineWidth = dpr; ctx.setLineDash([2 * dpr, 3 * dpr]);
      ctx.beginPath(); ctx.moveTo(0, y(st.price)); ctx.lineTo(W, y(st.price)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = lpCol; ctx.fillRect(W - 74 * dpr, y(st.price) - 8 * dpr, 74 * dpr, 16 * dpr);
      ctx.fillStyle = C.void; ctx.font = `bold ${9.5 * dpr}px "JetBrains Mono"`;
      ctx.fillText(fmt(st.sym, st.price), W - 70 * dpr, y(st.price) + 4 * dpr);

      /* animated radar scan sweep across the chart */
      const sweepX = ((ts / 28) % (W + 200 * dpr)) - 100 * dpr;
      const sg = ctx.createLinearGradient(sweepX - 60 * dpr, 0, sweepX, 0);
      sg.addColorStop(0, rgba(C.magenta, 0)); sg.addColorStop(1, rgba(C.magenta, 0.14));
      ctx.fillStyle = sg; ctx.fillRect(sweepX - 60 * dpr, 0, 60 * dpr, H);
      ctx.fillStyle = rgba(C.magenta, 0.5); ctx.fillRect(sweepX - dpr, 0, dpr, H);

      /* crosshair following mouse */
      const m = mouse.current;
      if (m) {
        const mx = m.x * dpr, my = m.y * dpr;
        ctx.strokeStyle = rgba(C.text, 0.35); ctx.lineWidth = dpr; ctx.setLineDash([3 * dpr, 3 * dpr]);
        ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.moveTo(0, my); ctx.lineTo(W, my); ctx.stroke(); ctx.setLineDash([]);
        const pv = (lo - pad) + (1 - my / priceH) * ((hi + pad) - (lo - pad));
        if (my < priceH) {
          ctx.fillStyle = rgba(C.void, 0.9); ctx.fillRect(mx + 6 * dpr, my - 16 * dpr, 70 * dpr, 14 * dpr);
          ctx.fillStyle = C.gold; ctx.font = `${9 * dpr}px "JetBrains Mono"`;
          ctx.fillText(fmt(st.sym, pv), mx + 10 * dpr, my - 5 * dpr);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const chg = ((s.price - s.dayOpen) / s.dayOpen) * 100;
  return (
    <section className="panel" style={{ animationDelay: '0.1s' }}>
      <span className="cnr" />
      <div className="p-head">
        <span className="p-title glitch" data-text="Live Chart & Tactical Overlay">Live Chart &amp; Tactical Overlay — {s.sym} · {s.tf}</span>
        <span className="p-badge mono" style={{ color: chg >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {chg >= 0 ? '+' : ''}{chg.toFixed(2)}% TODAY
        </span>
      </div>
      <div className="chart-shell">
        <canvas
          ref={ref} className="cv"
          onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top }; }}
          onMouseLeave={() => { mouse.current = null; }}
        />
        <span className="live-badge mono upd">◉ LIVE {fmt(s.sym, s.price)}</span>
        <span className="crosshair-hint mono">CROSSHAIR ACTIVE · VWAP DASHED · SCAN FREQ 28ms</span>
      </div>
      <div className="mono" style={{ display: 'flex', gap: 16, fontSize: 10, color: 'var(--sub)', marginTop: 8, flexWrap: 'wrap' }}>
        <span><b style={{ color: 'var(--cyan)' }}>▮</b> BULLISH</span>
        <span><b style={{ color: 'var(--red)' }}>▯</b> BEARISH</span>
        <span><b style={{ color: 'var(--gold)' }}>—</b> SMA 20</span>
        <span><b style={{ color: 'var(--violet)' }}>┄</b> VWAP</span>
        <span><b style={{ color: 'var(--magenta)' }}>▍</b> RADAR SWEEP</span>
        <span style={{ marginLeft: 'auto' }}>VOL {(Math.abs(chg) * 4120 + 8000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
      </div>
    </section>
  );
});
