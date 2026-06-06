// Sync the Python pipeline's outputs/ into public/data so the static export can
// fetch it at runtime. Read-only over the pipeline outputs; the pipeline lives in
// the sibling skill-metacognition-pipeline repo. Tolerates a missing/empty real/ subtree.
import { cp, mkdir, rm, stat, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// This dashboard is a separate repo from the Python pipeline. By default it reads
// the pipeline's outputs from a sibling folder; override with PIPELINE_OUTPUTS to
// point anywhere (e.g. a CI artifact path).
const SRC = process.env.PIPELINE_OUTPUTS
  ? resolve(process.env.PIPELINE_OUTPUTS)
  : resolve(__dirname, '..', '..', 'skill-metacognition-pipeline', 'outputs');
const DEST = resolve(__dirname, '..', 'public', 'data');

async function isNonEmptyDir(p) {
  try {
    const s = await stat(p);
    if (!s.isDirectory()) return false;
    const entries = await readdir(p);
    return entries.length > 0;
  } catch {
    return false;
  }
}

async function main() {
  if (!existsSync(SRC)) {
    console.error(`[prepare-data] outputs/ not found at ${SRC}; nothing to copy.`);
    process.exit(0);
  }

  // Clean dest so removed files do not linger.
  await rm(DEST, { recursive: true, force: true });
  await mkdir(DEST, { recursive: true });

  // Copy top-level summary.json + metacog_traces.json
  for (const f of ['summary.json', 'metacog_traces.json']) {
    const src = join(SRC, f);
    if (existsSync(src)) {
      await cp(src, join(DEST, f));
      console.log(`[prepare-data] copied ${f}`);
    }
  }

  // Copy tables/*.csv
  const tablesSrc = join(SRC, 'tables');
  if (existsSync(tablesSrc)) {
    await cp(tablesSrc, join(DEST, 'tables'), { recursive: true });
    console.log('[prepare-data] copied tables/');
  }

  // Copy the technical report (sits at the pipeline root, beside outputs/).
  const reportSrc = join(SRC, '..', 'TECHNICAL_REPORT.md');
  if (existsSync(reportSrc)) {
    await cp(reportSrc, join(DEST, 'TECHNICAL_REPORT.md'));
    console.log('[prepare-data] copied TECHNICAL_REPORT.md');
  } else {
    console.log('[prepare-data] TECHNICAL_REPORT.md not found; report section will be empty');
  }

  // Copy only the real artifacts the dashboard needs (summary, tables, traces),
  // not the raw call cache or run log, and only when a real summary.json exists.
  const realSrc = join(SRC, 'real');
  const realSummary = join(realSrc, 'summary.json');
  let realPresent = false;
  if (existsSync(realSummary)) {
    const realDest = join(DEST, 'real');
    await mkdir(realDest, { recursive: true });
    await cp(realSummary, join(realDest, 'summary.json'));
    const realTraces = join(realSrc, 'metacog_traces.json');
    if (existsSync(realTraces)) await cp(realTraces, join(realDest, 'metacog_traces.json'));
    const realTables = join(realSrc, 'tables');
    if (existsSync(realTables)) await cp(realTables, join(realDest, 'tables'), { recursive: true });
    realPresent = true;
    console.log('[prepare-data] copied real/ (summary + tables + traces)');
  } else if (await isNonEmptyDir(realSrc)) {
    console.log('[prepare-data] real/ exists but has no summary.json; skipping (real run optional)');
  } else {
    console.log('[prepare-data] no real/ run; section will be hidden');
  }

  // A tiny manifest the client reads first, so it only fetches real/* when present
  // (keeps the browser console clean of expected 404s on simulation-only runs).
  await writeFile(
    join(DEST, 'manifest.json'),
    JSON.stringify({ real: realPresent }, null, 2)
  );

  console.log('[prepare-data] done.');
}

main().catch((err) => {
  console.error('[prepare-data] failed:', err);
  process.exit(1);
});
