import type { Pulse } from "../types";

export function WatchlistPulse({ pulse, onSelect }: { pulse: Pulse; onSelect: (tier: "All" | "Significant" | "Notable" | "Normal") => void }) {
  const items = [
    { key: "Significant" as const, count: pulse.significant, className: "text-tier-significant" },
    { key: "Notable" as const, count: pulse.notable, className: "text-tier-notable" },
    { key: "Normal" as const, count: pulse.normal, className: "text-tier-normal" },
  ];
  return (
    <div className="grid grid-cols-3 gap-space-sm">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          className="bg-surface-lifted border border-surface-border rounded-xl p-space-md text-left hover:bg-surface-elevated transition-colors duration-150"
        >
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">{item.key}</span>
          <p className={`font-headline-lg text-headline-lg mt-space-2xs ${item.className}`}>{item.count}</p>
        </button>
      ))}
    </div>
  );
}
