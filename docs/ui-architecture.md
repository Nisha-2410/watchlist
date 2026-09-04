# UI architecture

The browser client uses one focused shell with Home, Watchlist, and Settings navigation. A hash route opens `/stock/:symbol` in the same client without duplicating market intelligence in the UI.

Home is ordered as header, catch-up, pulse, context, then raw watchlist. The reusable presentation units are a catch-up card, tier pill, evidence list, compact metrics, timeline, and watchlist table. The catch-up list is capped at five before rendering.

Responsive behavior moves the catch-up grid and detail grid to one column on narrow screens; the full watchlist keeps a horizontal scroll container instead of hiding fields. Buttons have native focus behavior and semantic labels on the search control.

The client owns route, filters, local transition feedback, and the local-demo acknowledgement display state. The server owns shared market payloads and is the intended owner of future baseline, evidence, tier, confidence, and authorization state. Loading or API failure falls back to an explicit unavailable context rather than claiming live data.
