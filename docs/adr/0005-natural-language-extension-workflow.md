# ADR-0005: Natural-Language Extension Workflow for New Chart Types

## Status

Accepted — 2026-09-02

## Context

The user's central ask: be able to describe a new chart or report need in
plain language and have the system grow to support it sustainably,
without degrading the visual coherence documented in
`docs/design-language/RESEARCH.md` and enforced by
`docs/design-language/PRINCIPLES.md`. Upstream already has a "translation
workflow" for chart types not in the 64-entry catalog (`SKILL.md` §6,
four steps: identify the encoding, find the nearest catalog relative,
build strictly from tokens, pass the same hard-rule checklist as a native
chart) — this is a sound process, but it lived entirely as unstructured
prose with no artifact, no validation gate, and no way for a new chart to
actually join the catalog afterward (it stayed a one-off "translated"
delivery, never promoted to a reusable `chart_id`).

## Decision

Formalize a two-tier extension path:

1. **One-off translation** (matches upstream's existing behavior): for a
   single delivery, an agent may synthesize a chart not in the catalog by
   following the four-step process in `SKILL.md` §7.1 — identify the
   encoding, cite the nearest catalog neighbor, build only from
   `mono-tokens.js`/`color-presets.json` values, and pass every rule in
   `PRINCIPLES.md` before delivery. This produces a working chart but does
   **not** modify the catalog.
2. **Catalog promotion** (new in this fork): when a translated chart
   proves reusable — the user asks for it again, or an agent judges the
   data shape common enough to be worth registering — it can be promoted
   into `catalog/charts.json` via `npm run new-chart`, which:
   - prompts for the required schema fields (data shape, occasion,
     reading speed, family, nearest sibling, primary-vs-backup tier),
   - validates the new entry against `catalog/schema/chart.schema.json`,
   - scaffolds the gallery HTML entry from the nearest sibling's
     structure (never from a blank template — enforcing ADR-0002's reuse
     principle even for brand-new chart types),
   - regenerates `catalog.md` and fails if `npm run validate` doesn't
     pass on the result (no `Math.random()`, token-only colors, required
     card anatomy present, accessible name present).
3. **Reports follow the same two-tier path** via the report entry in
   `catalog/reports.json`, using the nearest report template as the
   structural donor rather than a chart.
4. **Nothing skips validation.** A catalog promotion that fails
   `scripts/validate.ts` is rejected, not merged with a TODO. This mirrors
   the hard-rule posture in upstream `SKILL.md` — "违反任意一条都必须返工" (violate
   any rule, it gets reworked) — carried into an actual CI gate instead of
   remaining an instruction the agent has to remember unprompted every
   time.

## Consequences

- The catalog can grow from real usage instead of only from planned
  feature work — this directly satisfies the user's "always add something
  in natural language" requirement.
- Growth is structurally prevented from diluting the visual system: every
  new entry inherits tokens and cites a structural donor, the same
  discipline that keeps the original 64 charts feeling like one family
  (see `RESEARCH.md` §1).
- There is now a real gate (`npm run validate`) between "agent thinks this
  chart is good" and "chart is permanently in the catalog," which is a
  meaningfully higher bar than upstream's fully prose-based process — and
  is the mechanism that makes "sustainable" more than an aspiration.
- One-off translations that are never promoted leave no trace in the
  catalog, which is correct (not every one-off chart deserves to become a
  reusable type) but means catalog growth requires a deliberate promotion
  step rather than happening automatically — an intentional friction
  point, not an oversight.
