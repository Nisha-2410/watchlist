"""Persisted cache used by scheduled ingestion; stale values survive transient outages."""
from __future__ import annotations

import json
import threading
from datetime import datetime, timedelta, timezone

from backend.providers.base import Snapshot

_locks = {}
_locks_guard = threading.Lock()

def _lock_for(key):
    with _locks_guard:
        return _locks.setdefault(key, threading.Lock())


def history_or_fetch(connection, key, ttl_seconds, fetch):
    row = connection.execute("SELECT value_json,refreshed_at FROM provider_cache WHERE cache_key=?", (key,)).fetchone()
    now = datetime.now(timezone.utc)
    payload = json.loads(row["value_json"]) if row else None
    cached = [Snapshot(datetime.fromisoformat(x["timestamp"]), x["price"], x["volume"]) for x in payload["values"]] if payload else None
    if row and datetime.fromisoformat(row["refreshed_at"]) + timedelta(seconds=ttl_seconds) > now:
        return cached, payload["source"], False
    lock = _lock_for(key)
    # A concurrent refresh serves stale data instead of issuing a duplicate call.
    if cached is not None and not lock.acquire(blocking=False):
        return cached, payload["source"], True
    if cached is None:
        lock.acquire()
    try:
        values, source = fetch()
        encoded = json.dumps({"source": source, "values": [{"timestamp": x.timestamp.isoformat(), "price": x.price, "volume": x.volume} for x in values]})
        connection.execute("INSERT INTO provider_cache(cache_key,value_json,refreshed_at) VALUES(?,?,?) ON CONFLICT(cache_key) DO UPDATE SET value_json=excluded.value_json,refreshed_at=excluded.refreshed_at", (key, encoded, now.isoformat()))
        connection.commit()
        return values, source, False
    except Exception:
        if cached is not None: return cached, payload["source"], True
        raise
    finally:
        lock.release()
