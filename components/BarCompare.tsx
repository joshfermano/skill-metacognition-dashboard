'use client';

import { useState } from 'react';

export interface BarGroup {
  label: string;
  // ordered series values for this group
  values: number[];
}

export interface BarCompareProps {
  groups: BarGroup[];
  // series names in order; first muted, second accent (or color list)
  series: string[];
  colors?: string[];
  // domain max (default 1 for proportions)
  max?: number;
  // format a value for tooltip / axis (default percent)
  format?: (v: number) => string;
  height?: number;
  horizontal?: boolean;
}

const DEFAULT_COLORS = ['#5b6473', '#e8a13a'];

export default function BarCompare({
  groups,
  series,
  colors = DEFAULT_COLORS,
  max = 1,
  format = (v) => `${Math.round(v * 100)}%`,
  height = 220,
  horizontal = false,
}: BarCompareProps) {
  const [hover, setHover] = useState<string | null>(null);

  if (horizontal) {
    return (
      <div className="space-y-3">
        <Legend series={series} colors={colors} />
        <div className="space-y-2.5">
          {groups.map((g) => (
            <div key={g.label} className="grid grid-cols-[minmax(120px,1fr)_3fr] items-center gap-3">
              <div className="truncate font-mono text-[11px] text-paper-dim" title={g.label}>
                {g.label}
              </div>
              <div className="space-y-1">
                {g.values.map((v, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <div className="h-3 flex-1 overflow-hidden rounded-sm bg-panel-2">
                      <div
                        className="h-full rounded-sm transition-all"
                        style={{ width: `${(v / max) * 100}%`, backgroundColor: colors[si] }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-[10px] tabular-nums text-paper-dim">
                      {format(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vertical grouped bars
  return (
    <div>
      <Legend series={series} colors={colors} />
      <div
        className="thin-scroll mt-4 flex items-end gap-4 overflow-x-auto pb-2"
        style={{ height: height + 28 }}
      >
        {groups.map((g) => (
          <div key={g.label} className="flex shrink-0 flex-col items-center">
            <div className="flex items-end gap-1" style={{ height }}>
              {g.values.map((v, si) => {
                const id = `${g.label}-${si}`;
                return (
                  <div
                    key={si}
                    className="relative flex w-7 items-end"
                    style={{ height }}
                    onMouseEnter={() => setHover(id)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{
                        height: `${Math.max((v / max) * 100, 1)}%`,
                        backgroundColor: colors[si],
                        opacity: hover && hover !== id ? 0.5 : 1,
                      }}
                    />
                    {hover === id ? (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-hairline bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                        {format(v)}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div
              className="mt-2 max-w-[80px] truncate text-center font-mono text-[10px] text-paper-dim"
              title={g.label}
            >
              {g.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ series, colors }: { series: string[]; colors: string[] }) {
  return (
    <div className="flex flex-wrap gap-4">
      {series.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: colors[i] }}
          />
          <span className="text-xs text-paper-dim">{s}</span>
        </div>
      ))}
    </div>
  );
}
