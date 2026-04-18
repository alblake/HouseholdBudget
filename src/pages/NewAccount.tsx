import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useCreateAccount } from "../lib/queries";
import { parseMoney } from "../lib/money";

export default function NewAccount() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [startingBalance, setStartingBalance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = useCreateAccount();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the account a name.");
      return;
    }
    const balance = startingBalance.trim() === "" ? 0 : parseMoney(startingBalance);
    if (balance === null) {
      setError("Enter a valid starting balance (e.g. 1234.56).");
      return;
    }
    try {
      const created = await create.mutateAsync({ name: trimmed, starting_balance: balance });
      setLocation(`/accounts/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-brand-600 hover:underline">← Overview</Link>

      <section className="card p-5">
        <h1 className="text-xl font-semibold">New account</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Add a checking account, savings, cash envelope, or anything you want to track.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="name">Account name</label>
            <input
              id="name"
              autoFocus
              className="input"
              placeholder="e.g. Checking"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="bal">Starting balance</label>
            <input
              id="bal"
              type="text"
              inputMode="decimal"
              className="input tabular-nums"
              placeholder="0.00"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Today's balance. Future deposits and withdrawals will be added on top.
            </p>
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 text-red-800 px-3 py-2 text-sm dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Link href="/" className="btn-ghost flex-1 text-center">Cancel</Link>
            <button type="submit" className="btn-primary flex-1" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
