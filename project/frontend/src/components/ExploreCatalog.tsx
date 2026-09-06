import { useEffect, useState } from "react";
import { CirclePlus, SlidersHorizontal } from "lucide-react";
import { api, ApiRequestError } from "../api";
import type { ExploreResponse } from "../types";
import { ErrorState } from "./ErrorState";
import { LoadingSkeleton } from "./LoadingSkeleton";

export function ExploreCatalog({ onNeedAuth }: { onNeedAuth: () => void }) {
  const [data, setData] = useState<ExploreResponse | null>(null);
  const [sort, setSort] = useState<"move" | "price">("move");
  const [sector, setSector] = useState("All");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setError(null);
    try { setData(await api.explore(sort, sector === "All" ? "" : sector)); }
    catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) onNeedAuth();
      else setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [sort, sector]);

  if (loading && !data) return <LoadingSkeleton variant="watchlist" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return null;

  return (
    <section className="space-y-space-lg">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-space-md">
        <div><h2 className="font-headline-lg text-headline-lg">Explore the catalog</h2><p className="font-body-md text-text-secondary">Browse current quotes beyond your watchlist. Prices appear as catalog refreshes reach each symbol.</p></div>
        <div className="flex flex-wrap items-center gap-space-xs">
          <span className="inline-flex items-center gap-1 font-label-sm text-text-muted"><SlidersHorizontal size={15} /> Sort</span>
          {(["move", "price"] as const).map((value) => <button key={value} type="button" onClick={() => setSort(value)} className={`rounded-full px-3 py-1.5 font-label-sm capitalize ${sort === value ? "bg-surface-elevated text-primary shadow-glow" : "text-text-secondary hover:bg-surface-container-high"}`}>{value === "move" ? "Biggest moves" : "Price"}</button>)}
        </div>
      </div>
      <div className="flex gap-space-xs overflow-x-auto pb-1">
        {["All", ...data.sectors].map((value) => <button key={value} type="button" onClick={() => setSector(value)} className={`shrink-0 rounded-full px-3 py-1.5 font-label-sm ${sector === value ? "bg-surface-elevated text-primary shadow-glow" : "bg-surface-lifted text-text-secondary hover:bg-surface-container"}`}>{value}</button>)}
      </div>
      {loading ? <div className="h-1 rounded bg-primary/30 animate-pulse" /> : null}
      <div className="space-y-space-xs">
        {data.items.map((item) => {
          const moveClass=item.move == null ? "text-text-muted" : item.move < 0 ? "text-negative-coral" : "text-primary-fixed-dim";
          return <article key={item.symbol} className="flex flex-col sm:flex-row sm:items-center gap-space-md rounded-xl border border-surface-border bg-surface-lifted p-space-md hover:bg-surface-elevated transition-colors">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-container-high font-label-md text-primary">{item.symbol.slice(0,2)}</div>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-space-xs"><h3 className="font-headline-sm">{item.symbol}</h3><span className="font-body-sm text-text-muted">{item.exchange}</span></div><p className="truncate font-body-sm text-text-secondary">{item.name} · {item.sector}</p></div>
            <div className="sm:text-right"><p className="font-label-md text-text-primary">{item.price == null ? "—" : item.price.toFixed(2)}</p><p className={`font-body-sm ${moveClass}`}>{item.move == null ? item.status : `${item.move >= 0 ? "+" : ""}${item.move.toFixed(1)}%`}</p></div>
            {item.watching ? <span className="rounded-lg bg-surface-container px-3 py-2 font-label-sm text-text-muted">Watching</span> : <button type="button" onClick={() => { window.location.hash=`#/watchlist?add=${encodeURIComponent(item.symbol)}`; }} className="inline-flex items-center justify-center gap-1 rounded-lg bg-surface-container-high px-3 py-2 font-label-md text-primary hover:bg-surface-elevated"><CirclePlus size={16} /> Add</button>}
          </article>;
        })}
      </div>
      {!data.items.length ? <p className="font-body-md text-text-muted">No securities match this sector.</p> : null}
    </section>
  );
}
