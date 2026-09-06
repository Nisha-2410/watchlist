export function ZeroChangeState({ unchanged, total }: { unchanged: number; total: number }) {
  return (
    <section className="bg-surface-lifted border border-surface-border rounded-xl p-space-xl text-center space-y-space-xs">
      <p className="font-headline-md text-headline-md text-text-primary">Nothing meaningful changed</p>
      <p className="font-body-md text-body-md text-text-secondary">
        {unchanged} of {total} stocks had no meaningful change since your last review.
      </p>
    </section>
  );
}
