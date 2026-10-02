// Executes mono-tokens.js and color-presets.js in a VM sandbox (the runtime files
// stay vanilla JS on purpose — see docs/adr/0004-vanilla-runtime-typescript-tooling.md)
// and emits machine-readable copies for tooling to consume: catalog/tokens.json (the
// Mono roles + type/shape/motion constants) and catalog/color-presets.json (each
// built-in preset's role->hex map). scripts/new-chart.ts reads these to inherit tokens
// for a scaffolded chart rather than inventing new values.
//
// Also acts as the "keep scripts/*.ts consistent with mono-tokens.js runtime behavior"
// regression guard ADR-0004 calls for: it recomputes WCAG contrast for every
// load-bearing text/data role against the baseline already measured by hand in
// docs/design-language/PRINCIPLES.md §11, and fails the build if a future edit to
// mono-tokens.js / color-presets.js silently drops below 4.5:1.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

interface MonoTokens {
  INK: string;
  PAPER: string;
  MUTED: string;
  FAINT: string;
  GRID: string;
  L: string[];
  LAD: string[];
  DARK: Record<string, unknown>;
  FONT: Record<string, unknown>;
  SHAPE: Record<string, unknown>;
  MOTION: { css: string } & Record<string, unknown>;
}

interface ColorPreset {
  name: string;
  BG: string;
  TXT: string;
  MUT: string;
  GRID: string;
  DATA: string;
  HERO: string;
  [key: string]: unknown;
}

interface Presets {
  PORCELAIN: ColorPreset;
  PALM: ColorPreset;
  WIRE: ColorPreset;
  list: string[];
  get: (name: string) => ColorPreset | null;
}

function runInSandbox<T>(relPath: string, globalKey: string): T {
  const source = fs.readFileSync(path.join(root, relPath), 'utf8');
  const sandbox: Record<string, unknown> = {};
  vm.createContext(sandbox);
  new vm.Script(source, { filename: relPath }).runInContext(sandbox);
  const value = sandbox[globalKey];
  if (!value) throw new Error(`${relPath} did not set global.${globalKey}`);
  return value as T;
}

// --- WCAG relative-luminance contrast ---------------------------------------

function srgbChannel(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.exec(hex.trim());
  if (!m) return null;
  const full = m[1]!.length === 3 ? [...m[1]!].map(c => c + c).join('') : m[1]!;
  return [Number.parseInt(full.slice(0, 2), 16), Number.parseInt(full.slice(2, 4), 16), Number.parseInt(full.slice(4, 6), 16)];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b);
}

function contrastRatio(hexA: string, hexB: string): number | null {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return null;
  const [lLight, lDark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lLight! + 0.05) / (lDark! + 0.05);
}

function main(): void {
  const MONO = runInSandbox<MonoTokens>('mono-tokens.js', 'MONO');
  const PRESETS = runInSandbox<Presets>('color-presets.js', 'PRESETS');

  for (const key of ['INK', 'PAPER', 'MUTED', 'FAINT', 'GRID', 'L'] as const) {
    if (!(key in MONO)) throw new Error(`mono-tokens.js: MONO.${key} is missing`);
  }
  if (!Array.isArray(MONO.L) || MONO.L.length !== 7) {
    throw new Error(`mono-tokens.js: MONO.L should be the 7-step ladder, got ${MONO.L?.length} entries`);
  }

  const failures: string[] = [];
  const MIN_AA_TEXT = 4.5;

  function checkContrast(label: string, fgHex: string, bgHex: string): number {
    const ratio = contrastRatio(fgHex, bgHex);
    if (ratio === null) {
      failures.push(`${label}: could not parse hex colors (${fgHex} / ${bgHex})`);
      return 0;
    }
    if (ratio < MIN_AA_TEXT) {
      failures.push(`${label}: contrast ${ratio.toFixed(2)}:1 is below the ${MIN_AA_TEXT}:1 AA text minimum`);
    }
    return Number(ratio.toFixed(2));
  }

  const contrastReport: Record<string, number> = {};
  contrastReport['mono.INK/PAPER'] = checkContrast('mono.INK/PAPER', MONO.INK, MONO.PAPER);

  const presetEntries: [string, ColorPreset][] = [
    ['porcelain', PRESETS.PORCELAIN],
    ['palm', PRESETS.PALM],
    ['wire', PRESETS.WIRE],
  ];

  const colorPresetsJson: Record<string, { BG: string; TXT: string; MUT: string; GRID: string; DATA: string; HERO: string }> = {};

  for (const [name, preset] of presetEntries) {
    for (const role of ['BG', 'TXT', 'MUT', 'GRID', 'DATA', 'HERO'] as const) {
      if (!(role in preset)) failures.push(`color-presets.js: ${name}.${role} is missing`);
    }
    colorPresetsJson[name] = { BG: preset.BG, TXT: preset.TXT, MUT: preset.MUT, GRID: preset.GRID, DATA: preset.DATA, HERO: preset.HERO };
    // Only TXT/BG and DATA/BG are load-bearing text roles per PRINCIPLES.md §11 — MUT/
    // FAINT/GRID/HERO are documented decorative/low-emphasis exceptions, checked by
    // hand there, not re-asserted here (HERO is known to fail on Wire, by design).
    contrastReport[`${name}.TXT/BG`] = checkContrast(`${name}.TXT/BG`, preset.TXT, preset.BG);
    contrastReport[`${name}.DATA/BG`] = checkContrast(`${name}.DATA/BG`, preset.DATA, preset.BG);
  }

  if (failures.length) {
    console.error(`build:tokens failed (${failures.length}):`);
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }

  // The raw reduced-motion CSS block is large and stays in mono-tokens.js as the
  // runtime source of truth; tooling only needs the numeric/easing constants.
  const { css: _css, ...motionConstants } = MONO.MOTION;

  const tokensJson = {
    color: { INK: MONO.INK, PAPER: MONO.PAPER, MUTED: MONO.MUTED, FAINT: MONO.FAINT, GRID: MONO.GRID, ladder: MONO.L, ladderShort: MONO.LAD },
    dark: MONO.DARK,
    font: MONO.FONT,
    shape: MONO.SHAPE,
    motion: motionConstants,
    contrast: contrastReport,
  };

  fs.mkdirSync(path.join(root, 'catalog'), { recursive: true });
  fs.writeFileSync(path.join(root, 'catalog/tokens.json'), JSON.stringify(tokensJson, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'catalog/color-presets.json'), JSON.stringify(colorPresetsJson, null, 2) + '\n');

  console.log(`build:tokens passed. Wrote catalog/tokens.json and catalog/color-presets.json. Contrast checks: ${Object.keys(contrastReport).length} passed >= ${MIN_AA_TEXT}:1.`);
}

main();
