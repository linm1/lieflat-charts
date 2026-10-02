# Architecture Decision Records

Each ADR is a single immutable decision record: context, decision,
consequences, status. Don't edit a merged ADR's decision — supersede it
with a new one and link back. This keeps the "why" auditable the same way
git history keeps the "what" auditable.

| # | Title | Status |
|---|---|---|
| [0001](0001-license-and-provenance.md) | License and provenance | Accepted |
| [0002](0002-catalog-as-data.md) | Catalog as machine-readable data, docs generated | Accepted |
| [0003](0003-english-first-bilingual-generated.md) | English-first; Chinese output generated on request, not hand-maintained | Accepted |
| [0004](0004-vanilla-runtime-typescript-tooling.md) | Vanilla-JS chart runtime; TypeScript for tooling only | Accepted |
| [0005](0005-natural-language-extension-workflow.md) | Natural-language extension workflow for new chart types | Accepted |
| [0006](0006-accessibility-and-security-remediations.md) | Accessibility and security remediations carried into the fork | Accepted |

See also `docs/design-language/UNKNOWNS.md` for open questions that
haven't reached ADR maturity yet — an ADR records a decision that's been
made; the unknowns ledger tracks what's still being resolved.
