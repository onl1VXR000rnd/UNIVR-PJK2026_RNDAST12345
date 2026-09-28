/* ============ AEON_LTX — FUI Phase 2: System Rail & Palette Lab ============ */
import { memo, useEffect, useRef, useState } from 'react';
import { useOS } from '../hooks';
import { triggerCrisis } from '../lib/engine';
import { C, PALETTE, rgba, hslHex, hueSpectrum } from '../lib/palette';

/* Mini sparkline canvas used inside rail cells. */
const Spark = memo(function Spark({ data, color }: { data: number[]; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!; const dpr = window.devicePixelRatio || 1;
    cv.width = 90 * dpr; cv.height = 22 * dpr;
    const ctx = cv.getContext('2d')!; ctx.clearRect(0, 0, cv.width, cv.height);
    if (data.length < 2) return;
    const hi = Math.max(...data), lo = Math.min(...data), rng = Math.max(1e-9, hi - lo);
    ctx.strokeStyle = color; ctx.lineWidth = 1.2 * dpr; ctx.shadowColor = color; ctx.shadowBlur = 4 * dpr;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * cv.width;
      const y = cv.height - ((v - lo) / rng) * (cv.height - 3 * dpr) - 1.5 * dpr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke(); ctx.shadowBlur = 0;
    // head dot
    const lastV = data[data.length - 1];
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cv.width - 1, cv.height - ((lastV - lo) / rng) * (cv.height - 3 * dpr) - 1.5 * dpr, 2 * dpr, 0, Math.PI * 2); ctx.fill();
  }, [data, color]);
  return <canvas className="mini-spark" ref={ref} />;
});

/* Scrolling telemetry marquee. */
const NEWS = [
  'FED OFFICIAL HINTS AT LATE-QE TAPER', 'BTC ETF INFLOWS $412M', 'GOLD RETESTS 2650 RESISTANCE',
  'NAS100 FUTURES +0.8% PRE-MARKET', 'EUR/DXY CROSSFLOW ANOMALY DETECTED', 'JEV CASCADE MODEL v4.7 DEPLOYED',
  'ORDERFLOW DELTA SKewed BUY 63%', 'VOL SURFACE RICHENING ON 0DTE', 'LIQUIDITY POOL SWAP > $2.1B',
];
const Marquee = memo(function Marquee() {
  const items = [...NEWS, ...NEWS].map((n, i) => `${i % 3 === 0 ? '<b>◆</b> ' : '<i>▲</i> '}${n}`).join('   ///   ');
  return <div className="marquee"><span className="marquee-inner mono" dangerouslySetInnerHTML={{ __html: items }} /></div>;
});

/* Live HUE lab strip — cycles the full spectrum at FULL saturation so you can
   see exactly where our palette anchors sit on the wheel. Click a chip to pin it. */
const HueLab = memo(function HueLab() {
  const [phase, setPhase] = useState(0);
  const [pinned, setPinned] = useState<number | null>(null);
  useEffect(() => {
    const t = setInterval(() => setPhase(p => (p + 3) % 360), 90);
    return () => clearInterval(t);
  }, []);
  const spec = hueSpectrum(24);
  return (
    <div className="hue-lab" title="HUE cycling lab — zero pastel, S=100%">
      <label className="mono">HUE LAB · {(pinned ?? phase).toString().padStart(3, '0')}°</label>
      <div className="hue-chips">
        {spec.map(({ h, hex }) => (
          <i key={h} className={`hue-chip ${pinned === h ? 'pin' : ''}`} style={{ background: hex, boxShadow: `0 0 6px ${hex}` }}
            onClick={() => setPinned(pinned === h ? null : h)} />
        ))}
      </div>
      <div className="hue-live" style={{ background: hslHex(pinned ?? phase, 100, 50), boxShadow: `0 0 12px ${hslHex(pinned ?? phase, 100, 50)}` }} />
    </div>
  );
});

export const SystemRail = memo(function SystemRail() {
  const s = useOS();
  const eqUp = s.equityCurve[s.equityCurve.length - 1] >= (s.equityCurve[0] ?? 0);
  return (
    <footer className="sys-rail">
      <div className="rail-cell">
        <label>EQUITY CURVE</label>
        <b className={eqUp ? 'pnl-pos' : 'pnl-neg'}>${s.equity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b>
        <Spark data={s.equityCurve} color={eqUp ? C.green : C.red} />
      </div>
      <div className="rail-cell">
        <label>LATENCY / FEED</label>
        <b>{s.latencyMs}ms</b>
        <Spark data={Array.from({ length: 14 }, (_, i) => 20 + Math.sin(s.tickCount / 7 + i) * 12 + (i % 3) * 4)} color={C.cyan} />
      </div>
      <div className="rail-cell">
        <label>CASCADE STATE</label>
        <b style={{ color: s.thinking ? C.gold : C.magenta }}>{s.thinking ? 'PROCESSING' : 'IDLE'}</b>
        <b style={{ fontSize: 9, color: 'var(--sub)' }}>TICKS {s.tickCount.toLocaleString()}</b>
      </div>
      <Marquee />
      <HueLab />
      <div className="rail-cell" style={{ justifyContent: 'center' }}>
        <button className="drill-btn upd mono" onClick={() => triggerCrisis()} title="Press X anywhere">⚠ CRISIS DRILL</button>
      </div>
    </footer>
  );
});

/* Floating palette legend — pinned swatch card with HUE readouts (toggle P). */
export const PaletteCard = memo(function PaletteCard({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <aside className="panel palette-card">
      <span className="cnr" />
      <div className="p-head"><span className="p-title">◈ Tactical Palette — Anti-Pastel Doctrine</span></div>
      {PALETTE.map(sw => (
        <div key={sw.name} className="pal-row">
          <i style={{ background: sw.hex, boxShadow: `0 0 10px ${rgba(sw.hex, 0.8)}` }} />
          <div>
            <b className="upd">{sw.name}</b>
            <div className="mono pal-meta">{sw.hex} · HUE {sw.hue}° · SAT {sw.sat}% · L {sw.lit}%</div>
            <div className="mono pal-role">{sw.role}</div>
          </div>
        </div>
      ))}
      <div className="mono" style={{ fontSize: 9, color: 'var(--sub)', marginTop: 8, letterSpacing: '0.1em' }}>
        ⛔ RULE: no accent below S≥85%. Pastel = instant PR rejection.
      </div>
    </aside>
  );
});
