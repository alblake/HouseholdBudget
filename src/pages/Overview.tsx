import { useState } from "react";
import { Link } from "wouter";
import { useAccounts } from "../lib/queries";
import { formatMoney } from "../lib/money";
import AccountCard from "../components/AccountCard";
import DepositWithdrawModal from "../components/DepositWithdrawModal";
import TransferModal from "../components/TransferModal";
import type { AccountBalanceRow } from "../lib/supabase";

type Action = { kind: "deposit" | "withdrawal"; account: AccountBalanceRow } | null;

export default function Overview() {
  const { data: accounts, isLoading, error } = useAccounts();
  const [action, setAction] = useState<Action>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState<string | null>(null);

  const list = accounts ?? [];
  const grandTotal = list.reduce((s, a) => s + (a.balance ?? 0), 0);
  const negative = grandTotal < 0;

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="text-sm text-slate-500 dark:text-slate-400">Grand total</div>
        <div className={`mt-1 text-4xl font-semibold tabular-nums ${negative ? "text-red-600 dark:text-red-400" : ""}`}>
          {formatMoney(grandTotal)}
        </div>
        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          across {list.length} {list.length === 1 ? "account" : "accounts"}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/accounts/new" className="btn-primary">+ New account</Link>
          <button
            type="button"
            className="btn-secondary"
            disabled={list.length < 2}
            onClick={() => { setTransferFrom(null); setTransferOpen(true); }}
          >
            ↔ Transfer
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-800 px-3 py-2 text-sm dark:bg-red-950/40 dark:text-red-200">
          {error instanceof Error ? error.message : String(error)}
        </div>
      )}

      {isLoading ? (
        <div className="text-slate-500 text-sm">Loading accounts…</div>
      ) : list.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-lg font-medium">No accounts yet</div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create your first account to start tracking your household budget.
          </p>
          <div className="mt-4">
            <Link href="/accounts/new" className="btn-primary">+ Create account</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              onDeposit={() => setAction({ kind: "deposit", account: a })}
              onWithdraw={() => setAction({ kind: "withdrawal", account: a })}
              onTransfer={() => { setTransferFrom(a.id); setTransferOpen(true); }}
            />
          ))}
        </div>
      )}

      <DepositWithdrawModal
        open={action !== null}
        onClose={() => setAction(null)}
        account={action?.account ?? null}
        mode={action?.kind ?? "deposit"}
      />

      <TransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        accounts={list}
        defaultFromId={transferFrom}
      />
    </div>
  );
}
