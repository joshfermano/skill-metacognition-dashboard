'use client';

import { useMemo } from 'react';
import { useData } from '@/lib/useData';
import { matrixExtent, symmetricMax, fmtPct, fmtSigned } from '@/lib/data';
import { rdYlBu, reds, ylGnBu, rdBu } from '@/lib/colormaps';
import { familyColor } from '@/lib/cn';
import type { SkillRow, TaskRow } from '@/lib/types';

import SectionNav, { type NavItem } from './SectionNav';
import Heatmap from './Heatmap';
import BarCompare, { type BarGroup } from './BarCompare';
import { StatCard } from './StatCard';
import { TraceCard } from './TraceCard';
import { DataTable, type Column } from './DataTable';
import { ReportMarkdown } from './ReportMarkdown';
import { Card, Badge, FamilyBadge, Mono, Section } from './ui';

const METRIC_LABELS: Record<string, string> = {
  enumeration_recall: 'Enumeration recall',
  selection_accuracy: 'Selection accuracy',
  name_before_use: 'Name-before-use',
  answer_correct: 'Answer correct',
};

export default function Dashboard() {
  const d = useData();

  const realPresent = !!d.realSummary;

  const nav: NavItem[] = useMemo(() => {
    const base: NavItem[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'model-grid', label: 'Model × Task' },
      { id: 'co-failure', label: 'Co-failure' },
      { id: 'baseline-uplift', label: 'Baseline / Uplift' },
      { id: 'self-improvement', label: 'Self-improvement' },
      { id: 'metacognition', label: 'Metacognition' },
      { id: 'code-tasks', label: 'Code tasks' },
    ];
    if (realPresent) base.push({ id: 'real-results', label: 'Real results' });
    base.push({ id: 'skills', label: 'Skills' });
    base.push({ id: 'tasks', label: 'Tasks' });
    base.push({ id: 'report', label: 'Report' });
    return base;
  }, [realPresent]);

  return (
    <div>
      <SectionNav items={nav} />
      <main className="mx-auto max-w-7xl px-5">
        {d.loading ? (
          <div className="flex h-[60vh] items-center justify-center">
            <span className="font-mono text-sm text-paper-dim">loading pipeline outputs…</span>
          </div>
        ) : (
          <>
            <Overview d={d} realPresent={realPresent} />
            <ModelGrid d={d} />
            <CoFailure d={d} />
            <BaselineUplift d={d} />
            <SelfImprovement d={d} />
            <Metacognition d={d} />
            <CodeTasks d={d} />
            {realPresent ? <RealResults d={d} /> : <RealAbsentNote />}
            <SkillsTable skills={d.skills} />
            <TasksTable tasks={d.tasks} skills={d.skills} />
            <ReportSection md={d.reportMd} />
            <Footer />
          </>
        )}
      </main>
    </div>
  );
}

type D = ReturnType<typeof useData>;

// 1. Overview ---------------------------------------------------------------
function Overview({ d, realPresent }: { d: D; realPresent: boolean }) {
  const s = d.summary;
  return (
    <section id="overview" className="scroll-mt-24 pt-16 pb-4">
      <div className="rise" style={{ animationDelay: '0ms' }}>
        <div className="mb-3 flex items-center gap-3">
          <Badge color={s?.backend === 'simulation' ? '#7aa2c8' : '#e8a13a'}>
            {s?.backend ?? 'unknown'} backend
          </Badge>
          <Mono className="text-muted">fixed model · {s?.fixed_model ?? '—'}</Mono>
          {realPresent ? (
            <Badge color="#7fb59b">+ real ({d.realSummary?.backend ?? 'openrouter'})</Badge>
          ) : null}
        </div>
        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-paper sm:text-6xl">
          Skill-Metacognition
          <br />
          <span className="text-accent">Pipeline</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-paper-dim">
          A research instrument over LLM skill extraction, metacognition-scaffolded task
          generation, easy-to-hard evaluation, and STaR-style self-improvement. Numbers from the
          simulation backend are synthetic and calibrated to published magnitudes.
        </p>
      </div>

      <div className="rise mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" style={{ animationDelay: '120ms' }}>
        <StatCard label="Extracted skills" value={s?.n_extracted_skills ?? '—'} />
        <StatCard label="ND skills" value={s?.n_nd_skills ?? '—'} />
        <StatCard label="Total tasks" value={s?.n_tasks ?? '—'} />
        <StatCard
          label="Skill-mix uplift"
          value={s ? s.skillmix_uplift_mean_pp.toFixed(1) : '—'}
          unit="pp"
        />
        <StatCard
          label="Self-improvement"
          value={s ? s.self_improvement_mean_pp.toFixed(1) : '—'}
          unit="pp"
          accent
        />
        <StatCard
          label="Post selection acc."
          value={s ? fmtPct(s.metacog_post.selection_accuracy, 1) : '—'}
          accent
        />
      </div>
    </section>
  );
}

// 2. Model × Task grid ------------------------------------------------------
function ModelGrid({ d }: { d: D }) {
  const m = d.modelTaskPass;
  return (
    <Section
      id="model-grid"
      index="01"
      title="Model × Task grid"
      caption="Pass rate per task (rows, sorted easy→hard top to bottom) across evaluated models (columns). RdYlBu: blue = high pass, red = low. Hover any cell for detail."
    >
      {m ? (
        <Card className="p-5">
          <Heatmap
            matrix={m}
            cmap={rdYlBu}
            domain={[0, 1]}
            valueLabel="pass rate"
            rowLabel="task"
            colLabel="model"
            formatValue={(v) => fmtPct(v, 0)}
            rowLabelWidth={160}
          />
          <LegendBar cmap={rdYlBu} left="0% pass" right="100% pass" />
        </Card>
      ) : (
        <Empty />
      )}
    </Section>
  );
}

// 3. Skill-pair co-failure --------------------------------------------------
function CoFailure({ d }: { d: D }) {
  const m = d.skillPairFailure;
  return (
    <Section
      id="co-failure"
      index="02"
      title="Skill-pair co-failure"
      caption="Failure rate when two natural-deduction rules are required together, over the nine ND symbols (Asm, →I, MP, ∧I, ∧E, ∨I, ∨E, ¬I, ⊥E). Reds: darker = more failure."
    >
      {m ? (
        <Card className="p-5">
          <Heatmap
            matrix={m}
            cmap={reds}
            domain={[0, 1]}
            valueLabel="failure"
            rowLabel="rule"
            colLabel="paired with"
            formatValue={(v) => fmtPct(v, 0)}
            cellSize={42}
            rowLabelWidth={64}
          />
          <LegendBar cmap={reds} left="0% fail" right="100% fail" />
        </Card>
      ) : (
        <Empty />
      )}
    </Section>
  );
}

// 4. Baseline vs Uplift -----------------------------------------------------
function BaselineUplift({ d }: { d: D }) {
  const base = d.baseline;
  const up = d.uplift;
  const M = up ? symmetricMax(up) : 1;
  return (
    <Section
      id="baseline-uplift"
      index="03"
      title="Baseline vs Uplift"
      caption={
        <>
          Left: baseline pass rate per language task × small model (YlGnBu). Right: uplift from
          skill-targeted prompting, a diverging RdBu centered at 0 — blue helped, red hurt —
          symmetric domain ±{M.toFixed(2)}. Cells annotate the signed delta.
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-paper-dim">
            baseline
          </div>
          {base ? (
            <>
              <Heatmap
                matrix={base}
                cmap={ylGnBu}
                domain={[0, 1]}
                valueLabel="baseline"
                rowLabel="task"
                colLabel="model"
                formatValue={(v) => fmtPct(v, 0)}
                cellSize={44}
                rowLabelWidth={150}
              />
              <LegendBar cmap={ylGnBu} left="0" right="1" />
            </>
          ) : (
            <Empty />
          )}
        </Card>
        <Card className="p-5">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-paper-dim">
            uplift (Δ)
          </div>
          {up ? (
            <>
              <Heatmap
                matrix={up}
                cmap={rdBu}
                diverging={M}
                annotate
                valueLabel="uplift"
                rowLabel="task"
                colLabel="model"
                formatValue={(v) => fmtSigned(v, 2)}
                cellSize={44}
                rowLabelWidth={150}
              />
              <LegendBar cmap={rdBu} left={`−${M.toFixed(2)} hurt`} right={`+${M.toFixed(2)} helped`} mid="0" />
            </>
          ) : (
            <Empty />
          )}
        </Card>
      </div>
    </Section>
  );
}

// 5. Self-improvement -------------------------------------------------------
function SelfImprovement({ d }: { d: D }) {
  const rows = d.selfImprovement;
  const groups: BarGroup[] = rows.map((r) => ({ label: r.label, values: [r.before, r.after] }));
  const meanDelta =
    rows.length > 0 ? rows.reduce((a, r) => a + r.delta, 0) / rows.length : 0;
  return (
    <Section
      id="self-improvement"
      index="04"
      title="Self-improvement"
      caption="Per-task pass rate before (muted) vs after (accent) STaR-style best-of-n rejection-sampling self-improvement."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <Card className="p-5">
          {rows.length ? (
            <BarCompare
              groups={groups}
              series={['before', 'after']}
              colors={['#5b6473', '#e8a13a']}
              max={1}
              horizontal
            />
          ) : (
            <Empty />
          )}
        </Card>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <StatCard
            label="Mean Δ"
            value={`+${(meanDelta * 100).toFixed(1)}`}
            unit="pp"
            accent
            hint="across tasks"
          />
          <StatCard
            label="Reported"
            value={d.summary ? `+${d.summary.self_improvement_mean_pp.toFixed(1)}` : '—'}
            unit="pp"
            hint="summary.json"
          />
        </div>
      </div>
    </Section>
  );
}

// 6. Metacognition ----------------------------------------------------------
function Metacognition({ d }: { d: D }) {
  const pre = d.metacog['pre_training'];
  const post = d.metacog['post_training'];
  const keys = ['enumeration_recall', 'selection_accuracy', 'name_before_use', 'answer_correct'];
  const groups: BarGroup[] =
    pre && post
      ? keys.map((k) => ({ label: METRIC_LABELS[k], values: [pre[k], post[k]] }))
      : [];

  // Pick example traces: one pre + one post (same task ideally), then a second post.
  const post1 = d.traces.find((t) => t.condition === 'post_training');
  const pre1 = d.traces.find((t) => t.condition === 'pre_training' && t.label === post1?.label) ??
    d.traces.find((t) => t.condition === 'pre_training');
  const post2 = d.traces.find(
    (t) => t.condition === 'post_training' && t.task_uid !== post1?.task_uid
  );

  return (
    <Section
      id="metacognition"
      index="05"
      title="Metacognition scaffolding"
      caption="The named-skill protocol: enumerate candidate skills, choose one, name it before use, then justify the choice under interrogation. Pre-training has no skill catalogue in context; post-training does. This contrast is the centerpiece."
    >
      <Card className="mb-6 p-5">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-paper-dim">
          metric scores · pre vs post
        </div>
        {groups.length ? (
          <BarCompare
            groups={groups}
            series={['pre-training', 'post-training']}
            colors={['#5b6473', '#e8a13a']}
            max={1}
            height={200}
          />
        ) : (
          <Empty />
        )}
      </Card>

      <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-paper-dim">
        example traces
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {pre1 ? <TraceCard trace={pre1} /> : null}
        {post1 ? <TraceCard trace={post1} /> : null}
      </div>
      {post2 ? (
        <div className="mt-5">
          <TraceCard trace={post2} />
        </div>
      ) : null}
    </Section>
  );
}

// 7. Code tasks -------------------------------------------------------------
function CodeTasks({ d }: { d: D }) {
  const m = d.codeTasks;
  return (
    <Section
      id="code-tasks"
      index="06"
      title="Code-derived tasks"
      caption="Tasks derived from a small PICO-8-style Lua source (locate / grep / trace / explain / decompose), with deterministic gold checked against the file. RdYlBu: blue = high pass."
    >
      {m ? (
        <Card className="p-5">
          <Heatmap
            matrix={m}
            cmap={rdYlBu}
            domain={[0, 1]}
            valueLabel="pass rate"
            rowLabel="task"
            colLabel="model"
            formatValue={(v) => fmtPct(v, 0)}
            cellSize={44}
            rowLabelWidth={180}
          />
          <LegendBar cmap={rdYlBu} left="0% pass" right="100% pass" />
        </Card>
      ) : (
        <Empty />
      )}
    </Section>
  );
}

// 7. Real results -----------------------------------------------------------
function RealResults({ d }: { d: D }) {
  const s = d.realSummary!;
  const rows = d.realVsSim?.rows ?? [];
  const rvsGroups: BarGroup[] = rows.map((r) => ({ label: r.label, values: [r.real, r.sim] }));

  const pre = d.realMetacog['pre_training'];
  const post = d.realMetacog['post_training'];
  const mkeys = ['enumeration_recall', 'selection_accuracy', 'name_before_use', 'answer_correct'];
  const mcGroups: BarGroup[] =
    pre && post ? mkeys.map((k) => ({ label: METRIC_LABELS[k], values: [pre[k], post[k]] })) : [];

  const postTrace = d.realTraces.find((t) => t.condition === 'post_training');
  const preTrace =
    d.realTraces.find((t) => t.condition === 'pre_training' && t.label === postTrace?.label) ??
    d.realTraces.find((t) => t.condition === 'pre_training');

  const modelList = s.models?.join(', ') ?? s.model ?? '—';

  return (
    <Section
      id="real-results"
      index="07"
      title="Real results"
      caption="Measured on real open-weight models via OpenRouter, cached for keyless reproducibility. The code tasks embed their source so the models can actually read it; vague broad tasks are excluded from the real slice. The real-vs-sim gap is the point — it shows where a calibrated simulation and a real model diverge."
    >
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Backend" value={s.backend} />
        <StatCard label="Models" value={s.models?.length ?? 1} hint={modelList} />
        <StatCard label="Primary" value={s.primary ?? s.model ?? '—'} />
        <StatCard label="Real vs sim MAE" value={s.real_vs_sim_mae_pp.toFixed(1)} unit="pp" accent />
        <StatCard label="Trials" value={s.trials ?? '—'} />
        <StatCard label="Cached calls" value={s.cached_calls ?? '—'} hint="reproducible, no key" />
      </div>

      <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-paper-dim">
        real model × task grid
      </div>
      {d.realGrid ? (
        <Card className="mb-6 p-5">
          <Heatmap
            matrix={d.realGrid}
            cmap={rdYlBu}
            domain={[0, 1]}
            valueLabel="pass rate"
            rowLabel="task"
            colLabel="model"
            formatValue={(v) => fmtPct(v, 0)}
            cellSize={64}
            rowLabelWidth={190}
          />
          <LegendBar cmap={rdYlBu} left="0% pass" right="100% pass" />
        </Card>
      ) : (
        <Empty />
      )}

      <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-paper-dim">
        real ({s.primary ?? 'model'}) vs simulation ({s.sim_model}) · mean |Δ| = {s.real_vs_sim_mae_pp.toFixed(1)} pp
      </div>
      <Card className="mb-6 p-5">
        {rvsGroups.length ? (
          <BarCompare
            groups={rvsGroups}
            series={['real', 'simulation']}
            colors={['#e8a13a', '#7aa2c8']}
            max={1}
            horizontal
          />
        ) : (
          <Empty />
        )}
      </Card>

      <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-paper-dim">
        real metacognition · pre vs post — the named-skill protocol on a real model
      </div>
      <Card className="mb-6 p-5">
        {mcGroups.length ? (
          <BarCompare
            groups={mcGroups}
            series={['pre-training', 'post-training']}
            colors={['#5b6473', '#e8a13a']}
            max={1}
            height={200}
          />
        ) : (
          <Empty />
        )}
      </Card>

      {preTrace || postTrace ? (
        <>
          <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-paper-dim">
            real example traces
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {preTrace ? <TraceCard trace={preTrace} /> : null}
            {postTrace ? <TraceCard trace={postTrace} /> : null}
          </div>
        </>
      ) : null}
    </Section>
  );
}

function RealAbsentNote() {
  return (
    <Section id="real-results" index="07" title="Real results" caption="Optional section.">
      <Card className="px-5 py-6">
        <p className="text-sm text-paper-dim">
          No real run is present. Run the real pipeline (<Mono>python -m src.run_real</Mono>, writes{' '}
          <Mono>outputs/real/</Mono>) and rebuild; this section will populate with the real model×task
          grid, real-vs-simulated pass rates, and the real metacognition metrics and traces.
        </p>
      </Card>
    </Section>
  );
}

// 10. Technical report ------------------------------------------------------
function ReportSection({ md }: { md: string | null }) {
  return (
    <Section
      id="report"
      index="10"
      title="Technical report"
      caption="The full methodology, grounding in the Arora-lab literature, and findings — rendered from TECHNICAL_REPORT.md."
    >
      {md ? (
        <Card className="px-6 py-7 sm:px-8">
          <ReportMarkdown md={md} />
        </Card>
      ) : (
        <Empty />
      )}
    </Section>
  );
}

// 9. Skills -----------------------------------------------------------------
function SkillsTable({ skills }: { skills: SkillRow[] }) {
  const columns: Column<SkillRow>[] = [
    {
      key: 'uid',
      header: 'UID',
      render: (r) => <Mono className="text-paper-dim">{r.skill_uid}</Mono>,
      searchText: (r) => r.skill_uid,
      sortValue: (r) => r.skill_uid,
    },
    {
      key: 'name',
      header: 'Name / slug',
      render: (r) => (
        <div>
          <div className="text-paper">{r.name}</div>
          <Mono className="text-[11px] text-muted">{r.name.replace(/ /g, '_')}</Mono>
        </div>
      ),
      searchText: (r) => r.name,
      sortValue: (r) => r.name,
    },
    {
      key: 'symbol',
      header: 'Sym',
      render: (r) => (r.symbol ? <Mono className="text-accent">{r.symbol}</Mono> : <span className="text-muted">—</span>),
      sortValue: (r) => r.symbol,
      align: 'center',
    },
    {
      key: 'family',
      header: 'Family',
      render: (r) => <FamilyBadge family={r.family} />,
      searchText: (r) => r.family,
      sortValue: (r) => r.family,
    },
    {
      key: 'rank',
      header: 'Cog. rank',
      render: (r) => <span className="tabular-nums text-paper-dim">{r.cognitive_rank}</span>,
      sortValue: (r) => r.cognitive_rank,
      align: 'right',
    },
    {
      key: 'members',
      header: 'Members',
      render: (r) => <span className="tabular-nums text-muted">{r.n_members}</span>,
      sortValue: (r) => r.n_members,
      align: 'right',
    },
    {
      key: 'group',
      header: 'Group',
      render: (r) => <Mono className="text-paper-dim">{r.group}</Mono>,
      searchText: (r) => r.group,
      sortValue: (r) => r.group,
    },
  ];
  const filters = [
    { key: 'extracted', label: 'extracted', predicate: (r: SkillRow) => r.group === 'extracted' },
    { key: 'nd', label: 'natural_deduction', predicate: (r: SkillRow) => r.group === 'natural_deduction' },
    { key: 'code', label: 'code', predicate: (r: SkillRow) => r.group === 'code' },
  ];
  return (
    <Section
      id="skills"
      index="08"
      title="Skills"
      caption="Extracted, natural-deduction, and code skills with their four-word canonical names and underscore slugs. Search, sort any column, or filter by group."
    >
      <DataTable rows={skills} columns={columns} filters={filters} searchPlaceholder="Search skills…" pageSize={30} />
    </Section>
  );
}

// 10. Tasks -----------------------------------------------------------------
function TasksTable({ tasks, skills }: { tasks: TaskRow[]; skills: SkillRow[] }) {
  const nameByUid = new Map(skills.map((s) => [s.skill_uid, s.name]));
  const families = Array.from(new Set(tasks.map((t) => t.family))).sort();
  const columns: Column<TaskRow>[] = [
    {
      key: 'label',
      header: 'Label',
      render: (r) => <span className="text-paper">{r.label}</span>,
      searchText: (r) => `${r.label} ${r.prompt}`,
      sortValue: (r) => r.label,
    },
    {
      key: 'family',
      header: 'Family',
      render: (r) => <FamilyBadge family={r.family} />,
      searchText: (r) => r.family,
      sortValue: (r) => r.family,
    },
    {
      key: 'k',
      header: 'k',
      render: (r) => <span className="tabular-nums text-paper-dim">{r.k}</span>,
      sortValue: (r) => r.k,
      align: 'right',
    },
    {
      key: 'difficulty',
      header: 'Difficulty',
      render: (r) => <span className="tabular-nums text-paper-dim">{r.difficulty.toFixed(2)}</span>,
      sortValue: (r) => r.difficulty,
      align: 'right',
    },
    {
      key: 'skills',
      header: 'Skill UIDs',
      render: (r) => (
        <div className="flex max-w-[260px] flex-wrap gap-1">
          {r.skill_uids.map((u) => (
            <span
              key={u}
              title={nameByUid.get(u) ?? u}
              className="rounded border border-hairline bg-panel-2/60 px-1.5 py-0.5 font-mono text-[10px] text-paper-dim"
            >
              {u.slice(0, 9)}
            </span>
          ))}
        </div>
      ),
      searchText: (r) => r.skill_uids.join(' '),
    },
    {
      key: 'prompt',
      header: 'Prompt',
      render: (r) => <ExpandablePrompt text={r.prompt} />,
      searchText: (r) => r.prompt,
      className: 'min-w-[280px] max-w-[420px]',
    },
  ];
  const filters = families.map((f) => ({
    key: f,
    label: f,
    predicate: (r: TaskRow) => r.family === f,
  }));
  return (
    <Section
      id="tasks"
      index="09"
      title="Tasks"
      caption="The full task catalogue: label, family, k (skills required), difficulty, the skill UIDs each task targets, and the prompt. Search across labels and prompts, filter by family."
    >
      <DataTable rows={tasks} columns={columns} filters={filters} searchPlaceholder="Search tasks…" pageSize={20} />
    </Section>
  );
}

function ExpandablePrompt({ text }: { text: string }) {
  const truncated = text.length > 90;
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-[12px] leading-relaxed text-paper-dim marker:hidden">
        <span className="group-open:hidden">
          {truncated ? text.slice(0, 90) + '…' : text}
        </span>
        <span className="hidden group-open:inline text-paper">{text}</span>
        {truncated ? (
          <span className="ml-1 font-mono text-[10px] text-accent">
            <span className="group-open:hidden">[+]</span>
            <span className="hidden group-open:inline">[−]</span>
          </span>
        ) : null}
      </summary>
    </details>
  );
}

// 11. Footer ----------------------------------------------------------------
function Footer() {
  return (
    <footer className="mt-12 border-t border-hairline/60 py-12 text-sm leading-relaxed text-muted">
      <p className="max-w-3xl">
        Grounded in Sanjeev Arora&rsquo;s Skill-Mix (arXiv:2310.17567), LLM Metacognition
        (arXiv:2405.12205), and Instruct-SkillMix (arXiv:2408.14774); the self-improvement loop
        follows STaR. The natural-deduction rule set is standard logic used illustratively.
        SkillsBench is a separate multi-institution benchmark used here only as a style template.
        Simulation numbers are synthetic and labelled as such; real numbers, when present, come
        from open-weight models via Groq and are cached.
      </p>
      <p className="mt-4 font-mono text-[11px] text-hairline">
        skill-metacognition-pipeline · static export · read-only over outputs/
      </p>
    </footer>
  );
}

// Shared bits ----------------------------------------------------------------
function Empty() {
  return <div className="py-8 text-center font-mono text-sm text-muted">data unavailable</div>;
}

function LegendBar({
  cmap,
  left,
  right,
  mid,
}: {
  cmap: (t: number) => string;
  left: string;
  right: string;
  mid?: string;
}) {
  const stops = Array.from({ length: 24 }, (_, i) => cmap(i / 23));
  return (
    <div className="mt-4 flex items-center gap-3">
      <span className="shrink-0 font-mono text-[10px] text-muted">{left}</span>
      <div className="relative h-2 flex-1">
        <div
          className="h-2 w-full rounded-sm"
          style={{ background: `linear-gradient(to right, ${stops.join(',')})` }}
        />
        {mid ? (
          <span className="absolute left-1/2 top-3 -translate-x-1/2 font-mono text-[10px] text-muted">
            {mid}
          </span>
        ) : null}
      </div>
      <span className="shrink-0 font-mono text-[10px] text-muted">{right}</span>
    </div>
  );
}
