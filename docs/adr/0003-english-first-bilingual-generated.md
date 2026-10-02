# ADR-0003: English-First; Chinese Output Generated on Request, Not Hand-Maintained

## Status

Accepted — 2026-09-02

## Context

Upstream is Chinese-primary: `SKILL.md` is 45.7% CJK characters by byte
count, `catalog.md` is 20.7%, `README.md` (the Chinese version) is the
canonical README with `README.en.md` as a secondary, occasionally-stale
translation (see `RESEARCH.md` §7 for the specific stale-table example).
Report templates ship as true parallel bilingual pairs
(`report-NN.zh.html` / `report-NN.en.html`), which is a different,
healthier pattern — two independently-authored, independently-validated
files — than a primary/translation pair.

The user explicitly wants an English-first version of the skill itself
(instructions, catalog, tooling, docs) while being able to continue
producing Chinese-language *chart output* when a user's data or request
calls for it.

## Decision

1. **`SKILL.md`, the catalog JSON/Markdown, ADRs, and all tooling docs are
   English-only.** There is no parallel `SKILL.zh.md` to keep in sync —
   duplicating the *instruction* layer bilingually is exactly the
   maintenance burden that caused the stale-README problem upstream.
2. **The report-template pattern (independent parallel files per
   language) is kept and extended**, because it isn't a translation-drift
   risk the same way instruction docs are: each report file is a complete
   working artifact validated independently by
   `scripts/validate.ts`, not prose that has to stay semantically
   identical to a sibling.
3. **Chart and report *output* remains fully language-agnostic** — the
   generation workflow accepts a `language` parameter (or infers it from
   the user's input language, matching upstream's existing rule) and
   produces correctly-localized chart titles, subtitles, and source lines
   in that language, using the same catalog entry and the same visual
   grammar either way. Language is a rendering parameter, not a fork in
   the taxonomy.
4. **`catalog/charts.json` and `catalog/reports.json` store English
   canonical names**, with an optional `zh_title` field per entry for
   report templates that have an established Chinese name worth
   preserving (e.g., report template display names used in
   `templates/reports/index.html`).

## Consequences

- Anyone maintaining the skill's *rules* only edits English files —
  removes the two-file sync burden that produced the stale-table bug this
  fork is fixing.
- Chart *output* in Chinese remains fully supported and is not a
  second-class path — this decision does not reduce the project's
  Chinese-language usability, only its Chinese-language *documentation*
  maintenance surface.
- A future contributor who wants a fully Chinese-language instruction
  layer would need to fork again or maintain a translation layer
  explicitly outside this repo's guarantee — that's an accepted tradeoff,
  not an oversight.
