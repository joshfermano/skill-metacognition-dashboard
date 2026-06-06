'use client';

import { useEffect, useState } from 'react';
import {
  fetchJson,
  fetchText,
  parseMatrix,
  parseRows,
} from './data';
import type {
  Matrix,
  RealSummary,
  SelfImpRow,
  SkillRow,
  Summary,
  TaskRow,
  Trace,
} from './types';

export interface PipelineData {
  summary: Summary | null;
  modelTaskPass: Matrix | null;
  skillPairFailure: Matrix | null;
  baseline: Matrix | null;
  uplift: Matrix | null;
  codeTasks: Matrix | null;
  selfImprovement: SelfImpRow[];
  metacog: Record<string, Record<string, number>>;
  traces: Trace[];
  skills: SkillRow[];
  tasks: TaskRow[];
  // technical report (markdown)
  reportMd: string | null;
  // real run (optional)
  realSummary: RealSummary | null;
  realVsSim: { rows: { label: string; real: number; sim: number; family: string }[] } | null;
  realGrid: Matrix | null;
  realMetacog: Record<string, Record<string, number>>;
  realTraces: Trace[];
  loading: boolean;
}

async function loadMatrix(path: string): Promise<Matrix | null> {
  const txt = await fetchText(path);
  return txt ? parseMatrix(txt) : null;
}

export function useData(): PipelineData {
  const [data, setData] = useState<PipelineData>({
    summary: null,
    modelTaskPass: null,
    skillPairFailure: null,
    baseline: null,
    uplift: null,
    codeTasks: null,
    selfImprovement: [],
    metacog: {},
    traces: [],
    skills: [],
    tasks: [],
    reportMd: null,
    realSummary: null,
    realVsSim: null,
    realGrid: null,
    realMetacog: {},
    realTraces: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // The manifest tells us whether a real (Groq) run exists, so we only fetch
      // real/* when present and keep the console free of expected 404s.
      const manifest = await fetchJson<{ real?: boolean }>('manifest.json');
      const hasReal = !!manifest?.real;

      const [
        summary,
        modelTaskPass,
        skillPairFailure,
        baseline,
        uplift,
        codeTasks,
        selfImpTxt,
        metacogTxt,
        traces,
        skillsTxt,
        tasksTxt,
        reportMd,
        realSummary,
        realVsSimTxt,
        realGrid,
        realMetacogTxt,
        realTraces,
      ] = await Promise.all([
        fetchJson<Summary>('summary.json'),
        loadMatrix('tables/model_task_pass.csv'),
        loadMatrix('tables/skill_pair_failure.csv'),
        loadMatrix('tables/baseline.csv'),
        loadMatrix('tables/uplift.csv'),
        loadMatrix('tables/code_tasks.csv'),
        fetchText('tables/self_improvement.csv'),
        fetchText('tables/metacog.csv'),
        fetchJson<Trace[]>('metacog_traces.json'),
        fetchText('tables/skills.csv'),
        fetchText('tables/tasks.csv'),
        fetchText('TECHNICAL_REPORT.md'),
        hasReal ? fetchJson<RealSummary>('real/summary.json') : Promise.resolve(null),
        hasReal ? fetchText('real/tables/real_vs_sim.csv') : Promise.resolve(null),
        hasReal ? loadMatrix('real/tables/model_task_real.csv') : Promise.resolve(null),
        hasReal ? fetchText('real/tables/metacog.csv') : Promise.resolve(null),
        hasReal ? fetchJson<Trace[]>('real/metacog_traces.json') : Promise.resolve(null),
      ]);

      // self_improvement
      const selfImprovement: SelfImpRow[] = selfImpTxt
        ? parseRows<Record<string, string>>(selfImpTxt).map((r) => {
            const label = r[''] ?? Object.values(r)[0];
            return {
              label,
              before: Number(r.before),
              after: Number(r.after),
              delta: Number(r.delta),
            };
          })
        : [];

      // metacog -> { condition: { metric: value } }
      const parseMetacog = (txt: string | null): Record<string, Record<string, number>> => {
        const out: Record<string, Record<string, number>> = {};
        if (!txt) return out;
        for (const r of parseRows<Record<string, string>>(txt)) {
          const cond = r.condition ?? Object.values(r)[0];
          out[cond] = {
            enumeration_recall: Number(r.enumeration_recall),
            selection_accuracy: Number(r.selection_accuracy),
            name_before_use: Number(r.name_before_use),
            answer_correct: Number(r.answer_correct),
          };
        }
        return out;
      };
      const metacog = parseMetacog(metacogTxt);
      const realMetacog = parseMetacog(realMetacogTxt);

      // skills
      const skills: SkillRow[] = skillsTxt
        ? parseRows<Record<string, string>>(skillsTxt).map((r) => ({
            group: r.group,
            skill_uid: r.skill_uid,
            name: r.name,
            family: r.family,
            cognitive_rank: Number(r.cognitive_rank),
            symbol: r.symbol ?? '',
            n_members: Number(r.n_members),
          }))
        : [];

      // tasks
      const tasks: TaskRow[] = tasksTxt
        ? parseRows<Record<string, string>>(tasksTxt).map((r) => ({
            task_uid: r.task_uid,
            label: r.label,
            family: r.family,
            k: Number(r.k),
            difficulty: Number(r.difficulty),
            base_uplift: Number(r.base_uplift),
            skill_uids: (r.skill_uids ?? '').split('|').filter(Boolean),
            prompt: r.prompt ?? '',
          }))
        : [];

      // real_vs_sim
      let realVsSim: PipelineData['realVsSim'] = null;
      if (realVsSimTxt) {
        const rrows = parseRows<Record<string, string>>(realVsSimTxt).map((r) => {
          const label = r[''] ?? Object.values(r)[0];
          return {
            label,
            real: Number(r.real),
            sim: Number(r.sim),
            family: r.family ?? '',
          };
        });
        realVsSim = { rows: rrows };
      }

      if (cancelled) return;
      setData({
        summary,
        modelTaskPass,
        skillPairFailure,
        baseline,
        uplift,
        codeTasks,
        selfImprovement,
        metacog,
        traces: traces ?? [],
        skills,
        tasks,
        reportMd,
        realSummary,
        realVsSim,
        realGrid,
        realMetacog,
        realTraces: realTraces ?? [],
        loading: false,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
