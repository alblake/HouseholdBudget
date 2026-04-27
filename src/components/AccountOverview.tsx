import { useState } from "react";
import { Link } from "wouter";
import { useAccounts, useAllTransactions } from "../lib/queries";
import { formatMoney } from "../lib/money";
import AccountCard from "./AccountCard";
import DepositWithdrawModal from "./DepositWithdrawModal";
import TransferModal from "./TransferModal";
import TransactionRow from "./TransactionRow";
import type { AccountBalanceRow, TransactionWithAccountRow } from "../lib/supabase";

type Action = { kind: "deposit" | "withdrawal"; account: AccountBalanceRow } | null;
type Props = {
  variant?: "full" | "sidebar";
  activeAccountId?: string;
};

function getTransactionSearchText(tx: TransactionWithAccountRow): string {
  const kindLabel =
    tx.kind === "transfer"
      ? tx.amount >= 0 ? "transfer in" : "transfer out"
      : tx.kind;
  const transferText = tx.transfer_details
    ? `${tx.transfer_details.from_account_name} ${tx.transfer_details.to_account_name}`
    : "";

  return [
    tx.account_name,
    kindLabel,
    tx.note,
    tx.amount,
    Math.abs(tx.amount),
    formatMoney(tx.amount),
    formatMoney(Math.abs(tx.amount)),
    transferText,
  ]
    .filter((part) => part !== null && part !== undefined)
    .join(" ")
    .toLowerCase();
}

export default function AccountOverview({ variant = "full", activeAccountId }: Props) {
  const { data: accounts, isLoading, error } = useAccounts();
  const [action, setAction] = useState<Action>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const list = accounts ?? [];
  const grandTotal = list.reduce((s, a) => s + (a.balance ?? 0), 0);
  const negative = grandTotal < 0;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const {
    data: transactions,
    isLoading: isSearching,
    error: searchError,
  } = useAllTransactions(Boolean(normalizedSearch));
  const matchingTransactions = normalizedSearch
    ? (transactions ?? []).filter((tx) => getTransactionSearchText(tx).includes(normalizedSearch))
    : [];
  const isSidebar = variant === "sidebar";
  const accountGridClass = isSidebar ? "grid gap-3" : "grid gap-3 sm:grid-cols-2";
  const totalClass = isSidebar ? "mt-1 text-3xl" : "mt-1 text-4xl";

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="text-sm text-slate-500 dark:text-slate-400">Grand total</div>
        <div className={`${totalClass} font-semibold tabular-nums ${negative ? "text-red-600 dark:text-red-400" : ""}`}>
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

        <div className="mt-4 flex gap-2">
          <input
            type="search"
            className="input"
            placeholder="Search transactions by name or amount"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="btn-ghost" onClick={() => setSearchQuery("")}>
              Clear
            </button>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-800 px-3 py-2 text-sm dark:bg-red-950/40 dark:text-red-200">
          {error instanceof Error ? error.message : String(error)}
        </div>
      )}

      {searchError && (
        <div className="rounded-lg bg-red-50 text-red-800 px-3 py-2 text-sm dark:bg-red-950/40 dark:text-red-200">
          {searchError instanceof Error ? searchError.message : String(searchError)}
        </div>
      )}

      {normalizedSearch && (
        <section className="card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
            Search results
          </h2>
          {isSearching ? (
            <div className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
              Searching transactions…
            </div>
          ) : matchingTransactions.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
              No transactions match "{searchQuery.trim()}".
            </div>
          ) : (
            <div>
              <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                {matchingTransactions.length} matching {matchingTransactions.length === 1 ? "transaction" : "transactions"}
              </div>
              {matchingTransactions.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} accountName={tx.account_name} />
              ))}
            </div>
          )}
        </section>
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
        <div className={accountGridClass}>
          {list.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              active={a.id === activeAccountId}
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
