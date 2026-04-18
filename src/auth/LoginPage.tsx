import { useState, type FormEvent } from "react";
import { useAuth } from "./AuthProvider";
import { isSupabaseConfigured } from "../lib/supabase";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Copy .env.example to .env and add your project URL and anon key.");
      return;
    }
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        const { needsConfirmation } = await signUp(email, password);
        if (needsConfirmation) {
          setInfo("Check your inbox to confirm your email, then sign in.");
          setMode("signin");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">
            $
          </div>
          <div>
            <h1 className="text-lg font-semibold">Household Budget</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === "signin" ? "Sign in to your account" : "Create a new account"}
            </p>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-lg bg-amber-50 text-amber-900 ring-1 ring-amber-200 px-3 py-2 text-sm dark:bg-amber-900/20 dark:text-amber-200 dark:ring-amber-800">
            Supabase env vars not detected. Copy <code>.env.example</code> to <code>.env</code> and restart <code>npm run dev</code>.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 text-red-800 px-3 py-2 text-sm dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-lg bg-emerald-50 text-emerald-800 px-3 py-2 text-sm dark:bg-emerald-950/40 dark:text-emerald-200">
              {info}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          {mode === "signin" ? (
            <>
              No account?{" "}
              <button
                className="font-medium text-brand-600 hover:underline"
                onClick={() => { setMode("signup"); setError(null); setInfo(null); }}
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have one?{" "}
              <button
                className="font-medium text-brand-600 hover:underline"
                onClick={() => { setMode("signin"); setError(null); setInfo(null); }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
