# Provenance

Navi Chart is a fork of [`lieflat-charts`](https://github.com/larashero3-dotcom/lieflat-charts)
by larashero3-dotcom, forked at commit `4eef5ce00d0907a03b8eff42578b5a04942915e9`
(2026-08-19, "Add 16 chart types across Lupi, Basics, Glance and Maps").

## What Navi Chart changes

- **English-first.** `SKILL.md`, the chart/report catalog, all tooling,
  and all architecture docs are English. Chart and report *output*
  remains fully bilingual/multilingual — this is a documentation and
  instruction-layer change, not a capability reduction. See
  [ADR-0003](adr/0003-english-first-bilingual-generated.md).
- **Machine-readable catalog.** The 64-chart and 12-report catalogs move
  from hand-written Markdown tables to schema-validated JSON, with
  Markdown docs generated from that JSON. See
  [ADR-0002](adr/0002-catalog-as-data.md).
- **A natural-language extension workflow with a real validation gate.**
  New chart types can be proposed conversationally and promoted into the
  catalog through `npm run new-chart`, which scaffolds from the nearest
  sibling and validates before the catalog accepts the entry. See
  [ADR-0005](adr/0005-natural-language-extension-workflow.md).
- **TypeScript tooling** (validator, doc generator, chart scaffolder)
  alongside the unchanged vanilla-JS chart runtime. See
  [ADR-0004](adr/0004-vanilla-runtime-typescript-tooling.md).
- **Documented, evidence-based design research** (`docs/design-language/`)
  reverse-engineering *why* the visual system works, not just restating
  its rules — used as the basis for every architectural decision in this
  fork.
- **Concrete accessibility and security fixes**, and explicit documentation
  of tradeoffs deliberately not changed. See
  [ADR-0006](adr/0006-accessibility-and-security-remediations.md).

## What Navi Chart preserves unchanged

- The core visual grammar (Mono tokens, the Lupi/Basics/Glance reading-
  speed split, the report-template system) — this is the asset worth
  keeping, and the entire point of forking rather than starting over. See
  `docs/design-language/RESEARCH.md` for the full reverse-engineering of
  why this system works.
- The PolyForm Noncommercial License 1.0.0. See
  [ADR-0001](adr/0001-license-and-provenance.md).
- The single-file, no-build-step distribution model for generated charts
  and reports.

## License

PolyForm Noncommercial License 1.0.0 — see [`LICENSE`](LICENSE). Same
terms as upstream; see ADR-0001 for why this fork does not relicense.
