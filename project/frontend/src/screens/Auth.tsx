import { useState } from "react";
import { api } from "../api";

export function AuthScreen({ onAuthed }: { onAuthed: () => void }) {
  const [email, setEmail] = useState("briefing@local.test");
  const [password, setPassword] = useState("briefing-desk");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-space-lg">
      <form
        className="w-full max-w-md bg-surface-lifted border border-surface-border rounded-xl p-space-xl space-y-space-md"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            if (mode === "signup") await api.signup(email, password);
            else await api.login(email, password);
            onAuthed();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not sign in");
          }
        }}
      >
        <h1 className="font-headline-lg text-headline-lg">Smart Market Watchlist</h1>
        <p className="font-body-sm text-text-secondary">Session cookie auth is required. This is not a trading login.</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-[38px] px-space-sm rounded-lg bg-input-surface border border-surface-border" placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full h-[38px] px-space-sm rounded-lg bg-input-surface border border-surface-border" placeholder="Password" />
        {error ? <p className="font-body-sm text-negative-coral">{error}</p> : null}
        <button type="submit" className="w-full py-2 rounded-lg bg-primary-container text-on-primary-container font-label-md">
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
        <button type="button" className="w-full font-body-sm text-text-muted" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
