import { useEffect, useMemo, useState } from "react";
import { api, ApiRequestError } from "../api";
import type { EventThread, StockDetailResponse, TimelineEvent, TimelineResponse } from "../types";
import { BeforeAfterComparison } from "../components/BeforeAfterComparison";
import { ConfidenceIndicator } from "../components/ConfidenceIndicator";
import { ErrorState } from "../components/ErrorState";
import { EvidenceList } from "../components/EvidenceList";
import { FreshnessLabel } from "../components/FreshnessLabel";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { TierBadge } from "../components/TierBadge";
import { TimelineEntry } from "../components/TimelineEntry";
import { ArrowLeft } from "lucide-react";

const layers = ["All", "Company", "Sector", "Domestic", "Global"] as const;

export function StockDetailScreen({ symbol, onNeedAuth }: { symbol: string; onNeedAuth: () => void }) {
  const [detail, setDetail] = useState<StockDetailResponse | null>(null);
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);
  const [layer, setLayer] = useState<(typeof layers)[number]>("All");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openThread, setOpenThread] = useState<number | null>(null);

  async function load(nextLayer = layer) {
    setLoading(true);
    setError(null);
    try {
      const [stock, events] = await Promise.all([api.stock(symbol), api.timeline(symbol, nextLayer)]);
      setDetail(stock);
      setTimeline(events);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) onNeedAuth();
      else setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("All");
  }, [symbol]);

  const evidence = useMemo(() => {
    if (!detail?.insight) return [];
    try {
      return JSON.parse(detail.insight.evidence_json) as string[];
    } catch {
      return [];
    }
  }, [detail]);

  const signals = useMemo(() => {
    if (!detail?.insight) return {} as Record<string, unknown>;
    try {
      return JSON.parse(detail.insight.signals_json) as Record<string, unknown>;
    } catch {
      return {};
    }
  }, [detail]);

  if (loading && !detail) return <LoadingSkeleton variant="detail" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!detail) return null;

  const move = detail.comparison?.percentageDifference;
  const insight = detail.insight;
  const contextPartial = detail.context.peers.some((p) => p.freshness === "Missing") || detail.context.benchmarkMove == null;

  const threadEventIds = new Set((timeline?.threads ?? []).flatMap((t) => t.events.map((e) => e.id)));
  const standalone = (timeline?.events ?? []).filter((e) => !threadEventIds.has(e.id));
  const timelineItems = [
    ...(timeline?.threads ?? []).map((thread) => ({
      kind: "thread" as const,
      timestamp: thread.updated_at,
      thread,
      events: layer === "All" ? thread.events : thread.events.filter((event) => event.layer === layer),
    })),
    ...standalone
      .filter((event) => layer === "All" || event.layer === layer)
      .map((event) => ({ kind: "event" as const, timestamp: event.timestamp, event })),
  ]
    .filter((item) => item.kind === "event" || item.events.length > 0)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div>
      <div className="flex items-center justify-between gap-space-md mb-space-xl">
        <a href="#/watchlist" className="inline-flex items-center gap-space-2xs text-text-secondary hover:text-primary font-body-sm">
          <ArrowLeft size={18} aria-hidden="true" />
          Back to Watchlist
        </a>
        {insight ? (
          <button
            type="button"
            disabled={detail.reviewed}
            onClick={async () => {
              await api.acknowledge(symbol);
              await load();
            }}
            className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-elevated text-secondary hover:text-primary font-label-md disabled:opacity-50"
          >
            {detail.reviewed ? "Reviewed" : "Mark reviewed"}
          </button>
        ) : null}
      </div>
      <div className="bg-surface-lifted rounded-xl p-space-xl mb-space-xl">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
          <div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-text-primary">
                {detail.stock.symbol} <span className="text-text-muted font-normal">·</span> {detail.stock.name}
              </h1>
              <span className="px-space-xs py-space-3xs rounded bg-surface-container-high text-text-secondary font-label-sm uppercase">{detail.stock.exchange}</span>
              {insight ? <TierBadge tier={insight.tier} /> : null}
            </div>
            <p className="font-body-sm text-body-sm text-text-secondary mt-space-2xs">{detail.stock.sector}</p>
            {insight ? <div className="mt-space-xs"><FreshnessLabel freshness={insight.freshness} /></div> : null}
          </div>
          <div className="flex flex-col lg:items-end">
            <span className="font-data-metric text-data-metric text-text-primary tabular-nums">{insight?.current_price != null ? insight.current_price.toFixed(2) : "—"}</span>
            {move != null ? (
              <span className={`font-data-delta text-data-delta ${move < 0 ? "text-negative-coral" : "text-primary-fixed-dim"}`}>
                {move >= 0 ? "+" : ""}
                {move.toFixed(1)}%
              </span>
            ) : null}
          </div>
        </div>
      </div>
      {contextPartial ? (
        <div className="flex items-center justify-between mb-space-lg p-space-md rounded-xl bg-surface-elevated">
          <p className="font-body-sm text-body-sm text-text-secondary">Some context is temporarily unavailable — price and volume are still current.</p>
          <button type="button" className="font-label-md text-primary" onClick={() => void load()}>
            Retry
          </button>
        </div>
      ) : null}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
        <div className="lg:col-span-7 bg-surface-lifted rounded-xl p-space-xl">
          <BeforeAfterComparison comparison={detail.comparison} />
        </div>
        <div className="lg:col-span-5 bg-surface-lifted rounded-xl p-space-xl">
          <h3 className="font-headline-md text-headline-md text-text-primary mb-space-sm">Why this was surfaced</h3>
          {insight ? <ConfidenceIndicator confidence={insight.confidence} /> : <p className="font-body-sm text-text-muted">No derived insight yet. Refresh quotes after adding this symbol.</p>}
          <div className="mt-space-md">
            <EvidenceList items={evidence} />
          </div>
        </div>
      </div>
      <section className="bg-surface-lifted rounded-xl p-space-xl mb-space-xl">
        <h3 className="font-headline-sm text-headline-sm mb-space-sm">Relative / sector context</h3>
        <p className="font-body-sm text-body-sm text-text-muted mb-space-md">{detail.context.label}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
          <ContextMetric label="This stock" value={fmtMove(detail.context.stockMove)} />
          <ContextMetric label={`Benchmark ${detail.context.benchmarkSymbol ?? ""}`} value={fmtMove(detail.context.benchmarkMove)} />
          <ContextMetric label="Peers" value={fmtMove(detail.context.peerMove)} />
        </div>
        {typeof signals.sectorBenchmarkMove === "number" && typeof signals.sectorBenchmark === "string" ? (
          <p className="font-body-sm text-text-secondary mt-space-sm">
            Sector benchmark ({signals.sectorBenchmark}) moved {(signals.sectorBenchmarkMove as number) >= 0 ? "+" : ""}
            {(signals.sectorBenchmarkMove as number).toFixed(1)}% vs this stock's {fmtMove(detail.context.stockMove)}
          </p>
        ) : null}
      </section>
      <section className="bg-surface-lifted rounded-xl p-space-xl">
        <h3 className="font-headline-sm text-headline-sm mb-space-sm">Timeline</h3>
        <div className="flex items-center gap-space-xs flex-wrap mb-space-lg">
          {layers.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setLayer(name)}
              className={`px-3 py-1.5 rounded-full font-label-sm ${layer === name ? "bg-surface-elevated text-primary shadow-glow" : "text-text-secondary"}`}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="space-y-space-lg">
          {timelineItems.map((item) =>
            item.kind === "thread" ? (
              <ThreadBlock
                key={`thread-${item.thread.id}`}
                thread={item.thread}
                events={item.events}
                open={openThread === item.thread.id}
                onToggle={() => setOpenThread(openThread === item.thread.id ? null : item.thread.id)}
              />
            ) : (
              <TimelineEntry key={item.event.id} event={item.event} />
            ),
          )}
          {!timelineItems.length ? <p className="font-body-sm text-text-muted">No timeline events for this filter.</p> : null}
        </div>
      </section>
    </div>
  );
}

function fmtMove(value: number | null | undefined) {
  if (value == null) return "Unavailable";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function ContextMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container rounded-lg p-space-md">
      <span className="font-label-sm text-label-sm text-text-muted">{label}</span>
      <p className="font-headline-sm text-headline-sm text-text-primary mt-space-2xs">{value}</p>
    </div>
  );
}

function ThreadBlock({ thread, events, open, onToggle }: { thread: EventThread; events: TimelineEvent[]; open: boolean; onToggle: () => void }) {
  return (
    <div className="border border-surface-border rounded-xl p-space-md">
      <button type="button" onClick={onToggle} className="w-full text-left flex items-center justify-between">
        <span className="font-headline-sm text-headline-sm">{thread.category} thread</span>
        <span className="font-body-sm text-text-muted">{events.length} update{events.length === 1 ? "" : "s"} · {thread.status}</span>
      </button>
      {open
        ? events.map((event) => <div key={event.id} className="mt-space-sm"><TimelineEntry event={event} /></div>)
        : null}
    </div>
  );
}
