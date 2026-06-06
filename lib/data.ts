import Papa from 'papaparse';
import type { Matrix } from './types';

// Static export is served at the site root; data lives under /data.
const BASE = '/data';

export async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchText(path: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// Parse a CSV string into row objects keyed by header.
export function parseRows<T = Record<string, string>>(csv: string): T[] {
  const out = Papa.parse<T>(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  return (out.data as T[]).filter(Boolean);
}

// Parse a "matrix" CSV: first column is the row label (header may be blank),
// remaining columns are the matrix columns. Values become number|null.
export function parseMatrix(csv: string): Matrix {
  const parsed = Papa.parse<string[]>(csv.trim(), {
    header: false,
    skipEmptyLines: true,
  });
  const grid = parsed.data as string[][];
  if (grid.length === 0) return { rows: [], cols: [], values: [] };

  const headerRow = grid[0];
  const cols = headerRow.slice(1).map((c) => c.trim());
  const rows: string[] = [];
  const values: (number | null)[][] = [];

  for (let i = 1; i < grid.length; i++) {
    const r = grid[i];
    if (!r || r.length === 0) continue;
    rows.push((r[0] ?? '').trim());
    const vrow: (number | null)[] = [];
    for (let j = 1; j < headerRow.length; j++) {
      const raw = (r[j] ?? '').trim();
      if (raw === '' || raw.toLowerCase() === 'nan') {
        vrow.push(null);
      } else {
        const n = Number(raw);
        vrow.push(Number.isFinite(n) ? n : null);
      }
    }
    values.push(vrow);
  }
  return { rows, cols, values };
}

// Min/max ignoring nulls.
export function matrixExtent(m: Matrix): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const row of m.values) {
    for (const v of row) {
      if (v == null) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!Number.isFinite(min)) return [0, 1];
  return [min, max];
}

// Symmetric absolute max for diverging maps centered at 0.
export function symmetricMax(m: Matrix): number {
  let mx = 0;
  for (const row of m.values) {
    for (const v of row) {
      if (v == null) continue;
      mx = Math.max(mx, Math.abs(v));
    }
  }
  return mx === 0 ? 1 : mx;
}

export function fmtPct(v: number | null, digits = 0): string {
  if (v == null || Number.isNaN(v)) return '--';
  return `${(v * 100).toFixed(digits)}%`;
}

export function fmtSigned(v: number | null, digits = 2): string {
  if (v == null || Number.isNaN(v)) return '--';
  const s = v >= 0 ? '+' : '';
  return `${s}${v.toFixed(digits)}`;
}
