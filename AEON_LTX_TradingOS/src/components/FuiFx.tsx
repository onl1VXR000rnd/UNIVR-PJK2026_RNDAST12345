/* ============ AEON_LTX — FUI Phase 2: Ambient Motion Layer ============ */
import { memo, useEffect, useRef } from 'react';
import { C, rgba } from '../lib/palette';

/* ---------------------------------------------------------------- */
/* Particle starfield — drifting neon dust with occasional streaks   */
/* ---------------------------------------------------------------- */
export const Particles = memo(function Particles({ crisis }: { crisis: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const crisisRef = useRef(crisis); crisisRef.current = crisis;
  useEffect(() => {
    const cv = ref.current!; let raf = 0;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const COLORS = [C.cyan, C.magenta, C.violet, C.blue, C.gold];
    interface P { x: number; y: number; vx: number; vy: number; r: number; c: string; tw: number; streak: boolean }
    let ps: P[] = [];
    const seed = () => {
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
      ps = Array.from({ length: Math.min(90, Math.floor(innerWidth / 16)) }, () => ({
        x: Math.random() * cv.width, y: Math.random() * cv.height,
        vx: (Math.random() - 0.5) * 0.35 * dpr, vy: (Math.random() - 0.5) * 0.35 * dpr,
        r: (0.6 + Math.random() * 1.8) * dpr,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
        tw: Math.random() * Math.PI * 2,
        streak: Math.random() < 0.08,
      }));
    };
    seed();
    addEventListener('resize', seed);
    const draw = (ts: number) => {
      const ctx = cv.getContext('2d')!;
      ctx.clearRect(0, 0, cv.width, cv.height);
      const boost = crisisRef.current ? 4 : 1;
      for (const p of ps) {
        p.x += p.vx * boost; p.y += p.vy * boost;
        if (p.x < 0) p.x = cv.width; if (p.x > cv.width) p.x = 0;
        if (p.y < 0) p.y = cv.height; if (p.y > cv.height) p.y = 0;
        const a = 0.35 + 0.55 * Math.abs(Math.sin(ts / 900 + p.tw));
        if (p.streak) {
          ctx.strokeStyle = rgba(p.c, a * 0.7); ctx.lineWidth = dpr;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 40 * boost, p.y - p.vy * 40 * boost); ctx.stroke();
        } else {
          ctx.fillStyle = rgba(p.c, a);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', seed); };
  }, []);
  return <canvas ref={ref} className="particles" />;
});

/* ---------------------------------------------------------------- */
/* Hexagon mesh — slow-rotating honeycomb lattice overlay            */
/* ---------------------------------------------------------------- */
export const HexMesh = memo(function HexMesh() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!; let raf = 0;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const size = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
    size(); addEventListener('resize', size);
    const hex = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 3 * i + Math.PI / 6;
        const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
    };
    const draw = (ts: number) => {
      const ctx = cv.getContext('2d')!;
      ctx.clearRect(0, 0, cv.width, cv.height);
      const R = 46 * dpr, wob = Math.sin(ts / 4000) * 0.05 + 1;
      ctx.strokeStyle = rgba(C.violet, 0.06); ctx.lineWidth = dpr;
      for (let row = -1; row * R * 1.5 < cv.height + R; row++) {
        for (let col = -1; col * R * Math.sqrt(3) < cv.width + R * 2; col++) {
          const x = col * R * Math.sqrt(3) + (row % 2 ? R * Math.sqrt(3) / 2 : 0);
          hex(ctx, x, row * R * 1.5, R * 0.9 * wob);
        }
      }
      // a few "hot" cells pulsing gold/magenta
      const n = 5;
      for (let i = 0; i < n; i++) {
        const t = ts / 2600 + i * 1.7;
        const x = (Math.sin(t * 0.7 + i) * 0.5 + 0.5) * cv.width;
        const y = (Math.cos(t * 0.5 + i * 2) * 0.5 + 0.5) * cv.height;
        ctx.strokeStyle = i % 2 ? rgba(C.gold, 0.18) : rgba(C.magenta, 0.16);
        ctx.lineWidth = 1.4 * dpr;
        hex(ctx, x, y, R * (0.9 + 0.25 * Math.sin(t * 3)));
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); };
  }, []);
  return <canvas ref={ref} className="hexmesh" />;
});

/* ---------------------------------------------------------------- */
/* Data rain columns — faint matrix-style telemetry drizzle          */
/* ---------------------------------------------------------------- */
const GLYPHS = '01▲▼◆◇ΔΣΩλ%$#@*+=~<>▮▯┄╱╲';
export const DataRain = memo(function DataRain() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!; let raf = 0;
    const dpr = 1;
    const size = () => { cv.width = innerWidth; cv.height = innerHeight; };
    size(); addEventListener('resize', size);
    const cols = Math.floor(innerWidth / 26);
    const drops = Array.from({ length: cols }, () => ({ y: Math.random() * innerHeight, v: 0.4 + Math.random() * 1.6, g: GLYPHS[Math.floor(Math.random() * GLYPHS.length)] }));
    let last = 0;
    const draw = (ts: number) => {
      if (ts - last > 50) {
        last = ts;
        const ctx = cv.getContext('2d')!;
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.font = '11px "JetBrains Mono"';
        drops.forEach((d, i) => {
          d.y += d.v * 3;
          if (d.y > innerHeight) { d.y = -20; d.g = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; }
          if (Math.random() < 0.03) d.g = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          const hot = i % 9 === 0;
          ctx.fillStyle = hot ? rgba(C.gold, 0.14) : rgba(C.blue, 0.12);
          ctx.fillText(d.g, i * 26, d.y);
        });
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); };
  }, []);
  return <canvas ref={ref} className="datarain" />;
});

/* ---------------------------------------------------------------- */
/* Orbiting rings SVG — decorative depth widget for panel headers    */
/* ---------------------------------------------------------------- */
export const OrbitRings = memo(function OrbitRings() {
  return (
    <svg className="orbit-rings" viewBox="0 0 40 40" width="34" height="34">
      <circle cx="20" cy="20" r="16" fill="none" stroke={rgba(C.blue, 0.5)} strokeWidth="0.8" strokeDasharray="4 6" className="orb-spin" />
      <circle cx="20" cy="20" r="10" fill="none" stroke={rgba(C.magenta, 0.6)} strokeWidth="0.8" strokeDasharray="2 5" className="orb-spin-rev" />
      <circle cx="20" cy="4" r="1.6" fill={C.gold} className="orb-pulse" />
      <circle cx="30" cy="20" r="1.2" fill={C.cyan} className="orb-pulse2" />
      <circle cx="20" cy="20" r="2.4" fill={rgba(C.violet, 0.9)} />
    </svg>
  );
});
