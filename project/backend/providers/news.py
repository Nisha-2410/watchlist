"""News adapters; no provider means no invented live events."""
from __future__ import annotations

from .base import NewsEvent


class NoopNewsProvider:
    name = "none"

    def events(self, symbol: str) -> list[NewsEvent]:
        return []

    def is_healthy(self) -> bool:
        return True
