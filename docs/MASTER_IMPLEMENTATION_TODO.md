# Master implementation TODO

This is the execution contract. No item is marked done until its acceptance criteria are met through every listed layer.

## Phase 0 — Replace prototype seams

**Goal:** establish an honest current-state baseline.

- Remove obsolete `SAMPLE_WATCHLIST`, `home_payload`, and misleading localStorage comments; retain only explicit `DATA_MODE=demo` provider data.
- Split the single static client and `http.server` prototype into route/controller, service, repository, provider, and frontend component boundaries.
- Add a repeatable database reset/migration path.
- **Acceptance:** no production UI receives hardcoded price/evidence/timeline records; `rg mock|sample|fake|placeholder` is classified.

## Phase 1 — Application shell and auth

**References:** frontend `dashboard-layout`, sidebar/top-bar, theme context; Stock-Market-Intelligence auth routes.

- DB: password hashes, expiring/revocable sessions, user profile.
- Backend/API: signup/login/logout/me and authenticated-route guard.
- Frontend: distinct signup/login forms, redirect, nav state, retry/error/loading.
- Tests: wrong password, duplicate email, logout invalidation, user A cannot read user B.
- **Acceptance:** browser signup → Home; reload remains signed in; logout returns to login.

## Phase 2 — Watchlist and security search

**References:** `global-search.tsx`; `services/watchlist.py`; trading-bb symbol master.

- DB: import a licensed security master and aliases; keep one active list/user with entry metadata.
- Backend/API: debounced/paginated search; CRUD; 100-cap; active/expired membership endpoint.
- Frontend: API keyboard search dropdown, select, add modal, remove confirmation, empty onboarding.
- Tests: name/symbol/exchange matching, duplicates, cap, post-login persistence and isolation.
- **Acceptance:** search → add → refresh → logout/login retains entry; no local static universe is used.

## Phase 3 — Provider, normalized history, scheduler

**References:** trading-bb providers/cache/budget, Stock-Market-Intelligence registry/tasks, market-data-api service/models.

- DB: normalized source, quote/snapshot, provider health/cache records with indexes.
- Backend: provider interface (`quote`, `history`, `events`), explicit `DATA_MODE=demo|live`, source-of-record/secondary comparison, normalized DTOs.
- Jobs: `backend/scheduler.py` loads distinct active symbols, refreshes every five minutes in sessions / close otherwise, writes health/audit records; manual refresh is secondary.
- Frontend: provider status, real-time/delayed/stale/missing/conflict states and retry.
- Tests: demo determinism, live adapter contract, 429/nonfatal provider failure, scheduler active-watch filter.
- **Acceptance:** demo scheduler independently produces persisted history/health for active watches; live mode never falls back silently to demo.

## Phase 4 — Signal, insight, evidence and catch-up state

**References:** trading-bb indicators/divergence/cache, Stock-Market-Intelligence scoring engine.

- DB: benchmark, sector, peer relationships; snapshot-derived signals; versioned insights, evidence and user watchlist/stock state markers.
- Backend: rolling prior close, 30-day comparable volume, 90-day top-three unusualness, volatility change, benchmark/peer divergence, event match; fixed scheduled shared calculation.
- API: cache-backed Home returns catch-up, reviewed state, pulse, context, watchlist freshness and partial-failure metadata.
- Frontend: dominant catch-up, Significant → Notable/rank/recency, five cap, expandable overflow, pulse filters, designed zero-change.
- Tests: all boundaries in PRD, cold start, no request-time recompute, cap/overflow, acknowledged baseline and material resurface.
- **Acceptance:** two users consume one shared insight; Home changes only after explicit acknowledgement/material update, not page open.

## Phase 5 — Review actions and stock detail

**References:** frontend stock card; Stock-Market-Intelligence `PriceChart`, `WhyMovingCard`.

- DB/API: item and thread acknowledgement at user scope; stock detail read model includes baseline/current timestamps, absolute/% change, signals/evidence/confidence, freshness and reviewed state; history-series endpoint.
- Frontend: review/review-all; detail header, before/now, evidence, price-volume-volatility, confidence/freshness; Recharts/Chart.js timeframe chart from snapshot API with baseline/event markers.
- Tests: review persists reload/device, history remains visible, no automatic review, history/chart empty/partial failure.
- **Acceptance:** click a catch-up card → fact-backed detail → explicit review → Home removes it while detail timeline remains.

## Phase 6 — Events, unified timeline, threads and context

**References:** trading-bb `news.py`; Stock-Market-Intelligence adapters/tasks/sector service.

- DB: event source URL/payload, security/sector/global scope, event-insight link, threads/resolution/membership.
- Backend: provider event ingestion; ±4h matching; layer filters; minor-event count; same entity/category within 72h grouping; resolved after five trading days; strict domestic/global linking only when timing and co-movement thresholds pass.
- API/UI: `/timeline?layer=`, source/timestamp cards, All/Company/Sector/Domestic/Global filter, expand minor updates and thread chronology/status.
- Context: benchmark, sector, peer return panels; label contextual rather than causal unless strict link exists.
- Tests: event match edges, ordering, filters, thread grouping/resolution, link false positives.
- **Acceptance:** timeline is persisted/API-backed and has no synthetic news; price succeeds while news failure is visibly nonblocking.

## Phase 7 — Preferences and temporary watches

- DB/API: five interest toggles, threshold override, stock/category mute, permanent/date/event-bound expiry; validation/ownership.
- Frontend: Settings saves with status; per-entry management; disclose that preferences alter visibility/order, not objective tier.
- Tests: persistence across login/device, expired entries excluded from scheduler/catch-up, significant item is never muted.
- **Acceptance:** setting/control survives reload and affects only permitted user-layer behavior.

## Phase 8 — Product states, responsive/accessibility and test gates

**References:** frontend skeleton/lazy primitives and mobile drawer; reference Jest/Playwright setup.

- Build loading skeletons per screen/section, empty/cold-start, zero-change, partial-failure, full-error/retry, stale/conflict states.
- Verify at desktop/tablet/mobile: navigation, search, cards, chart, detail, timeline; no desktop table dependency on phone.
- Add unit/service/API/browser suites plus accessibility keyboard/focus checks and Home latency measurement.
- **Acceptance:** the full demo acceptance flow passes: signup, add five, scheduler, varied tiers, catch-up, chart/context/timeline/thread, review, settings, persistent state, mobile. Live mode is separately tested and reports provider failures accurately.

## Phase 9 — Production hardening and documentation

- Add migrations, password-strength/rate limiting/CSRF session policy, audit logs/model input traceability, health/metrics, cache invalidation and deployment configuration.
- Update existing architecture/API/testing/significance documents only to describe verified behavior.
- **Acceptance:** authenticated ownership test, Home cached-read target, provider health visibility, operational runbook.
