export type Backend = 'simulation' | 'ollama' | 'hf' | 'openrouter' | 'groq' | string;

export interface MetacogMetrics {
  enumeration_recall: number;
  selection_accuracy: number;
  name_before_use: number;
  answer_correct: number;
}

export interface Summary {
  backend: Backend;
  n_extracted_skills: number;
  n_nd_skills: number;
  n_tasks: number;
  fixed_model: string;
  skillmix_uplift_mean_pp: number;
  self_improvement_mean_pp: number;
  metacog_pre: MetacogMetrics;
  metacog_post: MetacogMetrics;
}

export interface RealSummary {
  backend: string;
  sim_model: string;
  real_vs_sim_mae_pp: number;
  metacog_post: MetacogMetrics;
  metacog_pre: MetacogMetrics;
  // multi-model real runs
  models?: string[];
  primary?: string;
  trials?: number;
  n_slice_tasks?: number;
  cached_calls?: number;
  // legacy single-model field (older runs)
  model?: string;
}

export type SkillGroup = 'extracted' | 'natural_deduction' | 'code' | string;

export interface SkillRow {
  group: SkillGroup;
  skill_uid: string;
  name: string;
  family: string;
  cognitive_rank: number;
  symbol: string;
  n_members: number;
}

export interface TaskRow {
  task_uid: string;
  label: string;
  family: string;
  k: number;
  difficulty: number;
  base_uplift: number;
  skill_uids: string[];
  prompt: string;
}

export interface SelfImpRow {
  label: string;
  before: number;
  after: number;
  delta: number;
}

// A matrix table: row labels, column labels, and a value grid (null for NaN).
export interface Matrix {
  rows: string[];
  cols: string[];
  values: (number | null)[][];
}

export interface TraceStep {
  candidates: string[];
  candidate_uids: string[];
  chosen: string;
  chosen_uid: string | null;
  why: string;
  applied: string;
  named_before_use: boolean;
}

export interface Interrogation {
  step?: number;
  question?: string;
  answer?: string;
}

export interface Trace {
  task_uid: string;
  label: string;
  model: string;
  condition: 'pre_training' | 'post_training';
  steps: TraceStep[];
  answer: string;
  raw: string;
  passed: boolean;
  score: number;
  interrogation?: Interrogation;
}
