import { memo, useEffect, useRef } from 'react';
import { useOS } from '../hooks';

/** Radar sweep canvas — the Quantum Core visualizer. */
const Radar = memo(function Radar({ thinking }: { thinking: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!; const dpr = window.devicePixelRatio || 1;
    cv.width = 130 * dpr; cv.height = 130 * dpr;
    const ctx = cv.getContext('2d')!; const C = 65 * dpr; let raf = 0, ang = 0;
    const blips = Array.from({ length: 6 }, () => ({ a: Math.random() * Math.PI * 2, r: 0.3 + Math.random() * 0.6 }));
    const draw = () => {
      ctx.clearRect(0, 0, C * 2, C * 2);
      ctx.strokeStyle = 'rgba(30,41,59,0.9)'; ctx.lineWidth = dpr;
      for (const rr of [0.35, 0.6, 0.85, 1]) { ctx.beginPath(); ctx.arc(C, C, C * rr, 0, Math.PI * 2); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(C, 0); ctx.lineTo(C, C * 2); ctx.moveTo(0, C); ctx.lineTo(C * 2, C); ctx.stroke();
      ang += thinking ? 0.06 : 0.015;
      const grad: CanvasGradient | null = typeof (ctx as any).createConicGradient === 'function' ? (ctx as any).createConicGradient(ang, C, C) : null;
      if (grad) {
        grad.addColorStop(0, thinking ? 'rgba(255,191,0,0.75)' : 'rgba(0,240,255,0.6)');
        grad.addColorStop(0.12, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(C, C, C, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = thinking ? '#FFBF00' : '#00F0FF'; ctx.lineWidth = 1.6 * dpr;
      ctx.beginPath(); ctx.moveTo(C, C); ctx.lineTo(C + Math.cos(ang) * C, C + Math.sin(ang) * C); ctx.stroke();
      blips.forEach(b => {
        const diff = ((ang % (Math.PI * 2)) - b.a + Math.PI * 4) % (Math.PI * 2);
        const glow = Math.max(0, 1 - diff / 1.2);
        if (glow > 0.05) {
          ctx.fillStyle = `rgba(0,240,255,${glow})`;
          ctx.beginPath(); ctx.arc(C + Math.cos(b.a) * C * b.r, C + Math.sin(b.a) * C * b.r, 2.6 * dpr, 0, Math.PI * 2); ctx.fill();
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, [thinking]);
  return <canvas ref={ref} className="radar" />;
});

const Gauge = memo(function Gauge({ value, label }: { value: number; label: string }) {
  const col = value > 75 ? 'var(--green)' : value >= 50 ? 'var(--amber)' : '#64748B';
  const r = 38, circ = 2 * Math.PI * r;
  return (
    <div className="gauge">
      <svg width="92" height="92" viewBox="0 0 92 92">
        <circle cx="46" cy="46" r={r} fill="none" stroke="#1E293B" strokeWidth="6" strokeDasharray={`${circ * 0.75} ${circ}`} transform="rotate(135 46 46)" strokeLinecap="round" />
        <circle cx="46" cy="46" r={r} fill="none" stroke={col} strokeWidth="6" strokeDasharray={`${circ * 0.75 * (value / 100)} ${circ}`} transform="rotate(135 46 46)" strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.3,1,.4,1), stroke 0.5s', filter: `drop-shadow(0 0 4px ${col})` }} />
      </svg>
      <b className="mono" style={{ color: col }}>{value}<small>{label}</small></b>
    </div>
  );
});

export const AiNexus = memo(function AiNexus() {
  const s = useOS();
  const steps = ['GATEKEEPER', 'SNIPER', 'EXECUTION'];
  const cacheTxt = s.cacheAgeMin < 1 ? '✅ FRESH (<1m)' : `✅ Cached (${Math.floor(s.cacheAgeMin)}m ago)`;
  return (
    <section className={`panel ${s.veto ? 'veto-alert' : ''}`} style={{ animationDelay: '0.15s' }}>
      <div className="p-head">
        <span className="p-title">⬡ Quantum Core — JEV Cascade</span>
        <span className="p-badge mono" style={{ color: s.thinking ? 'var(--amber)' : 'var(--purple)' }}>
          {s.thinking ? '🧠 THINKING' : 'CORE IDLE'}
        </span>
      </div>
      <div className="radar-wrap">
        <Radar thinking={s.thinking} />
        <div className="core-stats mono">
          <div className="stat-line"><span>DEEPSEEK RESEARCH</span><b style={{ color: 'var(--green)' }}>{cacheTxt}</b></div>
          <div className="stat-line"><span>MACRO REGIME</span><b style={{ color: 'var(--amber)' }}>CAUTIOUS_BEARISH</b></div>
          <div className="stat-line"><span>CONFIDENCE MATRIX</span><b>{(s.buyProb + s.sellProb) > 90 ? 'LOCKED' : 'CALIBRATING'}</b></div>
          <div className="stat-line"><span>TICKS PROCESSED</span><b>{s.tickCount.toLocaleString()}</b></div>
        </div>
      </div>
      <div className="cascade">
        {steps.map((st, i) => {
          const stage = i + 1;
          const cls = s.cascade > stage ? 'done' : s.cascade === stage ? 'active' : '';
          const pct = s.cascade > stage ? 100 : s.cascade === stage ? Math.max(15, s.cascadePct) : 0;
          return <div key={st} className={`cstep ${cls} upd`}>{st}<i style={{ width: `${pct}%` }} /></div>;
        })}
      </div>
      <div className="typeline mono">{s.typeline}</div>
      <div className="gauges">
        <Gauge value={s.buyProb} label="BUY PROB" />
        <Gauge value={s.sellProb} label="SELL PROB" />
        <div style={{ flex: 1 }}>
          <div className="upd" style={{ fontSize: 9, color: 'var(--sub)', marginBottom: 6 }}>RISK SCORE {s.riskScore}/5</div>
          <div className="risk-bars">
            {[1, 2, 3, 4, 5].map(n => <i key={n} className={n <= s.riskScore ? (s.riskScore >= 4 ? 'crit' : 'lit') : ''} style={{ height: `${n * 7 + 5}px` }} />)}
          </div>
        </div>
      </div>
      <div className={`veto-badge mono ${s.veto ? 'show' : ''}`}>🛑 {s.veto ?? ''}</div>
    </section>
  );
});
