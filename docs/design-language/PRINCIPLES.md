# Design Principles (Normative)

This is the enforceable rulebook. `RESEARCH.md` explains *why* these rules
exist and cites the evidence; this file states *what must be true* of any
chart or report Navi Chart produces. `scripts/validate.ts` checks the
mechanical subset of these rules automatically. Where a rule can't be
checked by a script, it's still binding — treat it as a review checklist.

Every rule here traces to a citation in `RESEARCH.md`. If you want to
change a rule, update the research first, then the principle, then the
schema/validator — in that order. Rules don't get to drift from their
evidence.

## 1. Reuse before invention

A chart is only "in the system" if it maps to a `chart_id` in
`catalog/charts.json` with a real implementation in `templates/`. Do not
generate a chart from a prompt without first checking the catalog for the
nearest data-shape match. See `docs/adr/0002-catalog-as-data.md` and the
extension workflow in `SKILL.md` §7 for how to *add* a new chart_id
properly — that is different from inventing one ad hoc for a single
delivery.

**Rework trigger:** a delivered chart whose core geometry doesn't trace to
a named `chart_id`, or that mixes structural elements from two different
`chart_id`s.

## 2. One reading speed per delivery, chosen deliberately

Before picking a chart, name the reading contract:

- **Lupi** (editorial, 30s+, one record = one mark) — default for reports,
  papers, long-form, portfolios.
- **Basics** (editorial density, familiar silhouette, countable units) —
  default when data is sparse but the occasion still wants Lupi's density.
- **Glance** (<10s, pre-aggregated, bold) — only after Lupi and Basics are
  checked and rejected for cause, or the user explicitly asks for a
  dashboard / weekly report / "readable in 3 seconds."

**Rework trigger:** Glance chosen as a default without a documented reason
Lupi/Basics failed. See `RESEARCH.md` §3.

## 3. Small data does not mean low density

When a dataset is just a handful of percentages or counts, decompose it
into honest countable units (1 dot = 1 person in a hundred; 1 tick = 1
respondent) rather than defaulting to a low-density Glance shape. State
the unit meaning in the subtitle. Only fabricate individual-level detail
you can actually derive from the aggregate (percentages of 100 → 100
dots is fine; percentages of an unknown N → do not invent N).

**Rework trigger:** a sparse dataset rendered as three big colored blocks
with no unit decomposition attempted, when the occasion called for Lupi
density.

## 4. The four-slot card is not optional

Every standalone chart ships: a conclusion-style title (not a chart-type
label), a subtitle carrying legend + time range + unit meaning, the mark,
and an all-caps source line (`CHART NAME · SYSTEM · SOURCE`). See
`RESEARCH.md` §2.2.

**Rework trigger:** a title that names the chart type instead of stating a
finding ("Bar Chart" instead of "Revenue by plan"); a chart with no
source line.

## 5. Color is data, mono is the floor

Default output is Mono. Automatically choose a built-in preset
(Porcelain/Palm/Wire) only when the data shape and occasion clearly
match one (see `catalog/color-presets.json` for the exact fit table); when
unclear, stay on Mono. Do not mix systems within one delivery. Custom
palettes require the user to supply real colors and must define, at
minimum, `bg`/`text`/`muted`/`grid`/`data` roles with a checked contrast
ratio — never distribute five arbitrary hexes across elements without a
role system behind them.

**Rework trigger:** more than one color system in a single HTML file or
chart set; a chart with more than one "hero" accent color; a custom
palette with un-checked contrast.

## 6. Perceptual honesty is mechanical, not a vibe

- Bars are never axis-truncated. Use one of: let the extreme value tower,
  add an inset magnifier, or use a visibly-torn bar with the axis intact.
- Area/radius encodings use `sqrt(value)`, never raw value, for the size
  channel.
- If a legibility floor is added on top of `sqrt(value)` (so tiny values
  stay visible/clickable), keep the visible ratio distortion small, or
  disclose the floor in the subtitle exactly the way rounding loss is
  disclosed (see rule 7).
- Deterministic pseudo-randomness only (`rnd(i, k)` style hash). No
  `Math.random()` in any shipped artifact — screenshots and diffs must be
  stable across reloads.
- Choropleth maps state `shade = value` (or equivalent) directly in the
  subtitle, because map area is geography, not data.

**Rework trigger:** any of the above violated; `Math.random()` found in a
generated file (this one is enforced by `scripts/validate.ts`).

## 7. Disclose, don't hide, imperfection

If rounded values don't sum to the stated total, say so in the footer
("rounding ate the other N") rather than padding a category to force the
total. If data is missing, mark it as silent/absent rather than
interpolating a fake value. This is a direct, load-bearing rule, not
decoration — see `RESEARCH.md` §4 for the worked example.

**Rework trigger:** a total presented as exact when the underlying marks
don't actually sum to it, with no disclosure.

## 8. Accessibility floor

Every generated artifact must:

- Respect `prefers-reduced-motion` (disable non-essential CSS animation).
- Give every chart mark an accessible name: SVG marks use `<title>`
  (native tooltip + accessible name); Canvas/Chart.js marks require an
  `aria-label` on the container summarizing the chart's finding, plus a
  visually-hidden data table when the chart carries load-bearing numeric
  detail a screen-reader user would otherwise lose entirely.
- Never use color as the only channel distinguishing categories; pair
  with position, label, or shape.
- Meet WCAG AA (4.5:1) for any text a reader is expected to parse
  word-by-word; large/decorative type may use the 3:1 large-text minimum
  in `mono-tokens`' own `MUTED`/`FAINT` roles, but flag explicitly when a
  delivery leans on that lower bar for load-bearing text.

**Known accepted gap (documented in ADR-0006, not silently ignored):**
fixed-canvas report templates intentionally scale-to-fit narrow viewports
instead of reflowing to a single column, which is a deliberate tradeoff
against strict WCAG 1.4.10 Reflow — reports are page metaphors, not
responsive web pages. State this tradeoff to the user when it's relevant
to their use case (e.g., "this needs to be read as a full page, not
reflowed on a phone").

## 9. Card furniture rules (dashboards specifically)

A dashboard/report is a **Monitor** or **Compare** surface, not a
**Decide/Learn** surface — see `claude-design`'s seven-surface model. That
means: no hero-plus-three-cards composition, no feature-tile grid, no
icon-topper headings, no monument stat that crowds out real chart content.
KPI callouts are allowed as pure typography + a single decorative bar,
additive to the page's chart budget, never a substitute for it — see
`RESEARCH.md` §5.

**Rework trigger:** a dashboard delivery that reads like a marketing
landing page.

## 10. Chart-count discipline

One chart carries one independent conclusion. Chart count follows the
number of distinct findings, not the amount of data available:

| Request | Default count |
|---|---|
| One question / one metric | 1 |
| Two or three explicit findings | 2–3 |
| Full article / paper / complete case | 4–6 |
| User specifies a count | Honor it, but still drop duplicate findings |

Six charts is the soft ceiling for a single page; beyond that, split into
sections or multiple pages. Within one batch, do not repeat the same
`chart_id` and do not let more than one dark card appear per four-card
screen.

## 11. Contrast audit (reference table)

Computed against the actual token hex values (relative-luminance WCAG
formula). Use this table when deciding whether a text role is safe for a
given use.

| Pair | Ratio | AA text (4.5:1) | AA large/UI (3:1) |
|---|---:|:--:|:--:|
| Mono `INK` / `PAPER` | 14.83:1 | pass | pass |
| Mono `MUTED` / `PAPER` | 2.86:1 | fail | fail |
| Mono `FAINT` / `PAPER` | 1.50:1 | fail | fail |
| Mono `GRID` / `PAPER` | 1.18:1 | fail | fail (exempt as decorative hairline, WCAG 1.4.11) |
| Porcelain `TXT` / `BG` | 13.86:1 | pass | pass |
| Porcelain `DATA` / `BG` | 6.67:1 | pass | pass |
| Palm `TXT` / `BG` | 8.34:1 | pass | pass |
| Palm `DATA` / `BG` | 6.68:1 | pass | pass |
| Wire `HERO` (orange) / `BG` | 2.93:1 | fail | fail (marginal) |

Rule of thumb from this table: **never put load-bearing numeric labels in
`FAINT`, `GRID`, or Wire's orange `HERO` on light backgrounds.** Those
roles are for decoration and single-glance accents only.

## 12. Extending the system (natural-language workflow)

See `SKILL.md` §7 for the full step-by-step. In brief: new chart requests
go through data-contract classification → nearest-neighbor check against
`catalog/charts.json` → either reuse or a logged "new chart_id" proposal
that inherits tokens from `mono-tokens.js`/`color-presets.json`, cites its
nearest relative, and is validated against this file's rules before being
added to the catalog. Nothing gets added to the catalog without passing
`npm run validate`.
