"""Deterministic shared classification for a normalized market insight.

Version 1 keeps classification objective. User-specific thresholds are applied
after this module, only to visibility and ordering.
"""
from dataclasses import dataclass
from typing import Literal

Tier = Literal["Normal", "Notable", "Significant"]
Confidence = Literal["Low", "Medium", "High"]
MODEL_VERSION = "significance-v1"


@dataclass(frozen=True)
class Signals:
    absolute_move: float
    relative_move: float = 0
    volume_ratio: float = 1
    event_match: bool = False
    peer_divergence: bool = False
    stale: bool = False
    conflicting_sources: bool = False
    volatility: float = 0
    historical_unusualness: float = 0


def classify(signals: Signals) -> Tier:
    """Return the PRD's three user-facing objective tiers."""
    move = abs(signals.absolute_move)
    relative = abs(signals.relative_move)
    notable = move >= 3 or signals.volume_ratio >= 2
    corroborated = signals.event_match or signals.peer_divergence or relative >= 3 or signals.historical_unusualness >= 2
    if move >= 6 or relative >= 6 or (notable and corroborated):
        return "Significant"
    return "Notable" if notable else "Normal"


def confidence(signals: Signals) -> Confidence:
    """Data quality caps confidence; independent corroboration earns High."""
    contributors = sum((abs(signals.absolute_move) >= 3, signals.volume_ratio >= 2,
                        abs(signals.relative_move) >= 3, signals.event_match,
                        signals.peer_divergence, signals.historical_unusualness >= 2))
    value: Confidence = "High" if contributors >= 2 else "Low"
    if signals.stale or signals.conflicting_sources:
        return "Medium" if value == "High" else "Low"
    return value


def rank_score(signals: Signals) -> float:
    """Internal-only sort aid. Never expose this score in the product UI."""
    return abs(signals.absolute_move) + abs(signals.relative_move) + max(0, signals.volume_ratio - 1) + (2 if signals.event_match else 0) + (2 if signals.peer_divergence else 0)
