import { memo, useEffect, useRef } from 'react';
import { useOS } from '../hooks';
import { fmt } from '../lib/engine';

/** Tactical candlestick chart drawn on canvas — neon cyan bullish / hollow red bearish + SMA20. */
export const ChartPanel = memo(function ChartPanel() {
  const s = useOS();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth * dpr, H = cv.clientHeight * dpr;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    const cs = s.candles; if (cs.length < 2) return;
    const hi = Math.max(...cs.map(c => c.h)), lo = Math.min(...cs.map(c => c.l));
    const pad = (hi - lo) * 0.08;
    const y = (v: number) => H - ((v - (lo - pad)) / ((hi + pad) - (lo - pad))) * H;
    const bw = W / cs.length;

    // faint horizontal HUD levels
    ctx.strokeStyle = 'rgba(30,41,59,0.5)'; ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) { const yy = (H / 5) * i; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }

    // candles
    cs.forEach((c, i) => {
      const x = i * bw + bw / 2;
      const bull = c.c >= c.o;
      ctx.strokeStyle = bull ? '#00F0FF' : '#FF003C';
      ctx.lineWidth = Math.max(1, dpr);
      ctx.beginPath(); ctx.moveTo(x, y(c.h)); ctx.lineTo(x, y(c.l)); ctx.stroke();
      const top = y(Math.max(c.o, c.c)), bh = Math.max(1.5 * dpr, Math.abs(y(c.o) - y(c.c)));
      if (bull) { ctx.fillStyle = 'rgba(0,240,255,0.22)'; ctx.fillRect(x - bw * 0.32, top, bw * 0.64, bh); ctx.strokeRect(x - bw * 0.32, top, bw * 0.64, bh); }
      else { ctx.strokeRect(x - bw * 0.32, top, bw * 0.64, bh); }
    });

    // SMA20 overlay
    ctx.strokeStyle = 'rgba(255,191,0,0.85)'; ctx.lineWidth = 1.4 * dpr; ctx.beginPath();
    let started = false;
    for (let i = 19; i < cs.length; i++) {
      const avg = cs.slice(i - 19, i + 1).reduce((a, c) => a + c.c, 0) / 20;
      const x = i * bw + bw / 2;
      if (!started) { ctx.moveTo(x, y(avg)); started = true; } else ctx.lineTo(x, y(avg));
    }
    ctx.stroke();

    // entry/TP/SL lines of first open position on this symbol
    const pos = s.positions.find(p => p.sym === s.sym);
    if (pos) {
      const line = (v: number, col: string, label: string) => {
        ctx.strokeStyle = col; ctx.setLineDash([6 * dpr, 5 * dpr]); ctx.lineWidth = dpr;
        ctx.beginPath(); ctx.moveTo(0, y(v)); ctx.lineTo(W, y(v)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = col; ctx.font = `${9 * dpr}px "JetBrains Mono"`; ctx.fillText(label, 8 * dpr, y(v) - 4 * dpr);
      };
      line(pos.entry, 'rgba(0,240,255,0.7)', `ENTRY ${fmt(s.sym, pos.entry)}`);
      line(pos.tp, 'rgba(16,185,129,0.7)', `TP ${fmt(s.sym, pos.tp)}`);
      line(pos.sl, 'rgba(255,0,60,0.7)', `SL ${fmt(s.sym, pos.sl)}`);
    }

    // live price line
    ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = dpr; ctx.setLineDash([2 * dpr, 3 * dpr]);
    ctx.beginPath(); ctx.moveTo(0, y(s.price)); ctx.lineTo(W, y(s.price)); ctx.stroke(); ctx.setLineDash([]);
  }, [s.candles, s.price, s.positions, s.sym]);

  const chg = ((s.price - s.dayOpen) / s.dayOpen) * 100;
  return (
    <section className="panel" style={{ animationDelay: '0.1s' }}>
      <div className="p-head">
        <span className="p-title">Live Chart & Tactical Overlay — {s.sym} · {s.tf}</span>
        <span className="p-badge mono" style={{ color: chg >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {chg >= 0 ? '+' : ''}{chg.toFixed(2)}% TODAY
        </span>
      </div>
      <div className="chart-shell">
        <canvas ref={ref} className="cv" />
        <span className="live-badge mono upd">◉ LIVE {fmt(s.sym, s.price)}</span>
      </div>
      <div className="mono" style={{ display: 'flex', gap: 16, fontSize: 10, color: 'var(--sub)', marginTop: 8 }}>
        <span><b style={{ color: 'var(--cyan)' }}>▮</b> BULLISH</span>
        <span><b style={{ color: 'var(--red)' }}>▯</b> BEARISH</span>
        <span><b style={{ color: 'var(--amber)' }}>—</b> SMA 20</span>
        <span style={{ marginLeft: 'auto' }}>VOL {(Math.abs(chg) * 4120 + 8000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
      </div>
    </section>
  );
});
