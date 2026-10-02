---
name: navi-chart
description: A template-driven data-visualization and report-generation skill. Generates HTML charts strictly from the real implementations in the Lupi, Basics, Glance, and Maps galleries, and generates publishable HTML reports from 12 bilingual (Chinese/English) full-page report templates. Mono grayscale is the floor; the skill automatically selects a built-in color preset when the data semantics call for one, and also supports a user-supplied custom palette. Maps activate only on explicit user request. Never mix color systems within one delivery.
---

# Navi Chart — A Codex of Chart Taste

Navi Chart is a data-visualization and report-generation skill built to the Agent Skills format. Mono grayscale is the floor; it also automatically selects a built-in color preset when the data semantics and occasion clearly call for one. Navi Chart is a fork of [`lieflat-charts`](https://github.com/larashero3-dotcom/lieflat-charts) (originally built at [moxt.ai](https://moxt.ai)) — see [`PROVENANCE.md`](PROVENANCE.md) for what changed and why, and [`docs/design-language/RESEARCH.md`](docs/design-language/RESEARCH.md) for the evidence-based reverse-engineering of the visual system this skill preserves. It supports Lupi (editorial narrative), Glance (fast-read judgment), Basics (editorial basics for sparse data), Maps, standalone interactive big charts, and the 12 bilingual full-page report templates catalogued in `report-catalog.md`. Give it data and an occasion; you get a build-free, double-click-to-open single-file HTML chart or HTML report. Pure-SVG charts run fully offline; charts using Chart.js, ECharts, map GeoJSON, or web fonts need a network connection unless those dependencies are inlined. **The default output is a chart, not a report: given only data, or a request to "visualize / analyze this data / make a chart or two" with no explicit delivery format named, you must produce chart mode. Report mode only activates when the user explicitly asks for a full narrative deliverable** — "report / annual report / monthly report / whitepaper / survey one-pager / poster / brief / notebook / dashboard report," etc. In chart mode you **must audit Lupi Editorial and Lupi Basics first; Glance is only allowed once neither has a suitable template, or the user explicitly asks for Glance / a dashboard / a three-second read. Maps only activate when the user explicitly asks for a map or geographic breakdown.**

Color doesn't need an explicit user trigger. §6.5 below governs the automatic choice between Mono and the three built-in `color-presets.js` schemes; when the user gives an explicit brand color or custom hex values, you may build a custom palette for that delivery. One HTML file, or one delivered set, locks to exactly one color system — never mix systems. Re-skinned samples live in `templates/color/`.

**How to find the reference code for a chart**: look it up in the catalog (`catalog.md`, generated from `catalog/charts.json`) → open the matching gallery file → find the `<div class="card">` block by its card title → search the `<script>` for the matching `// ════` comment block to get the rendering code. Never copy a whole gallery page — a gallery file is a multi-card sheet; what you deliver to the user is always a single-chart file assembled from the §9 skeleton.

**The target user is not a programmer** (writers, ops people, anyone building a deck). They speak in plain language ("visualize this quarter's conversion for our newsletter"), not chart-type names. Your job is to translate plain language into the correct chart — one good-looking enough to publish as-is.

---

## 0. Output Mode and Template-First Hard Constraints

### 0.1 Decide the output mode first

- **Default: chart mode.** If the user only gives data, or says "visualize this data / analyze this data / make a chart / make a few charts / build a chart page / illustrate this deck," produce a chart or chart page. Absent report keywords, never reach for R01–R12 on your own, and never upgrade to report mode just because the data is rich or the user said "analyze."
- **Report mode.** Only when the user explicitly says "generate a report / report template / annual report / monthly report / whitepaper / survey one-pager / poster / brief / notebook / dashboard report" etc. do you read `report-catalog.md` and pick R01–R12 by report type, content structure, canvas, density, reading speed, and language. The scenarios listed in the catalog are recall cues, not hard restrictions on the template.
- **When ambiguous, still default to chart mode.** If the user says "analyze" without explicitly requesting a report, deliver the strongest single chart, or 2–3 evidence charts; you may note in prose "let me know if you'd like a full report," but do not generate one unprompted.
- **Report mode is not "draw more charts."** A report template fixes the whole-page structure; the charts inside it must still obey `catalog.md` and this file's chart rules.
- Report templates ship in two versions, `.zh.html` and `.en.html`. When Chinese is selected, output defaults to Taiwan Traditional Chinese (`zh-Hant-TW`), including titles, subtitles, labels, source lines, alt text, and report copy. A generic `zh` tag must not be used as the default; use Simplified Chinese only when the user explicitly requests it. Use Taiwan wording where it matters (for example, `資料`, `使用者`, `網路`, `軟體`, `程式碼`, `檔案`, `專案`, `預設`, and `營運`). When the user doesn't specify a language, follow the language of their input; never mix Chinese and English content within one version.

The following rules are not suggestions — violating any one of them requires rework:

1. **Must be generated from the repo's templates.** Every finished chart first locks a chart-type number in `catalog.md`, then opens the matching gallery's real implementation: Lupi uses `templates/lupi-gallery.html`, Basics uses `templates/basics-gallery.html`, Glance uses `templates/glance-gallery.html`, Maps uses `templates/maps-gallery.html`, interactive big charts use `templates/big-*.html`. Colored charts still use these original templates as the structural source of truth; `templates/color/` is only for looking up color values.
2. **Must reuse the chosen template's code skeleton.** Start from the `<div class="card">` matching the card title and the `// ════ <chart name> ════` comment block with the same name; keep its core SVG/Canvas/ECharts structure, data-encoding method, proportions, and animation rhythm. You may swap data, title, annotations, source, and necessary layout; you may not draw a "looks similar" chart independent of the template, splice structural elements from multiple templates into one hybrid chart, or fall back to a plotting library's default styling.
3. **The default selection order is fixed.** Fully audit Lupi Editorial (L1–L19) first, then Lupi Basics (F1–F17). If either group has a template that can honestly carry the data, fit its labels, and stay readable, you must choose from these two groups. Maps never enter this default chain — they're checked separately, only on explicit request.
   3.1 **Within these two groups, there's a primary and a backup tier.** Primary is **L1–L15 and F1–F13** — default here. Backup is **L16–L20, F14–F17, G19–G22** — use these only when nothing in primary can honestly encode the data, and state in writing which primary candidates you checked and why each failed. "The newer chart looks nicer/more professional" is not an acceptable reason. The one exception is §3.2 below.
   3.2 **Five data shapes go straight to a backup chart without first disproving primary** — because primary has no honest encoding for them, and forcing one produces a wrong chart: OHLC four-value price series → F17 Candlestick; five-number summary + outliers → F15 Tick Box; the same entity across 3–6 continuous dimensions → L20 Parallel Coordinates; a full year of 52-week × 7-day date density → L17 Calendar Heat; multi-series composition changing over continuous time where you also need the running total → F16 Stream Ribbon. Outside these five, every backup chart follows §3.1.
4. **Glance is a default fallback, not a co-equal first choice.** Use Glance only once both Lupi Editorial and Lupi Basics fail to fit, or the user explicitly asks for Glance, a dashboard, monitoring, a weekly report, or a three-second read. Before downgrading, state in writing the specific reason Lupi/Basics didn't fit.
5. **Inventing outside the library is the last resort.** Only when Lupi, Basics, Glance, and the interactive templates all fail to carry the data do you go to the §6 translation workflow — and even a new chart must inherit the visual grammar and code structure of the nearest gallery template.

## 1. Workflow (every request goes through these six steps)

1. **Diagnose the data shape.** Don't ask the user what chart they want — look at what their data actually is: a comparison across a few categories? A time series? A proportion? Values with positive/negative sign? A many-to-one grouping? A network? Record-level distribution? Shape is the primary key for chart selection.
2. **Audit primary first, backup only if needed.** By data shape, scan primary L1–L15 and F1–F13 candidates, comparing at least 3 (list all of them if fewer than 3 exist). Compare semantic fit, unit honesty, label capacity, reading speed, narrative tension, and duplication within this batch. Only scan backup L16–L20/F14–F17 once every primary candidate fails, and state which primary candidates you checked and why each failed (§0.3.1). When the data shape hits one of the five §0.3.2 shapes, go straight to the matching backup chart.
3. **Only check Glance when necessary.** Scan the 20 Glance candidates (G3–G22) only once every Lupi and Basics candidate has failed, or the user explicitly asked for Glance/dashboard/monitoring/weekly-report/three-second-read. When you choose Glance, record why Lupi and Basics couldn't carry the data — "Glance is more intuitive" alone is not an acceptable reason. When the user explicitly asks for a map, jump straight to Maps (M1–M2); never mix Maps into the normal candidate pool.
4. **Lock the real template, then compose the page.** Every chart must record its family, chart-type number, gallery file, and card title, and use that card's real structure and rendering code as its skeleton. Never plan "this page needs to say six things" and then invent chart types to match — page-level narrative can only be organized after every template is locked.
5. **Assemble the batch by the chart-count rule.** One chart carries one independent conclusion; after removing duplicate conclusions, size the batch by the default ranges in §1.2. Distribute templates across the whole batch: no repeats, no stacking the same silhouette, no padding the count just to fill space.
6. **Render from the template and self-check** (§0, §2, §3, §8). Check line by line that the finished piece still traces back to the chosen gallery implementation — changing the data must never swap out the template's core geometry, encoding, or motion. Choose Mono or a color preset for the whole delivery per §6.5; library-external chart types go through the §6 translation workflow.

### 1.1 Report-mode workflow

1. Read `report-catalog.md`, compare at least 3 candidate reports, and record why each rejected candidate didn't fit. Choose by content structure, information density, canvas, and reading speed — never treat the template's name as an industry restriction; e.g. "Travel Notebook" can carry sports or personal-life data just as well as travel data, and "Monthly Ops" can carry a financial or business report.
2. Lock one language version and one report template file; never splice two report templates' layouts together.
3. First distill the page's main conclusion, supporting-evidence conclusions, context, and sources — then assign them into the template's existing title, deck, KPI, chart, annotation, and closing slots.
4. Select each chart slot independently against `catalog.md`, preferring real Lupi/Basics implementations; the report template's layout is never an excuse to bypass the chart data contract.
5. Copy the full HTML of the matching report template as your starting point; only replace data, copy, sources, legends, language, and necessary modules. Never keep demo data, demo sources, moxt.ai links, or the template's original conclusions.
6. A report page's color system is locked to whatever the template currently uses; if the user explicitly asks for a color change, replace it uniformly across the whole page with Mono, a single built-in preset, or a complete custom palette — never mix locally.
7. Extra pre-delivery checks for report mode: the canvas size hasn't drifted, section order still holds, the number of charts on the page is evidence-supported, fixed-size templates don't overflow, and Chinese fonts plus their English fallback stay readable.

### 1.2 Chart-count rule

The number of charts is driven by **the count of independent conclusions**, not by how many data columns exist, and there's no fixed default of 5 or 6:

| Request type | Default output count | Rule |
|---|---:|---|
| One question / one table / one metric | 1 | Deliver only the strongest single chart — don't pad it out to show off templates |
| Two or three explicit conclusions | 2–3 | Each chart carries a different conclusion; they may share the same data source |
| A full article, paper, or complete case | 4–6 | Cover different data shapes — overview, composition, comparison, relationship, or change |
| User states an explicit count | Honor it | Still drop duplicate charts; if the data can't support the count, say so and deliver fewer |

- The soft ceiling for one page is **6 charts**; beyond that, split into multiple pages or sections.
- Candidate sketches or Glance/Lupi comparison drafts don't count toward the final chart count — they're part of the selection process, not the delivered batch.
- A multi-chart page must keep at least one overview conclusion; every other chart must add a new comparison dimension, relationship, change over time, or supporting detail.
- If two charts express the same conclusion, keep only the one whose reading occasion and data contract are the more honest fit.

## 2. Mono Grammar · Hard Rules (violation requires rework)

Default reference is `mono-tokens.js` (inline its contents into the HTML for open distribution). Where a value conflicts with a token, the token wins. Going color, only the color tokens change — typography, radius, layout, and animation still follow `mono-tokens.js`.

**Color**
- The default palette has two poles only — paper `#F0EFEB` and ink `#1C1C1A` — with a 7-step gray ladder between them. Color is the exception, and starts from a preset per §6.5.
- **Lightness encodes rank**: the most important series is always the darkest step (inverted to the lightest on a dark card). Assign multi-series colors along the ladder by importance, never by arbitrary list order.
- **Everything is solid.** No opaque-but-glossy materials, no glow, no gradient filters, no drop shadow. Texture comes entirely from lightness contrast and shape. The one exception: in overlaid charts (Radial Patchwork), opacity itself encodes density — that's data, not decoration.
- Dark cards (`.card.dark`) are reserved for exactly two chart shapes that genuinely need a dark ground to read (petal, or a glowing-feeling thread/network). Default to light cards; at most one dark card per four-card screen.

**Typography**
- Inter throughout. Titles 700 / in-chart numerals 800 / axis labels 600. Every card has the fixed four-part anatomy: conclusion-style title (h2) + subtitle (legend and time range, separated by `·`) + the mark + source line (all-caps, letter-spaced).
- Titles state a conclusion, not a chart type: "Revenue by plan" passes, "Bar Chart" fails; better still, a title with a judgment in it, e.g. "Where we gained, where we bled."
- Minimum SVG font size: 6.5px on half-width cards, 5.5px on full-width. Anything that doesn't fit moves to hover — never shrink below the floor to force it in.

**Shape**
- 24px card radius, no border, no shadow — cards are separated by whitespace alone. Bar ends get a full pill-radius cap (round the top end on vertical bars, the outer end on horizontal bars).
- **Bars are never axis-truncated.** The bar's contract is length ∝ value; truncating the axis breaks that contract. For extreme values, use one of: ① let the extreme value tower above the frame (most honest), ② a main chart plus an inset magnifier, ③ a visibly torn bar with the axis left intact (state explicitly that it doesn't fit).
- The petal skin (thick black seams + rounded wedges) only suits an equal or near-equal radial split. Wide, uneven sectors occlude each other and hurt readability.

**Motion**
- Entrance animation defaults on, `quarticOut` easing — fast in, fast stop, no bounce (wave entrances may use `elasticOut`). Dot stagger 8–15ms/item, bar stagger 80–130ms/bar.
- One unified reveal mechanism: play on scroll-into-view, replay on click (`mono-tokens.js`'s `obsReveal`, with timer cleanup).
- Must degrade under `prefers-reduced-motion` (already built into the token CSS).
- **Motion must never outrank structure**: if an effect needs a brand-new layout just to have somewhere to live, it doesn't earn a place (the `effectScatter` lesson).

**Data**
- Demo data uses the token's deterministic pseudo-random `rnd(i,k)`; `Math.random()` is banned — a refresh must render identically.
- Values and visuals must be strictly proportional. Area encodings scale radius by `Math.sqrt(v)`; never use the raw value as a radius directly.

## 3. Division of labor between the two style families

Under the same Mono palette there are two distinct worldviews; which one you pick depends on the **occasion** and **how many seconds the reader is willing to spend**:

| | Glance family (20 charts) | Lupi family (close reading, 19 charts) |
|---|---|---|
| Atomic unit | shape (thick bar, big arc, block of color) | record (one dot = one row of data) |
| Line weight | 2px+, confident | 0.5–0.7px hairline |
| Aggregation | pre-aggregated, states the conclusion | resists aggregation, lays out the raw material |
| Reading contract | glance (<10s) | lean in and read (30s+) |
| Occasion | weekly report, dashboard, quick share | annual report, external story page, poster |
| Engine | Chart.js / ECharts | hand-written SVG |

**Default strategy: Lupi Editorial → Lupi Basics → Glance.** Without an explicit occasion, defaulting to Glance is forbidden. For an annual report, long-form article, poster, open-source README, or portfolio, start with Lupi Editorial; when data is sparser or a familiar silhouette fits better, move to Lupi Basics. Only enter the Glance candidate pool once both of the first two groups have no suitable template, or the user explicitly asks for a dashboard, monitoring, weekly report, or a three-second read.

**A full-candidate audit is not "make one of every chart."** First filter candidates down to ones that can encode the same underlying data, then split them by:

- **Semantically appropriate**: every point, line, area, or bead behind it has a real unit or an explicit aggregation basis.
- **Visually appropriate**: labels fit, density is sufficient, the reader can finish in the expected time.
- **Narratively appropriate**: the shape itself can carry the judgment this batch of data is meant to make, not just lay the numbers out.

The final choice is the intersection of all three — not "whichever template file is easiest to copy." The default audit happens entirely within Lupi Editorial and Lupi Basics first; only expand to Glance once both fail. When a batch needs multiple charts, do one more global pass across the candidates: no repeated templates, rotate shapes, at most one dark card, avoid a page where all six charts turn into similar rings or bars.

**Small data (just a handful of percentages) does not mean Glance-only.** The correct Lupi path is unit decomposition: spread an aggregate back into countable units (1 dot = 1 person / 1 percentage point) — density comes from the unit, not the record count. State the unit's meaning in the subtitle, and only spread honest units (percentages that sum to 100 → 100 dots is fine; don't invent individual records that don't exist). If rounding leaves the total short of 100 (e.g. 49.0+27.4+13.9+5.0+3.2 → 98), say so in the footer ("rounding ate the other N") — don't pad in a fake unit to force the total.

**Priority order for small data going the Lupi route (validated across many worked cases)**:
1. **Scan the whole set first, then pick the code skeleton** — Basics F1–F13 (`templates/basics-gallery.html`) is the Lupi vocabulary for sparse data: bar/line/area/donut/row/grouped/stacked/scatter/waterfall/heat/gauge/dumbbell/treemap. Editorial L1–L15 supplies record-level, unit-decomposed, relational, and annotated grammar. These two groups are primary — small data almost always lands here. F14–F17 and L16–L20 are backup, judged per §0.3.1/3.2. Don't pick an F chart just because `basics-gallery.html` has ready-made code for it.
2. **Start from the template closest to the actual data shape** — for multi-select percentages, compare L15, F5, L2 first; for 100% composition, compare L14, L5, F4, G4 first; for a funnel, compare L13 or the downgraded F1/F5 forms first. The basis for choosing is the encoding, not file order.
3. **Only invent a new one if the library genuinely has nothing matching that shape**, and any new chart must extend the gallery's existing grammar (hairline ticks, deterministic `rnd` jitter, paint-order glow, all-caps annotation) rather than importing an outside reference — "Lupi style" means the visual grammar of this gallery's charts, not Giorgia Lupi's own hand-drawn style.
4. A newly invented small-data chart needs its full **environment layer**: half of what makes the gallery look good is data-free furniture (ledger-paper ruling, dashed guide rails, rim ticks, a column grid every 10 units, annotation leader lines). Keep the data layer honestly sparse and spend the density budget on the furniture. A small-data chart with only the data plus one baseline will always look thin.

**Never repeat a template within one delivered batch (one page, multiple charts).** 19 Lupi charts is plenty to rotate through; when the same data could be carried by multiple templates, pick whichever hasn't been used yet in this batch.

## 4. Chart Decision Tree (data shape → candidates)

Numbers correspond to `catalog.md`. These are **recall candidates only** — the arrows and listed order do not encode priority. The actual choice must still follow: check every Lupi Editorial and Lupi Basics candidate first, confirm none fits, only then use a Glance candidate.

- **Few-category comparison (≤8)** → G3 Chunky Bars ⇄ vertical F1 Rung Bars / horizontal F5 Tick Rows ⇄ L2 Dot Cascade (⚠️ Cascade's category labels run vertically — only usable when names are ≤4 characters or short abbreviations; for long category names use F5/L5/L12 instead)
- **Multi-select percentages (each item independent 0–100, sum may exceed 100)** → G3 Chunky Bars ⇄ L15 Ballot Tally
- **Distribution across many categories (30–60 bars)** → G12 Stagger Wave
- **Signed categorical values** → G10 Diverging Bar
- **Proportion / 100% composition** → G4 Dot Waffle ⇄ L14 Hundred Field ⇄ F4 Tick Donut (the default pie-chart replacement); dual-encoded share × intensity → G13 Big Slice; stacked by category → F7 Stacked Rungs
- **Two-point comparison (before/after)** → category-level (≤6 categories) → F12 Dumbbell Queue (horizontal, beads = real units) ⇄ F6 Paired Rungs (side-by-side pairs); only for 2–4 series needing a trend line → Glance chunky slope (thick line, big numbers, conclusion in the title). Slope charts with too many crossings become significantly less readable — don't pile on decoration just to "Lupi-fy" one.
- **Daily series (≤30 days, day-by-day reading)** → F2 Hairline Line ⇄ (90-day scale, wants texture) L3 Barcode Lollipop; 30–60 days wanting shape → F3 Hairline Area
- **Cumulative growth** → G18 Draw-in + Counter
- **Two-series cause/effect (input vs. output)** → G8 Rainfall
- **Real-time data** → G17 Dynamic Stream
- **Rank changing over time** → dynamic demo needs G16 Bar Race; static, see "rank changing over discrete time" below
- **Weekday × hour × volume** → G14 Single Axis ⇄ F10 Dot Heat
- **Waterfall / gain-loss breakdown (≤6 steps)** → F9 Rung Waterfall
- **Single-value progress (0–100%)** → F11 Tick Gauge ⇄ G18 Draw-in + Counter
- **2D scatter (≤20 points)** → F8 Plumb Scatter; a few hundred points → G15 Jitter Strip
- **Univariate binned frequency** → first check whether F1 Rung Bars can carry it directly (bin as category); only use F14 Rung Histogram when true binning semantics are required. Bin boundaries must have real business meaning — never slice bins arbitrarily for looks.
- **Grouped continuous distribution** → **five-number summary + outliers go straight to F15 Tick Box** (primary has no matching encoding). For density-shape-only comparisons, check G15 Jitter Strip first; G19 Violin and L19 Ridgeline are backup — state explicitly why Jitter/F15 wasn't enough.
- **Record-level distribution** → G15 Jitter Strip.
- **Category × category + volume (matrix)** → primary first: lightweight L4 Arc Matrix, or L9 Bubble Almanac when it spans years and needs annotation. Only use L16 Matrix Heat when neither can hold up (too many cells, bubbles crowding, must be read by lightness); use G20 when a fast read with directly labeled cells is required.
- **Date × count across a full year** → **a full 52-week × 7-day year goes straight to L17 Calendar Heat** (primary has no matching encoding; L3 only scales to ~90 days). Weekday × hour recurring cycles still use F10/G14.
- **Many-to-one attribution** → strong visual form L5 Radial Convergence ⇄ with a name list L12 Type Colonnade
- **Funnel / staged drop-off** → L13 Hourglass Stream
- **Hierarchical structure** → G7 Tree LR
- **Hierarchy + share/weight (two levels, positive values)** → F13 Nested Treemap; when only membership matters and not relative size → G7 Tree LR
- **Multi-series composition changing over continuous time** → static categorical composition uses F7 Stacked Rungs first; **when you need the running total and the continuous-time flow together, go straight to F16 Stream Ribbon** (primary has no matching encoding). A single series' total alone uses F3/G17.
- **The same entity across 3–6 continuous dimensions** → **go straight to L20 Parallel Coordinates** (primary has no matching encoding). Beyond 6 dimensions, filter first or split into multiple charts.
- **OHLC price data** → **go straight to F17 Candlestick** (primary has no matching encoding).
- **Two-sided aggregate flow** → check first whether L5 Radial Convergence / L12 Type Colonnade can carry the attribution relationship; only use G22 Aggregate Sankey when flow width itself must be read. For per-path queries, use B3 Threads.
- **Rank changing over discrete time (static)** → compare L11 Trend Lineage / L2 Dot Cascade first; only use G21 Rank Strip when period-by-period cell alignment is genuinely required.
- **Event-sequence life history** → L11 Trend Lineage
- **Multiple entities' birth time + current scale** → L1 Launch Fan
- **Per-event time-of-day distribution** → L10 Radial Patchwork
- **Bipolar scale (both ends are valid positions)** → L7 Brand Spectrum. Distinguish from unipolar scoring (radar) — use ECharts' native radar for unipolar.
- **Network** → ≤15 nodes, small G6/G11; >15 nodes or needs querying → B1 (ring) / B2 (force-directed); multi-segment path flow → B3 Threads
- **Multi-group × grid (wants a decorative feel)** → L8 Dotty Matrix; needs to be read → flatten to G14
- **Same entity set, multi-dimension carousel (demo)** → G9 Scatter Morph

### Maps: explicit-trigger rule

- Only check Maps once the user explicitly says "map," "geographic breakdown," "shade by country/state," or names a choropleth. A region field merely existing in the data does not auto-trigger a map.
- US state-level values → M1 US Choropleth; world country-level values → M2 World Choropleth. Map area is geographic area, not data value — the subtitle must state `shade = value`.
- M1/M2 depend on ECharts and GeoJSON; state that a network connection is required for delivery, or inline a properly sourced map dataset only when the user explicitly requests offline use. The vendored copy at `assets/geo/world.json` exists for local gallery development and offline delivery — see `docs/design-language/UNKNOWNS.md` U2 for why it's vendored rather than fetched from a CDN.
- Never repurpose M1/M2 as a China map by renaming labels. Only build one after obtaining a complete data source and review information that meets current mapping-compliance requirements.

### F13 Nested Treemap hard rules

- Accepts only hierarchical data with non-negative weights; parent values must equal the sum of their children — parent/child totals may never contradict each other. Area is handed directly to ECharts' treemap layout; do not additionally take a square root of the value.
- Show two levels by default (parent group + leaves). Only enable drill-down when there are more than two levels and the reader needs to query level by level; a normal static delivery keeps `nodeClick:false` to avoid accidentally changing the view.
- Mono's grayscale encodes hierarchy only — don't randomly assign each leaf its own shade. Parent groups are distinguished by title band, inter-group whitespace, and boundaries; the grouping must still read with color removed.
- Porcelain uses a single hue's lightness to show ordered parent share or hierarchy; Palm maps hue to no more than 4 top-level categories; Wire stays grayscale, with `HERO` reserved for exactly one clear protagonist.
- When area already encodes a value, color must not silently re-encode the same value — the subtitle must state `area = ...`, and `color = ...` too when color is in use.
- When leaves exceed 30, labels are widely omitted, or the smallest rectangles are too small to form a stable hit target, either merge the long tail into "Other," split into multiple charts, or switch to G7 / L12 / a B-series relationship chart.
- The tooltip must show at minimum the full hierarchy path, the raw value, and share of total. Hide in-card labels that don't fit rather than shrinking below the minimum font size.

## 5. The Interactivity Triage (static or interactive)

Ask in order:

1. **Is there a real record behind this line/point?** If not (pure decorative texture, like Cluster Field's spokes or Hourglass's flowing lines) → interactivity is forbidden; adding hover to an element with no content behind it is deceptive.
2. If there is a record → **can it be read without clicking?** Fewer than 50 elements with labels at both ends (like Colonnade) → static is enough, hover is a nice-to-have.
3. **More than 50 elements, or multi-segment paths** (like Threads) → hover/pin is required, otherwise it's just an ambient decoration, not a real chart. For the interaction pattern, see `templates/big-threads.html`: a transparent 9px twin line under the visible line as the hit target; hover a single line to light up its whole path; hover a label to pull its whole bundle; click to pin.

## 6. Library-External Chart Types · Extension Workflow

### 6.1 One-off translation

When what the user wants isn't among the catalog's chart types (or they send a reference image), **it isn't impossible — it just needs to be composed on the spot.** Four steps, and step one may never be skipped:

1. **Answer the encoding first**: what does this chart type actually encode? Which data dimension does each visual channel (position/length/angle/area/lightness/density) correspond to? If you can't answer this, ask the user for the underlying data structure. Copying the shape without the meaning is wasted work (a pictorial bar chart once mis-implemented "symbol count" as "tree grows taller" — that was reworked).
2. **Find the nearest relative**: pick the catalog entry with the closest-matching data shape as your starting point, and inherit its layout skeleton and animation rhythm.
3. **Compose only from tokens**: pull every color, font, radius, and animation parameter from `mono-tokens.js` — never invent a new color or font size. The result must look like "one of the family" next to the library's existing charts. When going color, pull colors from a single `color-presets.js` preset; every other token still follows `mono-tokens.js`.
4. **Pass §2's hard rules and §8's checklist** — held to the exact same bar as a native chart.

Extra rule for reference-image translation: identify which family the reference belongs to (Glance or editorial) — an editorial reference's density, annotation, and hand-drawn feel (`blob`) are part of its actual encoding, don't sand them down (the Almanac chart was reworked once for being "afraid to crowd the page").

### 6.2 Catalog promotion — the natural-language extension path

A one-off translation produces a working chart but doesn't touch the catalog. When a translated chart proves reusable — the user asks for the same shape again, or you judge the data shape common enough to be worth registering — promote it into `catalog/charts.json` (or `catalog/reports.json` for a report) via:

```
npm run new-chart -- --id=<ID> --name="<Card Name>" --card-title="<Card Title>" \
  --family=<glance|lupi|basics|maps|interactive> --tier=<primary|backup> \
  --sibling=<existing-chart-id> --data-shape="<description>" --occasion="<description>" \
  --reading-speed=<"<10s"|"~30s"|">30s"|"animated"> --engine=<SVG|Chart.js|ECharts|"ECharts + GeoJSON"> \
  [--siblings=<comma,separated,extra,ids>] [--kind=chart|report]
```

This is the mechanism that makes "always be able to add something in natural language" real rather than aspirational: the user describes a need in plain language, you identify the nearest neighbor in the catalog, and either do a one-off translation (§6.1) or — when the shape is recurring and genuinely general — run the promotion command. `new-chart` scaffolds the new entry's gallery HTML from its nearest sibling's real structure (never a blank template — this still enforces "reuse before invention," it does not relax it), validates the new entry against `catalog/schema/`, regenerates `catalog.md`, and runs `npm run validate`. **A promotion that fails validation is rejected outright, not merged with a TODO** — nothing skips the same hard-rule gate a native chart has to pass. Reports follow the identical two-tier path against `catalog/reports.json` with `--kind=report`, using the nearest report template as the structural donor.

Catalog growth is a deliberate step, not automatic: a one-off translation that's never promoted leaves no trace in the catalog, and that's correct — not every one-off chart deserves to become a reusable type. The friction is intentional; it's what keeps 65+ chart types feeling like one family instead of drifting apart.

## 6.5 Color (chosen automatically by scenario, one system per delivery)

**Mono is the floor, not the forced answer whenever color hasn't been explicitly requested.** Even when the user hasn't mentioned color, evaluate whether color fits the data semantics, category count, reading occasion, and content tone; when the fit is unclear, or color adds no real information value, fall back to Mono.

A first color pass picks one of three presets — values live in `color-presets.js`, samples in `templates/color/`. Presets exist to get a fast, stable, unified first pass — they're not a locked palette. If the user says "make that blue a bit darker," keep adjusting within the current color system; when the user gives an explicit brand color, hex values, or a full palette, build a custom palette per the rules below. After any adjustment, re-check contrast, visual hierarchy, and data semantics.

**One HTML file, or one delivered set, must first lock a single global color system: Mono, porcelain, palm, wire, or one custom palette.** Every chart in the delivery shares that choice. If one chart doesn't support the chosen system, don't re-color it alone — pick a globally compatible system instead, or fall the whole set back to Mono.

**The structural source of truth is always the original gallery.** Look up rendering code in the root `templates/` gallery files; `templates/color/` is only for color values. Lock structure per §0 first, then decide whether to re-skin it.

### Whether to use color

Judge in this priority order:

1. **Explicit user request.** Honor a requested color, mood, or preset first, but still check capacity, contrast, and data semantics.
2. **Agent auto-selection.** Even without a user request, auto-select a preset whenever the data shape and occasion clearly match one: an ordered single series suits porcelain; a handful of unordered categories suits palm; needing one controlled focal point suits wire.
3. **Default to Mono when the fit is unclear.** Too many categories, high-density records, color with no stable meaning, or a batch that can't share one preset — use Mono.

Color isn't an upgrade tier — it's a semantic tool the agent may choose deliberately. State in one sentence, at delivery, which color system was chosen and what data meaning it carries.

### Custom palettes (only on explicit user request)

Never invent a fifth default aesthetic. Build a custom palette only when the user gives explicit hex values, a brand color, brand guidelines, or says "match this reference image's colors" — "make it look nicer" alone still means picking from the three built-in presets.

1. **Decide the color logic before assigning values.** Ordered data gets a single-hue lightness ramp; unordered categories get categorical colors; when focus is needed, use a neutral base plus one accent. Never grab five colors and spread them evenly across every element.
2. **Establish full roles, don't scatter raw hex values.** A custom palette defines at minimum `BG`, `TXT`, `MUT`, `GRID`, `DATA`; add `HERO` when emphasis is needed, `RAMP` for ordered data, `CAT` for categorical data. Inline one `CUSTOM` object in the final artifact; every chart pulls color from its roles.
3. **Interpret by input count.** 1 color → generate a same-hue lightness ramp. 2 colors → default to primary-data-color + accent, not two equal categories. 3–6 colors → only assign to `CAT` when the data genuinely has that many categories. Beyond 6, merge categories, switch to position/label encoding, or fall back to Mono.
4. **Derive light/dark shades — never smuggle in a new hue.** Lighter shades mix the user's color with `BG`; darker shades mix it with `TXT`. Never borrow hex values from porcelain, palm, or wire to fill out a custom palette.
5. **Contrast is a hard gate.** Body text and small labels need at least 4.5:1 against the background; large type needs at least 3:1; key boundaries, data shapes, and interactive states need at least 3:1 against adjacent colors. When contrast fails, adjust lightness first — don't unilaterally change the user's specified hue.
6. **Color can never be the only cue.** Categories still carry labels, ordinal data still keeps position/length/area, emphasis still gets a title or annotation. A colorblind reader should still be able to read the chart's structure with color removed.
7. **Lock exactly one custom palette per delivery.** Never mix a custom palette with a built-in preset; a multi-chart delivery shares one `CUSTOM` object. Unless the user explicitly asks to promote a brand color into a project-level preset, a custom palette stays inlined in the current delivery and is never written back into `color-presets.js`.

When the user later asks to go "a bit darker," "warm up the background," or swap one color value, update the matching role and re-check the whole palette's contrast and semantic mapping — not just the one element they named.

### Which preset: data shape first, then tone

| Data shape | Allowed | Reason |
|---|---|---|
| Ordered / single series (progress, heat, time series, single metric, ranking) | porcelain, wire | The "lightness = data" contract still holds |
| Unordered categories ≤4 | palm | Hue maps to category |
| Unordered categories 5–6 | palm (marginal) | Relies on lightness and saturation to help distinguish |
| Categories >6 | Mono grayscale | The color presets don't have the capacity |
| Wants restraint but one focal point | wire | Grayscale carries the data; orange marks only the protagonist |

| The user might say | Preset | Tone |
|---|---|---|
| Blue, cool, academic, rational, serious, tech-forward | porcelain | Single-hue blue ramp |
| Green, warm, natural, gentle, retro, muted | palm | Low-saturation green/yellow, amber accent |
| Black and white, restrained, magazine feel, editorial | wire | Black/gray plus a touch of fluorescent orange |

### Color hard rules

- **Exactly one color system per delivery.** One chart, one HTML file, or one set of sibling charts uses only Mono, a single `color-presets.js` preset, or one explicit custom palette. Never mix presets, and never let a custom palette borrow color from a built-in preset.
- **Line weight ×1.8, opacity floor .85.** A hairline that reads fine in grayscale can nearly vanish once it's a light color; the exception is `dot heat`.
- **At least 3 color steps or positions per chart.** Using only 1–2 colors falls back to grayscale.
- **Color must connect to a real dimension.** An ordinal ramp maps to a value, a segment color maps to a month or period, a categorical color maps to a category; the footer states what color is encoding.
- **The accent color gets exactly one protagonist.** A second protagonist cancels the first.
- **Dark-card data colors must read lighter than the card background.** Dark-ground big charts use the preset's `DARK` block. `big-circular`/`big-force`/`big-threads` only ship porcelain and palm; wire uses the original Mono big-chart version.
- **In palm, `DATA` and `HERO` must differ.** Amber and olive sit too close in lightness to double as two equal category colors.

## 7. When to Say No

Being willing to refuse is more credible than accepting everything. Don't build the following — offer an alternative instead:

- **A truncated-axis bar chart** → refuse, offer the three honest alternatives (tower above the frame / inset magnifier / torn bar with intact axis).
- **Glow / glassmorphism / 3D** → refuse, keep the existing visual grammar. Custom hex values still map through the custom-palette rules; mixing color systems is refused.
- **Multiple hues for a single series** → refuse. Offer porcelain, wire, or fall back to Mono.
- **Color requested with >6 categories** → refuse, fall back to Mono grayscale.
- **The user hasn't explicitly requested a map** → don't auto-trigger M1/M2 just because a region field exists in the data; keep selecting by ordinary comparison, ranking, or composition logic.
- **A map scope beyond M1/M2** (Chinese provinces, city-level points, route/trajectory maps, etc.) → don't force the wrong boundaries onto it; confirm data source, projection, compliance, and interaction requirements before building it fresh.
- **Adding interactivity to a purely decorative element** (§5, question 1) → refuse and explain why.
- **Rebuilding a radar chart from scratch** → don't; use ECharts' native radar re-skinned with Mono tokens (field-tested: for presentation contexts, "a chart type readers already recognize" has real value).
- Data too thin to support the chosen chart type (e.g. 3 nodes asking for a force-directed layout) → downgrade to something simpler and say so.

## 8. Pre-Delivery Checklist

1. Are values and visuals proportional? (Did area use `sqrt`? Are bars un-truncated?)
2. Is the palette controlled? Does the whole HTML file, or the whole delivered set, use only Mono, a single built-in preset, or a single custom palette? Any non-ladder color inside Mono is rework; any color from a second preset inside a built-in color chart is rework; does the custom palette pull only from `CUSTOM` roles and pass its contrast check?
3. Will labels overlap? (The barcode lesson: nearby peak labels need an enforced minimum spacing.)
4. Is any font at or below the minimum size? (Half-width 6.5 / full-width 5.5.)
5. Is the demo data deterministic via `rnd`? Does it render identically on two reloads?
6. Does reveal behave correctly? (Plays on scroll-in, replays on click, timers don't stack, `prefers-reduced-motion` degrades correctly.)
7. Does `node --check` pass syntax? (Extract the `<script>` contents and check them.)
8. Is the four-part card anatomy complete? Is the title a conclusion, not a chart-type name?
9. Does the subtitle actually explain the legend? (The reader only sees this line, not your code.)
10. Did you complete a full candidate audit? At minimum, 3 candidates and why each was rejected — not just "which template got used."
11. If this is a multi-chart page, was template assignment done globally? Any repeated silhouette, too many dark cards, or every chart collapsing into the same radial shape?
12. Does every chart record its chart-type number, gallery file, and card title? Does the finished piece's core structure genuinely trace to that template, rather than being reinvented?
13. If Glance was used, did you state in writing why both Lupi Editorial and Lupi Basics didn't fit? If not, rework back to Lupi/Basics.
14. Last question: place this chart back next to its matching card in the chosen gallery — is it genuinely the same template family, or just "similar-ish in style"?

## 9. Single-File Template Skeleton

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Mono — {chart name}</title>
<!-- When ECharts is needed: -->
<script src="https://cdn.jsdelivr.net/npm/echarts@6/dist/echarts.min.js"></script>
<!-- When Chart.js is needed (G3): -->
<!-- <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="{MONO.FONT.link}" rel="stylesheet">
<style>/* inline MONO.CARD_CSS */</style>
</head>
<body>
<div class="grid2">
  <div class="card"><!-- or card dark / card wide -->
    <h2>{conclusion-style title}</h2>
    <div class="sub">{explanation} · {legend} · {time range}</div>
    <!-- pick one container per engine: -->
    <div class="ch" id="ch"></div><!-- ECharts -->
    <!-- hand-written SVG: <svg id="ch" viewBox="0 0 400 320"></svg> -->
    <!-- Chart.js (G3): <div class="wrap"><canvas id="ch"></canvas></div>, paired with .wrap{position:relative;height:320px} -->
    <!-- ⚠️ Chart.js must mount on a <canvas> — wrapping it in <div class="ch"> throws "can't acquire context" -->
    <div class="src">{chart type} · {series} · {data source}</div>
  </div>
</div>
<script>
// inline the full contents of mono-tokens.js
// ── data (the user only needs to change this) ──
const DATA = [ /* ... */ ];
// ── render ──
MONO.obsReveal('ch', el => { /* ... */ });
</script>
</body>
</html>
```

## 10. Report-Mode Skeleton

```text
report-catalog.md                    # pick R01–R12 by occasion first
templates/reports/report-NN.zh.html  # Chinese full-page source
templates/reports/report-NN.en.html  # English full-page source
templates/reports/index.html         # locally openable template index
docs/assets/reports/report-NN.png    # static preview of the Chinese version
```

A delivered report is still a single HTML file; the files in `templates/reports/` are copyable starting skeletons, not content to reproduce verbatim. The demo data inside each template exists only to show structure — replace all of it when generating the final report.
