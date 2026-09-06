import type { Comparison } from "../types";
import { ArrowRight } from "lucide-react";

export function BeforeAfterComparison({ comparison }: { comparison: Comparison | null }) {
  if (!comparison) {
    return <p className="font-body-sm text-body-sm text-text-muted">Not enough snapshots yet for a before/now comparison.</p>;
  }
  const pct = comparison.percentageDifference;
  const down = (pct ?? 0) < 0;
  return (
    <div>
      <span className="font-label-sm text-label-sm uppercase tracking-widest text-text-muted">Observation Interval</span>
      <h2 className="font-headline-sm text-headline-sm text-text-primary mt-space-3xs">State Comparison Since Last Review</h2>
      <p className="font-body-sm text-body-sm text-text-secondary mb-space-lg">Compared with your last acknowledged state</p>
      <div className="bg-surface-container rounded-lg p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <div className="flex flex-col">
          <span className="font-body-sm text-body-sm text-text-muted">Price</span>
        </div>
        <div className="flex items-center gap-space-md tabular-nums">
          <div className="flex flex-col sm:items-end">
            <span className="font-label-sm text-label-sm text-text-muted">{comparison.baselineTimestamp}</span>
            <span className="font-body-md text-body-md text-text-secondary">{comparison.baselinePrice.toFixed(2)}</span>
          </div>
          <ArrowRight size={16} className="text-text-muted" aria-hidden="true" />
          <div className="flex flex-col sm:items-end">
            <span className={`font-label-sm text-label-sm ${down ? "text-negative-coral" : "text-primary"}`}>Current</span>
            <span className={`font-headline-sm text-headline-sm font-medium ${down ? "text-negative-coral" : "text-text-primary"}`}>{comparison.currentPrice.toFixed(2)}</span>
          </div>
          {pct != null ? (
            <span className={`px-space-xs py-space-3xs rounded font-label-sm text-label-sm font-medium ${down ? "bg-negative-coral/10 text-negative-coral" : "bg-secondary-container text-primary"}`}>
              {pct >= 0 ? "+" : ""}
              {pct.toFixed(1)}%
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
