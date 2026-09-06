export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="bg-surface-lifted border border-surface-border rounded-xl p-space-xl space-y-space-sm">
      <h2 className="font-headline-md text-headline-md text-text-primary">We couldn't load your watchlist</h2>
      <p className="font-body-md text-body-md text-text-secondary">Your saved watchlist is safe. {message}</p>
      <button type="button" onClick={onRetry} className="bg-primary-container text-on-primary-container hover:bg-primary font-label-md text-label-md px-space-md py-2 rounded-lg">
        Try again
      </button>
    </section>
  );
}
