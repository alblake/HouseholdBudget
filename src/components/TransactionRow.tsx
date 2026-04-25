import type { TransactionRow as Tx } from "../lib/supabase";
import { formatMoney } from "../lib/money";

type Props = {
  tx: Tx;
  runningBalance?: number;
  onDelete?: () => void;
};

function describeKind(tx: Tx): string {
  if (tx.kind === "transfer") {
    return tx.amount >= 0 ? "Transfer in" : "Transfer out";
  }
  if (tx.kind === "deposit") return "Deposit";
  return "Withdrawal";
}

export default function TransactionRow({ tx, runningBalance, onDelete }: Props) {
  const positive = tx.amount >= 0;
  const date = new Date(tx.occurred_at);
  const runningNegative = (runningBalance ?? 0) < 0;
  const transferDetails = tx.transfer_details
    ? `${tx.transfer_details.from_account_name} → ${tx.transfer_details.to_account_name}`
    : null;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-200 dark:border-slate-800 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate">{describeKind(tx)}</div>
        {transferDetails && (
          <div className="text-sm text-slate-700 dark:text-slate-300 truncate">
            {transferDetails}
          </div>
        )}
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
        <div>{positive ? "+" : ""}{formatMoney(tx.amount)}</div>
        {runningBalance !== undefined && (
          <div className={`mt-0.5 text-right text-xs font-normal ${runningNegative ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
            Total {formatMoney(runningBalance)}
          </div>
        )}
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
