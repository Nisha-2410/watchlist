"""Simple scheduled market refresh for local development and single-node deployment.

Run `python -m backend.scheduler --once` for a one-off cycle, or omit `--once`
to refresh active entries every five minutes. The job never runs on page reads.
"""
import argparse
import time
from backend import store, pipeline

INTERVAL_SECONDS = 300
CATALOG_INTERVAL_SECONDS = 60
CATALOG_BATCH_SIZE = 1

def cycle():
    store.init(); c=store.con()
    symbols=[r['symbol'] for r in c.execute("SELECT DISTINCT symbol FROM watch_entries WHERE expires_at IS NULL OR expires_at > ?",(store.now(),)).fetchall()]
    c.close(); successes=0
    for symbol in symbols:
        try: pipeline.refresh(symbol); successes+=1
        except Exception as error: print(f"refresh failed for {symbol}: {error}")
    print(f"refreshed {successes}/{len(symbols)} active securities")

def catalog_cycle(batch_size=CATALOG_BATCH_SIZE):
    """Refresh a small, persisted slice of the full security catalog each minute."""
    store.init(); c=store.con()
    try:
        state=c.execute("SELECT last_symbol FROM catalog_refresh_state WHERE id=1").fetchone()
        last_symbol=state["last_symbol"] if state else ""
        rows=c.execute("SELECT symbol FROM securities WHERE symbol>? ORDER BY symbol LIMIT ?",(last_symbol,batch_size)).fetchall()
        if not rows:
            rows=c.execute("SELECT symbol FROM securities ORDER BY symbol LIMIT ?",(batch_size,)).fetchall()
    finally: c.close()
    successes=0
    for row in rows:
        symbol=row["symbol"]
        try: pipeline.catalog_refresh(symbol); successes+=1
        except Exception as error: print(f"catalog refresh failed for {symbol}: {error}")
        finally:
            c=store.con(); c.execute("INSERT INTO catalog_refresh_state(id,last_symbol,updated_at) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET last_symbol=excluded.last_symbol,updated_at=excluded.updated_at",(symbol,store.now())); c.commit(); c.close()
    print(f"catalog refreshed {successes}/{len(rows)} securities")

def news_cycle():
    """Run independently (for example hourly) when NEWS_PROVIDER is configured."""
    store.init(); c=store.con(); symbols=[r['symbol'] for r in c.execute("SELECT DISTINCT symbol FROM watch_entries WHERE expires_at IS NULL OR expires_at > ?",(store.now(),)).fetchall()]; c.close()
    for symbol in symbols:
        try: pipeline.ingest_news(symbol)
        except Exception as error: print(f"news ingestion failed for {symbol}: {error}")

def run_forever():
    """Run refresh cycles every five minutes for the single-process deployment."""
    next_watch=next_catalog=time.monotonic()
    while True:
        now=time.monotonic()
        if now>=next_watch:
            cycle(); next_watch=time.monotonic()+INTERVAL_SECONDS
        if now>=next_catalog:
            catalog_cycle(); next_catalog=time.monotonic()+CATALOG_INTERVAL_SECONDS
        time.sleep(max(0.1,min(next_watch,next_catalog)-time.monotonic()))

if __name__ == '__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--once',action='store_true'); args=parser.parse_args()
    if args.once:
        cycle()
    else:
        run_forever()
