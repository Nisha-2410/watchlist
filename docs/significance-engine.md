# Significance engine

Model identifier: `significance-v1`.

For a common security window, the backend calculates absolute move, relative move against the relevant benchmark, comparable-volume ratio, matched event, and peer divergence. This is shared market intelligence, not per-user calculation.

| Tier | Rule |
| --- | --- |
| Normal | Neither absolute move is at least 3% nor volume ratio at least 2x. |
| Notable | Absolute move is at least 3% or comparable volume is at least 2x. |
| Significant | Absolute or relative move is at least 6%, or a Notable signal has matched-event, strong-relative, or peer-divergence corroboration. |

The internal rank score is used only to sort within a tier. It is never returned as a user-facing score. Confidence is Low for a single contributor, High for two or more agreeing independent contributors, and capped at Medium when the primary data is stale or a secondary source conflicts. Evidence is emitted as discrete source facts, not generated causal prose.

Significance must run on a scheduled worker in production (every five minutes during market hours and once at close), persist a versioned shared insight, and be read from cache by Home.
