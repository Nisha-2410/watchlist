import type { HomeStock } from "../types";
import type { WatchManageEntry } from "../types";
import { FreshnessLabel } from "./FreshnessLabel";
import { TierBadge } from "./TierBadge";
import { Ellipsis, ExternalLink } from "lucide-react";

export function WatchlistItemRow({
  stock,
  entry,
  quiet,
  menuOpen,
  onOpen,
  onMenu,
}: {
  stock?: HomeStock;
  entry: WatchManageEntry;
  quiet: boolean;
  menuOpen: boolean;
  onOpen: () => void;
  onMenu: () => void;
}) {
  const move = stock?.move ?? 0;
  const up = move >= 0;
  const muted = Boolean(entry.mute);
  const accent = stock?.tier === "Significant" ? "border-l-tier-significant" : stock?.tier === "Notable" ? "border-l-tier-notable" : "border-l-tier-normal";
  return (
    <div
      className={`group relative flex flex-col md:flex-row md:items-center justify-between border border-surface-border border-l-4 ${accent} p-space-lg rounded-xl transition-all duration-150 shadow-elevated ${
        quiet ? "bg-surface-container-low text-text-muted hover:bg-row-hover" : "bg-surface-lifted hover:bg-surface-elevated"
      } ${stock?.tier === "Significant" ? "shadow-glow" : ""}`}
    >
      <div className="flex items-center gap-space-md min-w-[240px]">
        <div className={`w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center font-label-md text-label-md ${quiet ? "text-tier-normal" : "text-text-primary"}`}>
          {entry.symbol.slice(0, 2)}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-space-xs flex-wrap">
            <span className="font-headline-sm text-headline-sm text-text-primary">{entry.symbol}</span>
            <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container-high text-text-secondary capitalize">{entry.watch_type}</span>
            {muted ? <span className="font-label-sm text-label-sm text-text-muted">Muted</span> : null}
          </div>
          <span className="font-body-sm text-body-sm text-text-secondary truncate">{entry.name}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between md:justify-end gap-x-space-lg gap-y-space-xs mt-3 md:mt-0 flex-1">
        <div className="flex flex-col items-start md:items-end min-w-[90px]">
          <span className={`font-data-delta text-data-delta ${quiet ? "text-text-muted" : up ? "text-primary-fixed-dim" : "text-negative-coral"}`}>
            {up ? "+" : ""}
            {move.toFixed(1)}%
          </span>
          <span className="font-body-sm text-body-sm text-text-muted">{stock?.price != null ? stock.price.toFixed(2) : "—"}</span>
        </div>
        <div className="min-w-[105px]">{stock ? <TierBadge tier={stock.tier} /> : <span className="font-body-sm text-text-muted">Awaiting insight</span>}</div>
        <div className="min-w-[80px]">{stock ? <FreshnessLabel freshness={stock.freshness} /> : null}</div>
        <div className="flex items-center gap-space-xs">
          <button type="button" onClick={onOpen} className="inline-flex items-center gap-1 font-label-md text-label-md text-primary-fixed-dim hover:text-primary">
            View <ExternalLink size={14} aria-hidden="true" />
          </button>
          <button type="button" onClick={onMenu} className="p-1.5 rounded-md hover:bg-surface-container-high text-text-secondary hover:text-text-primary" aria-expanded={menuOpen}>
            <Ellipsis size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
