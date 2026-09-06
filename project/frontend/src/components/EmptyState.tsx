export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: { label: string; onClick: () => void } }) {
  return (
    <section className="bg-surface-lifted border border-surface-border rounded-xl p-space-xl text-center space-y-space-sm">
      <h2 className="font-headline-md text-headline-md text-text-primary">{title}</h2>
      <p className="font-body-md text-body-md text-text-secondary">{detail}</p>
      {action ? (
        <button type="button" onClick={action.onClick} className="bg-primary-container text-on-primary-container hover:bg-primary font-label-md text-label-md px-space-md py-2 rounded-lg">
          {action.label}
        </button>
      ) : null}
    </section>
  );
}
