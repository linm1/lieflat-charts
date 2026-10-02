# ADR-0001: License and Provenance

## Status

Accepted — 2026-09-02

## Context

Navi Chart is a fork of `larashero3-dotcom/lieflat-charts` (commit
`4eef5ce`, 2026-08-19), licensed under PolyForm Noncommercial License
1.0.0. The upstream `LICENSE` file carries the raw PolyForm template text
with no `Required Notice: Copyright ...` line filled in — the original
author never established one. Third-party runtime dependencies
(Chart.js, Apache ECharts, Inter) are separately licensed (MIT / Apache
2.0 / SIL OFL 1.1) and documented in `THIRD_PARTY_NOTICES.md`.

Two things need deciding: (1) what license Navi Chart ships under, and
(2) how to represent the fork relationship and the substantial rewrite
this project performs (English-first rewrite, new tooling, new catalog
format, restructured docs) without misrepresenting authorship of the
original design system.

## Decision

1. **Keep PolyForm Noncommercial License 1.0.0** unmodified. This is a
   derivative work under copyright law regardless of how much is
   rewritten (the visual grammar, chart implementations, and core design
   taste are substantially inherited); relicensing would require the
   original author's permission, which has not been sought. Commercial
   use of Navi Chart requires the same permission commercial use of the
   upstream project would require.
2. **Add a `PROVENANCE.md`** stating the fork origin, the source commit,
   and a summary of what changed (English-first rewrite, TypeScript
   tooling, machine-readable catalog, ADR/unknowns process) so the
   relationship is discoverable without archaeology.
3. **Do not invent a `Required Notice:` copyright line** the upstream
   project never established. Carry `LICENSE` forward verbatim. If the
   upstream project later adds one, sync it.
4. **Preserve `THIRD_PARTY_NOTICES.md`**, updated for any dependency
   version changes made in this fork (see ADR-0006 for the ECharts
   4.9.0→6.1.0 pin fix).

## Consequences

- Commercial users of Navi Chart face the same licensing constraint as
  upstream users — this is expected and correct, not a limitation
  introduced by the fork.
- Anyone auditing this repository can trace design decisions back to
  upstream evidence via `docs/design-language/RESEARCH.md`, which cites
  exact upstream file paths and commit IDs.
- If upstream changes its license, this fork's license does not
  automatically follow; a new ADR would be required to evaluate a
  relicense.
