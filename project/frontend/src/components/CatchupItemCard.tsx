import type { HomeStock } from "../types";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { EvidenceList } from "./EvidenceList";
import { FreshnessLabel } from "./FreshnessLabel";
import { TierBadge } from "./TierBadge";

export function CatchupItemCard({
  item,
  onView,
  onReview,
  reviewing,
}: {
  item: HomeStock;
  onView: () => void;
  onReview: () => void;
  reviewing?: boolean;
}) {
  const up = item.move >= 0;
  return (
    <article className="bg-surface-lifted border border-surface-border rounded-xl p-card-padding space-y-space-sm">
      <div className="flex items-start justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs flex-wrap">
            <h3 className="font-headline-sm text-headline-sm text-text-primary">{item.symbol}</h3>
            <span className="font-body-sm text-body-sm text-text-secondary">{item.name}</span>
            <TierBadge tier={item.tier} />
          </div>
          <p className={`font-data-delta text-data-delta mt-space-2xs ${up ? "text-primary-fixed-dim" : "text-negative-coral"}`}>
            {up ? "+" : ""}
            {item.move.toFixed(1)}%
          </p>
        </div>
        <FreshnessLabel freshness={item.freshness} />
      </div>
      <EvidenceList items={item.evidence.slice(0, 4)} />
      <ConfidenceIndicator confidence={item.confidence} />
      <div className="flex items-center gap-space-sm pt-space-2xs">
        <button type="button" onClick={onView} className="font-label-md text-label-md text-primary-fixed-dim hover:text-primary">
          View stock
        </button>
        <button
          type="button"
          onClick={onReview}
          disabled={reviewing || item.reviewed}
          className="px-space-md py-space-xs rounded-lg bg-surface-elevated text-secondary hover:text-primary font-label-md text-label-md disabled:opacity-50"
        >
          {item.reviewed ? "Reviewed" : "Mark reviewed"}
        </button>
      </div>
    </article>
  );
}
