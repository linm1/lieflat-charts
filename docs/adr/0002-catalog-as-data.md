# ADR-0002: Catalog as Machine-Readable Data, Docs Generated

## Status

Accepted — 2026-09-02

## Context

Upstream `catalog.md` and `report-catalog.md` are hand-written Markdown
tables — the single source of truth for 64 chart types and 12 report
templates. This works until it doesn't: the research pass in
`RESEARCH.md` §7 found the README's summary table had drifted out of sync
with the actual catalog after the last three feature PRs, and found
naming drift between `catalog.md`'s canonical chart IDs (`F1`–`F17`) and
legacy shorthand comments still present in the gallery HTML (`B1`–`B4`,
`C1`–`C9`) from before that family was renamed. Both are structural
consequences of hand-maintained prose being the source of truth: nothing
forces the README, the catalog, and the implementation to agree.

The user's core requirement — "add something in natural language and end
up with a highly visualized, easy to understand output" — needs the
catalog to be something a tool (and an agent) can query, validate against,
and extend programmatically, not just something a human reads.

## Decision

1. **`catalog/charts.json`** and **`catalog/reports.json`** become the
   single source of truth, validated against JSON Schemas in
   `catalog/schema/`. Each entry carries: canonical ID, family, card
   title, data-shape tags, occasion/reading-speed tags, engine, gallery
   file + anchor, legacy aliases (for the `B1`/`C1`-style historical
   comments), primary-vs-backup tier, and sibling/alternative IDs.
2. **`catalog.md`, `report-catalog.md`, and the README's chart-family
   table are generated** from the JSON via `scripts/generate-catalog-docs.ts`
   and checked into git (generated-but-committed, so they remain readable
   without a build step) — but a CI-style check
   (`npm run catalog:check`) fails if the committed Markdown doesn't
   match what generation would produce, so drift is caught before merge
   rather than discovered months later.
3. **Legacy gallery anchors are preserved as data**, not deleted — the
   `legacy_anchor` field on each chart entry records the historical
   `B1`/`C1`-style comment so tooling that scans the HTML directly (rather
   than the JSON) still resolves correctly, and so the history stays
   traceable.
4. **The chart-selection engine** (documented in `SKILL.md` §7, the
   natural-language extension workflow) queries `charts.json` directly
   rather than parsing Markdown, which is both faster and removes an
   entire class of "the agent misread the table" failure.

## Consequences

- Adding a chart type is now: add a JSON entry (validated by schema) →
  implement it in the appropriate gallery file → regenerate docs → the
  catalog, the docs, and the implementation cannot silently disagree.
- The generated Markdown files are still the primary human-facing
  reference (agents and humans read `catalog.md` the same way they always
  did) — this decision doesn't change the reading experience, only where
  the authority lives.
- One more build step (`npm run catalog:check`) is required before a
  catalog change is considered complete. This is a deliberate cost:
  the alternative (trusting hand-maintained prose to stay in sync
  forever) is the exact failure this ADR fixes.
- Schema evolution (adding a new required field) needs a migration pass
  over existing entries — a manageable, visible cost, versus silent
  format drift.
