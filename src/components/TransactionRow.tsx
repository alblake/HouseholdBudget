import type { TransactionRow as Tx } from "../lib/supabase";
import { formatMoney } from "../lib/money";

type Props = {
  tx: Tx;
  onDelete?: () => void;
};

function describeKind(tx: Tx): string {
  if (tx.kind === "transfer") {
    return tx.amount >= 0 ? "Transfer in" : "Transfer out";
  }
  if (tx.kind === "deposit") return "Deposit";
  return "Withdrawal";
}

export default function TransactionRow({ tx, onDelete }: Props) {
  const positive = tx.amount >= 0;
  const date = new Date(tx.occurred_at);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-200 dark:border-slate-800 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate">{describeKind(tx)}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {date.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
          {tx.note ? ` · ${tx.note}` : ""}
        </div>
      </div>
      <div className={`tabular-nums font-medium ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
        {positive ? "+" : ""}{formatMoney(tx.amount)}
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
          aria-label="Delete"
          title={tx.transfer_id ? "Delete (also removes the matching transfer leg)" : "Delete"}
        >
          ✕
        </button>
      )}
    </div>
  );
}
