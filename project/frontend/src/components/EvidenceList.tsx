export function EvidenceList({ items }: { items: string[] }) {
  if (!items.length) return <p className="font-body-sm text-body-sm text-text-muted">No evidence facts yet.</p>;
  return (
    <ul className="space-y-space-2xs">
      {items.map((item) => (
        <li key={item} className="flex gap-space-xs font-body-sm text-body-sm text-text-secondary">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-fixed-dim shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
