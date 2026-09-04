# Testing strategy

Current executable coverage verifies deterministic tier boundaries and confidence data-quality caps in `tests/test_significance.py`. Basic runtime validation checks Python compilation, JavaScript parsing, and the Home and Stock API endpoints.

Before production, add API tests for authenticated ownership, add/remove limits, temporary expiry, cold start, baseline selection, acknowledgement persistence, source conflicts, partial provider failure, and cache-backed Home latency. Browser tests should cover zero-change copy, five-item cap with overflow, review removal, detail navigation, mobile table scrolling, and keyboard navigation.
