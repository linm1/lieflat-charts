# Navi Chart — Report Catalog · 12 templates

> A report template sets the whole page's narrative order, canvas, module density, and reading speed; charts inside it still follow the data contracts in `catalog.md`. The scenarios in the table below are recommended uses, not hard limits — the same layout can carry financial/economic, research, business, product, or personal-record content.
> Each template ships two independent language versions: Taiwan Traditional Chinese (`lang=zh-Hant-TW`, `templates/reports/report-NN.zh.html`) and English (`templates/reports/report-NN.en.html`).
> A visual index is at `templates/reports/index.html`; static previews are under `docs/assets/reports/`.
> The machine-readable source of truth is `catalog/reports.json` — this file is generated from it by `npm run catalog:generate` and checked for staleness by `npm run catalog:check`.

## Selection order

1. Filter first by report type, audience, and reading task — not by "which chart types are inside" or industry words in the template name.
2. Then filter by information density, canvas width, reading speed, and whether it needs to run offline.
3. Compare at least 3 candidates; compare all of them if fewer than 3 exist.
4. Once a template is locked, keep its whole-page skeleton — do not splice in sections from a different report template.

## Template index

| # | Name (EN / 繁體中文（台灣）) | Common report types / transferable scenarios | Canvas | Density | Color system | Dependencies |
| --- | --- | --- | ---: | --- | --- | --- |
| R01 | Survey One-Pager / 調查一頁紙 | survey report, research brief, policy / market insight, white-paper opener, external data release | 1080 | 3 charts, medium | Porcelain | web fonts |
| R02 | Annual Milestones / 年度里程碑 | annual retrospective, earnings / financial review, investor update, product or project milestones | 980 | 3 charts, medium | Palm | web fonts |
| R03 | Year in Data / 年度資料海報 | annual data report, operations / financial annual report, personal annual record, annual trend poster | 1080 | 4 charts, high | Wire | web fonts |
| R04 | Monthly Ops / 月度營運 | monthly report, business data report, financial report, operations / financial retrospective, periodic monitoring | 1080 | 4 charts, high | Porcelain | web fonts |
| R05 | Impact Story / 影響力故事 | project retrospective, product record, nonprofit / community case study, impact narrative, personal growth record | 760 | 2 charts, low | Mono | web fonts |
| R06 | Eight-Year Product Almanac / 產品八年年鑑 | long-horizon almanac, product / company history, multi-year financial or business trend, personal long-term data | 980 | 4 charts, high | Palm | web fonts |
| R07 | Survey Collage Poster / 調查拼貼海報 | survey-report poster, user / market research, event / expo data, social-media material | 980 | 5 charts, very high | Palm | web fonts |
| R08 | Population One-Pager / 單位人群一頁 | audience / user profile, policy / nonprofit brief, market segmentation, demographic and socioeconomic data | 880 | 2 charts, low | Wire | web fonts |
| R09 | Data Story Dashboard / 資料故事儀表板 | dashboard, financial / operations cockpit, business overview, competitor / market comparison, KPI snapshot | 1080 | 4 charts + KPI, high | Porcelain | web fonts |
| R10 | Travel Notebook / 旅行手記 | travel data record, sports/fitness data record, personal annual / lifestyle data, lightweight project log | 980 | 4 charts + table, medium | Palm | web fonts |
| R11 | Research Brief Card / 研究簡報卡 | research brief, financial / economic flash update, social-media card, presentation insert, key-metric snapshot | 600x1000 | 2 charts, fixed size | Mono | Chart.js + ECharts CDN |
| R12 | Weekly Glance / 週報速覽 | weekly report, financial / operations flash update, operations monitoring, project progress, sports or travel weekly log | 1080 | 4 charts, high | Palm | Chart.js + ECharts CDN |

## Report-type recall

- **Survey report / research brief:** R01, R07, R08, R11.
- **Business data report / dashboard:** R04, R09, R12.
- **Financial / economic report:** R02, R03, R04, R09, R11, R12. See the financial worked example at `examples/reports/r04-financial-report.zh.html` (Taiwan Traditional Chinese).
- **Product record / project retrospective:** R02, R05, R06, R12.
- **Personal data record:** R03, R05, R06, R10, R12 — fitness, travel, and annual lifestyle data all fit.
- **External poster / social sharing:** R03, R07, R11.
- **Template selection principle:** choose by content structure, information density, reading speed, and canvas — don't constrain a template to one industry just because its name says "travel," "ops," or "almanac."
- **Must run offline:** prefer R01–R10, and inline or drop web fonts; R11–R12 need chart dependencies inlined too.
- **Fixed social-media canvas:** R11; switch templates if content doesn't fit rather than shrinking type or cutting information.

## Template contract

- A report template is a whole page, not a chart gallery. Copy the full HTML of the matching language as your starting point.
- Keep the template's canvas width, primary grid, section order, main whitespace, color system, and chart-slot relationships.
- Copy text, data, sources, legends, and modules that conflict with real content may be replaced; unsupported secondary modules may be dropped.
- When a chart slot needs a real chart, lock the type from `catalog.md` and reuse the matching gallery implementation — replace only that slot.
- Never mix two report templates together, and never keep demo data, demo sources, or demo conclusions in the delivered file.
