import { useEffect, useState, type FormEvent } from "react";
import Modal from "./Modal";
import { useAddTransaction } from "../lib/queries";
import { parseMoney } from "../lib/money";
import type { AccountBalanceRow } from "../lib/supabase";

type Mode = "deposit" | "withdrawal";

type Props = {
  open: boolean;
  onClose: () => void;
  account: AccountBalanceRow | null;
  mode: Mode;
};

export default function DepositWithdrawModal({ open, onClose, account, mode }: Props) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const addTx = useAddTransaction();

  useEffect(() => {
    if (open) {
      setAmount("");
      setNote("");
      setError(null);
    }
  }, [open, account?.id, mode]);

  if (!account) return null;

  const title = mode === "deposit" ? `Deposit to ${account.name}` : `Withdraw from ${account.name}`;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const value = parseMoney(amount);
    if (value === null || value <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    try {
      await addTx.mutateAsync({
        account_id: account!.id,
        amount: value,
        kind: mode,
        note: note.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Amount</label>
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            className="input text-lg tabular-nums"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Paycheck, Groceries"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        {error && (
          <div className="rounded-lg bg-red-50 text-red-800 px-3 py-2 text-sm dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={addTx.isPending}>
            {addTx.isPending ? "Saving…" : mode === "deposit" ? "Deposit" : "Withdraw"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
