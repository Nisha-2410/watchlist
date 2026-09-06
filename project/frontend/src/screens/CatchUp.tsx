import { useEffect, useState } from "react";
import { api, ApiRequestError } from "../api";
import type { HomeResponse } from "../types";
import { CatchupItemCard } from "../components/CatchupItemCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { WatchlistPulse } from "../components/WatchlistPulse";
import { ZeroChangeState } from "../components/ZeroChangeState";
import { formatDateTime } from "../utils/date";

export function CatchUpScreen({ onNeedAuth }: { onNeedAuth: () => void }) {
  const [data, setData] = useState<HomeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [partial, setPartial] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const home = await api.home();
      setData(home);
      setPartial(home.watchlist.some((s) => s.price == null) && home.watchlist.some((s) => s.price != null));
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) onNeedAuth();
      else setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <LoadingSkeleton variant="catchup" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return null;
  if (!data.watchlist.length) {
    return <EmptyState title="Your watchlist is empty" detail="Add a security to start a briefing. Nothing is tracked until you choose it." action={{ label: "Add stock", onClick: () => { window.location.hash = "#/watchlist"; } }} />;
  }

  const unchanged = data.watchlist.filter((s) => s.tier === "Normal" || s.reviewed).length;

  return (
    <div className="space-y-space-xl">
      <header className="space-y-space-2xs">
        <p className="font-label-sm text-label-sm uppercase tracking-widest text-text-muted" title={data.updated}>{formatDateTime(data.updated)}</p>
        <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">Catch-up</h1>
        <p className="font-body-md text-body-md text-text-secondary">What meaningfully changed — not every print.</p>
        {data.demo ? <p className="font-body-sm text-body-sm text-tier-significant">Demo quotes are in use. This is not a live-data claim.</p> : null}
      </header>
      {partial ? (
        <div className="flex items-center justify-between gap-space-md p-space-md rounded-xl bg-surface-elevated">
          <p className="font-body-sm text-body-sm text-text-secondary">Some context is temporarily unavailable — price and volume are still current where shown.</p>
          <button type="button" onClick={() => void load()} className="font-label-md text-label-md text-primary">
            Retry
          </button>
        </div>
      ) : null}
      <WatchlistPulse pulse={data.pulse} onSelect={(tier) => { window.location.hash = `#/watchlist?tier=${tier}`; }} />
      {data.catchUp.length === 0 ? (
        <ZeroChangeState unchanged={unchanged} total={data.watchlist.length} />
      ) : (
        <div className="space-y-space-sm">
          {data.catchUp.map((item) => (
            <CatchupItemCard
              key={item.symbol}
              item={item}
              reviewing={reviewing === item.symbol}
              onView={() => { window.location.hash = `#/stocks/${item.symbol}`; }}
              onReview={async () => {
                setReviewing(item.symbol);
                try {
                  await api.acknowledge(item.symbol);
                  await load();
                } finally {
                  setReviewing(null);
                }
              }}
            />
          ))}
          {data.catchUpOverflow > 0 ? (
            <button type="button" onClick={() => { window.location.hash = "#/watchlist"; }} className="w-full py-space-sm rounded-xl bg-surface-lifted border border-surface-border font-label-md text-label-md text-text-secondary hover:text-text-primary">
              {data.catchUpOverflow} other notable change{data.catchUpOverflow === 1 ? "" : "s"}
            </button>
          ) : null}
        </div>
      )}
      {data.marketContext.length ? (
        <p className="font-body-sm text-body-sm text-text-muted">
          Sector context:{" "}
          {data.marketContext
            .slice(0, 3)
            .map((row) => `${row.sector} ${row.move >= 0 ? "+" : ""}${row.move.toFixed(1)}% (${row.tracked} tracked)`)
            .join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
