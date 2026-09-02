// Runtime smoke test: opens each gallery in a headless browser and confirms the given
// chart ids actually drew content, with no console errors. TypeScript port of the
// original scripts/smoke-new-charts.mjs — same technique (playwright-core against a
// global Playwright install, since ESM doesn't honor NODE_PATH), same target ids (the
// most recently added chart types across the three colorable families), just typed and
// driven by the catalog instead of a hardcoded id list where practical.
//
// Usage: npm run smoke
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

interface ChartEntry {
  id: string;
  family: string;
  card_anchor_id: string | null;
  gallery_file: string;
  legacy_anchor: string | null;
  origin: 'upstream' | 'extension';
}

function readJson<T>(relPath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8')) as T;
}

// Smoke-test the entries that carried a legacy_anchor or were the last batch added
// upstream (F14-F17, L16-L20, G19-G22) — the same "most recently added, least proven"
// set the original script targeted, now derived from the catalog instead of hardcoded.
const RECENT_IDS = new Set(['F14', 'F15', 'F16', 'F17', 'L16', 'L17', 'L18', 'L19', 'L20', 'G19', 'G20', 'G21', 'G22']);

const suffixes = ['gallery', 'porcelain', 'palm', 'wire'] as const;
type Family = 'basics' | 'lupi' | 'glance';

function filePath(family: Family, suffix: (typeof suffixes)[number]): string {
  return suffix === 'gallery' ? `templates/${family}-gallery.html` : `templates/color/${family}-${suffix}.html`;
}

async function main(): Promise<void> {
  const charts = readJson<ChartEntry[]>('catalog/charts.json');
  const groups: Record<Family, string[]> = { basics: [], lupi: [], glance: [] };
  for (const chart of charts) {
    if (!RECENT_IDS.has(chart.id)) continue;
    if (!chart.card_anchor_id) continue;
    if (chart.family !== 'basics' && chart.family !== 'lupi' && chart.family !== 'glance') continue;
    groups[chart.family].push(chart.card_anchor_id);
  }

  const globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
  const playwrightModule = (await import(path.join(globalRoot, 'playwright', 'index.js'))) as {
    chromium?: unknown;
    default?: { chromium: unknown };
  };
  const chromiumModule = (playwrightModule.chromium ? playwrightModule : playwrightModule.default) as {
    chromium: { launch: () => Promise<import('playwright-core').Browser> };
  };
  const { chromium } = chromiumModule;

  const browser = await chromium.launch();
  const failures: string[] = [];

  for (const [family, ids] of Object.entries(groups) as [Family, string[]][]) {
    for (const suffix of suffixes) {
      const relative = filePath(family, suffix);
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const errors: string[] = [];
      page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', error => errors.push(String(error)));

      await page.goto(`file://${path.join(root, relative)}`);
      await page.waitForTimeout(2500); // let layout + ECharts/SVG finish drawing

      for (const id of ids) {
        // Galleries lazy-render via IntersectionObserver — must scroll into view first.
        await page.evaluate(chartId => {
          document.getElementById(chartId)?.scrollIntoView({ block: 'center' });
        }, id);
        await page.waitForTimeout(1200);

        const report = await page.evaluate(chartId => {
          const node = document.getElementById(chartId);
          if (!node) return { missing: true, w: 0, h: 0, drawn: 0 };
          const box = node.getBoundingClientRect();
          const drawn = node.querySelectorAll('path,rect,circle,line,polygon,canvas,svg,text').length;
          return { missing: false, w: Math.round(box.width), h: Math.round(box.height), drawn };
        }, id);

        if (report.missing) failures.push(`${relative} #${id}: container does not exist`);
        else if (report.w < 50 || report.h < 30) failures.push(`${relative} #${id}: unexpected size ${report.w}x${report.h}`);
        else if (report.drawn < 3) failures.push(`${relative} #${id}: nothing drawn (${report.drawn} child elements)`);
      }

      // Maps depend on network GeoJSON; console errors there while offline are
      // expected, so this smoke test only covers the non-map families anyway.
      for (const error of errors) failures.push(`${relative} console error: ${error}`);
      await page.close();
    }
  }

  await browser.close();

  if (failures.length) {
    console.error(`Smoke test failed (${failures.length}):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log('Smoke test passed: the newest chart types drew content in all 12 galleries, no console errors.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
