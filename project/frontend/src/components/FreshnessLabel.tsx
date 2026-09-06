export function FreshnessLabel({ freshness }: { freshness: string }) {
  const live = !/awaiting|stale|demo/i.test(freshness);
  return (
    <span className="font-body-sm text-body-sm text-text-secondary flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full ${live ? "bg-primary-fixed-dim" : "bg-tier-significant"}`} />
      {freshness}
    </span>
  );
}
