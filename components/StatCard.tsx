import { Card } from './ui';

export function StatCard({
  label,
  value,
  unit,
  hint,
  accent = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Card className="px-5 py-4">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className="font-display text-3xl font-semibold tabular-nums sm:text-4xl"
          style={{ color: accent ? 'var(--color-accent)' : 'var(--color-paper)' }}
        >
          {value}
        </span>
        {unit ? <span className="font-mono text-sm text-paper-dim">{unit}</span> : null}
      </div>
      {hint ? <div className="mt-1 text-[11px] text-muted">{hint}</div> : null}
    </Card>
  );
}
