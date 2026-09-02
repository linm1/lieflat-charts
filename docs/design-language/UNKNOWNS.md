# Unknowns Ledger

Live tracking of uncertainty and assumptions, per the know-your-unknowns
method. Update this file as items get resolved — don't let it go stale.
Format per entry: quadrant, evidence, consequence if wrong, reversibility,
resolution method, status.

## Open

### U1 — Full-catalog accessible-name retrofit scope

- **Quadrant:** Known unknown.
- **Description:** ADR-0006 fixes accessible names for newly-added/
  promoted catalog entries going forward, but does not retrofit the
  existing 64 chart implementations across 52 HTML files. The actual
  effort (files touched, whether ECharts' `aria` module can be enabled
  wholesale vs. needing per-chart labels) hasn't been scoped.
- **Consequence if wrong (i.e., if this is bigger than expected):** a
  future "just add aria-labels" task could balloon into a multi-day
  effort touching every gallery file.
- **Reversibility:** fully reversible — this is additive work, no risk to
  existing behavior.
- **Resolution method:** scope with a subagent pass counting exact
  Canvas/ECharts chart instances lacking `aria-label`, then decide
  per-family (Glance canvas vs. ECharts) whether ECharts' built-in `aria:
  {enabled: true}` option (confirmed to exist in ECharts 6.x per
  `RESEARCH.md` §7 research) covers the gap for free.
- **Status:** open (the forward-going part is closed) — not blocking
  initial release. `scripts/validate.ts` now enforces the `aria-label`
  rule from PRINCIPLES.md §8 for every catalog entry with
  `"origin": "extension"` (i.e. anything scaffolded via `npm run
  new-chart` from here on), so the gap can no longer grow. The full
  retrofit across the 64 `"origin": "upstream"` entries is still
  unscoped and still deferred.

## Resolved

(Entries move here once closed, with resolution noted, rather than being
deleted — this preserves the reasoning trail.)

### U2 — Whether to vendor map GeoJSON locally vs. re-pin to echarts@6's CDN path

- **Quadrant:** Known unknown.
- **Description:** ADR-0006 decided to fix the `echarts@4.9.0` GeoJSON
  pin, but didn't decide between (a) pointing at the equivalent asset
  under the `echarts@6` CDN path, or (b) vendoring the GeoJSON file into
  `catalog/assets/` for a fully offline map option.
- **Consequence if wrong:** picking (a) keeps maps network-dependent
  (already true upstream, documented behavior); picking (b) adds a
  maintenance burden (GeoJSON boundary data needs occasional updates,
  especially for disputed-territory correctness) that this fork may not
  be positioned to own.
- **Reversibility:** fully reversible, low cost to change later.
- **Resolution method:** during implementation, check whether
  `echarts@6`'s CDN path serves an equivalent world/US GeoJSON; if yes,
  re-pin (lowest-risk fix). Defer vendoring unless the user asks for
  offline map support specifically.
- **Status:** resolved during implementation, but not the way this entry
  predicted. Probed directly (`curl` against jsdelivr): `echarts@6.1.0`,
  `5.6.0`, and `5.0.0` all 404 on `/map/json/world.json` — echarts
  stopped bundling map GeoJSON entirely from v5 onward, so option (a)
  never existed. Went with (b): vendored the file at
  `assets/geo/world.json` (fetched once from the still-live
  `echarts@4.9.0` CDN path — safe to fetch as inert static data even
  though that version string is CVE-flagged for its JS bundle, not its
  data files) and repointed all four map templates
  (`templates/maps-gallery.html`, `templates/color/maps-{palm,porcelain,wire}.html`)
  at the local copy. This removes the flagged version string from the
  codebase entirely and makes the gallery/dev copies of the map charts
  work offline; `SKILL.md`'s Maps guidance tells agents to inline this
  vendored GeoJSON into delivered single-file artifacts rather than
  re-adding a network fetch.

### U3 — Whether Chinese report-template display names belong in the JSON catalog

- **Quadrant:** Unknown known (tacit preference likely to surface once
  shown examples).
- **Description:** ADR-0003 allows an optional `zh_title` field on report
  entries but doesn't mandate populating it for all 12 templates on day
  one.
- **Consequence if wrong:** if left mostly empty, a future Chinese-
  language delivery loses the established template display names
  currently baked into `templates/reports/index.html` prose.
- **Reversibility:** fully reversible, additive field.
- **Resolution method:** populate `zh_title` for all 12 report entries
  during the catalog JSON authoring pass (cheap, data already exists in
  upstream `index.html`) rather than leaving it as a future gap.
- **Status:** resolved during implementation — populated from source.
  Verified: all 12 entries in `catalog/reports.json` carry a non-empty
  `zh_title`.
