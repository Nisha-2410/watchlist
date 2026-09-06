import { useEffect, useState } from "react";
import { api } from "./api";
import { AppShell } from "./components/AppShell";
import { AuthScreen } from "./screens/Auth";
import { CatchUpScreen } from "./screens/CatchUp";
import { PreferencesScreen } from "./screens/Preferences";
import { StockDetailScreen } from "./screens/StockDetail";
import { WatchlistScreen } from "./screens/Watchlist";

function parseHash() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  const params = new URLSearchParams(query);
  return { path, params };
}

export function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loc, setLoc] = useState(parseHash);

  useEffect(() => {
    const onHash = () => setLoc(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    void api
      .home()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <div className="min-h-screen bg-surface-base" />;
  if (!authed) return <AuthScreen onAuthed={() => setAuthed(true)} />;

  const route = `#${loc.path === "/" ? "/" : loc.path}`;
  let page;
  if (loc.path.startsWith("/stocks/")) {
    page = <StockDetailScreen symbol={loc.path.split("/")[2]?.toUpperCase() ?? ""} onNeedAuth={() => setAuthed(false)} />;
  } else if (loc.path === "/watchlist") {
    page = <WatchlistScreen initialTier={loc.params.get("tier") || "All"} initialAddSymbol={loc.params.get("add")} onNeedAuth={() => setAuthed(false)} />;
  } else if (loc.path === "/preferences") {
    page = <PreferencesScreen onNeedAuth={() => setAuthed(false)} />;
  } else {
    page = <CatchUpScreen onNeedAuth={() => setAuthed(false)} />;
  }

  return (
    <AppShell
      route={route}
      onLogout={async () => {
        await api.logout();
        setAuthed(false);
      }}
    >
      {page}
    </AppShell>
  );
}
