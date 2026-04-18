import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useAccount,
  useAccounts,
  useDeleteAccount,
  useDeleteTransaction,
  useRenameAccount,
  useTransactions,
} from "../lib/queries";
import { formatMoney } from "../lib/money";
import TransactionRow from "../components/TransactionRow";
import DepositWithdrawModal from "../components/DepositWithdrawModal";
import TransferModal from "../components/TransferModal";

export default function AccountDetail({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const { data: account, isLoading } = useAccount(id);
  const { data: accounts } = useAccounts();
  const { data: transactions } = useTransactions(id);

  const renameMut = useRenameAccount();
  const deleteAccountMut = useDeleteAccount();
  const deleteTxMut = useDeleteTransaction();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const [mode, setMode] = useState<"deposit" | "withdrawal" | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  if (isLoading) {
    return <div className="text-slate-500 text-sm">Loading…</div>;
  }
  if (!account) {
    return (
      <div className="card p-6 text-center">
        <div className="text-lg font-medium">Account not found</div>
        <Link href="/" className="btn-secondary mt-4 inline-flex">Back to overview</Link>
      </div>
    );
  }

  async function onRename() {
    const next = nameDraft.trim();
    if (!account || !next || next === account.name) {
      setEditingName(false);
      return;
    }
    await renameMut.mutateAsync({ id: account.id, name: next });
    setEditingName(false);
  }

  async function onDeleteAccount() {
    if (!account) return;
    const ok = window.confirm(
      `Delete account "${account.name}"? This will also remove its ${account.transaction_count} transaction(s). This cannot be undone.`,
    );
    if (!ok) return;
    await deleteAccountMut.mutateAsync(account.id);
    setLocation("/");
  }

  const negative = account.balance < 0;
  const txList = transactions ?? [];

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-brand-600 hover:underline">← Overview</Link>

      <section className="card p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  className="input"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void onRename();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                />
                <button className="btn-primary" onClick={() => void onRename()}>Save</button>
                <button className="btn-ghost" onClick={() => setEditingName(false)}>Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold truncate">{account.name}</h1>
                <button
                  className="btn-ghost text-xs"
                  onClick={() => { setNameDraft(account.name); setEditingName(true); }}
                >
                  Rename
                </button>
              </div>
            )}
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Starting balance {formatMoney(account.starting_balance)} ·
              {" "}{txList.length} {txList.length === 1 ? "transaction" : "transactions"}
            </div>
          </div>
          <div className={`text-3xl font-semibold tabular-nums ${negative ? "text-red-600 dark:text-red-400" : ""}`}>
            {formatMoney(account.balance)}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setMode("deposit")} className="btn-primary">+ Deposit</button>
          <button onClick={() => setMode("withdrawal")} className="btn-secondary">− Withdraw</button>
          <button
            onClick={() => setTransferOpen(true)}
            className="btn-secondary"
            disabled={(accounts?.length ?? 0) < 2}
          >
            ↔ Transfer
          </button>
          <button onClick={onDeleteAccount} className="btn-danger ml-auto">Delete account</button>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
          Transactions
        </h2>
        {txList.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            No transactions yet. Use Deposit, Withdraw, or Transfer above.
          </div>
        ) : (
          <div>
            {txList.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                onDelete={() => {
                  const ok = window.confirm(
                    tx.transfer_id
                      ? "Delete this transfer? Both legs will be removed."
                      : "Delete this transaction?",
                  );
                  if (!ok) return;
                  void deleteTxMut.mutateAsync({
                    id: tx.id,
                    account_id: account.id,
                    transfer_id: tx.transfer_id,
                  });
                }}
              />
            ))}
          </div>
        )}
      </section>

      <DepositWithdrawModal
        open={mode !== null}
        onClose={() => setMode(null)}
        account={account}
        mode={mode ?? "deposit"}
      />
      <TransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        accounts={accounts ?? []}
        defaultFromId={account.id}
      />
    </div>
  );
}
