# Reference integration map

| Reference repo | Capability | Existing implementation | Quality | Decision | Files/modules | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| stock-intelligence-frontend | Shell/navigation | `dashboard-layout.tsx`, `sidebar.tsx`, responsive mobile drawer | Adapt | `app/app.js`, `app/styles.css` | Retained the focused persistent navigation and responsive collapse pattern; rejected its trading dashboard and visual noise. |
| stock-intelligence-frontend | Search | `global-search.tsx` has input filtering, keyboard navigation, portal dropdown | Adapt | planned API-backed search control | Reuse the interaction pattern, but search is backed by the security table rather than mock stocks. |
| stock-intelligence-frontend | Stock cards/charts/UI states | `stock-card.tsx`, charts, skeletons and tests | Rewrite | product catch-up/detail components | Their content is price-dashboard oriented and chart fallbacks are unsuitable for evidence-first catch-up. |
| trading-bb | Provider router and cache | `python_api/providers.py`, `cache.py`, `news.py`, `db.py` | Adapt | provider/store boundary | Its failover, provider budget and persistent stale-while-revalidate design is the production direction. |
| trading-bb | Peer divergence | `python_api/divergence.py` | Extract | significance enrichment | Robust peer-relative pattern is useful; social/trading scoring is rejected. |
| market-data-api | Persistence/jobs/observability | FastAPI services, Alembic, Redis/Kafka config | Inspire | deployment architecture | Adopt the durable-store, migration, health and metrics discipline; reject Kafka-heavy v1 scope. |
| Stock-Market-Intelligence | User-scoped watchlist | `services/watchlist.py`, entities and routes | Adapt | `backend/store.py` | Ownership-filtered persistence informed the SQLite watch-entry model. |
| Stock-Market-Intelligence | Provider registry/tasks/chart | `adapters/registry.py`, `etl/tasks.py`, `PriceChart.tsx` | Extract | provider worker and detail chart design | Registry, scheduled refresh and timeframe chart patterns fit; portfolio, AI, forecasts and alerts are rejected. |

All four inspected repositories are MIT licensed. No source code was copied; no attribution obligation is triggered. Provider packages/data services referenced by those projects remain subject to their own licences and terms.
