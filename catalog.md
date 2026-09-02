# Navi Chart — Chart Catalog · 64 charts

> Every chart carries three tags: **data shape** (the primary key for selection), **occasion**, and **reader time**.
> **Primary vs. backup:** primary tier is L1–L15 and F1–F13 — default here first. L16–L20, F14–F17, and G19–G22 are backup tier, used only when the primary tier cannot honestly encode the data, with the reason written down. The exceptions are F15, F16, F17, L17, and L20 — no primary-tier encoding exists for their data shapes, so hitting that shape goes straight to the backup entry (see `SKILL.md` hard rules §0.3.1 / §0.3.2).
> **Selection priority follows `SKILL.md`'s hard rules: audit Lupi Editorial in full first, then Lupi Basics; only move to Glance once both are checked and rejected for cause, or the user explicitly asks for Glance / a dashboard / a 3-second read.
> The "Siblings" column pairs same-topic alternates for comparing data contracts and recalling candidates — it does not mean both should be generated, and it does not change the priority rules above.
> Reference implementations live under `templates/`: Glance family `templates/glance-gallery.html`, Lupi family `templates/lupi-gallery.html`, Basics family `templates/basics-gallery.html`, Maps `templates/maps-gallery.html`, big interactive charts `templates/big-*.html`. Maps are recalled only on an explicit user request. A gallery file holds many cards on one page — to find one chart's code, locate its card by the **card title** below, then search the matching `// ════` comment block inside `<script>`. Worked examples with real data live in `examples/`. The machine-readable source of truth is `catalog/charts.json` — this file is generated from it by `npm run catalog:generate` and checked for staleness by `npm run catalog:check`.

## Glance family · 22 charts (bold strokes · pre-aggregated · 3-second read)

| # | Name | Card title | Data shape | Occasion | Reading time | Engine | Siblings |
| --- | ------ | --------- | --------- | ------ | --------- | ------ | ------ |
| G1 | Range Capsules | Daily active range | one min-max range per day, daily series | weekly report dashboard | <10s | Chart.js | L3 (range only) |
| G2 | Petal Rose | How releases made us feel | single-variable categorical counts, up to 8 categories, roughly even split | facade / cover | <10s | ECharts (dark card) | G13 (upgrade at two variables) |
| G3 | Chunky Bars | Revenue by plan | small-category ranking comparison (up to 6) | weekly report dashboard | <10s | Chart.js | L2; L15 (multi-select percentages) |
| G4 | Dot Waffle | Where sign-ups come from | 100% composition (share of a whole) | general purpose, default replacement for a pie chart | <10s | hand-written SVG | L14 |
| G5 | Pictorial Bar | Trees planted, year by year | year-by-year count (one symbol = a fixed quantity) | external-facing story page | <10s | ECharts | — |
| G6 | Circular Graph (small) | Who works with whom | network, up to 12 nodes | quick illustration | <10s | ECharts (dark card) | — |
| G7 | Tree LR | Everything the platform ships | hierarchy (2-3 levels) | product catalog / architecture page | ~30s | ECharts | — |
| G8 | Rainfall Dual Area | Campaigns rain down, sign-ups flow | two-series cause and effect (spend vs. output) | growth retrospective | ~30s | ECharts | — |
| G9 | Scatter Morph | One dataset, three views | same entity set, three dimensions cycling through | short video / live demo | animated | ECharts universalTransition | — |
| G10 | Diverging Bar | Where we gained, where we bled | signed (positive/negative) categorical values | weekly report dashboard | <10s | ECharts | — |
| G11 | Force Graph (small) | Integrations, pulled into orbit | hub-and-satellite network, up to 15 nodes | quick illustration, draggable | <10s | ECharts (dark card) | L6 (static poster version) |
| G12 | Stagger Wave | Fifty markets, one wave | multi-category distribution (30-60 bars) | short-video entrance | animated | ECharts | — |
| G13 | Big Slice (Custom Pie) | Big slice, deep engagement | double encoding: share of whole (angle) x intensity (radius) | product analysis | ~30s | ECharts custom series | G2 (downgrade at one variable) |
| G14 | Single Axis | Support load, day by day | weekday x hour x volume (punch-card data) | support/ops weekly report | ~30s | ECharts | — |
| G15 | Jitter Strip | Response times, spread out | grouped distribution, record-by-record (a few hundred points) | SRE / ticket analysis | ~30s | ECharts | — |
| G16 | Bar Race | Eight products race for revenue | ranking evolving over time | short video | animated | ECharts realtimeSort | — |
| G17 | Dynamic Stream | Concurrent users, streaming | real-time scrolling series | livestream / big screen | animated | ECharts | — |
| G18 | Draw-in + Counter | H1 revenue, drawn in one stroke | cumulative growth (one line + one big number) | short video / presentation opener | animated | ECharts | — |
| G19 | Violin | How fast each plan gets an answer | grouped continuous-distribution density outline + median | dashboard / analysis readout | <10s | SVG | F15; L19 |
| G20 | Matrix Heat (Glance) | Adoption runs hot on the new versions | two discrete dimensions x value, up to 60 cells, each cell read directly | dashboard / product analysis | <10s | SVG | L16 (close-read version) |
| G21 | Rank Strip | Flows climbs to the top | multi-entity ranking over discrete time, print-friendly | reporting / billing retrospective | <10s | SVG | G16 (animated presentation version) |
| G22 | Aggregate Sankey | Channels pour into plans | two-sided aggregate flow, band width = quantity, no per-path lookup required | attribution / conversion analysis | ~30s | SVG | B3 (needs per-path lookup) |

\* G1/G3 still use Chart.js; a future pass may migrate them to ECharts for a single rendering stack.

## Lupi family · 20 charts (hairline · record-by-record · 30-second read)

| # | Name | Card title | Data shape | Occasion | Reading time | Engine | Siblings |
| --- | ------ | --------- | --------- | ------ | --------- | ------ | ------ |
| L1 | Launch Fan | Twelve features, fanned out | multiple entities, each with a birth time and current scale | annual report / story page | ~30s | SVG | — |
| L2 | Dot Cascade | What breaks, stacked and ranked | ranking comparison, countable units (a unit chart) | annual report / story page | ~30s | SVG (dark card) | G3 (Chunky Bars) |
| L3 | Barcode Lollipop | Ninety days as a barcode | one reading per day, daily series (roughly 90 days) | annual report / story page (with a text column) | ~30s | SVG (full width) | G1 (Range Capsules) |
| L4 | Arc Matrix | Eight products land in twelve cities | category x category + value, small data (up to 100 cells) | lightweight matrix | ~30s | SVG | L9 (use this for thinner data; Almanac is the heavier version) |
| L5 | Radial Convergence | 48 requests pull toward five themes | many-to-one attribution without losing detail (up to 60 records) | poster / cover | ~30s | SVG | L12 (two alternates offered for the same data shape) |
| L6 | Cluster Field | The contributor field | hub-and-satellite network, poster version | poster / cover (read the shape, not the numbers) | ~30s | SVG (full width) | B2 (use the big force template when interaction / lookup is needed) |
| L7 | Brand Spectrum | Where the brand sits | bipolar scale (both ends are valid positions) + competitor comparison | brand research report | ~30s | SVG | — |
| L8 | Dotty Matrix | Four squads, stacked in space | multiple groups x grid x value, evenly stacked | cover / poster (strongly decorative) | ~30s | SVG | G14 (the flattened version is easier to read numbers from) |
| L9 | Bubble Almanac | Eight years of tickets, one almanac | category x year + value + status, wide span (hand-drawn blob shapes) | annual report (with marginalia / milestones) | >30s | SVG (full width) | L4 (lighter-weight version) |
| L10 | Radial Patchwork | A quarter of deploys, overlaid | overlaid events: time-of-day (angle) x magnitude (radius), opacity = density | annual report / story page | >30s | SVG | — |
| L11 | Trend Lineage | Features rise, fall, come back | event-sequence life history (launch / rebuild / dormant / alive) | product retrospective | >30s | SVG | — |
| L12 | Type Colonnade | Forty-four repos, ten owners | many-to-one attribution + a full itemized list (up to 50 records) | governance / audit report | ~30s | SVG | L5 (two alternates offered for the same data shape) |
| L13 | Hourglass Stream | The funnel, poured | staged decreasing counts (a funnel) | annual report / story page | ~30s | SVG | — |
| L14 | Hundred Field | A hundred of us, four minds | 100% composition (share of whole), up to 6 small-data categories | annual report / story page | ~30s | SVG | G4 (Dot Waffle) |
| L15 | Ballot Tally | What they fear, tick by tick | multi-select-question percentages (each item independent, 0-100), up to 6 items | annual report / story page | ~30s | SVG | G3 (Chunky Bars) |
| L16 | Matrix Heat | Which features get used together | two discrete dimensions x value, up to 100 cells, keeps matrix structure and highlight cells | annual report / product analysis | ~30s | SVG | G20 (quick-read version) |
| L17 | Calendar Heat | A year of deploys, day by day | a full year of dates x count, 52 weeks x 7 days | annual report / ops retrospective | ~30s | SVG (full width) | F10 (weekday x hour instead of full year) |
| L18 | Beeswarm | A hundred and twenty deals, swarming | single-variable record-by-record stacked distribution, roughly 40-180 points | sales / research appendix figure | ~30s | SVG | G15; G19 |
| L19 | Ridgeline | Five pipelines, five tempos | 3-8 groups of continuous-distribution density shapes, compared | annual report / research report | >30s | SVG | G19 (quick read with fewer groups) |
| L20 | Parallel Coordinates | Twelve products, four dimensions | same entity set across 3-6 continuous dimensions, one line per entity | product-portfolio / research report | >30s | SVG | G9 (animated carousel presentation) |

> L14–L15 are the **small-data group**: when there are only a handful of percentages, unit decomposition earns back Lupi density — 1 dot = 1 person / 1 percentage point, density comes from the unit, not the record count. State the unit meaning in the subtitle (e.g. "one dot = one person in a hundred"), and only decompose into units you can honestly justify — never fabricate individuals.

## Basics family · 17 charts (F1–F17 · Lupi grammar over familiar chart silhouettes, for sparse data)

Recognizable as a familiar chart type from a distance (bar / line / donut...); every unit is countable up close. The first place to look for Lupi density when data is only a handful of categories or a few dozen days — check here before reaching for a library-external translation. Reference implementation: `templates/basics-gallery.html`.

| # | Name | Card title | Data shape | Occasion | Reading time | Engine | Siblings |
| --- | ------ | --------- | --------- | ------ | --------- | ------ | ------ |
| F1 | Rung Bars | Revenue by plan, rung by rung | small-category comparison (up to 8), countable units | annual report / story page | ~30s | SVG | G3 (Chunky Bars) |
| F2 | Hairline Line | Thirty days of sign-ups | daily series (up to 30 days, day-by-day reading) | annual report / story page | ~30s | SVG | G1 (Range Capsules) |
| F3 | Hairline Area | Concurrent users, filled with days | daily series (30-60 days, read for shape) | annual report / story page | ~30s | SVG | L3 (Barcode Lollipop) |
| F4 | Tick Donut | Where the traffic comes from | 100% composition (up to 6 segments) | annual report / story page | ~30s | SVG | G4; L14 |
| F5 | Tick Rows | Six teams, shipped and counted | horizontal ranking comparison, countable units (up to 8 rows) | annual report / story page | ~30s | SVG | L2 (Dot Cascade) |
| F6 | Paired Rungs | This year against last, plan by plan | grouped comparison (2 series per category, e.g. this year vs. last) | annual report / retrospective | ~30s | SVG | — |
| F7 | Stacked Rungs | Where each region's revenue sits | stacked composition (up to 4 categories x up to 3 segments) | annual report / retrospective | ~30s | SVG | — |
| F8 | Plumb Scatter | Price against satisfaction, twelve products | two-dimensional scatter (up to 20 points) | product analysis | ~30s | SVG | G15 (for distribution reading) |
| F9 | Rung Waterfall | From gross to net, step by step | waterfall / step-by-step increase-decrease breakdown (up to 6 steps) | finance / retrospective | ~30s | SVG | — |
| F10 | Dot Heat | When support gets loud | weekday x hour x volume (small heatmap) | support / ops | ~30s | SVG | G14 (Single Axis) |
| F11 | Tick Gauge | How far to the quarter's goal | single-value progress (0-100%) | presentation opener | <10s | SVG | G18 (Draw-in + Counter) |
| F12 | Dumbbell Queue | Onboarding, before and after the redesign | category-level before/after comparison (up to 6 categories, beads = real units) | annual report / retrospective | ~30s | SVG | — |
| F13 | Nested Treemap | Where the work went | two-level hierarchy + positive weights, rectangle area = value | budget / product portfolio / space allocation | ~30s | ECharts (SVG renderer) | G7 (when only the hierarchy matters, not the share) |
| F14 | Rung Histogram | Most tickets resolve within six hours | single-variable binned frequency, bins have business meaning and countable units | support / ops analysis | ~30s | SVG | G19; F15 (Tick Box) |
| F15 | Tick Box | Reply times, boxed by plan | grouped five-number summary + outliers, raw distribution can be summarized | support / experiment analysis | ~30s | SVG | G19; F14 (Rung Histogram) |
| F16 | Stream Ribbon | Three products trade the same river | 2-5 series of composition changing over continuous time, while still showing the total | product / traffic retrospective | ~30s | SVG (full width) | F7 (static-category alternative) |
| F17 | Candlestick | Six weeks of the token, candle by candle | OHLC four-value time series, hollow = up, filled = down | market / price retrospective | ~30s | SVG | G1 (when only a range is available) |

## Maps · 2 charts (recalled only on explicit user request)

Data containing a country, state/province, or region field does **not** automatically mean a map. Only pick from `templates/maps-gallery.html` when the user explicitly asks for "a map", "geographic distribution", "shade by country/state", etc. Maps render through ECharts with online GeoJSON and need network access unless the GeoJSON is inlined at delivery time (see the vendored copy at `assets/geo/world.json`).

| # | Name | Card title | Data shape | Occasion | Reading time | Engine | Constraints |
| --- | ------ | --------- | --------- | ------ | --------- | ------ | ------ |
| M1 | US Choropleth | Sign-ups across the states | US state-level regions + non-negative values, lightness = value | US market / operations report | ~30s | ECharts + GeoJSON | Only recall on explicit user request; state area does not represent value. |
| M2 | World Choropleth | Where the users are | world country-level regions + non-negative values, lightness = value | global market / operations report | ~30s | ECharts + GeoJSON | Only recall on explicit user request; not for point locations or paths. |

## Standalone interactive big charts · 3 charts (one chart, one file, full-page canvas)

| # | File | Data shape | Interaction | When to use |
| --- | ------ | --------- | ------ | ----------- |
| B1 | `templates/big-circular.html` | network, 60-node circular chord ribbon | Hover to focus adjacency, click to replay. One chart per file, full-page canvas. | poster-scale relationship data with more than 15 nodes |
| B2 | `templates/big-force.html` | network, 180-node force-directed galaxy | Drag with spring-back, hover to focus. One chart per file, full-page canvas. | large networks that need node-by-node lookup |
| B3 | `templates/big-threads.html` | three-stage paths, 100+ threads | Hover a single thread or a whole bundle, click to pin, status bar shows the reading. One chart per file, full-page canvas. | multi-stage flow data that needs per-path lookup |

## Removed chart types (superseded by a better fit)

Polar Line (24h distribution → L10), Punch Card (→ G14), Release Rings (its style did not belong to any family), static Thread Triptych (→ B3), Profile Equalizer (→ G10), Slope Beads (crossing diagonals read poorly; a redesigned slope chart is still pending), Meridian Dots (signed categorical values now use G10). The last two originated in an unadopted Lenny case-study draft and are not recommended to restore as-is.
