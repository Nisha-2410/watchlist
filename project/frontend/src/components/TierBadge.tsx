import type { Tier } from "../types";

const styles: Record<Tier, string> = {
  Significant: "bg-tier-significant/10 text-tier-significant",
  Notable: "bg-tier-notable/10 text-tier-notable",
  Normal: "bg-tier-normal/10 text-tier-normal",
};

const dots: Record<Tier, string> = {
  Significant: "bg-tier-significant",
  Notable: "bg-tier-notable",
  Normal: "bg-tier-normal",
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${styles[tier]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[tier]}`} />
      {tier.toUpperCase()}
    </span>
  );
}
