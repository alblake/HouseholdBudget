import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../auth/AuthProvider";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [location] = useLocation();

  const onOverview = location === "/";

  return (
    <div className="min-h-full flex flex-col">
      <header
        className="sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur ring-1 ring-slate-200 dark:ring-slate-800 pt-[env(safe-area-inset-top)]"
        style={{
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center text-sm">$</span>
            <span>Household Budget</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {!onOverview && (
              <Link href="/" className="btn-ghost text-sm">Overview</Link>
            )}
            <button
              className="btn-ghost text-sm"
              onClick={() => void signOut()}
              title={user?.email ?? "Sign out"}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main
        className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]"
        style={{
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        {children}
      </main>
    </div>
  );
}
