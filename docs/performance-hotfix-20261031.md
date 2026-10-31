# Performance hotfix — 2026-10-31

Base: production commit `166d7f338efe2d1cdfd64eba06ec9d1a96ad421e`.

## Changes

- Remove page-wide fades, staggered card entrances, progress animation, and large-area hover/selection transitions. Keep brief button color feedback.
- Replace relational `:has()` styling with explicit presentation classes, preserving table padding on mobile.
- Move button/badge component types outside App; memoize order rows and badges. Unchanged rows now skip unrelated modal, input and selection updates.
- Stable UI event adapters read the latest committed handler through a layout-effect ref, preserving current selections, permissions and business-handler state.
- Keep all existing data, accounting, request and permission handlers unchanged. A byte comparison of App's business-handler prefix against the base passed, after excluding new UI imports/hooks. No dependencies, schema, migrations, credentials or production records changed.

## Validation

- Release build passed; all 61 release tests passed. Shared-workspace suite: 64 passed. New UI modules passed ESLint; diff whitespace check passed.
- Isolated read-only fixture: 300 identical synthetic orders, same desktop viewport. Vite development build, React Profiler plus click-to-next-frame instrumentation; these are local interaction measurements, not production network timings.
- Before: four samples. New-order dialog click-to-frame median 158.8 ms (88.5–485 ms); select-all median 158.1 ms.
- After: six samples. Dialog median 33.0 ms (13.5–36.1 ms); select-all median 132.8 ms. Single-row selection no longer rerenders the other rows. Large selection still updates all affected rows.
- Browser checks: checkbox Enter, payment dialog Enter, empty-amount validation, correct payment target after filtering, order-detail navigation, Arabic/English status updates, 300 rows retained, zero external requests from fixtures.
- At 390 px: body width remains 390 px, table panel padding remains zero, page animation is `none`.
- Production JS gzip: 295,986 → 296,862 bytes; CSS gzip: 7,286 → 6,996 bytes. No added package or heavy media.

Deployment uses Cloudflare Pages' existing main-branch integration. Rollback is a revert of the hotfix commit; it requires no database operation.
