// shadcn-style primitives, hand-built with Tailwind v4 + neutral tokens.
import { cn, familyColor } from '@/lib/cn';

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-hairline bg-panel/70 backdrop-blur-sm',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  color,
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  const style = color
    ? {
        color,
        borderColor: `${color}55`,
        backgroundColor: `${color}1a`,
      }
    : undefined;
  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center rounded-md border border-hairline px-2 py-0.5 text-[11px] font-medium tracking-wide',
        !color && 'text-paper-dim',
        className
      )}
    >
      {children}
    </span>
  );
}

export function FamilyBadge({ family }: { family: string }) {
  return <Badge color={familyColor(family)}>{family}</Badge>;
}

export function Mono({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn('font-mono text-[12px]', className)}>{children}</span>;
}

// Section wrapper with an anchor id and a numbered header.
export function Section({
  id,
  index,
  title,
  caption,
  children,
}: {
  id: string;
  index: string;
  title: string;
  caption?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-hairline/60 py-16">
      <div className="mb-8">
        <div className="mb-2 flex items-baseline gap-3">
          <span className="font-mono text-xs text-accent">{index}</span>
          <h2 className="font-display text-3xl font-medium tracking-tight text-paper sm:text-4xl">
            {title}
          </h2>
        </div>
        {caption ? (
          <p className="max-w-3xl text-sm leading-relaxed text-paper-dim">{caption}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
