import type { TimelineEvent } from "../types";

const layers = ["Company", "Sector", "Domestic", "Global"] as const;

export function TimelineEntry({ event, expanded }: { event: TimelineEvent; expanded?: boolean }) {
  return (
    <article className="timeline-item relative pl-space-md border-l border-surface-border" data-layer={event.layer}>
      <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-surface-elevated border border-primary-fixed-dim" />
      <div className="flex items-center gap-space-xs flex-wrap mb-space-2xs">
        <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container-high text-text-secondary">{event.layer}</span>
        <span className="font-body-sm text-body-sm text-text-muted">{event.timestamp}</span>
        {event.source ? <span className="font-body-sm text-body-sm text-text-muted">· {event.source}</span> : null}
      </div>
      <h3 className="font-headline-sm text-headline-sm text-text-primary">{event.title}</h3>
      {expanded !== false && event.detail ? <p className="font-body-sm text-body-sm text-text-secondary mt-space-2xs">{event.detail}</p> : null}
    </article>
  );
}

export { layers as timelineLayers };
