# API contracts

## `GET /api/home`

Returns a consolidated read model: `watchlist`, `pulse`, `marketContext`, `baseline`, `updated`, `generatedAt`, and `demo`. A quote includes `symbol`, identity metadata, price, move, relative move, volume ratio, tier, confidence, evidence, freshness, update time, and watch type.

`freshness` is mandatory for price and volume. Production payloads will add a provider/source identifier, source timestamp, data-quality conflict flag, and a versioned model identifier.

## `GET /api/stocks/:symbol`

Returns `{ stock, baseline }` for a known symbol. Unknown symbols return `404` with `{ error }`.

## `POST /api/acknowledgments`

The local demo returns `{ ok: true, demo: true }`; the browser maintains acknowledgement state locally only. Production must require authentication, accept an item or event-thread identifier, persist the user-scoped acknowledgement baseline, and return the revised read model or acknowledgment timestamp.

## Errors

Unknown API routes return a JSON `404`. The client does not label failed or missing data as current, live, or real-time.
