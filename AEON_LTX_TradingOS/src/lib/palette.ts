/* ============ AEON_LTX — Full-Saturation Tactical Palette (HUE lab) ============ */
/* Anti-pastel doctrine: every accent runs S >= 85%, L tuned for neon punch.     */

export interface Swatch {
  name: string;
  hex: string;
  hue: number;
  sat: number;
  lit: number;
  role: string;
}

/** Canonical palette — blue / magenta / violet / red / gold, full chroma. */
export const PALETTE: Swatch[] = [
  { name: 'VOID BLUE',   hex: '#0044FF', hue: 226, sat: 100, lit: 50, role: 'primary structural' },
  { name: 'PLASMA CYAN', hex: '#00D4FF', hue: 191, sat: 100, lit: 50, role: 'bullish / HUD wire' },
  { name: 'MAGENTA PRIME', hex: '#FF00A8', hue: 320, sat: 100, lit: 50, role: 'accent / AI nexus' },
  { name: 'VIOLET CORE', hex: '#8400FF', hue: 270, sat: 100, lit: 50, role: 'depth field / cascade' },
  { name: 'KILL RED',    hex: '#FF0033', hue: 345, sat: 100, lit: 50, role: 'bearish / veto / alarm' },
  { name: 'REACTOR GOLD', hex: '#FFC800', hue: 47, sat: 100, lit: 50, role: 'signal / armed state' },
];

export const C = {
  blue: '#0044FF',
  cyan: '#00D4FF',
  magenta: '#FF00A8',
  violet: '#8400FF',
  red: '#FF0033',
  gold: '#FFC800',
  green: '#00FF9D',
  text: '#EAF2FF',
  sub: '#7D8FB8',
  void: '#020308',
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
