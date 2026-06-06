'use client';

import { useEffect, useState } from 'react';

export interface NavItem {
  id: string;
  label: string;
}

export default function SectionNav({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? '');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const total = h.scrollHeight - h.clientHeight;
      setProgress(total > 0 ? scrolled / total : 0);

      // Active section = last heading whose top is above the trigger line.
      let current = items[0]?.id ?? '';
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top <= 120) current = it.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [items]);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline/70 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3">
        <a href="#overview" className="shrink-0">
          <span className="font-display text-base font-semibold tracking-tight text-paper">
            Skill<span className="text-accent">·</span>Metacog
          </span>
        </a>
        <nav className="thin-scroll -mb-1 flex flex-1 items-center gap-1 overflow-x-auto pb-1">
          {items.map((it) => (
            <a
              key={it.id}
              href={`#${it.id}`}
              className="shrink-0 rounded-md px-2.5 py-1 text-[12px] transition-colors"
              style={{
                color: active === it.id ? 'var(--color-accent)' : 'var(--color-paper-dim)',
                backgroundColor: active === it.id ? 'rgba(232,161,58,0.08)' : 'transparent',
              }}
            >
              {it.label}
            </a>
          ))}
        </nav>
      </div>
      {/* Scroll progress */}
      <div className="h-px w-full bg-transparent">
        <div
          className="h-px bg-accent transition-[width] duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </header>
  );
}
