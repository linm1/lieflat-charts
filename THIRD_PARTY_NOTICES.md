# Third-Party Notices

Some Navi Chart templates load the following third-party projects in the
browser. They are not covered by this repository's PolyForm Noncommercial
License and remain under their own licenses.

| Project | Used for | License |
|---|---|---|
| [Chart.js](https://github.com/chartjs/Chart.js) | Glance chart rendering | MIT License |
| [Apache ECharts](https://github.com/apache/echarts) | Glance and interactive network rendering | Apache License 2.0 |
| [Inter](https://github.com/rsms/inter) | Page typeface | SIL Open Font License 1.1 |

Templates currently load these resources via jsDelivr and Google Fonts. If
you redistribute modified third-party code, font files, or an offline
bundle, keep the license and copyright notices each project requires.

## Subresource Integrity (accepted tradeoff)

CDN `<script>` tags in this project use floating major-version URLs
(`echarts@6`, `chart.js@4`) rather than exact-patch-pinned versions, and
carry no Subresource Integrity (SRI) hash. This is a deliberate tradeoff,
not an oversight: floating major-version URLs are incompatible with
exact-byte SRI hashes, and pinning exact patch versions to enable SRI
would reintroduce the version-drift maintenance burden the floating-tag
approach is meant to avoid — see
[ADR-0006](docs/adr/0006-accessibility-and-security-remediations.md).
If you deliver a chart into an environment with stricter supply-chain
requirements, pin an exact version and add your own SRI hash before
shipping it.

## Map data

`assets/geo/world.json` is vendored world-boundary GeoJSON, originally
sourced from the `echarts@4.9.0` npm package (the last ECharts release to
bundle map data; ECharts stopped shipping it from v5 onward). It is
static data, not executable code, and carries no license notice of its
own beyond ECharts' MIT License. See
[`docs/design-language/UNKNOWNS.md`](docs/design-language/UNKNOWNS.md) U2
for why it is vendored locally instead of fetched from a CDN at request
time.
