"""Built-in quote adapters. Add licensed adapters here without changing pipeline code."""
from __future__ import annotations

import hashlib
import json
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

from .base import Snapshot


def yahoo_chart(symbol: str, range: str, interval: str = "1d") -> list[Snapshot]:
    """Fetch Yahoo chart bars. Backfill uses daily bars; routine refreshes use a short intraday window."""
    url = "https://query1.finance.yahoo.com/v8/finance/chart/{}?range={}&interval={}".format(
        urllib.parse.quote(symbol), urllib.parse.quote(range), urllib.parse.quote(interval)
    )
    with urllib.request.urlopen(url, timeout=12) as response:
        raw = json.load(response)["chart"]["result"][0]
    quote = raw["indicators"]["quote"][0]
    closes = raw["indicators"].get("adjclose", [{"adjclose": quote["close"]}])[0]["adjclose"]
    return [Snapshot(datetime.fromtimestamp(ts, timezone.utc), float(price), volume)
            for ts, price, volume in zip(raw["timestamp"], closes, quote["volume"])
            if price is not None]


class YahooProvider:
    name = "yahoo-finance"

    def history(self, symbol: str) -> list[Snapshot]:
        """One-time 3-month daily baseline used when a symbol has no stored snapshots yet."""
        return yahoo_chart(symbol, "3mo", "1d")

    def recent_history(self, symbol: str) -> list[Snapshot]:
        """Intraday window for scheduled 5-minute refreshes."""
        return yahoo_chart(symbol, "1d", "5m")

    def is_healthy(self) -> bool:
        return True


class DemoProvider:
    name = "demo"

    def history(self, symbol: str) -> list[Snapshot]:
        seed = int(hashlib.sha256(symbol.encode()).hexdigest()[:8], 16)
        base, current = 80 + seed % 900, datetime.now(timezone.utc)
        values = [Snapshot(current - timedelta(days=90 - day), round(base * (1 + ((seed >> day) % 7 - 3) * day / 5000), 2), 900000 + seed % 2000000 + day * 2000) for day in range(91)]
        prior = values[-2]
        values[-1] = Snapshot(current, round(prior.price * (1 + ((seed % 8) - 3) / 100), 2), prior.volume * (2 + seed % 2))
        return values

    def is_healthy(self) -> bool:
        return True
