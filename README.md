# Smart Market Watchlist

An evidence-first watchlist: it surfaces only the changes that may deserve attention, shows the underlying facts and data quality, and lets a user mark those changes reviewed.

## Run locally

```powershell
python backend/server.py
```

Open `http://localhost:8000`. The local server starts in explicit **demo mode** (`DEMO_MODE=true`) and labels all values as demo data. It is not a live-data claim.

## Production configuration

Set `DEMO_MODE=false` and add a supported provider adapter plus credentials before production use. The `backend/server.py` interfaces demonstrate the boundary; a production service must also supply authenticated sessions, durable shared storage, scheduled ingestion, rate limits, and an approved data licence. See `docs/implementation-gap-analysis.md`.
