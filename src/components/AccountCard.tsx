import { Link } from "wouter";
import type { AccountBalanceRow } from "../lib/supabase";
import { formatMoney } from "../lib/money";

type Props = {
  account: AccountBalanceRow;
  active?: boolean;
  onDeposit: () => void;
  onWithdraw: () => void;
  onTransfer: () => void;
};

export default function AccountCard({ account, active = false, onDeposit, onWithdraw, onTransfer }: Props) {
  const negative = account.balance < 0;
  return (
    <div className={`card p-4 flex flex-col gap-3 ${active ? "ring-2 ring-brand-500" : ""}`}>
      <Link
        href={`/accounts/${account.id}`}
        className="flex items-baseline justify-between gap-3 hover:opacity-90"
      >
        <div className="min-w-0">
          <div className="font-medium truncate">{account.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {account.transaction_count} {account.transaction_count === 1 ? "transaction" : "transactions"}
          </div>
        </div>
        <div className={`text-xl font-semibold tabular-nums ${negative ? "text-red-600 dark:text-red-400" : ""}`}>
          {formatMoney(account.balance)}
        </div>
      </Link>
      <div className="flex flex-wrap gap-2">
        <button onClick={onDeposit} className="btn-secondary flex-1 min-w-[7rem]">+ Deposit</button>
        <button onClick={onWithdraw} className="btn-secondary flex-1 min-w-[7rem]">− Withdraw</button>
        <button onClick={onTransfer} className="btn-secondary flex-1 min-w-[7rem]">↔ Transfer</button>
      </div>
    </div>
  );
}
