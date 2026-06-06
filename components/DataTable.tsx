'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  key: string;
  header: string;
  // value used for sorting/searching
  sortValue?: (row: T) => string | number;
  searchText?: (row: T) => string;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  // optional filter chips: label -> predicate
  filters?: { key: string; label: string; predicate: (row: T) => boolean }[];
  pageSize?: number;
}

export function DataTable<T>({
  rows,
  columns,
  searchPlaceholder = 'Search…',
  filters,
  pageSize = 25,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [limit, setLimit] = useState(pageSize);

  const processed = useMemo(() => {
    let out = rows;
    const f = filters?.find((x) => x.key === activeFilter);
    if (f) out = out.filter(f.predicate);

    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter((row) =>
        columns.some((c) => {
          const txt = c.searchText ? c.searchText(row) : '';
          return txt.toLowerCase().includes(q);
        })
      );
    }

    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        const sv = col.sortValue;
        out = [...out].sort((a, b) => {
          const va = sv(a);
          const vb = sv(b);
          let cmp = 0;
          if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb;
          else cmp = String(va).localeCompare(String(vb));
          return sortDir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, columns, query, sortKey, sortDir, activeFilter, filters]);

  const visible = processed.slice(0, limit);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(pageSize);
          }}
          placeholder={searchPlaceholder}
          className="w-64 rounded-md border border-hairline bg-panel-2 px-3 py-1.5 text-sm text-paper placeholder:text-muted focus:border-accent/60 focus:outline-none"
        />
        {filters && filters.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            <FilterChip
              label="all"
              active={activeFilter === null}
              onClick={() => {
                setActiveFilter(null);
                setLimit(pageSize);
              }}
            />
            {filters.map((f) => (
              <FilterChip
                key={f.key}
                label={f.label}
                active={activeFilter === f.key}
                onClick={() => {
                  setActiveFilter(f.key);
                  setLimit(pageSize);
                }}
              />
            ))}
          </div>
        ) : null}
        <span className="ml-auto font-mono text-[11px] text-muted">
          {processed.length} rows
        </span>
      </div>

      <div className="thin-scroll overflow-x-auto rounded-lg border border-hairline">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline bg-panel-2/60">
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => c.sortValue && toggleSort(c.key)}
                  className={cn(
                    'whitespace-nowrap px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider text-paper-dim',
                    c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                    c.sortValue && 'cursor-pointer select-none hover:text-accent'
                  )}
                >
                  {c.header}
                  {sortKey === c.key ? (
                    <span className="ml-1 text-accent">{sortDir === 'asc' ? '▲' : '▼'}</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr
                key={i}
                className="border-b border-hairline/40 last:border-0 hover:bg-panel-2/40"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-3 py-2 align-top',
                      c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                      c.className
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {limit < processed.length ? (
        <button
          onClick={() => setLimit((l) => l + pageSize)}
          className="mt-3 rounded-md border border-hairline px-3 py-1.5 text-xs text-paper-dim transition-colors hover:border-accent/50 hover:text-accent"
        >
          Show more ({processed.length - limit} hidden)
        </button>
      ) : null}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-md border px-2 py-1 text-[11px] transition-colors"
      style={{
        color: active ? 'var(--color-accent)' : 'var(--color-paper-dim)',
        borderColor: active ? 'rgba(232,161,58,0.5)' : 'var(--color-hairline)',
        backgroundColor: active ? 'rgba(232,161,58,0.08)' : 'transparent',
      }}
    >
      {label}
    </button>
  );
}
