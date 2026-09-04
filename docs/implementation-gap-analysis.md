# Implementation gap analysis

## Starting point

The application directory was empty. The workspace supplies a final PRD, the Codex implementation prompt, and reference repositories, but no existing frontend, backend, database, authentication, or API routes to preserve.

## Implementation decision

This repository now starts with a dependency-free, responsive web client plus a small local API server. The server has an explicit **demo mode** for development and a provider boundary for production market data. Demo data is always labelled as such and is never described as live data.

## P0 coverage

- Focused Home, Watchlist, Settings, and Stock Detail routes.
- Catch-up ranking, review acknowledgement, five-item cap, overflow, and zero-change state.
- Evidence-first tiers, confidence, freshness, market context, raw watchlist, temporary watches, and stock detail timeline.
- A persistent local user state model for watchlist entries, acknowledgements, and preferences.
- A deterministic server-side classification module and consolidated home read model.

## Remaining production work

- Replace the local development identity with an authenticated session and tenant isolation.
- Configure a licensed primary quote/history/news provider and a secondary discrepancy source.
- Add scheduled ingestion, durable shared derived-insight storage, and background workers.
- Add provider-specific symbol search, corporate-action/news ingestion, observability, rate limiting, and deployment configuration.

## Recommended order

1. Add production authentication and PostgreSQL migrations.
2. Configure provider credentials and scheduled ingestion.
3. Replace demo fixtures with normalized market, event, and benchmark records.
4. Add automated API, significance-boundary, and browser tests.
