import { useEffect, useMemo, useState } from "react";
import { api, ApiRequestError } from "../api";
import type { ExploreResponse, HomeStock, SecuritySearchHit, WatchManageEntry } from "../types";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { WatchlistItemRow } from "../components/WatchlistItemRow";
import { CheckCircle2, CirclePlus, Info, Search, X } from "lucide-react";
import { useInstrumentSearch } from "../hooks/useInstrumentSearch";

function isoDaysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function WatchlistScreen({ initialTier, initialAddSymbol, onNeedAuth }: { initialTier: string; initialAddSymbol: string | null; onNeedAuth: () => void }) {
  const [entries, setEntries] = useState<WatchManageEntry[]>([]);
  const [homeBySymbol, setHomeBySymbol] = useState<Record<string, HomeStock>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState(initialTier || "All");
  const [menu, setMenu] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [pickerMode, setPickerMode] = useState<"search" | "explore">("search");
  const [explore, setExplore] = useState<ExploreResponse | null>(null);
  const [exploreSort, setExploreSort] = useState<"move" | "price">("move");
  const [exploreSector, setExploreSector] = useState("All");
  const [exploreLoading, setExploreLoading] = useState(false);
  const { query: search, setQuery: setSearch, hits } = useInstrumentSearch();
  const [picked, setPicked] = useState<SecuritySearchHit | null>(null);
  const [watchType, setWatchType] = useState<"permanent" | "temporary">("permanent");
  const [days, setDays] = useState(14);
  const [threshold, setThreshold] = useState("");
  const [personalize, setPersonalize] = useState<WatchManageEntry | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [manage, home] = await Promise.all([api.watchlistManage(), api.home()]);
      setEntries(manage.entries);
      setHomeBySymbol(Object.fromEntries(home.watchlist.map((s) => [s.symbol, s])));
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

  useEffect(() => {
    if (!initialAddSymbol) return;
    const symbol=initialAddSymbol.toUpperCase();
    setDrawer(true); setPickerMode("search"); setSearch(symbol); setPicked(null);
    void api.search(symbol).then(({ results }) => {
      setPicked(results.find((result) => result.symbol === symbol) ?? null);
    }).catch(() => undefined);
  }, [initialAddSymbol]);

  useEffect(() => {
    if (!drawer || pickerMode !== "explore") return;
    setExploreLoading(true);
    void api.explore(exploreSort, exploreSector === "All" ? "" : exploreSector)
      .then(setExplore)
      .catch(() => setExplore(null))
      .finally(() => setExploreLoading(false));
  }, [drawer, pickerMode, exploreSort, exploreSector]);

  function openDrawer() {
    setPicked(null);
    setSearch("");
    setPickerMode(entries.length === 0 ? "explore" : "search");
    setDrawer(true);
  }

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      const stock = homeBySymbol[entry.symbol];
      if (tier !== "All" && stock?.tier !== tier) return false;
      const q = query.trim().toUpperCase();
      if (!q) return true;
      return entry.symbol.includes(q) || entry.name.toUpperCase().includes(q);
    });
  }, [entries, homeBySymbol, query, tier]);

  if (loading) return <LoadingSkeleton variant="watchlist" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div>
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">Watchlist</h1>
          <p className="font-body-md text-body-md text-text-secondary">{entries.length} securities</p>
        </div>
        <button type="button" onClick={openDrawer} className="flex items-center gap-space-xs bg-primary-container text-on-primary-container hover:bg-primary shadow-primary-glow font-label-md text-label-md px-space-md py-2.5 rounded-lg">
          <CirclePlus size={18} aria-hidden="true" />
          Add stock
        </button>
      </section>
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg bg-surface-lifted p-space-sm rounded-xl">
        <div className="flex items-center flex-1 max-w-xl bg-surface-base rounded-lg px-space-sm h-[38px] gap-space-xs">
          <Search size={18} className="text-text-muted" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search watched securities" className="w-full bg-transparent font-body-md text-body-md text-text-primary placeholder:text-text-muted focus:outline-none" />
        </div>
        <div className="flex items-center gap-space-xs">
          {(["All", "Significant", "Notable", "Normal"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTier(key)}
              className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm ${tier === key ? "bg-surface-elevated text-primary shadow-glow" : "text-text-secondary hover:bg-surface-container-high"}`}
            >
              {key}
            </button>
          ))}
        </div>
      </section>
      {!entries.length ? (
        <EmptyState title="Nothing on your watchlist yet" detail="Search the seeded ticker universe and add a permanent or temporary watch." action={{ label: "Add stock", onClick: openDrawer }} />
      ) : (
        <div className="flex flex-col gap-space-xs">
          {filtered.map((entry) => {
            const stock = homeBySymbol[entry.symbol];
            return (
              <div key={entry.symbol} className="relative">
                <WatchlistItemRow
                  entry={entry}
                  stock={stock}
                  quiet={stock?.tier === "Normal"}
                  menuOpen={menu === entry.symbol}
                  onOpen={() => { window.location.hash = `#/stocks/${entry.symbol}`; }}
                  onMenu={() => setMenu(menu === entry.symbol ? null : entry.symbol)}
                />
                {menu === entry.symbol ? (
                  <div className="absolute right-4 top-full z-20 mt-1 w-56 bg-surface-elevated border border-surface-border rounded-xl p-space-2xs shadow-elevated">
                    <button type="button" className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container font-body-sm" onClick={() => { window.location.hash = `#/stocks/${entry.symbol}`; }}>
                      Open
                    </button>
                    <button type="button" className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container font-body-sm" onClick={() => { setPersonalize(entry); setMenu(null); }}>
                      Personalize
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container font-body-sm"
                      onClick={async () => {
                        await api.updateWatch({ symbol: entry.symbol, mute: !entry.mute });
                        setMenu(null);
                        await load();
                      }}
                    >
                      {entry.mute ? "Unmute" : "Mute"}
                    </button>
                    {entry.watch_type === "temporary" ? (
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container font-body-sm"
                        onClick={async () => {
                          await api.updateWatch({ symbol: entry.symbol, watchType: "permanent", expiresAt: null });
                          setMenu(null);
                          await load();
                        }}
                      >
                        End temporary watch
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container text-negative-coral font-body-sm"
                      onClick={async () => {
                        await api.removeWatch(entry.symbol);
                        setMenu(null);
                        await load();
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {drawer ? (
        <div className="fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-surface-base/75 backdrop-blur-md" onClick={() => setDrawer(false)} aria-label="Close" />
          <aside className="absolute top-0 right-0 h-screen w-full max-w-[560px] bg-surface-container-low flex flex-col shadow-elevated border-l border-surface-border animate-in slide-in-from-right">
            <div className="p-space-xl border-b border-surface-border flex items-start justify-between">
              <div><h2 className="font-headline-md text-headline-md">Add to Watchlist</h2><p className="font-body-sm text-text-secondary mt-space-2xs">Configure dynamic tracking for a security</p></div>
              <button type="button" onClick={() => setDrawer(false)} className="p-2 rounded-lg hover:bg-surface-container-high text-text-muted hover:text-text-primary" aria-label="Close drawer">
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <div className="p-space-xl flex-1 overflow-y-auto space-y-space-xl">
              <div className="grid grid-cols-2 p-1 bg-surface-base rounded-xl gap-1">
                <button type="button" onClick={() => setPickerMode("search")} className={`py-2 rounded-md font-label-md ${pickerMode === "search" ? "bg-surface-container-high text-primary" : "text-text-muted"}`}>Search</button>
                <button type="button" onClick={() => setPickerMode("explore")} className={`py-2 rounded-md font-label-md ${pickerMode === "explore" ? "bg-surface-container-high text-primary" : "text-text-muted"}`}>Explore</button>
              </div>
              {pickerMode === "search" ? <>
                <div><label className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">Security instrument</label>
                <div className="mt-space-sm flex items-center h-[52px] px-space-md rounded-xl bg-input-surface border border-surface-border focus-within:border-spruce focus-within:shadow-glow"><Search size={18} className="text-text-muted" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPicked(null); }} className="w-full bg-transparent px-space-sm font-body-md text-body-md outline-none" placeholder="Search instruments" />{picked ? <CheckCircle2 size={18} className="text-primary" /> : null}</div></div>
                <div className="space-y-space-2xs">{hits.map((hit) => <button key={hit.symbol} type="button" onClick={() => setPicked(hit)} className={`w-full text-left p-space-lg rounded-xl border ${picked?.symbol === hit.symbol ? "bg-surface-elevated border-spruce shadow-glow" : "bg-surface-lifted border-transparent hover:border-surface-border"}`}><div className="flex items-center gap-space-md"><span className="grid h-12 w-12 place-items-center rounded-xl bg-surface-container-high font-headline-sm text-primary">{hit.symbol.slice(0, 2)}</span><span className="min-w-0 flex-1"><span className="block font-headline-sm">{hit.symbol}</span><span className="block truncate font-body-sm text-text-secondary">{hit.name} · {hit.exchange}</span></span></div></button>)}</div>
              </> : <>
                <div className="flex flex-wrap items-center gap-space-xs"><span className="font-label-sm text-text-muted">Sort</span>{(["move", "price"] as const).map((value) => <button key={value} type="button" onClick={() => setExploreSort(value)} className={`rounded-full px-3 py-1.5 font-label-sm ${exploreSort === value ? "bg-surface-elevated text-primary shadow-glow" : "text-text-secondary hover:bg-surface-container-high"}`}>{value === "move" ? "Biggest moves" : "Price"}</button>)}</div>
                <div className="flex gap-space-xs overflow-x-auto pb-1">{["All", ...(explore?.sectors ?? [])].map((value) => <button key={value} type="button" onClick={() => setExploreSector(value)} className={`shrink-0 rounded-full px-3 py-1.5 font-label-sm ${exploreSector === value ? "bg-surface-elevated text-primary shadow-glow" : "bg-surface-lifted text-text-secondary hover:bg-surface-container"}`}>{value}</button>)}</div>
                {exploreLoading ? <div className="h-1 rounded bg-primary/30 animate-pulse" /> : null}
                <div className="max-h-72 space-y-space-2xs overflow-y-auto pr-1">{explore?.items.map((item) => { const moveClass = item.move == null ? "text-text-muted" : item.move < 0 ? "text-negative-coral" : "text-primary-fixed-dim"; return <button key={item.symbol} type="button" disabled={item.watching} onClick={() => setPicked(item)} className={`w-full text-left p-space-md rounded-xl border ${item.watching ? "cursor-not-allowed border-transparent bg-surface-base opacity-60" : picked?.symbol === item.symbol ? "bg-surface-elevated border-spruce shadow-glow" : "bg-surface-lifted border-transparent hover:border-surface-border"}`}><div className="flex items-center gap-space-sm"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-container-high font-label-md text-primary">{item.symbol.slice(0, 2)}</span><span className="min-w-0 flex-1"><span className="block font-label-md">{item.symbol} <span className="font-body-sm text-text-muted">{item.exchange}</span></span><span className="block truncate font-body-sm text-text-secondary">{item.name} · {item.sector}</span></span><span className="text-right"><span className="block font-label-md">{item.price == null ? "—" : item.price.toFixed(2)}</span><span className={`font-body-sm ${moveClass}`}>{item.move == null ? item.status : `${item.move >= 0 ? "+" : ""}${item.move.toFixed(1)}%`}</span></span>{item.watching ? <span className="font-label-sm text-text-muted">Watching</span> : null}</div></button>; })}</div>
              </>}
              <div><label className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">Watch horizon</label><div className="mt-space-sm grid grid-cols-2 p-1 bg-surface-base rounded-xl gap-1">
                <button type="button" onClick={() => setWatchType("permanent")} className={`py-2 rounded-md font-label-md ${watchType === "permanent" ? "bg-surface-container-high text-primary" : "text-text-muted"}`}>
                  Permanent
                </button>
                <button type="button" onClick={() => setWatchType("temporary")} className={`py-2 rounded-md font-label-md ${watchType === "temporary" ? "bg-surface-container-high text-primary" : "text-text-muted"}`}>
                  Temporary
                </button>
              </div></div>
              {watchType === "temporary" ? (
                <div className="rounded-xl bg-surface-base p-space-md"><div className="mb-space-sm flex items-center justify-between"><span className="font-body-sm text-text-secondary">Automatic expiration window</span><span className="rounded-md bg-tier-significant/15 px-2 py-1 font-label-sm text-tier-significant">TEMP · {days} days</span></div><div className="flex gap-2">
                  {[7, 14, 30].map((n) => (
                    <button key={n} type="button" onClick={() => setDays(n)} className={`flex-1 py-1 rounded font-label-sm ${days === n ? "bg-surface-elevated text-primary shadow-glow" : "bg-surface-lifted text-text-muted"}`}>
                      {n} days
                    </button>
                  ))}
                </div></div>
              ) : null}
              <div>
                <div className="flex justify-between"><label className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">Personal relevance threshold</label><span className="font-body-sm text-text-muted">Optional</span></div>
                <div className="mt-space-sm flex items-center rounded-xl bg-input-surface border border-surface-border p-space-md"><span className="font-body-md text-text-secondary">Alert me when move exceeds</span><span className="ml-auto flex min-w-24 items-center justify-center gap-1 rounded-lg bg-surface-elevated px-space-sm"><span className="text-text-muted">±</span><input type="number" min="0" step="0.1" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-14 appearance-none bg-transparent text-center font-label-md text-text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" placeholder="3.5" aria-label="Personal relevance threshold percentage" /><span className="text-text-muted">%</span></span></div>
                <p className="font-body-sm text-body-sm text-text-muted mt-space-xs">Affects your personal visibility and sorting only — does not change this security's objective significance tier.</p>
              </div>
              <div className="flex gap-space-sm rounded-xl bg-surface-elevated p-space-lg"><Info size={20} className="shrink-0 text-primary" aria-hidden="true" /><p className="font-body-sm text-text-secondary"><strong className="font-label-md text-text-primary">Algorithmic baseline</strong><br />Significance detection begins from this point forward. Historical anomalies remain pre-calibrated.</p></div>
            </div>
            <div className="p-space-lg border-t border-surface-border">
              <button
                type="button"
                disabled={!picked}
                className="w-full py-3 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary shadow-primary-glow disabled:opacity-40 font-label-md"
                onClick={async () => {
                  if (!picked) return;
                  await api.addWatch({
                    symbol: picked.symbol,
                    watchType,
                    expiresAt: watchType === "temporary" ? isoDaysFromNow(days) : null,
                  });
                  if (threshold) await api.updateWatch({ symbol: picked.symbol, threshold: Number(threshold) });
                  setDrawer(false);
                  setPicked(null);
                  setSearch("");
                  await load();
                }}
              >
                <span className="inline-flex items-center gap-space-xs"><CirclePlus size={18} aria-hidden="true" /> Add {picked?.symbol ?? "stock"} to Watchlist</span>
              </button>
              <button type="button" onClick={() => setDrawer(false)} className="w-full pt-space-md font-label-md text-text-secondary hover:text-text-primary">Cancel</button>
            </div>
          </aside>
        </div>
      ) : null}

      {personalize ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-base/70">
          <form
            className="bg-surface-lifted border border-surface-border rounded-xl p-space-lg w-full max-w-sm space-y-space-sm"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const value = Number(form.get("threshold"));
              await api.updateWatch({ symbol: personalize.symbol, threshold: value });
              setPersonalize(null);
              await load();
            }}
          >
            <h2 className="font-headline-sm">Personalize {personalize.symbol}</h2>
            <p className="font-body-sm text-text-muted">Personal visibility only — does not change objective tier.</p>
            <input name="threshold" defaultValue={personalize.threshold ?? ""} className="w-full h-[38px] px-space-sm rounded-lg bg-input-surface border border-surface-border" />
            <div className="flex gap-space-sm">
              <button type="submit" className="bg-primary-container text-on-primary-container rounded-lg px-space-md py-2 font-label-md">
                Save
              </button>
              <button type="button" onClick={() => setPersonalize(null)} className="font-label-md text-text-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
