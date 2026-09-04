# Implementation decisions

- The source project was blank, so the first implementation is a compact dependency-free client and Python standard-library local API rather than a large framework scaffold.
- Demo mode is explicit in both server response and UI. The demonstration fixture is not an implied real market data integration.
- No reference implementation was copied. Their MIT licensing was verified; their useful patterns informed the separation of data access, component presentation, and future provider interfaces.
- LocalStorage represents user review state only for local development. It is deliberately not presented as authentication or durable multi-user persistence.
- The deterministic engine has been separated into `backend/significance.py` so it can move behind scheduled ingestion without moving classification into the browser.
