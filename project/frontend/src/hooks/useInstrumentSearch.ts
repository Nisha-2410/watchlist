import { useEffect, useState } from "react";
import { api } from "../api";
import type { SecuritySearchHit } from "../types";

/** Shared debounced instrument search for the global search and watchlist drawer. */
export function useInstrumentSearch() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SecuritySearchHit[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void api.search(query).then((response) => setHits(response.results)).catch(() => setHits([]));
    }, 200);
    return () => window.clearTimeout(handle);
  }, [query]);

  return { query, setQuery, hits };
}
