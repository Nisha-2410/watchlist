import { useEffect, useState } from "react";
import { api, ApiRequestError } from "../api";
import type { SettingsResponse, WatchManageEntry } from "../types";
import { ErrorState } from "../components/ErrorState";
import { LoadingSkeleton } from "../components/LoadingSkeleton";

const interest = [
  { key: "price" as const, title: "Price moves", help: "Include price deviations in your briefing visibility." },
  { key: "volume" as const, title: "Volume anomalies", help: "Include unusual volume in ranking and catch-up emphasis." },
  { key: "news" as const, title: "News & announcements", help: "Keep company announcement categories visible when events exist." },
  { key: "earnings" as const, title: "Earnings & guidance", help: "Keep earnings-related categories visible." },
  { key: "corporate_actions" as const, title: "Corporate actions", help: "Keep corporate-action categories visible." },
];

export function PreferencesScreen({ onNeedAuth }: { onNeedAuth: () => void }) {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [entries, setEntries] = useState<WatchManageEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [prefs, manage] = await Promise.all([api.settings(), api.watchlistManage()]);
      setSettings(prefs);
      setEntries(manage.entries);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) onNeedAuth();
      else setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <LoadingSkeleton variant="preferences" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!settings) return null;

  const overrides = entries.filter((e) => e.threshold != null);
  const mutedStocks = entries.filter((e) => e.mute);

  return (
    <div className="space-y-space-3xl">
      <header>
        <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary">Intelligence Tuning</p>
        <h1 className="font-display-lg text-display-lg tracking-tight text-text-primary">Preferences</h1>
        <p className="font-body-lg text-body-lg text-text-secondary">Configure what Smart Watchlist surfaces. Personal settings do not change objective tiers.</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
        <section className="lg:col-span-6 space-y-space-sm">
          <h2 className="font-headline-md text-headline-md">What I care about</h2>
          {interest.map((item) => (
            <div key={item.key} className="flex items-start justify-between p-space-md rounded-lg bg-surface-lifted gap-space-lg">
              <div>
                <span className="font-headline-sm text-headline-sm block">{item.title}</span>
                <p className="font-body-sm text-body-sm text-text-secondary">{item.help}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(settings[item.key])}
                onClick={async () => {
                  await api.saveSettings({ [item.key]: settings[item.key] ? 0 : 1 });
                  await load();
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${settings[item.key] ? "bg-primary" : "bg-surface-container-highest"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-surface-base ${settings[item.key] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </section>
        <section className="lg:col-span-6 space-y-space-lg">
          <h2 className="font-headline-md text-headline-md">Personal relevance</h2>
          <div className="bg-surface-lifted rounded-xl p-space-lg space-y-space-md">
            <p className="font-body-sm text-body-sm text-on-secondary-container bg-secondary-container/20 p-space-md rounded-lg">
              Personal thresholds affect your individual visibility only. They do not alter a security's objective Significant / Notable / Normal tier.
            </p>
            <p className="font-body-sm text-text-muted">There is no stored global default threshold on the server. Per-stock overrides below are the `threshold` field on watch entries.</p>
            {overrides.map((entry) => (
              <div key={entry.symbol} className="flex items-center justify-between p-space-md rounded-lg bg-surface-container-lowest/60">
                <div>
                  <span className="font-headline-sm">{entry.symbol}</span>
                  <span className="font-data-delta text-primary ml-space-xs">± {entry.threshold}%</span>
                </div>
                <button
                  type="button"
                  className="text-negative-coral font-label-sm"
                  onClick={async () => {
                    await api.updateWatch({ symbol: entry.symbol, threshold: null });
                    await load();
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <h2 className="font-headline-md text-headline-md">Mutes</h2>
          <div className="bg-surface-lifted rounded-xl p-space-lg space-y-space-sm">
            <form
              className="flex gap-space-xs"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!category.trim()) return;
                await api.muteCategory(category.trim(), true);
                setCategory("");
                await load();
              }}
            >
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Mute a category" className="flex-1 h-[38px] px-space-sm rounded-lg bg-input-surface border border-surface-border" />
              <button type="submit" className="px-space-md rounded-lg bg-surface-container-high font-label-md">
                Add
              </button>
            </form>
            {settings.mutedCategories.map((name) => (
              <div key={name} className="flex items-center justify-between">
                <span className="font-body-sm">{name}</span>
                <button type="button" className="text-negative-coral font-label-sm" onClick={async () => { await api.muteCategory(name, false); await load(); }}>
                  Remove
                </button>
              </div>
            ))}
            <h3 className="font-headline-sm pt-space-sm">Muted stocks</h3>
            {mutedStocks.map((entry) => (
              <div key={entry.symbol} className="flex items-center justify-between">
                <span className="font-body-sm">{entry.symbol}</span>
                <button type="button" className="text-negative-coral font-label-sm" onClick={async () => { await api.updateWatch({ symbol: entry.symbol, mute: false }); await load(); }}>
                  Unmute
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
