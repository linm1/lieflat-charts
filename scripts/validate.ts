// Catalog- and repo-structure validator. Supersedes the old scripts/validate.mjs:
// same mechanical HTML/JS checks (script syntax, no duplicate ids, no Math.random(),
// color-preset channel matching, mono-tokens.js parses), but the brittle checks that
// grepped for hardcoded Chinese/English substrings inside catalog.md/SKILL.md are
// replaced with schema-driven checks against catalog/charts.json and
// catalog/reports.json (see docs/adr/0002-catalog-as-data.md).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures: string[] = [];
const fail = (message: string): void => {
  failures.push(message);
};

function rel(file: string): string {
  return path.relative(root, file);
}

function readText(relPath: string): string {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function readJson<T>(relPath: string): T {
  return JSON.parse(readText(relPath)) as T;
}

// ---------------------------------------------------------------------------
// 1. Required files
// ---------------------------------------------------------------------------

const requiredColorTemplates = [
  'templates/color/README.md',
  'templates/color/basics-palm.html',
  'templates/color/basics-porcelain.html',
  'templates/color/basics-wire.html',
  'templates/color/big-circular-palm.html',
  'templates/color/big-circular-porcelain.html',
  'templates/color/big-force-palm.html',
  'templates/color/big-force-porcelain.html',
  'templates/color/big-threads-palm.html',
  'templates/color/big-threads-porcelain.html',
  'templates/color/glance-palm.html',
  'templates/color/glance-porcelain.html',
  'templates/color/glance-wire.html',
  'templates/color/lupi-palm.html',
  'templates/color/lupi-porcelain.html',
  'templates/color/lupi-wire.html',
  'templates/color/maps-palm.html',
  'templates/color/maps-porcelain.html',
  'templates/color/maps-wire.html',
];

const required: string[] = [
  'README.md',
  'LICENSE',
  'SKILL.md',
  'catalog.md',
  'catalog/charts.json',
  'catalog/reports.json',
  'catalog/schema/chart.schema.json',
  'catalog/schema/report.schema.json',
  'mono-tokens.js',
  'color-presets.js',
  'agents/openai.yaml',
  'report-catalog.md',
  'templates/reports/index.html',
  ...requiredColorTemplates,
];
for (let i = 1; i <= 12; i += 1) {
  const n = String(i).padStart(2, '0');
  required.push(`templates/reports/report-${n}.zh.html`);
  required.push(`templates/reports/report-${n}.en.html`);
  required.push(`docs/assets/reports/report-${n}.png`);
}

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) fail(`missing release file: ${file}`);
}

// ---------------------------------------------------------------------------
// 2. Catalog JSON: schema validation
// ---------------------------------------------------------------------------

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

let charts: ChartEntry[] = [];
let reports: ReportEntry[] = [];

try {
  const chartSchema = readJson<object>('catalog/schema/chart.schema.json');
  const reportSchema = readJson<object>('catalog/schema/report.schema.json');
  const validateChart = ajv.compile(chartSchema);
  const validateReport = ajv.compile(reportSchema);

  charts = readJson<ChartEntry[]>('catalog/charts.json');
  reports = readJson<ReportEntry[]>('catalog/reports.json');

  for (const chart of charts) {
    // ajv's ValidateFunction<T> return type is a "data is T" guard; with T inferred as
    // unknown here, negating it narrows the already-typed `chart` to `never` — routing
    // through a plain boolean sidesteps that.
    const isValid: boolean = validateChart(chart);
    if (!isValid) {
      fail(`catalog/charts.json entry ${chart.id ?? '?'} fails schema: ${ajv.errorsText(validateChart.errors)}`);
    }
  }
  for (const report of reports) {
    const isValid: boolean = validateReport(report);
    if (!isValid) {
      fail(`catalog/reports.json entry ${report.id ?? '?'} fails schema: ${ajv.errorsText(validateReport.errors)}`);
    }
  }
} catch (error) {
  fail(`could not load/validate catalog JSON: ${(error as Error).message}`);
}

// ---------------------------------------------------------------------------
// 3. Catalog JSON: cross-references into the gallery files
// ---------------------------------------------------------------------------

const galleryCache = new Map<string, string>();
function galleryContents(relPath: string): string | null {
  if (galleryCache.has(relPath)) return galleryCache.get(relPath)!;
  const full = path.join(root, relPath);
  if (!fs.existsSync(full)) return null;
  const source = fs.readFileSync(full, 'utf8');
  galleryCache.set(relPath, source);
  return source;
}

for (const chart of charts) {
  const source = galleryContents(chart.gallery_file);
  if (source === null) {
    fail(`${chart.id}: gallery_file does not exist: ${chart.gallery_file}`);
    continue;
  }
  if (chart.card_title !== null && !source.includes(`>${chart.card_title}<`) && !(chart.legacy_anchor && source.includes(chart.legacy_anchor))) {
    fail(`${chart.id}: card title "${chart.card_title}" not found in ${chart.gallery_file}`);
  }
  if (chart.card_anchor_id !== null && !source.includes(`id="${chart.card_anchor_id}"`)) {
    fail(`${chart.id}: card_anchor_id "${chart.card_anchor_id}" not found in ${chart.gallery_file}`);
  }
}

// Primary/backup tier sanity: the five documented shape-specific exceptions must be
// present and marked backup (SKILL.md hard rule §0.3.2 / PRINCIPLES.md rule 1).
const BACKUP_WITHOUT_PRIMARY_EXCEPTIONS = ['F15', 'F16', 'F17', 'L17', 'L20'];
const chartsById = new Map(charts.map(c => [c.id, c]));
for (const id of BACKUP_WITHOUT_PRIMARY_EXCEPTIONS) {
  const entry = chartsById.get(id);
  if (!entry) fail(`catalog/charts.json is missing the documented backup exception ${id}`);
  else if (entry.tier !== 'backup') fail(`${id} must be tier "backup" (it's one of the five primary-less exceptions)`);
}

// Sibling references must resolve to real ids (catches typos / renames silently going stale).
for (const chart of charts) {
  for (const sibling of chart.siblings) {
    if (!chartsById.has(sibling.id)) fail(`${chart.id}: sibling reference "${sibling.id}" does not exist in the catalog`);
  }
}

// New hard rule (ADR-0006 / PRINCIPLES.md §8): any newly-scaffolded canvas-based chart
// must carry an accessible name. Scoped to origin:"extension" only — retrofitting the
// 64 upstream entries is tracked separately (docs/design-language/UNKNOWNS.md U1) and
// intentionally not enforced here.
for (const chart of charts) {
  if (chart.origin !== 'extension') continue;
  const isCanvasEngine = /chart\.js|echarts/i.test(chart.engine);
  if (!isCanvasEngine) continue;
  const source = galleryContents(chart.gallery_file);
  if (source === null) continue;
  const anchor = chart.card_anchor_id;
  const hasAriaNearby = anchor
    ? new RegExp(`id=["']${anchor}["'][^>]*aria-label|aria-label[^>]*\\sid=["']${anchor}["']`).test(source)
    : source.includes('aria-label');
  if (!hasAriaNearby) {
    fail(`${chart.id}: new Chart.js/ECharts chart is missing an aria-label on its container (PRINCIPLES.md §8)`);
  }
}

// ---------------------------------------------------------------------------
// 4. Generated docs must be up to date with the JSON
// ---------------------------------------------------------------------------

try {
  execFileSync(process.execPath, [path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs'), 'scripts/generate-catalog-docs.ts', '--check'], {
    cwd: root,
    stdio: 'pipe',
  });
} catch (error) {
  const output = (error as { stdout?: Buffer; stderr?: Buffer });
  const text = [output.stdout?.toString(), output.stderr?.toString()].filter(Boolean).join('\n');
  fail(`catalog.md / report-catalog.md / README.md are stale relative to catalog/*.json:\n${text}`);
}

// ---------------------------------------------------------------------------
// 5. Gallery group container coverage across the 4 palette variants
// ---------------------------------------------------------------------------

const paletteSuffixes = ['gallery', 'porcelain', 'palm', 'wire'] as const;
function palettePath(family: 'basics' | 'lupi' | 'glance' | 'maps', suffix: (typeof paletteSuffixes)[number]): string {
  return suffix === 'gallery' ? `templates/${family}-gallery.html` : `templates/color/${family}-${suffix}.html`;
}

const colorableFamilies: ('basics' | 'lupi' | 'glance' | 'maps')[] = ['basics', 'lupi', 'glance', 'maps'];
for (const family of colorableFamilies) {
  const familyCharts = charts.filter(c => c.family === family && c.card_anchor_id);
  for (const suffix of paletteSuffixes) {
    const relPath = palettePath(family, suffix);
    const source = galleryContents(relPath);
    if (source === null) {
      fail(`missing gallery template: ${relPath}`);
      continue;
    }
    // Mono (the base gallery file) is the floor per PRINCIPLES.md rule 5 — every
    // entry, extension or not, must exist there. The 3 color-preset variants are an
    // optional enhancement, required only for the 64 upstream entries that already
    // ship them; a freshly scaffolded chart doesn't need a Porcelain/Palm/Wire redraw
    // to be promotable.
    const requireHere = suffix === 'gallery' ? familyCharts : familyCharts.filter(c => c.origin === 'upstream');
    for (const chart of requireHere) {
      const anchor = chart.card_anchor_id as string;
      if (!source.includes(`id="${anchor}"`)) fail(`${relPath} is missing chart container id="${anchor}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Report templates: real HTML documents with a title
// ---------------------------------------------------------------------------

for (let i = 1; i <= 12; i += 1) {
  const n = String(i).padStart(2, '0');
  for (const language of ['zh', 'en'] as const) {
    const relPath = `templates/reports/report-${n}.${language}.html`;
    const full = path.join(root, relPath);
    if (!fs.existsSync(full)) continue; // already reported by the required-files check
    const source = fs.readFileSync(full, 'utf8');
    if (!source.includes('<!doctype html>')) fail(`${relPath} is not a complete HTML document`);
    if (!/<title>[\s\S]+<\/title>/i.test(source)) fail(`${relPath} is missing a <title>`);
  }
}

// ---------------------------------------------------------------------------
// 7. color-presets.js structural check + preset channel extraction
// ---------------------------------------------------------------------------

function colorChannels(literal: string): string | null {
  if (literal.startsWith('#')) {
    const hex = literal.slice(1);
    const full = hex.length === 3 ? [...hex].map(ch => ch + ch).join('') : hex.slice(0, 6);
    return [0, 2, 4].map(i => Number.parseInt(full.slice(i, i + 2), 16)).join(',');
  }
  const channels = literal.match(/\d+/g);
  return channels?.slice(0, 3).join(',') ?? null;
}

function collectPresetChannels(value: unknown, channels: Set<string> = new Set()): Set<string> {
  if (typeof value === 'string') {
    const literalPattern = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)/g;
    for (const match of value.matchAll(literalPattern)) {
      const parsed = colorChannels(match[0]);
      if (parsed) channels.add(parsed);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) collectPresetChannels(item, channels);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectPresetChannels(item, channels);
  }
  return channels;
}

const presetChannels = new Map<string, Set<string>>();
const colorPresetsPath = path.join(root, 'color-presets.js');
if (fs.existsSync(colorPresetsPath)) {
  try {
    const context = vm.createContext({});
    new vm.Script(fs.readFileSync(colorPresetsPath, 'utf8'), { filename: 'color-presets.js' }).runInContext(context);
    const presets = (context as { PRESETS?: { get: (name: string) => unknown } & Record<string, unknown> }).PRESETS;
    const expected: [string, string][] = [
      ['porcelain', 'PORCELAIN'],
      ['palm', 'PALM'],
      ['wire', 'WIRE'],
    ];
    if (!presets || typeof presets.get !== 'function') {
      fail('color-presets.js does not correctly expose PRESETS.get()');
    } else {
      for (const [name, key] of expected) {
        const preset = presets[key];
        if (!preset || presets.get(name) !== preset) {
          fail(`color-presets.js is missing a usable preset: ${name}`);
          continue;
        }
        presetChannels.set(name, collectPresetChannels(preset));
      }
    }
  } catch (error) {
    fail((error as Error).message);
  }
}

// ---------------------------------------------------------------------------
// 8. Walk every HTML file: script syntax, duplicate ids
// ---------------------------------------------------------------------------

const ignoredDirectories = new Set(['.git', '.playwright-cli', 'node_modules', 'output']);
const htmlFiles: string[] = [];
function walk(dir: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(root);

function lineNumber(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

for (const file of htmlFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const normalized = rel(file).replaceAll('\\', '/');
  const isTaiwanChinesePage = normalized.endsWith('.zh.html')
    || normalized === 'templates/reports/index.html'
    || normalized === 'templates/maps-gallery.html'
    || /^templates\/color\/(?:basics|lupi|maps)-/.test(normalized)
    || normalized === 'examples/reports/r04-financial-report.zh.html';
  if (isTaiwanChinesePage && !source.includes('<html lang="zh-Hant-TW">')) {
    fail(`${normalized} must declare lang="zh-Hant-TW"`);
  }
  if (isTaiwanChinesePage && /(?:Noto (?:Sans|Serif) SC|PingFang SC|Songti SC)/.test(source)) {
    fail(`${normalized} must use Traditional Chinese font fallbacks (TC), not SC fonts`);
  }
  if (/<html[^>]*\blang=["'](?:zh|zh-Hans|zh-CN)["']/i.test(source)) {
    fail(`${normalized} uses an ambiguous or Simplified Chinese lang tag`);
  }
  const scriptPattern = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  let scriptIndex = 0;
  while ((match = scriptPattern.exec(source))) {
    scriptIndex += 1;
    const body = match[1] ?? '';
    if (!body.trim()) continue;
    try {
      new vm.Script(body, { filename: `${rel(file)}#script-${scriptIndex}` });
    } catch (error) {
      fail((error as Error).message);
    }
  }

  const seenIds = new Map<string, number>();
  const idPattern = /\sid=(["'])([^"']+)\1/g;
  while ((match = idPattern.exec(source))) {
    const id = match[2] ?? '';
    const line = lineNumber(source, match.index);
    if (seenIds.has(id)) {
      fail(`${rel(file)}:${line} duplicate id="${id}" (first seen on line ${seenIds.get(id)})`);
    } else {
      seenIds.set(id, line);
    }
  }
}

// ---------------------------------------------------------------------------
// 9. Determinism + color-token discipline across text files
// ---------------------------------------------------------------------------

const textFiles: string[] = [];
function collectText(dir: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name) || entry.name === 'LICENSE') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectText(full);
    else if (/\.(?:html|js|mjs)$/.test(entry.name)) textFiles.push(full);
  }
}
collectText(root);

for (const file of textFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const relative = rel(file);
  const normalizedRelative = relative.replaceAll('\\', '/');
  const executableSource = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  for (const match of executableSource.matchAll(/Math\.random\s*\(/g)) {
    fail(`${relative} uses Math.random() — use the deterministic rnd() helper instead`);
  }

  const colorTemplate = relative.match(/^templates[\\/]color[\\/].+-(porcelain|palm|wire)\.html$/);
  if (colorTemplate) {
    const paletteName = colorTemplate[1] as string;
    const allowed = presetChannels.get(paletteName);
    const literalPattern = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)/g;
    for (const match of source.matchAll(literalPattern)) {
      const channels = colorChannels(match[0]);
      const transparentHitTarget = channels === '0,0,0';
      if (allowed && channels && !allowed.has(channels) && !transparentHitTarget) {
        fail(`${relative}:${lineNumber(source, match.index)} color ${match[0]} is not part of the ${paletteName} preset`);
      }
    }
  } else if (normalizedRelative !== 'color-presets.js' && !normalizedRelative.startsWith('templates/reports/')) {
    for (const match of source.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
      const hex = match[0];
      const channels = [
        Number.parseInt(hex.slice(1, 3), 16),
        Number.parseInt(hex.slice(3, 5), 16),
        Number.parseInt(hex.slice(5, 7), 16),
      ];
      if (Math.max(...channels) - Math.min(...channels) > 18) {
        fail(`${relative}:${lineNumber(source, match.index)} found an evidently saturated color ${hex}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 10. mono-tokens.js parses
// ---------------------------------------------------------------------------

try {
  new vm.Script(fs.readFileSync(path.join(root, 'mono-tokens.js'), 'utf8'), { filename: 'mono-tokens.js' });
} catch (error) {
  fail((error as Error).message);
}

// ---------------------------------------------------------------------------
if (failures.length) {
  console.error(`Validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Validation passed: ${htmlFiles.length} HTML files, ${textFiles.length} text files, ${charts.length} catalog entries, ${reports.length} report entries.`);
