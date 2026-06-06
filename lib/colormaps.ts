// Colormap utilities approximating matplotlib palettes with anchor colors and
// linear RGB interpolation. Each function maps a value to an "rgb(r, g, b)" string.

export type RGB = [number, number, number];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rgbStr([r, g, b]: RGB): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

// Interpolate across an ordered list of anchor stops (t in [0,1]).
function sample(stops: RGB[], t: number): RGB {
  const tt = Math.max(0, Math.min(1, t));
  const n = stops.length - 1;
  const x = tt * n;
  const i = Math.min(Math.floor(x), n - 1);
  const f = x - i;
  const a = stops[i];
  const b = stops[i + 1];
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
}

export const NEUTRAL = 'rgb(38, 45, 56)'; // for null / NaN cells

// --- Sequential palettes (matplotlib-approximate) ---

// RdYlBu: red (low) -> yellow (mid) -> blue (high). Reversed from matplotlib's
// default so that HIGH pass-rate reads blue, LOW reads red (per spec).
const RDYLBU_STOPS: RGB[] = [
  [165, 0, 38], // 0.0 deep red
  [215, 48, 39],
  [244, 109, 67],
  [253, 174, 97],
  [254, 224, 144],
  [255, 255, 191], // 0.5 pale yellow
  [224, 243, 248],
  [171, 217, 233],
  [116, 173, 209],
  [69, 117, 180],
  [49, 54, 149], // 1.0 deep blue
];

export function rdYlBu(t: number): string {
  return rgbStr(sample(RDYLBU_STOPS, t));
}

// Reds: white -> dark red (high = darker).
const REDS_STOPS: RGB[] = [
  [255, 245, 240],
  [254, 224, 210],
  [252, 187, 161],
  [252, 146, 114],
  [251, 106, 74],
  [239, 59, 44],
  [203, 24, 29],
  [165, 15, 21],
  [103, 0, 13],
];

export function reds(t: number): string {
  return rgbStr(sample(REDS_STOPS, t));
}

// YlGnBu: pale yellow (low) -> green -> deep blue (high).
const YLGNBU_STOPS: RGB[] = [
  [255, 255, 217],
  [237, 248, 177],
  [199, 233, 180],
  [127, 205, 187],
  [65, 182, 196],
  [29, 145, 192],
  [34, 94, 168],
  [37, 52, 148],
  [8, 29, 88],
];

export function ylGnBu(t: number): string {
  return rgbStr(sample(YLGNBU_STOPS, t));
}

// RdBu diverging: red (negative) -> white (zero) -> blue (positive).
const RDBU_STOPS: RGB[] = [
  [103, 0, 31], // -1
  [178, 24, 43],
  [214, 96, 77],
  [244, 165, 130],
  [253, 219, 199],
  [247, 247, 247], // 0
  [209, 229, 240],
  [146, 197, 222],
  [67, 147, 195],
  [33, 102, 172],
  [5, 48, 97], // +1
];

// Maps a normalized t in [0,1] across the full diverging ramp.
export function rdBu(t: number): string {
  return rgbStr(sample(RDBU_STOPS, t));
}

// Convenience type for a colormap function.
export type Colormap = (t: number) => string;

// Normalize a value v into [0,1] given a [min,max] domain.
export function norm(v: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (v - min) / (max - min);
}

// For a diverging map centered at 0 with symmetric domain [-M, M]:
// returns the rgb string for value v.
export function divergingColor(v: number, M: number, cmap: Colormap = rdBu): string {
  if (M === 0) return cmap(0.5);
  const t = (v + M) / (2 * M); // -M -> 0, 0 -> 0.5, +M -> 1
  return cmap(Math.max(0, Math.min(1, t)));
}

// Choose readable text color (dark or light) for a given background luminance.
export function textOn(t: number, cmap: Colormap): string {
  const m = cmap(t).match(/\d+/g);
  if (!m) return '#e8e4dc';
  const [r, g, b] = m.map(Number);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.58 ? '#1a1d23' : '#e8e4dc';
}
