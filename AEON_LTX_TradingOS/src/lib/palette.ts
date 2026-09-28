/* ============ AEON_LTX v3.0 — "MIDNIGHT OPS" Restrained Tactical Palette ===== */
/* Per references/UIUX_DESIGN.md §2: ~90% neutrals, ~7% cyan, ~2% ember,        */
/* ~1% status/amber. Anti-pastel doctrine KEPT (full chroma accents), but the   */
/* rainbow is retired: magenta folds into ember, violet demotes to cyan-dim.    */

export interface Swatch {
  name: string;
  hex: string;
  hue: number;
  sat: number;
  lit: number;
  role: string;
}

/** Canonical palette — v3.0 MIDNIGHT OPS: cyan signal + ember action + amber gold, full chroma. */
export const PALETTE: Swatch[] = [
  { name: 'SIGNAL CYAN', hex: '#5CE6EB', hue: 184, sat: 79, lit: 64, role: 'structure / data / live' },
  { name: 'PLASMA CYAN', hex: '#00D4FF', hue: 191, sat: 100, lit: 50, role: 'glow wire (focal only)' },
  { name: 'EMBER PRIME', hex: '#FF5A1F', hue: 16, sat: 100, lit: 56, role: 'action / emphasis / E-STOP' },
  { name: 'EMBER DEEP', hex: '#A63A14', hue: 16, sat: 78, lit: 37, role: 'ember gradient base' },
  { name: 'KILL RED',    hex: '#FF3B30', hue: 3, sat: 100, lit: 60, role: 'crit / veto / bearish' },
  { name: 'REACTOR GOLD', hex: '#E5B84B', hue: 43, sat: 75, lit: 60, role: 'gold line / caution / armed' },
];

export const C = {
  blue: '#4C9AFF',      /* info-only now */
  cyan: '#5CE6EB',
  cyanHot: '#00D4FF',
  cyanDim: '#2A8F94',
  magenta: '#FF5A1F',   /* folded into ember — legacy key kept for imports */
  violet: '#2A8F94',    /* demoted to depth/dim — legacy key kept */
  red: '#FF3B30',
  gold: '#E5B84B',
  green: '#3DDC84',
  text: '#E8EEF4',
  sub: '#9AA9B8',
  void: '#05070A',
} as const;

/** rgba() helper from a #RRGGBB hex + alpha. */
export function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Convert HSL -> hex (used by the live hue-cycling demo strip). */
export function hslHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const f = (n: number) => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const to2 = (v: number) => Math.round(255 * v).toString(16).padStart(2, '0');
  return `#${to2(f(0))}${to2(f(8))}${to2(f(4))}`.toUpperCase();
}

/** Sample points across the hue wheel at full saturation, for the spectrum bar. */
export function hueSpectrum(steps = 24, sat = 100, lit = 50): { h: number; hex: string }[] {
  return Array.from({ length: steps }, (_, i) => {
    const h = Math.round((i / steps) * 360);
    return { h, hex: hslHex(h, sat, lit) };
  });
}

/** Which palette swatch is closest to an arbitrary hue (for dynamic coloring). */
export function nearestSwatch(hue: number): Swatch {
  let best = PALETTE[0], bd = 999;
  for (const sw of PALETTE) {
    const d = Math.min(Math.abs(sw.hue - hue), 360 - Math.abs(sw.hue - hue));
    if (d < bd) { bd = d; best = sw; }
  }
  return best;
}
