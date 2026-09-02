# Design Research: What Lieflat Charts Actually Does

Deep-research notes on the source project's visual language, statistical
integrity, and engineering posture. This is the evidence base for
`PRINCIPLES.md` (the distilled rulebook Navi Chart ships) and for the ADRs
in `docs/adr/`. Every claim here is either read directly from source, a
computed number, or explicitly marked as inference.

Source: `larashero3-dotcom/lieflat-charts` @ `4eef5ce` (2026-08-19), forked
into this repository. All file paths below are relative to repo root.

---

## 1. What the project actually is

Lieflat Charts is not a chart-type library. It is a **visual grammar** —
one shared vocabulary of color, type, shape, motion, and annotation —
applied consistently across 64 chart implementations (`catalog.md`) and 12
full-page report layouts (`report-catalog.md`). The mechanism that keeps
64 charts feeling like one family, rather than 64 unrelated demos, is a
single shared token file (`mono-tokens.js`) plus a hard rule: **generate by
copying the nearest real gallery implementation, never by inventing a
fresh one from a prompt.** SKILL.md §0 makes this a hard constraint, not a
suggestion — sections 1–5 require citing the exact gallery file and card
title used as the structural donor for every delivered chart.

This is the single most important architectural fact about the source
project, and it is why the "taste" holds up across 64 different chart
types: **taste is enforced by reuse, not by restating rules for each new
chart.** A design system with 64 independently-prompted chart generators
would drift within a dozen charts. This one doesn't, because there are
only 64 *fixed* implementations and the agent's job is data substitution
plus disciplined new-chart authoring when nothing fits (§6, "translation
workflow").

## 2. The Mono grammar (the actual visual system)

Source of truth: `mono-tokens.js:11–33` (color), `:35–48` (type),
`:50–56` (shape), `:58–78` (motion), `:151–172` (card skeleton).

### 2.1 Color as encoded data, not decoration

Two extremes and a seven-step ladder between them:

| Token | Hex | Role |
|---|---|---|
| `INK` | `#1C1C1A` | Highest-priority data, headlines |
| `PAPER` | `#F0EFEB` | Background, and "ink" on dark cards |
| `MUTED` | `#8F8E88` | Secondary text, subtitles |
| `FAINT` | `#C6C5BF` | Source line, minor ticks |
| `GRID` | `#DEDDD6` | Gridlines, hairlines |
| `L` ladder | 7 steps, `#1C1C1A`→`#D8D7D1` | Multi-series rank by importance |

The rule that makes this a data system rather than a palette: **lightness
encodes rank**. The most important series is always the darkest step, not
the first color in an array. `mono-tokens.js:19` names this a "ladder,"
and the SKILL.md hard-rules (§2) make deviation a rework trigger: "多系列按重要性沿
ladder 分配，不按顺序随便拿" — assign by importance along the ladder,
never by list order.

Measured contrast (WCAG relative-luminance formula, verified independently
— see `docs/design-language/PRINCIPLES.md` §Contrast Audit for the full
table):

- `INK` on `PAPER`: **14.83:1** — far exceeds AA (4.5:1) for any text size.
- `MUTED` on `PAPER`: **2.86:1** — fails AA for body text (4.5:1) and
  fails the large-text minimum (3:1) only marginally; acceptable only
  because it is used exclusively for subtitles the eye is not required to
  parse letter-by-letter, but this is a real accessibility ceiling, not a
  false alarm.
- `FAINT` on `PAPER`: **1.50:1** — fails every WCAG text and non-text
  threshold. This token is used for the small-caps "source line" at the
  bottom of every card (e.g. `templates/lupi-gallery.html:65`,
  `"LAUNCH FAN · MONO-EDITORIAL · PRODUCT ANALYTICS"`). It is legible on a
  calibrated monitor at full size but will fail any automated accessibility
  audit and will be difficult for low-vision readers. This is the single
  most concrete, fixable contrast gap in the source system (tracked in
  ADR-0006).
- `GRID` on `PAPER`: **1.18:1** — below the 3:1 non-text-object minimum,
  but WCAG 1.4.11 explicitly exempts "a particular presentation of
  graphics" where low contrast is essential to the design (faint hairline
  grids are a recognized exception class); still worth a documented
  decision rather than silence.

**Emphasis discipline**: every accent system in the repo (Wire's orange
`HERO`, Palm's amber, Porcelain's deep blue) enforces "one hero per chart."
`color-presets.js:150` states it directly: *"每张图只给一个元素" — the second
accented element cancels the first.* This is the same principle as
`claude-design`'s "one focal point" doctrine, arrived at independently by
a different design practice, which is a good sign it is a durable rule
rather than local house style.

**Solid fills, no gloss.** `mono-tokens.js` hard rules ban glow, gradient,
glassmorphism, and drop shadow outright (SKILL.md §2: *"一律实心：不透明材质、不发光、
不渐变滤镜、无阴影"*). The one documented exception is semantically
load-bearing, not decorative: in Radial Patchwork (L10), overlapping
wedge opacity **is** the encoded density variable, not a texture choice.
That distinction — opacity is either data or it is banned — is a cleaner
rule than most design systems manage.

### 2.2 Typography as a four-slot contract

Every chart, regardless of engine (hand SVG, Chart.js, ECharts), uses the
same four-part card anatomy (`mono-tokens.js:151–157`):

1. **h2 — a conclusion, not a chart-type label.** SKILL.md is explicit
   that "Revenue by plan" passes and "Bar Chart" fails; the aspirational
   version is a title with a judgment in it, e.g. "Where we gained, where
   we bled" (`templates/glance-gallery.html:119`). This single rule does
   more to prevent generic-feeling output than any color or shape rule,
   because it forces the agent to have identified the chart's point before
   drawing it.
2. **sub — legend and time range folded into one line**, separated by
   `·`. This is where the "honest units" commitment surfaces in text: e.g.
   `"one dot = one person in a hundred · 38 + 34 + 16 + 12 = 100"`
   (`examples/lenny-2026-survey.html:158`).
3. **The mark itself** — SVG/canvas/ECharts container.
4. **src — small-caps, letter-spaced, all-caps source line**, always
   `TEMPLATE NAME · SYSTEM · SOURCE`. This slot is metadata as furniture:
   it makes every chart look like it came from a system with a citation
   discipline, whether or not the underlying data really has one.

Font: Inter throughout, weight is the only lever (700 titles / 800 in-chart
numerals / 600 axis labels / 400 body). Minimum SVG font sizes are
codified, not left to "looks fine": 6.5px on half-width cards, 5.5px on
full-width — anything smaller must move to hover rather than shrink
further (`mono-tokens.js:46-47`).

### 2.3 Shape and motion as restraint, not flourish

- 24px card radius, no border, no shadow — cards are separated by
  whitespace alone (`mono-tokens.js:52`, `CARD_CSS`).
- Bar ends are capped with a full pill radius (99px) rather than a small
  corner round — this reads as "ledger tally," not "rounded-corner SaaS
  card," and is one of the more distinctive, deliberate shape choices in
  the system.
- Animation timing is a fixed, small vocabulary — `quarticOut`, 900ms
  standard / 1200ms for large or relational marks, 8–15ms dot stagger,
  80–130ms bar stagger — not per-chart tuning. `elasticOut` (bounce) is
  reserved for exactly one motif (wave entrances) and is explicitly
  forbidden elsewhere (`mono-tokens.js:58-63`).
- Every chart is `IntersectionObserver`-gated (draw-on-scroll) with
  click-to-replay, and every chart respects
  `prefers-reduced-motion` by disabling the CSS animation classes
  (`mono-tokens.js:74-77`). This is applied with, as far as the repo's own
  validator checks, 100% coverage — `scripts/validate.mjs` does not check
  this, but manual grep across the templates in this research pass found
  the media query present in every gallery, report, and color-preset file
  inspected.
- Determinism is a hard constraint, not a nicety: `rnd(i,k)` is a fixed
  integer-hash pseudo-random function (`mono-tokens.js:90`), and
  `scripts/validate.mjs:278-280` fails the build if `Math.random()` appears
  anywhere in a shipped file. The stated reason — screenshots, recordings,
  and diffs must be stable across reloads — is a real engineering
  requirement this project takes more seriously than most chart libraries
  do.

## 3. Two reading speeds, not one house style

The source project's actual design insight — the thing worth preserving
above any individual token — is that it ships **two distinct visual
grammars for two distinct reading contracts**, sharing one palette:

| | Lupi (editorial) | Glance |
|---|---|---|
| Atomic unit | one record | one shape |
| Line weight | 0.5–0.7px hairline | 2px+ |
| Aggregation | resisted — raw units shown | pre-aggregated |
| Target read time | 30s+ | <10s |
| Engine | hand-written SVG | Chart.js / ECharts |
| Occasion | annual report, long-form article | weekly report, dashboard |

**Default order is Lupi Editorial → Lupi Basics → Glance**, and Glance is
explicitly framed as a *downgrade path requiring justification*, not a
parallel first choice (SKILL.md §0, rule 4: agents must record why Lupi
and Basics failed before using Glance). This inverts the usual chart-tool
default (bar chart first, fancy stuff later) and is the project's most
opinionated, most defensible position: it refuses to let "3-second
readability" be the default posture for content whose actual audience has
30 seconds and deserves the extra density.

**Lupi Basics is the unsung middle layer.** It exists specifically to
answer "I don't have enough data for editorial density, but Glance would
throw away structure I want to keep" — familiar bar/line/donut silhouettes
rebuilt so that, up close, every visual unit is countable (1 tick = 1
person, 1 rung = $1k). SKILL.md's small-data guidance (§3) is unusually
good on this point: it explicitly rejects "not enough data → default to
Glance" and instead teaches *unit decomposition* — turn a handful of
percentages into 100 honest dots, and disclose in the subtitle what a dot
represents. This is the strongest single piece of "taste" logic in the
whole spec, because it is a general technique (works for almost any small
dataset) rather than a chart-specific trick.

## 4. Statistical and perceptual integrity

This section evaluates whether the visual system's honesty claims hold up
under inspection, not just under narration.

**What holds up:**

- **No broken bars.** SKILL.md explicitly bans truncated y-axes on bar
  charts and gives three honest alternatives (let the extreme value tower,
  add an inset magnifier, or cut the bar visibly with a break glyph while
  keeping the axis intact). This is a correct, textbook-consistent
  position (axis truncation on length-encoded marks is one of the most
  common real-world chart-honesty failures).
- **Rounding is disclosed, not hidden.** The Lenny survey example
  (`examples/lenml-2026-survey.html`, script comment at the AI-identity
  chart) sums five rounded percentages to 98 rather than 100 and states in
  the footer *"rounding ate the other two"* instead of quietly padding a
  category to force the total. That is a specific, correct, and easy-to-
  skip honesty practice worth codifying as a hard rule (see
  `PRINCIPLES.md`).
- **Area encoding uses `sqrt(value)`, not raw value**, in every location
  checked (Launch Fan dot radius, Bubble Almanac, Dot Heat, Calendar Heat,
  Force Graph node size) — the correct transform for area-proportional
  perception (Stevens' power law says apparent area should track actual
  area at exponent ≈1, so radius must scale as √value, which is what the
  code does).
- **Geographic honesty on choropleths.** Both map templates state the
  caveat directly in the subtitle — *"shade = value"* / *"面积是地理面积，不代表数值"*
  — heading off the single most common map-chart misreading (large
  land area implying large data value).

**What is a real, underdocumented tradeoff — not a bug, but worth naming:**

- **Minimum-size floors distort the ratio they claim to encode.** Several
  dot/area encodings add a legibility floor on top of the `sqrt(value)`
  term (a fixed pixel offset so the smallest mark stays clickable/visible)
  — e.g. Dot Heat's cell marks. Measuring the actual rendered radius
  formula against nominal data values in this research pass, a 4:1 value
  ratio produced roughly a 2.5–2.9:1 area ratio in the affected
  encodings, not the theoretically "honest" 4:1 that pure `sqrt` scaling
  implies. This is a defensible design decision — a truly zero-size mark
  for near-zero values is worse than a slightly oversized one, and every
  bubble-chart library makes some version of this tradeoff — but the
  source project does not disclose it anywhere. **Recommendation carried
  into `PRINCIPLES.md`: when a floor is applied, either keep it small
  enough not to materially change the visible ratio, or disclose it in
  the subtitle exactly the way rounding loss is disclosed.**
- **OHLC/candlestick, box plot, calendar heat, parallel coordinates, and
  stream ribbon are all correctly classified as "backup, no primary
  encoding exists"** rather than being force-fit into the primary Lupi
  vocabulary. This is good taxonomy hygiene: the spec resists the urge to
  claim every chart type is 100% covered by the primary 28, and instead
  names the five specific data shapes where a backup chart is used
  *without* first disproving the primary set (SKILL.md §0.3.2). That is a
  well-designed escape hatch — narrow, named, justified — rather than a
  vague "when nothing else fits" clause.

## 5. Report layer: the same grammar at page scale

The 12 report templates are not just larger charts — they are a second,
consistent layer of taste applied to typography *pairing* and page
*architecture*, which the individual charts don't need to solve:

- **Serif + sans pairing for editorial reports.** R01 (Survey One-Pager)
  pairs Source Serif 4 (headlines, decks) with Inter (data, UI chrome),
  explicitly citing WARC's "Health of Creativity" report as a *typography
  and rhythm* reference — never a layout or color reference
  (`templates/reports/report-01.en.html:10-15`, in-file comment). This is
  the correct way to use an external reference: extract a principle
  (serif authority + sans precision), not a literal layout.
- **Fixed canvas, deliberate non-responsiveness.** Reports use a fixed
  pixel canvas (760–1080px, or a locked 600×1000 social card for R11) and
  scale the whole sheet down via `zoom` on narrow viewports rather than
  reflowing content into a single mobile column
  (`templates/reports/report-01.en.html`, `fit()` function). The in-file
  comment states the reasoning outright: *"报告是一张版面，不是响应式网页"* — a
  report is a page, not a responsive website; shrinking to fit preserves
  the composition the way a PDF "fit to width" does, where reflowing would
  produce a layout nobody designed. This is a real, deliberate, and
  reasonable tradeoff against strict WCAG 1.4.10 Reflow — documented here
  and in ADR-0006 rather than silently accepted or silently "fixed" by
  breaking the report metaphor.
- **KPI furniture earns its keep.** Sidebar stat blocks (dashed border,
  large number top-right, two-segment bar beneath) are pure typography and
  a single decorative bar — not a second chart competing for the page's
  chart budget. This matches `claude-design`'s "monument stat" anti-
  pattern warning *only when the number replaces real chart content*; here
  it is additive, one per page, and doesn't crowd out the actual data
  visualizations, which is the difference between a KPI callout and
  dashboard slop.
- **Report selection is a first-class decision, not a skin choice.**
  `report-catalog.md` requires comparing at least 3 candidate templates by
  content structure, density, and reading speed — the same discipline the
  chart catalog requires for individual charts — before locking a report
  template. Template *names* ("Travel Notebook," "Monthly Ops") are
  explicitly non-binding on content *type*; the spec insists on judging by
  structure, not by the industry the name suggests.

## 6. Anti-AI-slop self-audit

Running the `claude-design` ten-tell slop diagnostic against the source
system's own house style (not against any single generated artifact):

| Tell | Present in the system's own rules? |
|---|---|
| Tech gradient | Explicitly banned (`SKILL.md` §2) |
| Generic tech hue (indigo/violet default) | Palette is warm paper/ink or one of 3 curated presets, never an unexamined default blue |
| Feature-tile grid (icon+heading+sentence ×3) | Not part of the chart or report vocabulary; reports lead with one claim per section |
| Accent rail (colored left strip as fake structure) | Not used; hierarchy comes from weight/lightness, not decoration |
| Unearned blur / glassmorphism | Explicitly banned |
| Monument stat crowding out real content | Guarded against by the "one dot = one X" unit-decomposition discipline |
| Icon topper above every heading | Not used anywhere in the 64-chart catalog |
| Center-stack default composition | Actively rejected — the "surface" is chosen per occasion (Monitor for dashboards, Decide/Learn for reports) before any visual token is picked |
| Default type (Inter/system-ui by default) | Inter is a *deliberate, singular* choice (weight-only hierarchy, not "whatever the framework shipped"), which is a different thing from lazy default type — still worth flagging that the system never explores other faces |
| Wrong-surface composition | The Lupi/Basics/Glance split *is* a surface-aware default; the system will not put a marketing hero on a Monitor surface |

Score: this system was already built by someone actively avoiding the
exact failure modes `claude-design` catalogs, months before that skill's
audit vocabulary existed. That is strong independent validation that the
underlying taste is sound and worth preserving rather than reinventing.

## 7. Security, dependency, and maintainability findings

- **`chart.js@4.5.1` and `echarts@6.1.0`** (the versions the CDN "@4" /
  "@6" floating tags currently resolve to) have zero known OSV
  vulnerabilities as of this research.
- **`echarts@4.9.0`** — pinned specifically as the source of the world
  map GeoJSON asset in `templates/maps-gallery.html:144` and its three
  color-preset copies — has one published advisory,
  `GHSA-fgmj-fm8m-jvvx` (XSS in the Lines-series tooltip renderer, fixed
  in 6.1.0). The actual exploit surface here is low (the URL only serves
  static GeoJSON, not the vulnerable script), but pinning a CVE-flagged
  version string into four file paths is bad hygiene that will trip any
  automated dependency scanner. **Fixed in this fork**: echarts stopped
  bundling map GeoJSON from v5 onward (confirmed by probing the jsdelivr
  CDN directly — `@6.1.0`, `@5.6.0`, and `@5.0.0` all 404 on that path),
  so the file is now vendored at `assets/geo/world.json` and all four map
  templates fetch the local copy instead. See
  `docs/design-language/UNKNOWNS.md` U2 and ADR-0006.
- **No Subresource Integrity (SRI) hashes** on any CDN `<script>` tag.
  This is a deliberate tradeoff (floating major-version CDN URLs are
  incompatible with exact-byte SRI hashes) rather than an oversight, and
  is documented as an accepted risk in ADR-0006 rather than silently
  fixed by pinning exact patch versions (which would reintroduce a
  version-drift maintenance burden the source project was clearly trying
  to avoid).
- **Canvas charts (Chart.js) carry no accessible fallback.** A direct
  browser probe of `templates/glance-gallery.html` found zero
  `aria-label`/`role` attributes and zero focusable elements on any
  `<canvas>` — meaning every Glance chart rendered via Chart.js is
  invisible to a screen reader and unreachable by keyboard. Hand-written
  SVG charts fare much better: they carry native `<title>` tooltips via
  the shared `tip()` helper (`mono-tokens.js` pattern, used throughout
  `lupi-gallery.html` and `basics-gallery.html`), which is a real (if
  minimal) accessible-name mechanism SVG gets for free and canvas does
  not. This asymmetry is the most concrete, fixable accessibility gap in
  the source system and is addressed in `PRINCIPLES.md` §Accessibility
  and ADR-0006.
- **No build tooling existed upstream** — no `package.json`, no CI, no
  automated cross-check between `catalog.md`'s chart IDs and the gallery
  files' internal comments. A community PR (`#11`,
  *"CJK font fallback, styled SVG tooltips, catalog↔gallery validation +
  CI"*) proposed exactly this kind of validation and was never merged.
  Navi Chart's TypeScript tooling (`scripts/validate.ts`) picks up that
  exact gap.
- **Naming drift between catalog and gallery comments.** `catalog.md`
  numbers the Basics family `F1`–`F17`, but the HTML comments inside
  `templates/basics-gallery.html` still use legacy internal shorthand
  (`<!-- B1 · rung bars -->`, `<!-- C1 · tick rows -->`) for the first 13
  entries — a residue from before the family was renamed. Retrieval by
  card title still works (that's how the spec tells agents to search), so
  this never broke a human workflow, but it will break any tool that
  cross-references IDs literally. Navi Chart's machine-readable catalog
  (`catalog/charts.json`) records both the canonical ID and the legacy
  gallery anchor so tooling doesn't have to guess.
- **README template-count table was stale relative to the catalog** after
  the last three PRs (`b8e9e2b` color presets, `80b3701` report mode,
  `4eef5ce` 16 new charts). The catalog and the narrative prose in the
  README were both updated; the summary *table* was not — it still read
  Lupi Editorial 15 / Lupi Basics 13 / Glance 18 against an actual count
  of 20 / 17 / 22. This is exactly the kind of drift a generated-docs
  pipeline prevents structurally rather than by remembering to update a
  table by hand — which is why Navi Chart generates `catalog.md`,
  `report-catalog.md`, and the README counts table from
  `catalog/charts.json` rather than hand-maintaining prose that has to
  agree with a separate source of truth.

## 8. Upstream evolution (why the system looks the way it does)

Confirmed from `git log` against the fork point (`4eef5ce`, 41 commits,
first commit `d398ce9` on 2026-07-16):

1. **2026-07-16 — Initial release.** Mono-only, 48 charts across three
   families (Lupi, Basics, Glance), no color, no reports.
2. **2026-08-05/06 (`v1.1.0`) — Color mode.** Added the three built-in
   presets (Porcelain/Palm/Wire) and the custom-palette workflow, driven
   by a community PR (`#3`) rather than the original author.
3. **2026-08-13/14 (`v1.2.0`) — Report mode.** Added the 12 full-page
   report templates, bilingual from day one, and — in direct response to
   a Chinese-language issue asking for a financial-report preset — the R04
   financial worked example.
4. **2026-08-19 (current `HEAD`, unreleased) — 16 new chart types.**
   Extended every family with its "backup tier" entries (L16–L20,
   F14–F17, G19–G22, plus the two Maps chart types), bringing the catalog
   from 48 to 64. This is the point where the README's summary table
   quietly fell out of sync (§7 above).

No `CONTRIBUTING`, `NOTICE`, or `AUTHORS` file exists upstream, and the
`LICENSE` file has never been revised since the initial commit — it
carries the raw PolyForm Noncommercial 1.0.0 text with no
"Required Notice: Copyright ..." line filled in. That absence is itself
useful information: the upstream project never asserted the specific
copyright-notice format PolyForm's own template recommends, so this fork
carries the license and third-party notices forward unmodified rather
than inventing a notice line that was never established upstream (see
ADR-0001).
