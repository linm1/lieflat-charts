# ADR-0004: Vanilla-JS Chart Runtime; TypeScript for Tooling Only

## Status

Accepted — 2026-09-02

## Context

The user's global convention is TypeScript-first, Python only where a
parser or ML component genuinely requires it. Upstream's actual chart
runtime is hand-written vanilla JavaScript embedded directly in
single-file HTML artifacts (`templates/*.html`), using SVG DOM APIs,
Chart.js, and ECharts — deliberately dependency-light so a finished chart
is one double-clickable HTML file with no build step (see
`RESEARCH.md` §1). This is a load-bearing product property, not an
accident of the original author's toolchain: the entire "zero-friction"
distribution story (`npx skills add ...`, then immediately usable)
depends on generated artifacts having no compile step.

## Decision

1. **The chart/report runtime stays vanilla JavaScript, inlined in
   single-file HTML.** Introducing TypeScript (or any framework) into the
   generated-artifact layer would require a build step between "agent
   writes a chart" and "user opens a working file," which breaks the
   zero-friction distribution model this project depends on.
2. **TypeScript is used for everything that is not a generated artifact**:
   the catalog validator, the docs generator, the new-chart scaffolding
   tool, the smoke-test runner, and any future chart-selection engine
   logic. These run in Node during development/generation, never ship to
   the end user's browser.
3. **Shared runtime helpers stay as `.js` files** (`mono-tokens.js`,
   `color-presets.js`) consumed two ways: inlined directly into
   single-file deliverables (production path, matches upstream), or
   loaded via `<script src>` for local gallery development (matches
   upstream's existing dual-mode comment in the file header). No change
   from upstream's approach here — it already works and matches the
   project's actual constraints.
4. **Python is not used anywhere in this project.** No parser or ML
   component is needed; `pygount`/OSV lookups used during research were
   external, one-off inspection tools, not part of the shipped system.

## Consequences

- Contributors get real type-checking, linting, and IDE support for the
  tooling layer (the part with the most logic and the most room for
  silent bugs), while the artifact layer keeps its zero-dependency,
  zero-build distribution story intact.
- There is a real seam to maintain: token/logic changes made in
  `scripts/*.ts` (e.g. a new color-contrast check) must be manually kept
  consistent with the equivalent runtime behavior in `mono-tokens.js` —
  there's no shared type system across that boundary. This is an accepted
  cost of the dual-mode requirement, mitigated by `scripts/validate.ts`
  asserting runtime-file invariants (e.g. it already executes
  `mono-tokens.js` as a VM script to catch syntax errors).
- If the project later drops the "single-file, no-build" requirement,
  this ADR should be revisited — but doing so would be a materially
  different product, not a tooling upgrade.
