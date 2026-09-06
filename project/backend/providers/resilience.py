"""Small SQLite-backed rate budget and priority failover router."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os


class AllProvidersExhausted(RuntimeError):
    pass


class BudgetGuard:
    def __init__(self, connection, limit=None, window_seconds=3600, cooldown_seconds=900):
        self.connection = connection
        # 20 symbols × (60 / 5 min) = 240 routine calls/hour; +60 for new-symbol
        # 3mo backfills and reserve-then-fail retries. Override with QUOTE_CALL_LIMIT.
        self.limit = limit if limit is not None else int(os.getenv("QUOTE_CALL_LIMIT", "300"))
        self.window_seconds = window_seconds
        self.cooldown_seconds = cooldown_seconds

    def reserve(self, provider):
        now = datetime.now(timezone.utc)
        row = self.connection.execute("SELECT * FROM provider_budgets WHERE provider=?", (provider,)).fetchone()
        if row and row["cooldown_until"] and datetime.fromisoformat(row["cooldown_until"]) > now:
            return False
        if not row or datetime.fromisoformat(row["window_started"]) + timedelta(seconds=self.window_seconds) <= now:
            self.connection.execute("""INSERT INTO provider_budgets(provider,window_started,call_count,cooldown_until)
                VALUES(?,?,1,NULL) ON CONFLICT(provider) DO UPDATE SET window_started=excluded.window_started,call_count=1,cooldown_until=NULL""", (provider, now.isoformat()))
            self.connection.commit(); return True
        if row["call_count"] >= self.limit: return False
        self.connection.execute("UPDATE provider_budgets SET call_count=call_count+1 WHERE provider=?", (provider,)); self.connection.commit()
        return True

    def record_failure(self, provider, error):
        text = str(error).lower()
        if any(code in text for code in ("401", "403", "429", "quota", "rate limit", "authentication")):
            until = (datetime.now(timezone.utc) + timedelta(seconds=self.cooldown_seconds)).isoformat()
            self.connection.execute("UPDATE provider_budgets SET cooldown_until=? WHERE provider=?", (until, provider)); self.connection.commit()


class ProviderRouter:
    """Use the first provider that can deliver data; failures exhaust only that provider."""
    def __init__(self, providers, budget):
        self.providers, self.budget, self.failures = providers, budget, []

    def history(self, symbol):
        return self._fetch(symbol, "history")

    def recent_history(self, symbol):
        """Prefer a provider's short-window fetch; QuoteProvider.history remains the fallback."""
        return self._fetch(symbol, "recent_history")

    def _fetch(self, symbol, method):
        self.failures = []
        for provider in self.providers:
            if not self.budget.reserve(provider.name):
                self.failures.append((provider.name, RuntimeError("provider budget or cooldown is active"))); continue
            try:
                fetch = getattr(provider, method, provider.history)
                result = fetch(symbol)
                if not result: raise RuntimeError("provider returned no snapshots")
                return result, provider.name
            except Exception as error:
                self.budget.record_failure(provider.name, error); self.failures.append((provider.name, error))
        raise AllProvidersExhausted(f"No quote provider available for {symbol}")
