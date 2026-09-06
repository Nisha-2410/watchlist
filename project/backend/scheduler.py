"""Simple scheduled market refresh for local development and single-node deployment.

Run `python -m backend.scheduler --once` for a one-off cycle, or omit `--once`
to refresh active entries every five minutes. The job never runs on page reads.
"""
import argparse
import time
from backend import store, pipeline

INTERVAL_SECONDS = 300

def cycle():
    store.init(); c=store.con()
    symbols=[r['symbol'] for r in c.execute("SELECT DISTINCT symbol FROM watch_entries WHERE expires_at IS NULL OR expires_at > ?",(store.now(),)).fetchall()]
    c.close(); successes=0
    for symbol in symbols:
        try: pipeline.refresh(symbol); successes+=1
        except Exception as error: print(f"refresh failed for {symbol}: {error}")
    print(f"refreshed {successes}/{len(symbols)} active securities")

def news_cycle():
    """Run independently (for example hourly) when NEWS_PROVIDER is configured."""
    store.init(); c=store.con(); symbols=[r['symbol'] for r in c.execute("SELECT DISTINCT symbol FROM watch_entries WHERE expires_at IS NULL OR expires_at > ?",(store.now(),)).fetchall()]; c.close()
    for symbol in symbols:
        try: pipeline.ingest_news(symbol)
        except Exception as error: print(f"news ingestion failed for {symbol}: {error}")

def run_forever():
    """Run refresh cycles every five minutes for the single-process deployment."""
    while True:
        cycle()
        time.sleep(INTERVAL_SECONDS)

if __name__ == '__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--once',action='store_true'); args=parser.parse_args()
    if args.once:
        cycle()
    else:
        run_forever()
