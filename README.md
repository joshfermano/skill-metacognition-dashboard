# Skill-Metacognition Dashboard

A static, production-grade Next.js 16 dashboard that visualizes the results of the
`skill-metacognition-pipeline` (LLM skill extraction, metacognition-scaffolded task
generation, easy-to-hard evaluation, and STaR-style self-improvement).

This is a **separate repository** from the Python pipeline. By default it expects the
pipeline checked out as a sibling folder (`../skill-metacognition-pipeline/`); it is
read-only over the pipeline's outputs and never modifies the pipeline's code or data.

## Quick start

```bash
npm install
npm run dev      # local dev server at http://localhost:3000
npm run build    # static export to out/
```

`npm run build` produces a fully static site in `out/` (Next.js `output: 'export'`,
`images.unoptimized`). Serve it with any static file server, e.g.:

```bash
npx serve out
```

## Data sync

The dashboard consumes the pipeline's CSV/JSON outputs at runtime by fetching from
`/data/...`. A prebuild step copies them into `public/data/`:

- `scripts/prepare-data.mjs` mirrors the pipeline's outputs into `public/data/`
  (`summary.json`, `metacog_traces.json`, `tables/*.csv`, and the `real/` subtree).
  It reads from `../skill-metacognition-pipeline/outputs/` by default; set the
  `PIPELINE_OUTPUTS` env var to point elsewhere (e.g. a CI artifact path).
- It is wired as both `predev` and `prebuild`, so `npm run dev` and `npm run build`
  always pick up the latest outputs.
- The `real/` (Groq) run is optional. If `outputs/real/summary.json` is absent the
  script skips it and the dashboard hides the "Real vs Simulation" section, showing a
  short note instead.

To re-sync without building: `npm run prepare-data`.

CSVs are parsed in the browser with `papaparse`; everything works as a static export
with no backend.

## Sections

Overview · Model × Task grid · Skill-pair co-failure · Baseline vs Uplift ·
Self-improvement · Metacognition scaffolding (centerpiece: pre/post traces) ·
Code-derived tasks · Real vs Simulation (optional) · Skills table · Tasks table.

## Design

- Dark "research instrument / lab console": deep ink background, warm off-white text,
  a single amber/copper accent (`#e8a13a`). The heatmap palettes do the chromatic work.
- Fonts via `next/font/google`: **Fraunces** (display serif), **IBM Plex Sans** (body),
  **IBM Plex Mono** (UIDs / slugs / code).
- Heatmap colormaps (`lib/colormaps.ts`) approximate matplotlib: RdYlBu, Reds, YlGnBu,
  and a diverging RdBu centered at 0.

## Structure

```
skill-metacognition-dashboard/
  app/                layout.tsx, page.tsx, globals.css (Tailwind v4 @theme)
  components/         Dashboard, Heatmap, BarCompare, DataTable, TraceCard,
                      StatCard, SectionNav, ui (Card/Badge/Section)
  lib/                colormaps, data (fetch + papaparse), useData, types, cn
  scripts/            prepare-data.mjs
  public/data/        synced copy of the pipeline outputs (generated, gitignored)
  out/                static export (generated)
```
