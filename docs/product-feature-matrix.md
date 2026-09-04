# Smart Market Watchlist product feature matrix

Status: **planned** unless the complete DB → backend → API → UI → interaction → persistence → test chain is marked verified. Existing fragments are deliberately not marked complete.

| ID | Product feature | DB | Backend/API | Frontend/interaction | Test | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | Signup, login, logout, route guard | users/sessions | session service and auth middleware | dedicated login/signup, logout | browser/session isolation | P0 | Partial |
| A2 | One watchlist, add/remove, 100 cap | watch entry | user-scoped CRUD | management screen and confirmation | persistence/login regression | P0 | Partial |
| A3 | Security search | security master/aliases | normalized search service | keyboard result list/select/add | symbol/name/exchange tests | P0 | Partial |
| A4 | Temporary watch | type, date/event expiry | active-membership filter | type/date controls/expired display | expiry exclusion | P1 | Planned |
| M1 | Live/demo provider abstraction | provider config/cache | normalized quote/history/events adapters | provider/freshness state | adapter contract tests | P0 | Partial |
| M2 | Snapshots/history | snapshot table/indexes | scheduled ingestion | history/chart endpoint | 30/90-day calculations | P0 | Partial |
| M3 | Data quality/conflicts | source records/conflict flag | source-of-record/comparison | delayed/stale/conflict UI | provider failure cases | P0 | Planned |
| I1 | Signals | snapshots, benchmark/peer maps | absolute/relative/volume/volatility/event/unusualness | none; API facts only | boundaries/missing data | P0 | Partial |
| I2 | Significance/confidence/evidence | versioned insight/evidence | scheduled shared compute | tier/confidence/evidence render | audit/recompute tests | P0 | Partial |
| I3 | Catch-up/baseline/ranking | ack/state markers | cached Home read model | cap 5, overflow, zero-change | user journey/cap tests | P0 | Planned |
| I4 | Review/review-all/resurface | acknowledgement/version | item/thread acknowledgement | explicit action optimistic update | refresh/material-update tests | P0 | Partial |
| D1 | Stock detail/before-now | snapshot/baseline | detail read model | header, metrics, evidence | endpoint/browser test | P0 | Partial |
| D2 | Historical chart | snapshots/events | history series endpoint | timeframe, tooltip, markers | chart state tests | P0 | Planned |
| C1 | Sector/benchmark/peers | sector/benchmark/peer tables | comparative context service | comparable context panels | divergence tests | P1 | Planned |
| E1 | Events and matching | normalized events/links | provider ingestion/match ±4h | evidence/source status | match boundary tests | P0 | Planned |
| E2 | Unified timeline/minor updates | events | timeline filter/read model | layer filters/collapse | chronology/filter tests | P0 | Partial |
| E3 | Event threads/cross-layer links | threads/event links | 72h grouping/resolution/strict linking | expandable active/resolved thread | grouping/link tests | P1 | Planned |
| P1 | Interest/threshold/mutes | preferences/entry settings | user preference service | persisted controls | cross-session tests | P1 | Planned |
| U1 | Home UI states | n/a | error contracts | loading/empty/zero/partial/error/populated | visual/e2e | P0 | Partial |
| U2 | Responsive/accessibility | n/a | n/a | desktop/tablet/mobile/focus | viewport/a11y checks | P0 | Planned |
| N1 | Performance/security/observability | audit/cache | jobs/cache/auth/rate limits | n/a | latency/ownership tests | P0 | Planned |
