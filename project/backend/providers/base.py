"""Vendor-neutral shapes used by the ingestion pipeline."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol


@dataclass(frozen=True)
class Snapshot:
    timestamp: datetime
    price: float
    volume: float | None


@dataclass(frozen=True)
class NewsEvent:
    layer: str
    category: str
    title: str
    detail: str | None
    timestamp: datetime


class QuoteProvider(Protocol):
    name: str
    def backfill(self, symbol: str) -> list[Snapshot]: ...
    def refresh(self, symbol: str) -> list[Snapshot]: ...
    def is_healthy(self) -> bool: ...


class NewsProvider(Protocol):
    name: str
    def events(self, symbol: str) -> list[NewsEvent]: ...
    def is_healthy(self) -> bool: ...
