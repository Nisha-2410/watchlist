import type { ReactNode } from "react";
import { BarChart3, Bell, ChevronRight, CircleUserRound, LogOut, Search, SlidersHorizontal, Sparkles, TrendingUp } from "lucide-react";

const links = [
  { href: "#/", label: "Catch-up", hint: "Meaningful changes", icon: Sparkles },
  { href: "#/watchlist", label: "Watchlist", hint: "Tracked securities", icon: BarChart3 },
  { href: "#/preferences", label: "Preferences", hint: "Personal settings", icon: SlidersHorizontal },
];

export function AppShell({ route, children, onLogout }: { route: string; children: ReactNode; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <aside className="fixed left-0 top-0 h-screen w-72 bg-surface-container-low border-r border-surface-border flex flex-col justify-between z-40">
        <div>
          <div className="h-20 px-space-lg flex items-center gap-space-sm border-b border-surface-border">
            <div className="w-10 h-10 shrink-0 grid place-items-center rounded-xl bg-surface-elevated border border-surface-border shadow-glow">
              <TrendingUp size={20} className="text-primary" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm font-medium tracking-tight text-text-primary">Smart Market</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">Briefing Desk</span>
            </div>
          </div>
          <p className="px-space-lg pt-space-xl pb-space-sm font-label-sm text-label-sm uppercase tracking-[0.14em] text-text-muted">Intelligence</p>
          <nav className="px-space-md flex flex-col gap-space-xs">
            {links.map((link) => {
              const active = route === link.href || (link.href === "#/watchlist" && route.startsWith("#/stocks"));
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center gap-space-sm px-space-md py-3 rounded-xl transition-all ${
                    active ? "bg-surface-elevated text-primary border border-spruce shadow-glow" : "border border-transparent hover:bg-surface-elevated"
                  }`}
                >
                  <Icon size={18} className={active ? "text-primary" : "text-text-secondary"} aria-hidden="true" />
                  <span className="min-w-0 flex-1 flex flex-col">
                    <span className="font-label-md text-label-md font-medium text-text-primary">{link.label}</span>
                    <span className="font-body-sm text-body-sm text-text-muted mt-space-3xs">{link.hint}</span>
                  </span>
                  <ChevronRight size={15} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                </a>
              );
            })}
          </nav>
        </div>
        <div className="p-space-lg border-t border-surface-border">
          <div className="flex items-center gap-space-sm mb-space-lg">
            <CircleUserRound size={40} className="p-0.5 rounded-full text-secondary bg-surface-elevated border border-surface-border" aria-hidden="true" />
            <div><p className="font-label-md text-text-primary">Market observer</p><p className="font-body-sm text-text-muted">Personal briefing</p></div>
          </div>
          <button type="button" onClick={onLogout} className="w-full font-body-sm text-body-sm text-text-muted hover:text-negative-coral flex items-center gap-space-xs">
            <LogOut size={16} aria-hidden="true" /> Sign out <span className="ml-auto font-label-sm">v2.4</span>
          </button>
        </div>
      </aside>
      <div className="pl-72">
        <main className="relative min-h-screen bg-surface-base">
          <header className="sticky top-0 z-30 h-20 border-b border-surface-border bg-surface-base/95 backdrop-blur flex items-center justify-between px-space-lg lg:px-space-xl">
            <div className="inline-flex items-center gap-space-xs text-text-secondary font-label-md"><span className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim" /> Market Calm <span className="text-text-muted mx-1">·</span> Curated Briefing Active</div>
            <div className="flex items-center gap-space-sm">
              <label className="hidden md:flex items-center w-80 h-11 px-space-md rounded-xl bg-surface-lifted border border-surface-border text-text-muted focus-within:border-spruce focus-within:shadow-glow">
                <Search size={17} aria-hidden="true" /><input aria-label="Search instruments" placeholder="Search instruments..." className="min-w-0 flex-1 bg-transparent px-space-sm font-body-md text-text-primary placeholder:text-text-muted outline-none" /><kbd className="rounded-md bg-surface-elevated px-2 py-1 font-label-sm">⌘K</kbd>
              </label>
              <button type="button" aria-label="Notifications" className="grid place-items-center w-10 h-10 rounded-full bg-surface-lifted text-text-secondary hover:text-primary hover:bg-surface-elevated"><Bell size={18} aria-hidden="true" /></button>
            </div>
          </header>
          <div className="w-full max-w-[1280px] mx-auto px-space-lg lg:px-space-xl py-space-xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
