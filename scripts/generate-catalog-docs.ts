// Generates catalog.md and report-catalog.md from catalog/charts.json and
// catalog/reports.json (the source of truth — see docs/adr/0002-catalog-as-data.md),
// and refreshes the chart-family count table inside README.md's marked block.
//
// Usage:
//   tsx scripts/generate-catalog-docs.ts          # write the generated files
//   tsx scripts/generate-catalog-docs.ts --check  # exit 1 if committed files are stale
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
const check = process.argv.includes('--check');

function readJson<T>(relPath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8')) as T;
}

function siblingsCell(siblings: ChartSibling[]): string {
  if (!siblings.length) return '—';
  return siblings.map(s => (s.note ? `${s.id} (${s.note})` : s.id)).join('; ');
}

function row(cells: string[]): string {
  return `| ${cells.join(' | ')} |`;
}

const FAMILY_META: Record<ChartEntry['family'], { heading: string; blurb?: string }> = {
  glance: { heading: '## Glance family · 22 charts (bold strokes · pre-aggregated · 3-second read)' },
  lupi: { heading: '## Lupi family · 20 charts (hairline · record-by-record · 30-second read)' },
  basics: {
    heading: '## Basics family · 17 charts (F1–F17 · Lupi grammar over familiar chart silhouettes, for sparse data)',
    blurb:
      "Recognizable as a familiar chart type from a distance (bar / line / donut...); every unit is countable up close. The first place to look for Lupi density when data is only a handful of categories or a few dozen days — check here before reaching for a library-external translation. Reference implementation: `templates/basics-gallery.html`.",
  },
  maps: {
    heading: '## Maps · 2 charts (recalled only on explicit user request)',
    blurb:
      'Data containing a country, state/province, or region field does **not** automatically mean a map. Only pick from `templates/maps-gallery.html` when the user explicitly asks for "a map", "geographic distribution", "shade by country/state", etc. Maps render through ECharts with online GeoJSON and need network access unless the GeoJSON is inlined at delivery time (see the vendored copy at `assets/geo/world.json`).',
  },
  interactive: { heading: '## Standalone interactive big charts · 3 charts (one chart, one file, full-page canvas)' },
};

function renderChartTable(entries: ChartEntry[], columns: 'siblings' | 'constraints'): string[] {
  const lines: string[] = [];
  lines.push(row(['#', 'Name', 'Card title', 'Data shape', 'Occasion', 'Reading time', 'Engine', columns === 'siblings' ? 'Siblings' : 'Constraints']));
  lines.push(row(['---', '------', '---------', '---------', '------', '---------', '------', '------']));
  for (const e of entries) {
    const tail = columns === 'siblings' ? siblingsCell(e.siblings) : (e.notes ?? '—');
    lines.push(row([e.id, e.name, e.card_title ?? '—', e.data_shape, e.occasion, e.reading_speed, e.engine, tail]));
  }
  return lines;
}

function renderInteractiveTable(entries: ChartEntry[]): string[] {
  const lines: string[] = [];
  lines.push(row(['#', 'File', 'Data shape', 'Interaction', 'When to use']));
  lines.push(row(['---', '------', '---------', '------', '-----------']));
  for (const e of entries) {
    lines.push(row([e.id, `\`${e.gallery_file}\``, e.data_shape, e.notes ?? '—', e.occasion]));
  }
  return lines;
}

const REMOVED_CHART_TYPES =
  'Polar Line (24h distribution → L10), Punch Card (→ G14), Release Rings (its style did not belong to any family), ' +
  'static Thread Triptych (→ B3), Profile Equalizer (→ G10), Slope Beads (crossing diagonals read poorly; a redesigned ' +
  'slope chart is still pending), Meridian Dots (signed categorical values now use G10). The last two originated in an ' +
  'unadopted Lenny case-study draft and are not recommended to restore as-is.';

function generateChartsMd(charts: ChartEntry[]): string {
  // The upstream "64" count already includes the 3 standalone interactive templates
  // (22 Glance + 20 Lupi + 17 Basics + 2 Maps + 3 interactive = 64), even though they
  // get their own section below rather than living inside one of the four families.
  const total = charts.length;
  const byFamily = (family: ChartEntry['family']) => charts.filter(c => c.family === family);

  const lines: string[] = [];
  lines.push(`# Navi Chart — Chart Catalog · ${total} charts`);
  lines.push('');
  lines.push('> Every chart carries three tags: **data shape** (the primary key for selection), **occasion**, and **reader time**.');
  lines.push(
    '> **Primary vs. backup:** primary tier is L1–L15 and F1–F13 — default here first. L16–L20, F14–F17, and G19–G22 are ' +
      'backup tier, used only when the primary tier cannot honestly encode the data, with the reason written down. The ' +
      'exceptions are F15, F16, F17, L17, and L20 — no primary-tier encoding exists for their data shapes, so hitting that ' +
      'shape goes straight to the backup entry (see `SKILL.md` hard rules §0.3.1 / §0.3.2).'
  );
  lines.push(
    "> **Selection priority follows `SKILL.md`'s hard rules: audit Lupi Editorial in full first, then Lupi Basics; only " +
      'move to Glance once both are checked and rejected for cause, or the user explicitly asks for Glance / a dashboard / ' +
      'a 3-second read.'
  );
  lines.push(
    '> The "Siblings" column pairs same-topic alternates for comparing data contracts and recalling candidates — it does not ' +
      'mean both should be generated, and it does not change the priority rules above.'
  );
  lines.push(
    '> Reference implementations live under `templates/`: Glance family `templates/glance-gallery.html`, Lupi family ' +
      '`templates/lupi-gallery.html`, Basics family `templates/basics-gallery.html`, Maps `templates/maps-gallery.html`, ' +
      'big interactive charts `templates/big-*.html`. Maps are recalled only on an explicit user request. A gallery file ' +
      'holds many cards on one page — to find one chart\'s code, locate its card by the **card title** below, then search ' +
      'the matching `// ════` comment block inside `<script>`. Worked examples with real data live in `examples/`. The ' +
      'machine-readable source of truth is `catalog/charts.json` — this file is generated from it by ' +
      '`npm run catalog:generate` and checked for staleness by `npm run catalog:check`.'
  );
  lines.push('');

  const order: ChartEntry['family'][] = ['glance', 'lupi', 'basics', 'maps', 'interactive'];
  for (const family of order) {
    const meta = FAMILY_META[family];
    lines.push(meta.heading);
    lines.push('');
    if (meta.blurb) {
      lines.push(meta.blurb);
      lines.push('');
    }
    const entries = byFamily(family);
    if (family === 'interactive') {
      lines.push(...renderInteractiveTable(entries));
    } else {
      lines.push(...renderChartTable(entries, family === 'maps' ? 'constraints' : 'siblings'));
    }
    lines.push('');
    if (family === 'glance') {
      lines.push('\\* G1/G3 still use Chart.js; a future pass may migrate them to ECharts for a single rendering stack.');
      lines.push('');
    }
    if (family === 'lupi') {
      lines.push(
        '> L14–L15 are the **small-data group**: when there are only a handful of percentages, unit decomposition earns back ' +
          'Lupi density — 1 dot = 1 person / 1 percentage point, density comes from the unit, not the record count. State the ' +
          'unit meaning in the subtitle (e.g. "one dot = one person in a hundred"), and only decompose into units you can ' +
          'honestly justify — never fabricate individuals.'
      );
      lines.push('');
    }
  }

  lines.push('## Removed chart types (superseded by a better fit)');
  lines.push('');
  lines.push(REMOVED_CHART_TYPES);
  lines.push('');

  return lines.join('\n');
}

function generateReportsMd(reports: ReportEntry[]): string {
  const lines: string[] = [];
  lines.push(`# Navi Chart — Report Catalog · ${reports.length} templates`);
  lines.push('');
  lines.push(
    "> A report template sets the whole page's narrative order, canvas, module density, and reading speed; charts inside " +
      'it still follow the data contracts in `catalog.md`. The scenarios in the table below are recommended uses, not hard ' +
      'limits — the same layout can carry financial/economic, research, business, product, or personal-record content.'
  );
  lines.push(
    '> Each template ships two independent language versions: Taiwan Traditional Chinese (`lang=zh-Hant-TW`, ' +
      '`templates/reports/report-NN.zh.html`) and English (`templates/reports/report-NN.en.html`).'
  );
  lines.push('> A visual index is at `templates/reports/index.html`; static previews are under `docs/assets/reports/`.');
  lines.push(
    '> The machine-readable source of truth is `catalog/reports.json` — this file is generated from it by ' +
      '`npm run catalog:generate` and checked for staleness by `npm run catalog:check`.'
  );
  lines.push('');

  lines.push('## Selection order');
  lines.push('');
  lines.push('1. Filter first by report type, audience, and reading task — not by "which chart types are inside" or industry words in the template name.');
  lines.push('2. Then filter by information density, canvas width, reading speed, and whether it needs to run offline.');
  lines.push('3. Compare at least 3 candidates; compare all of them if fewer than 3 exist.');
  lines.push('4. Once a template is locked, keep its whole-page skeleton — do not splice in sections from a different report template.');
  lines.push('');

  lines.push('## Template index');
  lines.push('');
  lines.push(row(['#', 'Name (EN / 繁體中文（台灣）)', 'Common report types / transferable scenarios', 'Canvas', 'Density', 'Color system', 'Dependencies']));
  lines.push(row(['---', '---', '---', '---:', '---', '---', '---']));
  for (const r of reports) {
    lines.push(row([r.id, `${r.name} / ${r.zh_title}`, r.common_types.join(', '), r.page_width, r.density, r.color_system, r.dependencies]));
  }
  lines.push('');

  lines.push('## Report-type recall');
  lines.push('');
  lines.push('- **Survey report / research brief:** R01, R07, R08, R11.');
  lines.push('- **Business data report / dashboard:** R04, R09, R12.');
  lines.push(
    '- **Financial / economic report:** R02, R03, R04, R09, R11, R12. See the financial worked example at ' +
      '`examples/reports/r04-financial-report.zh.html` (Taiwan Traditional Chinese).'
  );
  lines.push('- **Product record / project retrospective:** R02, R05, R06, R12.');
  lines.push('- **Personal data record:** R03, R05, R06, R10, R12 — fitness, travel, and annual lifestyle data all fit.');
  lines.push('- **External poster / social sharing:** R03, R07, R11.');
  lines.push(
    '- **Template selection principle:** choose by content structure, information density, reading speed, and canvas — ' +
      'don\'t constrain a template to one industry just because its name says "travel," "ops," or "almanac."'
  );
  lines.push('- **Must run offline:** prefer R01–R10, and inline or drop web fonts; R11–R12 need chart dependencies inlined too.');
  lines.push('- **Fixed social-media canvas:** R11; switch templates if content doesn\'t fit rather than shrinking type or cutting information.');
  lines.push('');

  lines.push('## Template contract');
  lines.push('');
  lines.push('- A report template is a whole page, not a chart gallery. Copy the full HTML of the matching language as your starting point.');
  lines.push('- Keep the template\'s canvas width, primary grid, section order, main whitespace, color system, and chart-slot relationships.');
  lines.push('- Copy text, data, sources, legends, and modules that conflict with real content may be replaced; unsupported secondary modules may be dropped.');
  lines.push('- When a chart slot needs a real chart, lock the type from `catalog.md` and reuse the matching gallery implementation — replace only that slot.');
  lines.push('- Never mix two report templates together, and never keep demo data, demo sources, or demo conclusions in the delivered file.');
  lines.push('');

  return lines.join('\n');
}

const README_START = '<!-- GENERATED:chart-family-table:start -->';
const README_END = '<!-- GENERATED:chart-family-table:end -->';

function familyTableBlock(charts: ChartEntry[]): string {
  const counts: Record<string, number> = {};
  for (const c of charts) counts[c.family] = (counts[c.family] ?? 0) + 1;
  const order: [ChartEntry['family'], string][] = [
    ['glance', 'Glance'],
    ['lupi', 'Lupi Editorial'],
    ['basics', 'Lupi Basics'],
    ['maps', 'Maps'],
    ['interactive', 'Interactive'],
  ];
  const total = charts.length;
  const lines: string[] = [];
  lines.push(row(['Family', 'Count']));
  lines.push(row(['---', '---:']));
  for (const [family, label] of order) lines.push(row([label, String(counts[family] ?? 0)]));
  lines.push(row(['**Total**', `**${total}**`]));
  return lines.join('\n');
}

function updateReadmeBlock(charts: ChartEntry[]): { changed: boolean; content?: string } {
  const readmePath = path.join(root, 'README.md');
  if (!fs.existsSync(readmePath)) return { changed: false };
  const source = fs.readFileSync(readmePath, 'utf8');
  const startIdx = source.indexOf(README_START);
  const endIdx = source.indexOf(README_END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) return { changed: false };
  const before = source.slice(0, startIdx + README_START.length);
  const after = source.slice(endIdx);
  const block = familyTableBlock(charts);
  const updated = `${before}\n${block}\n${after}`;
  return { changed: updated !== source, content: updated };
}

function writeOrCheck(relPath: string, content: string, failures: string[]): void {
  const fullPath = path.join(root, relPath);
  if (check) {
    const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : null;
    if (existing !== content) failures.push(`${relPath} is stale relative to catalog/*.json — run \`npm run catalog:generate\`.`);
    return;
  }
  fs.writeFileSync(fullPath, content);
}

function main(): void {
  const charts = readJson<ChartEntry[]>('catalog/charts.json');
  const reports = readJson<ReportEntry[]>('catalog/reports.json');

  const failures: string[] = [];
  writeOrCheck('catalog.md', generateChartsMd(charts), failures);
  writeOrCheck('report-catalog.md', generateReportsMd(reports), failures);

  const readme = updateReadmeBlock(charts);
  if (readme.content !== undefined) {
    if (check) {
      if (readme.changed) failures.push('README.md\'s generated chart-family table is stale — run `npm run catalog:generate`.');
    } else if (readme.changed) {
      fs.writeFileSync(path.join(root, 'README.md'), readme.content);
    }
  }

  if (check) {
    if (failures.length) {
      console.error(`catalog:check failed (${failures.length}):`);
      for (const f of failures) console.error(`- ${f}`);
      process.exit(1);
    }
    console.log('catalog:check passed — generated docs match catalog/*.json.');
    return;
  }

  console.log(`Generated catalog.md (${charts.length} charts) and report-catalog.md (${reports.length} reports).`);
}

main();
