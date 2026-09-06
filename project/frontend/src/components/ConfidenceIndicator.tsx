import type { Confidence } from "../types";

const filled: Record<Confidence, number> = { Low: 1, Medium: 2, High: 3 };

export function ConfidenceIndicator({ confidence }: { confidence: Confidence }) {
  const n = filled[confidence];
  return (
    <div className="flex items-center gap-space-2xs" title={`Confidence: ${confidence}`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`w-2 h-2 rounded-full ${i <= n ? "bg-primary" : "bg-surface-container-highest"}`} />
      ))}
      <span className="font-label-md text-label-md text-text-primary ml-space-2xs">{confidence} confidence</span>
    </div>
  );
}
