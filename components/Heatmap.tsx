'use client';

import { useState } from 'react';
import type { Matrix } from '@/lib/types';
import { type Colormap, norm, textOn, NEUTRAL } from '@/lib/colormaps';

interface HoverInfo {
  row: string;
  col: string;
  value: number | null;
  x: number;
  y: number;
}

export interface HeatmapProps {
  matrix: Matrix;
  cmap: Colormap;
  // domain over which to normalize values (default [0,1]).
  domain?: [number, number];
  // For diverging maps, pass the symmetric absolute max; if set, values are
  // mapped as (v + M)/(2M) and `domain` is ignored.
  diverging?: number;
  // Show signed value annotations inside each cell.
  annotate?: boolean;
  // Format value for tooltip.
  formatValue?: (v: number | null) => string;
  // Label for the value in the tooltip (e.g. "pass rate", "failure").
  valueLabel?: string;
  rowLabel?: string;
  colLabel?: string;
  cellSize?: number;
  // Tighten row labels (e.g. for short symbol grids).
  rowLabelWidth?: number;
}

export default function Heatmap({
  matrix,
  cmap,
  domain = [0, 1],
  diverging,
  annotate = false,
  formatValue = (v) => (v == null ? '--' : v.toFixed(2)),
  valueLabel = 'value',
  rowLabel = 'row',
  colLabel = 'col',
  cellSize = 34,
  rowLabelWidth = 180,
}: HeatmapProps) {
  const [hover, setHover] = useState<HoverInfo | null>(null);

  const colorFor = (v: number | null): string => {
    if (v == null || Number.isNaN(v)) return NEUTRAL;
    if (diverging != null) {
      const t = diverging === 0 ? 0.5 : (v + diverging) / (2 * diverging);
      return cmap(Math.max(0, Math.min(1, t)));
    }
    return cmap(norm(v, domain[0], domain[1]));
  };

  const tFor = (v: number | null): number => {
    if (v == null) return 0.5;
    if (diverging != null) return diverging === 0 ? 0.5 : (v + diverging) / (2 * diverging);
    return norm(v, domain[0], domain[1]);
  };

  return (
    <div className="relative">
      <div className="thin-scroll overflow-x-auto pb-2">
        <div className="inline-block">
          {/* Column header */}
          <div className="flex" style={{ paddingLeft: rowLabelWidth }}>
            {matrix.cols.map((c) => (
              <div
                key={c}
                className="flex items-end justify-center pb-2 font-mono text-[10px] text-paper-dim"
                style={{ width: cellSize, minWidth: cellSize }}
                title={c}
              >
                <span className="origin-bottom-left -rotate-45 whitespace-nowrap">{c}</span>
              </div>
            ))}
          </div>

          {matrix.rows.map((r, i) => (
            <div key={r + i} className="flex items-center">
              <div
                className="truncate pr-3 text-right font-mono text-[11px] text-paper-dim"
                style={{ width: rowLabelWidth, minWidth: rowLabelWidth }}
                title={r}
              >
                {r}
              </div>
              {matrix.values[i].map((v, j) => {
                const bg = colorFor(v);
                const fg = v == null ? '#6f7480' : textOn(tFor(v), cmap);
                return (
                  <div
                    key={j}
                    className="flex items-center justify-center border border-ink/40 transition-[outline] hover:outline hover:outline-2 hover:outline-accent"
                    style={{
                      width: cellSize,
                      minWidth: cellSize,
                      height: cellSize,
                      backgroundColor: bg,
                      color: fg,
                    }}
                    onMouseEnter={(e) =>
                      setHover({
                        row: r,
                        col: matrix.cols[j],
                        value: v,
                        x: e.clientX,
                        y: e.clientY,
                      })
                    }
                    onMouseMove={(e) =>
                      setHover((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h))
                    }
                    onMouseLeave={() => setHover(null)}
                  >
                    {annotate && v != null ? (
                      <span className="font-mono text-[9px] tabular-nums">
                        {v >= 0 ? '+' : ''}
                        {v.toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {hover ? (
        <div
          className="pointer-events-none fixed z-[60] max-w-xs rounded-md border border-hairline bg-panel-2 px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(hover.x + 14, typeof window !== 'undefined' ? window.innerWidth - 220 : hover.x),
            top: hover.y + 14,
          }}
        >
          <div className="font-mono text-[11px] text-paper">
            <span className="text-paper-dim">{rowLabel}: </span>
            {hover.row}
          </div>
          <div className="font-mono text-[11px] text-paper">
            <span className="text-paper-dim">{colLabel}: </span>
            {hover.col}
          </div>
          <div className="mt-1 font-mono text-[12px] text-accent">
            {valueLabel}: {formatValue(hover.value)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
