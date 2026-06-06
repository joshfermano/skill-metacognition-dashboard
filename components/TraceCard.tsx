'use client';

import type { Trace } from '@/lib/types';
import { Card, Badge, Mono } from './ui';

export function TraceCard({ trace }: { trace: Trace }) {
  const isPost = trace.condition === 'post_training';
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-panel-2/60 px-5 py-3">
        <div className="flex items-center gap-3">
          <Badge
            color={isPost ? '#e8a13a' : '#5b6473'}
            className="uppercase tracking-wider"
          >
            {isPost ? 'post-training' : 'pre-training'}
          </Badge>
          <span className="font-display text-lg text-paper">{trace.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mono className="text-paper-dim">{trace.model}</Mono>
          <Badge color={trace.passed ? '#7fb59b' : '#c47f8f'}>
            {trace.passed ? 'passed' : 'failed'}
          </Badge>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        {isPost ? (
          trace.steps.map((step, i) => (
            <div key={i} className="relative pl-6">
              <span className="absolute left-0 top-0.5 font-mono text-[11px] text-accent">
                {String(i + 1).padStart(2, '0')}
              </span>
              {/* Candidate chips, chosen highlighted */}
              <div className="mb-2 flex flex-wrap gap-1.5">
                <span className="mr-1 self-center text-[10px] uppercase tracking-wider text-muted">
                  candidates
                </span>
                {step.candidates.map((c) => {
                  const chosen = c === step.chosen;
                  return (
                    <span
                      key={c}
                      className="rounded-md border px-2 py-0.5 font-mono text-[11px]"
                      style={
                        chosen
                          ? {
                              color: '#e8a13a',
                              borderColor: '#e8a13a88',
                              backgroundColor: '#e8a13a18',
                            }
                          : {
                              color: '#8a8f9a',
                              borderColor: '#262d38',
                              backgroundColor: 'transparent',
                            }
                      }
                    >
                      {chosen ? '▸ ' : ''}
                      {c}
                    </span>
                  );
                })}
              </div>
              <div className="space-y-1 text-[13px] leading-relaxed">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    why{' '}
                  </span>
                  <span className="text-paper">{step.why}</span>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    apply{' '}
                  </span>
                  <span className="text-paper-dim">{step.applied}</span>
                </div>
                {step.named_before_use ? (
                  <div className="font-mono text-[10px] text-paper-dim">
                    <span className="text-accent">{'✓'}</span> skill named before use
                  </div>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          // Pre-training: no enumerated candidates, just opaque step text.
          <div className="rounded-md border border-dashed border-hairline bg-panel-2/30 px-4 py-3">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted">
              no skill enumeration {'·'} no selection {'·'} no naming
            </div>
            <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-paper-dim">
              {trace.raw}
            </pre>
          </div>
        )}

        {/* Answer line */}
        <div className="flex items-center gap-2 border-t border-hairline/60 pt-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">answer</span>
          <Mono className="text-paper">{trace.answer}</Mono>
          <span className="ml-auto font-mono text-[11px] text-paper-dim">
            score {trace.score.toFixed(2)}
          </span>
        </div>

        {/* Interrogation (post only) */}
        {isPost && trace.interrogation && trace.interrogation.question ? (
          <div className="rounded-md border border-accent/30 bg-accent/[0.06] px-4 py-3">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-accent">
              interrogation {'·'} step {(trace.interrogation.step ?? 0) + 1}
            </div>
            <div className="text-[13px] leading-relaxed text-paper">
              <span className="text-paper-dim">Q: </span>
              {trace.interrogation.question}
            </div>
            <div className="mt-1 text-[13px] leading-relaxed text-paper">
              <span className="text-paper-dim">A: </span>
              {trace.interrogation.answer}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
