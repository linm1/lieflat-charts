// The natural-language extension workflow's actual gate (ADR-0005). An agent that has
// already gathered a chart's data shape, occasion, and reading speed from a
// conversation drives this non-interactively via flags — it is not meant to prompt a
// human. It never invents a chart from nothing: it always scaffolds from the nearest
// sibling's real implementation (ADR-0002's reuse principle), appends a schema-checked
// catalog entry, regenerates the docs, and runs the same validator every other chart
// has to pass. Nothing here marks a scaffold "done" — see the printed checklist.
//
// Usage:
//   npm run new-chart -- --id=<ID> --name="<Card Name>" --card-title="<Card Title>" \
//     --family=<glance|lupi|basics|maps|interactive> --tier=<primary|backup> \
//     --sibling=<existing-chart-id> --data-shape="<description>" --occasion="<description>" \
//     --reading-speed=<"<10s"|"~30s"|">30s"|"animated"|"interactive"> \
//     --engine=<SVG|Chart.js|ECharts|"ECharts + GeoJSON"> \
//     [--siblings=<comma,separated,extra,ids>] [--kind=chart|report]
//
//   --kind=report scaffolds into catalog/reports.json / templates/reports/ instead,
//   using the nearest report template as the structural donor. Report scaffolding is
//   file-level only (clones both language HTML files and marks them with TODOs) — it
//   does not attempt to parse or edit individual chart slots inside the report, unlike
//   chart scaffolding's card-level cloning.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

interface ChartSibling {
  id: string;
  note?: string;
}

interface ChartEntry {
  id: string;
  family: 'glance' | 'lupi' | 'basics' | 'maps' | 'interactive';
  name: string;
  card_title: string | null;
  card_anchor_id: string | null;
  data_shape: string;
  occasion: string;
  reading_speed: string;
  engine: string;
  gallery_file: string;
  legacy_anchor: string | null;
  tier: 'primary' | 'backup';
  siblings: ChartSibling[];
  notes?: string;
  origin: 'upstream' | 'extension';
}

interface ReportEntry {
  id: string;
  name: string;
  zh_title: string;
  common_types: string[];
  page_width: string;
  density: string;
  color_system: string;
  dependencies: string;
  gallery_file_zh?: string;
  gallery_file_en?: string;
  origin: 'upstream' | 'extension';
}

// ---------------------------------------------------------------------------
// Flags
// ---------------------------------------------------------------------------

function parseFlags(argv: string[]): Map<string, string> {
  const flags = new Map<string, string>();
  for (const arg of argv) {
    const m = /^--([a-z-]+)=([\s\S]*)$/.exec(arg);
    if (m) flags.set(m[1]!, m[2]!);
  }
  return flags;
}

const flags = parseFlags(process.argv.slice(2));
const kind = flags.get('kind') === 'report' ? 'report' : 'chart';

function requireFlag(name: string): string {
  const value = flags.get(name);
  if (!value) {
    console.error(`Missing required --${name}. See the usage comment at the top of scripts/new-chart.ts.`);
    process.exit(1);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function readJson<T>(relPath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8')) as T;
}

function writeJson(relPath: string, value: unknown): void {
  fs.writeFileSync(path.join(root, relPath), JSON.stringify(value, null, 2) + '\n');
}

function slugify(name: string, fallback: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24);
  return slug || fallback.toLowerCase();
}

function uniqueSlug(base: string, isTaken: (candidate: string) => boolean): string {
  if (!isTaken(base)) return base;
  for (let n = 2; n < 100; n += 1) {
    const candidate = `${base}${n}`;
    if (!isTaken(candidate)) return candidate;
  }
  throw new Error(`Could not find a free slug based on "${base}"`);
}

function runChecked(cmd: string, args: string[]): { ok: boolean; output: string } {
  try {
    const output = execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: 'pipe' });
    return { ok: true, output };
  } catch (error) {
    const e = error as { stdout?: Buffer | string; stderr?: Buffer | string };
    const output = [e.stdout?.toString(), e.stderr?.toString()].filter(Boolean).join('\n');
    return { ok: false, output };
  }
}

function printPromotionChecklist(id: string, validateResult: { ok: boolean; output: string }): void {
  console.log('');
  console.log(`Chart ${id} scaffolded but not yet promotable — checklist before it's real:`);
  console.log('  [ ] Replace the copied demo data with real (or intentionally illustrative) values.');
  console.log('  [ ] Rewrite the h2 into a conclusion-style title, not a chart-type label (PRINCIPLES.md rule 4).');
  console.log('  [ ] Rewrite the subtitle to state the unit meaning / legend / time range (PRINCIPLES.md rule 4).');
  console.log('  [ ] Rewrite the ALL-CAPS source line to a real "CHART NAME · SYSTEM · SOURCE".');
  console.log('  [ ] Review perceptual-honesty rules that apply to this data shape (PRINCIPLES.md rule 6).');
  console.log('  [ ] Remove every `// TODO(new-chart)` marker once addressed.');
  console.log(`  [ ] Re-run \`npm run verify\` until it is green.`);
  console.log('');
  console.log(validateResult.ok ? 'npm run validate: PASSED (structurally valid; the checklist above is still real work).' : 'npm run validate: FAILED — see output above; fix before treating this as usable.');
}

// ---------------------------------------------------------------------------
// Chart scaffolding
// ---------------------------------------------------------------------------

function findCardBlockByTitle(html: string, cardTitle: string): { start: number; end: number; text: string } {
  const h2Needle = `>${cardTitle}<`;
  const h2Index = html.indexOf(h2Needle);
  if (h2Index === -1) throw new Error(`Could not find a card with title "${cardTitle}" in the gallery file.`);

  const openTagPattern = /<div\b[^>]*class="[^"]*\bcard\b[^"]*"[^>]*>/g;
  let lastOpen = -1;
  let match: RegExpExecArray | null;
  while ((match = openTagPattern.exec(html)) && match.index < h2Index) {
    lastOpen = match.index;
  }
  if (lastOpen === -1) throw new Error(`Found the title "${cardTitle}" but no enclosing <div class="card"> before it.`);

  const tagPattern = /<div\b[^>]*>|<\/div>/g;
  tagPattern.lastIndex = lastOpen;
  let depth = 0;
  let end = -1;
  while ((match = tagPattern.exec(html))) {
    if (match[0].startsWith('<div')) depth += 1;
    else depth -= 1;
    if (depth === 0) {
      end = match.index + match[0].length;
      break;
    }
  }
  if (end === -1) throw new Error('Could not find the matching closing </div> for the card block (unbalanced HTML?).');

  return { start: lastOpen, end, text: html.slice(lastOpen, end) };
}

function findScriptChunkByAnchor(html: string, anchorId: string): { start: number; end: number; text: string } | null {
  const scriptPattern = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g;
  let scriptMatch: RegExpExecArray | null;
  while ((scriptMatch = scriptPattern.exec(html))) {
    const body = scriptMatch[1] ?? '';
    const bodyStart = scriptMatch.index + scriptMatch[0].indexOf(body);
    const idPattern = new RegExp(`['"\`]${anchorId}['"\`]`);
    const idMatch = idPattern.exec(body);
    if (!idMatch) continue;

    const headerPattern = /\/\/ ═+.*═+/g;
    let lastHeader = 0;
    let h: RegExpExecArray | null;
    while ((h = headerPattern.exec(body)) && h.index < idMatch.index) {
      lastHeader = h.index;
    }
    headerPattern.lastIndex = idMatch.index;
    const nextHeaderMatch = headerPattern.exec(body);
    const chunkEnd = nextHeaderMatch ? nextHeaderMatch.index : body.length;

    return { start: bodyStart + lastHeader, end: bodyStart + chunkEnd, text: body.slice(lastHeader, chunkEnd) };
  }
  return null;
}

function scaffoldChart(): void {
  const id = requireFlag('id');
  const name = requireFlag('name');
  const cardTitle = requireFlag('card-title');
  const family = requireFlag('family') as ChartEntry['family'];
  const tier = requireFlag('tier') as ChartEntry['tier'];
  const siblingId = requireFlag('sibling');
  const dataShape = requireFlag('data-shape');
  const occasion = requireFlag('occasion');
  const readingSpeed = requireFlag('reading-speed');
  const engine = requireFlag('engine');
  const extraSiblings = (flags.get('siblings') ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const charts = readJson<ChartEntry[]>('catalog/charts.json');
  const byId = new Map(charts.map(c => [c.id, c]));

  if (byId.has(id)) {
    console.error(`Chart id "${id}" already exists in catalog/charts.json.`);
    process.exit(1);
  }
  const sibling = byId.get(siblingId);
  if (!sibling) {
    console.error(`--sibling "${siblingId}" was not found in catalog/charts.json. Scaffolding always starts from a real neighbor (ADR-0002) — pick an existing id.`);
    process.exit(1);
  }
  for (const extra of extraSiblings) {
    if (!byId.has(extra)) {
      console.error(`--siblings references unknown id "${extra}".`);
      process.exit(1);
    }
  }
  if (sibling.card_title === null) {
    console.error(`Sibling "${siblingId}" has no card_title (it's a whole-page interactive template) — pick a card-based sibling instead.`);
    process.exit(1);
  }

  const galleryPath = path.join(root, sibling.gallery_file);
  const html = fs.readFileSync(galleryPath, 'utf8');

  const block = findCardBlockByTitle(html, sibling.card_title);
  const oldAnchor = sibling.card_anchor_id ?? (/\sid="([a-zA-Z0-9_-]+)"/.exec(block.text)?.[1] ?? null);
  if (!oldAnchor) {
    console.error(`Could not determine an anchor id inside sibling "${siblingId}"'s card — cannot safely clone it.`);
    process.exit(1);
  }

  const takenIds = new Set(html.match(/\sid="([a-zA-Z0-9_-]+)"/g)?.map(m => m.replace(/\sid="|"/g, '')) ?? []);
  const newAnchor = uniqueSlug(slugify(name, id), candidate => takenIds.has(candidate));

  // New catalog entry — validate BEFORE touching any files, so a schema failure never
  // leaves a half-written gallery file behind.
  const newEntry: ChartEntry = {
    id,
    family,
    name,
    card_title: cardTitle,
    card_anchor_id: newAnchor,
    data_shape: dataShape,
    occasion,
    reading_speed: readingSpeed,
    engine,
    gallery_file: sibling.gallery_file,
    legacy_anchor: null,
    tier,
    siblings: [{ id: sibling.id, note: 'structural donor' }, ...extraSiblings.map(sid => ({ id: sid }))],
    notes: `Scaffolded from ${sibling.id} via \`npm run new-chart\`; not yet promotable — see the printed checklist.`,
    origin: 'extension',
  };

  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const schema = readJson<object>('catalog/schema/chart.schema.json');
  const validateEntry = ajv.compile(schema);
  const isValid: boolean = validateEntry(newEntry);
  if (!isValid) {
    console.error(`New catalog entry fails schema validation — nothing was written:\n${ajv.errorsText(validateEntry.errors)}`);
    process.exit(1);
  }

  // Whole-word replace of the old anchor id -> new anchor id, scoped to the cloned text
  // only (never touches the sibling's original block or the rest of the file). Then
  // swap the title/subtitle/source text for TODO placeholders (targeted replacements
  // rather than a blind template, so the rest of the markup is left untouched).
  const idPattern = new RegExp(`\\b${oldAnchor}\\b`, 'g');
  let cardHtml = block.text.replace(idPattern, newAnchor);
  cardHtml = cardHtml.replace(`>${sibling.card_title}<`, `>${cardTitle}<`);
  cardHtml = cardHtml.replace(/<div class="sub">[\s\S]*?<\/div>/, `<div class="sub"><!-- TODO(new-chart): unit-honest subtitle — legend + time range, separated by · --></div>`);
  cardHtml = cardHtml.replace(/<div class="src">[\s\S]*?<\/div>/, `<div class="src"><!-- TODO(new-chart): ${name.toUpperCase()} · SYSTEM · SOURCE --></div>`);

  const comment = `\n\n  <!-- ${id} · ${name} (scaffolded from ${sibling.id} via npm run new-chart — see checklist, not yet promotable) -->\n`;
  const newHtml = html.slice(0, block.end) + comment + '  ' + cardHtml + html.slice(block.end);

  // Script chunk: clone the sibling's render block (search the ORIGINAL html/anchor,
  // since newHtml's script section is unchanged so far).
  const scriptChunk = findScriptChunkByAnchor(html, oldAnchor);
  let finalHtml = newHtml;
  if (scriptChunk) {
    const clonedScript = `\n\n// TODO(new-chart): scaffolded from ${sibling.id}; replace demo data/encoding before promotion.\n` + scriptChunk.text.replace(idPattern, newAnchor);
    // The script section start index shifts because we already inserted the card HTML
    // earlier in the file; recompute the insertion point in finalHtml by locating the
    // sibling's original script chunk text (still present, unmodified) and inserting
    // the clone right after it.
    const insertAfter = finalHtml.indexOf(scriptChunk.text);
    if (insertAfter !== -1) {
      const insertAt = insertAfter + scriptChunk.text.length;
      finalHtml = finalHtml.slice(0, insertAt) + clonedScript + finalHtml.slice(insertAt);
    } else {
      console.warn('Warning: could not relocate the script chunk to clone after inserting the card — the new card has no render script. Add one manually before promotion.');
    }
  } else {
    console.warn(`Warning: could not find a script block rendering #${oldAnchor} in ${sibling.gallery_file} — the new card has no render script. Add one manually before promotion.`);
  }

  fs.writeFileSync(galleryPath, finalHtml);

  const updatedCharts = [...charts, newEntry];
  writeJson('catalog/charts.json', updatedCharts);

  const genResult = runChecked('npx', ['tsx', 'scripts/generate-catalog-docs.ts']);
  if (!genResult.ok) console.error(genResult.output);

  const validateResult = runChecked('npx', ['tsx', 'scripts/validate.ts']);
  console.log(validateResult.output);
  printPromotionChecklist(id, validateResult);
}

// ---------------------------------------------------------------------------
// Report scaffolding (file-level clone; see the usage comment at the top)
// ---------------------------------------------------------------------------

function scaffoldReport(): void {
  const id = requireFlag('id');
  const name = requireFlag('name');
  const zhTitle = flags.get('zh-title') ?? name;
  const siblingId = requireFlag('sibling');
  const pageWidth = requireFlag('page-width');
  const density = requireFlag('density');
  const colorSystem = requireFlag('color-system');
  const dependencies = flags.get('dependencies') ?? 'web fonts';
  const commonTypes = (flags.get('common-types') ?? '').split(',').map(s => s.trim()).filter(Boolean);

  const reports = readJson<ReportEntry[]>('catalog/reports.json');
  const byId = new Map(reports.map(r => [r.id, r]));

  if (byId.has(id)) {
    console.error(`Report id "${id}" already exists in catalog/reports.json.`);
    process.exit(1);
  }
  const sibling = byId.get(siblingId);
  if (!sibling) {
    console.error(`--sibling "${siblingId}" was not found in catalog/reports.json.`);
    process.exit(1);
  }

  const newEntry: ReportEntry = {
    id,
    name,
    zh_title: zhTitle,
    common_types: commonTypes.length ? commonTypes : sibling.common_types,
    page_width: pageWidth,
    density,
    color_system: colorSystem,
    dependencies,
    gallery_file_zh: `templates/reports/report-${id.slice(1)}.zh.html`,
    gallery_file_en: `templates/reports/report-${id.slice(1)}.en.html`,
    origin: 'extension',
  };

  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const schema = readJson<object>('catalog/schema/report.schema.json');
  const validateEntry = ajv.compile(schema);
  const isValid: boolean = validateEntry(newEntry);
  if (!isValid) {
    console.error(`New report entry fails schema validation — nothing was written:\n${ajv.errorsText(validateEntry.errors)}`);
    process.exit(1);
  }

  for (const lang of ['zh', 'en'] as const) {
    const srcPath = path.join(root, `templates/reports/report-${siblingId.slice(1)}.${lang}.html`);
    const destPath = path.join(root, `templates/reports/report-${id.slice(1)}.${lang}.html`);
    if (!fs.existsSync(srcPath)) {
      console.warn(`Warning: sibling report is missing its ${lang} file (${srcPath}) — skipping that language.`);
      continue;
    }
    let html = fs.readFileSync(srcPath, 'utf8');
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title><!-- TODO(new-chart): ${name} --></title>`);
    html = `<!-- TODO(new-chart): scaffolded from ${sibling.id} via npm run new-chart. Replace headline, deck, chart slots, KPI copy, and source before promotion. -->\n` + html;
    fs.writeFileSync(destPath, html);
  }

  writeJson('catalog/reports.json', [...reports, newEntry]);

  const genResult = runChecked('npx', ['tsx', 'scripts/generate-catalog-docs.ts']);
  if (!genResult.ok) console.error(genResult.output);

  const validateResult = runChecked('npx', ['tsx', 'scripts/validate.ts']);
  console.log(validateResult.output);
  printPromotionChecklist(id, validateResult);
}

if (kind === 'report') scaffoldReport();
else scaffoldChart();
