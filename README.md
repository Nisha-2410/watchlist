# Smart Market Watchlist

An evidence-first market watchlist. It tracks selected securities, classifies price and volume changes as **Normal**, **Notable**, or **Significant**, and adds peer, sector-benchmark, and event-timeline context. It is an observation and review tool—not a trading application.

## Table of contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Configuration](#configuration)
- [Importing securities](#importing-securities)
- [Demo and live modes](#demo-and-live-modes)
- [Scheduler](#scheduler)
- [API reference](#api-reference)
- [Render deployment](#render-deployment)
- [Screenshots](#screenshots)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Status and limitations](#status-and-limitations)

## Architecture

The runnable application lives in [`project/`](project/).

| Area | Actual implementation | Responsibility |
| --- | --- | --- |
| HTTP/API server | Python stdlib `ThreadingHTTPServer` in [`project/backend/server.py`](project/backend/server.py) | Serves the built React app and JSON endpoints under `/api/*`. |
| Database | SQLite, initialized in [`project/backend/store.py`](project/backend/store.py) and stored at `project/backend/watchlist.db` | Users, sessions, security universe, watches, preferences, snapshots, events, provider state, and derived insights. |
| Ingestion/classification | [`project/backend/pipeline.py`](project/backend/pipeline.py), [`project/backend/significance.py`](project/backend/significance.py) | Fetches snapshots, calculates tiers/confidence, and derives volume, historical, peer, sector, and event context. |
| Scheduler | [`project/backend/scheduler.py`](project/backend/scheduler.py) | Refreshes active watches every 300 seconds; page reads do not trigger refreshes. |
| Provider layer | [`project/backend/providers/`](project/backend/providers/) | Selects demo/Yahoo quotes; handles persistent cache, budgets, cooldowns, and provider health. |
| Frontend | React, TypeScript, Vite, Tailwind in [`project/frontend/`](project/frontend/) | Auth, catch-up, global instrument search, Explore, watchlist, stock detail, preferences, and the editorial UI. The production server serves `frontend/dist`. |

On a symbol’s first refresh, the provider backfills three months of daily bars to establish volume/history baselines. Subsequent cycles use one day of five-minute bars. Quote results are cached for 300 seconds.

## Prerequisites

This checkout was verified with Python **3.12.10**, Node.js **v24.16.0**, and npm **11.13.0**. The launcher probes common Windows Python 3.11, 3.12, and 3.13 locations before falling back to `python`/`py`.

There is **no Python dependency manifest** in this repository—no `requirements.txt`, `pyproject.toml`, or `Pipfile`; the backend uses the standard library. Frontend packages and the lockfile are in [`project/frontend/package.json`](project/frontend/package.json) and [`project/frontend/package-lock.json`](project/frontend/package-lock.json).

## Setup

1. Clone and enter the application directory.

   ```powershell
   git clone <repository-url> smart-market-watchlist
   cd smart-market-watchlist\project
   ```

2. Install launcher and frontend packages, then build the frontend. The server at port 8000 serves `frontend/dist`, so this build is required.

   ```powershell
   npm install
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. Initialize SQLite. This is idempotent and also seeds a small reference universe.

   ```powershell
   python -c "from backend import store; store.init()"
   ```

4. Start the server and open [http://localhost:8000](http://localhost:8000).

   ```powershell
   npm run dev
   ```

   `dev`, `start`, and `server` in [`project/package.json`](project/package.json) all run `node run.js`, which launches `python -m backend.server`.

### Frontend development server

Keep the backend running, then use Vite in another terminal for hot reload:

```powershell
cd project\frontend
npm run dev
```

Vite listens on [http://localhost:5173](http://localhost:5173) and proxies `/api` to port 8000.

## Configuration

Set these environment variables in the shell that starts the server or scheduler.

| Variable | Default | Behavior |
| --- | --- | --- |
| `DATA_MODE` | unset | Explicit `demo` or `live`; takes precedence over `DEMO_MODE`. Any other value fails validation. |
| `DEMO_MODE` | `true` | Legacy fallback only when `DATA_MODE` is unset. `false` selects live mode. |
| `QUOTE_PROVIDER` | `yahoo` | Comma-separated requested live providers. Only `yahoo` is registered currently. |
| `QUOTE_CALL_LIMIT` | `360` | Per-provider hourly budget. 20 symbols × 12 five-minute cycles = 240 calls/hour, leaving 120 calls (50%) headroom. |
| `NEWS_PROVIDER` | `none` | News selection. `none` is the only supported value in this checkout. |

```powershell
$env:DATA_MODE = 'demo'
npm run dev
```

```powershell
$env:DATA_MODE = 'live'
$env:QUOTE_PROVIDER = 'yahoo'
$env:QUOTE_CALL_LIMIT = '360'
$env:NEWS_PROVIDER = 'none'
npm run dev
```

## Importing securities

[`project/backend/import_securities.py`](project/backend/import_securities.py) imports a local/licensed CSV; it never downloads an unlicensed security universe. Run it from `project/`:

```powershell
python -m backend.import_securities path\to\securities.csv
```

Required columns: `symbol`, `name`, `exchange`, `sector`. Optional columns: `benchmark_symbol`, `peers`. `peers` is pipe-separated.

```csv
symbol,name,exchange,sector,benchmark_symbol,peers
AAPL,Apple Inc.,NASDAQ,Technology,MSFT,MSFT|NVDA
MSFT,Microsoft Corp.,NASDAQ,Technology,MSFT,AAPL|NVDA
```

The import upserts securities and sector benchmarks and adds non-duplicated peer relationships.

The checked-in sample catalog is [`project/backend/securities.csv`](project/backend/securities.csv). Import it from `project/`:

```powershell
& "C:\Users\Dell\AppData\Local\Programs\Python\Python312\python.exe" -m backend.import_securities backend\securities.csv
```

## Demo and live modes

| Mode | Quote behavior | User-visible behavior |
| --- | --- | --- |
| Demo | `DemoProvider` generates deterministic simulated history. | Data is labelled demo; it is not represented as live market data. |
| Live | Yahoo backfills `3mo/1d` only with zero stored snapshots, then refreshes with `1d/5m` bars. | Provider data and derived context are shown. Live failures never silently fall back to demo data. |

Live mode does not add real news. Timeline sample rows remain explicitly labelled `sample-context`, not live filings or news.

## Scheduler

Run from `project/` after initialization.

One cycle:

```powershell
python -m backend.scheduler --once
```

Continuous five-minute loop:

```powershell
python -m backend.scheduler
```

The scheduler also refreshes one catalog security per minute for Explore. This quote-only catalog refresh does not run the significance engine for securities that are not watched.

`POST /api/refresh` performs the same refresh synchronously for the current user’s active watches. `news_cycle()` exists but should not be scheduled until a licensed news provider is implemented.

## API reference

All endpoints return JSON. “Yes” means a signed-in session cookie is required.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | No | Create user, default preferences, and session. |
| `POST` | `/api/auth/login` | No | Authenticate and issue a session. |
| `POST` | `/api/auth/logout` | No | Remove the current session when present. |
| `GET` | `/api/home` | Yes | Watchlist, ranked catch-up items, pulse, sector context. |
| `GET` | `/api/search?q=<query>` | Yes | Search security symbol/name/exchange/sector; maximum eight results. |
| `GET` | `/api/explore?sort=move|price&sector=<sector>` | Yes | Browse the full imported catalog with the latest known price, move, and current-user watch state. |
| `GET` | `/api/watchlist/manage` | Yes | Watch-management entries and muted categories. |
| `POST` | `/api/watchlist` | Yes | Add `symbol`; accepts optional `watchType` and `expiresAt`. |
| `DELETE` | `/api/watchlist/:symbol` | Yes | Remove a watch. |
| `POST` | `/api/watchlist/manage` | Yes | Update `threshold`, `mute`, `watchType`, and/or `expiresAt`. |
| `GET` | `/api/stocks/:symbol` | Yes | Security, insight, comparison, history, timeline, context, and review state. |
| `GET` | `/api/stocks/:symbol/timeline?layer=<layer>` | Yes | Events and threads; layer is optional. |
| `POST` | `/api/acknowledgments` | Yes | Mark the current insight for `symbol` reviewed. |
| `POST` | `/api/refresh` | Yes | Refresh all active watches for the current user. |
| `GET` | `/api/settings` | Yes | Interest preferences and muted categories. |
| `POST` | `/api/settings` | Yes | Update `price`, `volume`, `news`, `earnings`, and/or `corporate_actions`. |
| `POST` | `/api/settings/muted-categories` | Yes | Add/remove a category with `category` and `muted`. |

## Render deployment

This repository includes [`render.yaml`](render.yaml) for one Render Web Service. It serves the React production build and API from the same origin, so no separate frontend hosting or CORS configuration is required.

1. Build the frontend locally whenever frontend source changes. Render's configured Python service serves the committed `project/frontend/dist` output; it does not run the Vite build itself.

   ```powershell
   cd project\frontend
   npm run build
   cd ..\..
   ```

2. Commit and push both the source changes and the generated `project/frontend/dist` changes to the branch linked in your Render service.

   ```powershell
   git add README.md render.yaml project/frontend/src project/frontend/dist project/backend/server.py project/backend/scheduler.py project/backend/pipeline.py project/backend/store.py project/backend/import_securities.py project/backend/securities.csv
   git commit -m "Update Smart Market Watchlist"
   git push origin main
   ```

3. In Render, confirm the service uses repository root directory `project`, start command `python -m backend.server`, and Auto-Deploy is **On Commit**. A push to the linked branch then rebuilds and deploys automatically. If Auto-Deploy is off, use **Manual Deploy → Deploy latest commit** instead.

4. Share the service's public `https://<your-service>.onrender.com` URL. Do not share the Render dashboard URL, deploy hooks, or environment-variable values. Visitors can reach the app and create their own local app account/session.

Render's default filesystem is ephemeral. Without a paid persistent disk, `project/backend/watchlist.db` is reset on a restart or redeploy; that includes local users, watches, imported securities, and cached quotes. Attach a persistent disk and move the DB there for a durable demo, or migrate to hosted Postgres for production.

## Screenshots

No screenshots are fabricated or committed. After running the app, capture the signed-in dashboard and a stock-detail view, save them as `docs/screenshots/dashboard.png` and `docs/screenshots/stock-detail.png`, then update these paths if you use different names.

![Dashboard screenshot placeholder](docs/screenshots/dashboard.png)

![Stock detail screenshot placeholder](docs/screenshots/stock-detail.png)

## Testing

Backend tests, from `project/`:

```powershell
python -m unittest discover -s ..\tests -p "test_*.py"
```

Frontend type-check and production build:

```powershell
cd project\frontend
npm run build
```

## Troubleshooting

### Provider budget/cooldown or `No quote provider available`

The router persists provider budgets and applies a 15-minute cooldown for rate-limit/auth-like failures. Check `QUOTE_CALL_LIMIT`, `QUOTE_PROVIDER`, upstream availability, and the configured provider. Raising the local budget does not override Yahoo’s own limits.

### `No cached or fresh quote history for <symbol>`

The first fetch failed and there is no prior cached value. Verify configuration/network access, then run:

```powershell
python -m backend.scheduler --once
```

When a cache exists, transient failures deliberately serve stale cached data instead of invented demo data.

### Page blank or frontend assets return 404

Rebuild the static frontend, then restart the backend:

```powershell
cd project\frontend
npm run build
cd ..
npm run dev
```

### Unsupported provider configuration

Use `QUOTE_PROVIDER=yahoo` and `NEWS_PROVIDER=none`. Other identifiers currently raise an unsupported-provider error.

### Authentication required

Sign up or log in in the browser. The API uses an HTTP-only local `session` cookie; non-browser requests must provide it.

### Temporary watch is not refreshing

Expired temporary watches are intentionally excluded by the scheduler and refresh endpoint. Change it to permanent or set a future expiration.

## Status and limitations

This is deterministic v1 behavior. `significance-v1` uses objective code-defined price, volume, relative-move, peer, and historical-unusualness signals. Personal thresholds affect visibility/order only, never the objective tier.

- Yahoo is the only registered live quote provider.
- No real news provider is wired up; `NoopNewsProvider` returns no events. Sample timeline context is stored as `sample-context` and is illustrative only.
- SQLite, the standard-library HTTP server, and local sessions are appropriate for local/single-node use, not hardened multi-user deployment.
- Provider cache, health, and budgets persist in SQLite; stale cache is preferred over inventing data during transient outages.
- `rank_score` is internal-only sorting data and must never be exposed in the UI.
- No buy/sell controls or predictive recommendations are implemented.
