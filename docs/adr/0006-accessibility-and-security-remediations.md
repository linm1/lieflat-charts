# ADR-0006: Accessibility and Security Remediations Carried Into the Fork

## Status

Accepted — 2026-09-02

## Context

`RESEARCH.md` §7 documents several concrete, evidence-based gaps found in
the upstream system: a CVE-flagged ECharts version pinned into the map
templates, zero accessible-name coverage on Canvas/Chart.js charts, no
Subresource Integrity on CDN scripts, and several text roles (`FAINT`,
`GRID`, Wire's `HERO` orange) that fail WCAG contrast minimums by
significant margins. Each needs an explicit decision: fix, document as an
accepted tradeoff, or defer.

## Decision

| Finding | Decision |
|---|---|
| `echarts@4.9.0` pinned in map GeoJSON fetch URLs (`GHSA-fgmj-fm8m-jvvx`) | **Fix.** Repoint to `echarts@6` (matching the version already used everywhere else in the project) or vendor the specific GeoJSON asset locally. Tracked as a concrete task in the implementation pass, not deferred. |
| No SRI hashes on CDN `<script>` tags | **Accept as documented tradeoff.** Floating major-version CDN URLs (`@4`, `@6`) are incompatible with exact-byte SRI hashes; pinning exact patch versions to enable SRI reintroduces the version-drift maintenance burden the floating-tag approach avoids. Document this explicitly in `THIRD_PARTY_NOTICES.md` rather than silently shipping without SRI and rather than silently "fixing" it in a way that adds a new maintenance burden. |
| Canvas/Chart.js charts have zero accessible name or fallback table | **Fix, as a new hard rule.** `PRINCIPLES.md` §8 requires an `aria-label` on every Canvas/Chart.js container summarizing the chart's finding, plus a visually-hidden data table for charts carrying load-bearing numeric detail. `scripts/validate.ts` gains a check for this on newly-added/promoted catalog entries; retrofitting the full existing gallery is tracked as follow-up work, not blocking this fork's initial release. |
| `FAINT`/`GRID`/Wire `HERO` fail WCAG AA/graphics-contrast minimums | **Document, don't silently change the palette.** These are deliberate low-emphasis/decorative roles in the source design system (source lines, hairline grids, single accent). Changing their hex values would be a visual-identity change requiring its own design decision, not an accessibility bugfix that can be made unilaterally. `PRINCIPLES.md` §11 codifies the exact ratios and the resulting rule: never put load-bearing text in these roles. A future ADR could propose a palette revision if this constraint proves too limiting in practice. |
| Fixed-canvas reports don't reflow (WCAG 1.4.10) | **Accept as documented tradeoff**, per `RESEARCH.md` §5 — reports are a page metaphor, matching PDF "fit to width" behavior, and reflowing would produce a layout nobody designed. `PRINCIPLES.md` §8 requires this tradeoff be surfaced to the user when relevant to their use case. |
| No `package.json`/CI existed upstream (community PR #11 proposing this was never merged) | **Fix.** This fork ships `package.json`, `tsconfig.json`, and `scripts/validate.ts`/`scripts/generate-catalog-docs.ts` as its baseline tooling — see ADR-0002 and ADR-0004. |
| Legacy `B1`/`C1`-style comment IDs inside `basics-gallery.html` disagree with `catalog.md`'s `F1`–`F17` numbering | **Fix via data, not deletion.** Recorded as `legacy_anchor` in `catalog/charts.json` (ADR-0002) so both the historical comment and the canonical ID resolve correctly; the HTML comments themselves are left alone to avoid an unnecessary diff against upstream history. |

## Consequences

- Two concrete security/correctness fixes ship in this fork (ECharts
  version, Canvas accessible names) rather than being narrated as
  findings with no action.
- Three items are explicitly *not* changed, with the reasoning recorded
  here so a future contributor doesn't "fix" them again without
  understanding the tradeoff (SRI, contrast on decorative roles, report
  reflow).
- Retrofitting accessible names across all 64 existing chart
  implementations (versus just newly-added ones) is significant surface
  area and is intentionally scoped as follow-up work — tracked in
  `docs/design-language/UNKNOWNS.md` — rather than blocking this fork's
  initial English-first release.
