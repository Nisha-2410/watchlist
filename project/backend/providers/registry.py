"""Configuration-driven provider selection with no live-to-demo fallback."""
from __future__ import annotations

import os

from .news import NoopNewsProvider
from .quotes import DemoProvider, YahooProvider
from .resilience import BudgetGuard, ProviderRouter


def data_mode() -> str:
    # DEMO_MODE remains supported for existing local launches.
    configured = os.getenv("DATA_MODE")
    if configured:
        if configured.lower() not in {"demo", "live"}:
            raise ValueError("DATA_MODE must be 'demo' or 'live'")
        return configured.lower()
    return "demo" if os.getenv("DEMO_MODE", "true").lower() == "true" else "live"


def quote_providers(symbol: str):
    if data_mode() == "demo":
        return [DemoProvider()]
    names = [name.strip().lower() for name in os.getenv("QUOTE_PROVIDER", "yahoo").split(",") if name.strip()]
    available = {"yahoo": YahooProvider}
    try:
        return [available[name]() for name in names]
    except KeyError as error:
        raise ValueError(f"Unsupported quote provider: {error.args[0]}") from error


def quote_router(symbol, connection):
    """Build a priority router for the symbol's configured exchange/provider set."""
    return ProviderRouter(quote_providers(symbol), BudgetGuard(connection))


def news_provider():
    name = os.getenv("NEWS_PROVIDER", "none").lower()
    if name != "none":
        raise ValueError(f"Unsupported news provider: {name}")
    return NoopNewsProvider()
