import { useEffect, useState, type FormEvent } from "react";
import Modal from "./Modal";
import { useTransfer } from "../lib/queries";
import { formatMoney, parseMoney } from "../lib/money";
import type { AccountBalanceRow } from "../lib/supabase";

type Props = {
  open: boolean;
  onClose: () => void;
  accounts: AccountBalanceRow[];
  defaultFromId?: string | null;
};

export default function TransferModal({ open, onClose, accounts, defaultFromId }: Props) {
  const [fromId, setFromId] = useState<string>("");
  const [toId, setToId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const transfer = useTransfer();

  useEffect(() => {
    if (!open) return;
    const initialFrom = defaultFromId ?? accounts[0]?.id ?? "";
    const initialTo = accounts.find((a) => a.id !== initialFrom)?.id ?? "";
    setFromId(initialFrom);
    setToId(initialTo);
    setAmount("");
    setNote("");
    setError(null);
  }, [open, defaultFromId, accounts]);

  const fromAccount = accounts.find((a) => a.id === fromId) ?? null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const value = parseMoney(amount);
    if (value === null || value <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!fromId || !toId) {
      setError("Choose both accounts.");
      return;
    }
    if (fromId === toId) {
      setError("Source and destination must differ.");
      return;
    }
    try {
      await transfer.mutateAsync({
        from_account: fromId,
        to_account: toId,
        amount: value,
        note: note.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Transfer between accounts">
      {accounts.length < 2 ? (
        <div className="text-sm text-slate-600 dark:text-slate-400">
          You need at least two accounts to transfer. Create another account first.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">From</label>
            <select className="input" value={fromId} onChange={(e) => setFromId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {formatMoney(a.balance)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">To</label>
            <select className="input" value={toId} onChange={(e) => setToId(e.target.value)}>
              {accounts
                .filter((a) => a.id !== fromId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {formatMoney(a.balance)}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="label">Amount</label>
            <input
              type="text"
              inputMode="decimal"
              className="input text-lg tabular-nums"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {fromAccount && (
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Source balance: {formatMoney(fromAccount.balance)}
              </div>
            )}
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Move to savings"
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
            <button type="submit" className="btn-primary flex-1" disabled={transfer.isPending}>
              {transfer.isPending ? "Transferring…" : "Transfer"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
