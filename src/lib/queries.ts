import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  supabase,
  type AccountBalanceRow,
  type AccountRow,
  type TransactionKind,
  type TransactionRow,
} from "./supabase";

export const queryKeys = {
  accounts: ["accounts"] as const,
  account: (id: string) => ["accounts", id] as const,
  transactions: (accountId: string) => ["transactions", accountId] as const,
};

// ---------------- Accounts ----------------

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async (): Promise<AccountBalanceRow[]> => {
      const { data, error } = await supabase
        .from("account_balances")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        starting_balance: Number(r.starting_balance),
        balance: Number(r.balance),
      })) as AccountBalanceRow[];
    },
  });
}

export function useAccount(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.account(id) : ["accounts", "none"],
    enabled: Boolean(id),
    queryFn: async (): Promise<AccountBalanceRow | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("account_balances")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        starting_balance: Number(data.starting_balance),
        balance: Number(data.balance),
      } as AccountBalanceRow;
    },
  });
}

type CreateAccountInput = { name: string; starting_balance: number };

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, starting_balance }: CreateAccountInput): Promise<AccountRow> => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("accounts")
        .insert({ name, starting_balance, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as AccountRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

type RenameAccountInput = { id: string; name: string };

export function useRenameAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: RenameAccountInput) => {
      const { error } = await supabase.from("accounts").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: queryKeys.account(vars.id) });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

// ---------------- Transactions ----------------

export function useTransactions(accountId: string | undefined) {
  return useQuery({
    queryKey: accountId ? queryKeys.transactions(accountId) : ["transactions", "none"],
    enabled: Boolean(accountId),
    queryFn: async (): Promise<TransactionRow[]> => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("account_id", accountId)
        .order("occurred_at", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })) as TransactionRow[];
    },
  });
}

type AddTransactionInput = {
  account_id: string;
  amount: number; // always positive
  kind: Exclude<TransactionKind, "transfer">;
  note?: string | null;
};

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      account_id,
      amount,
      kind,
      note,
    }: AddTransactionInput): Promise<TransactionRow> => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error("Not signed in");
      const signed = kind === "withdrawal" ? -Math.abs(amount) : Math.abs(amount);
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          account_id,
          user_id: user.id,
          amount: signed,
          kind,
          note: note ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as TransactionRow;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: queryKeys.account(vars.account_id) });
      qc.invalidateQueries({ queryKey: queryKeys.transactions(vars.account_id) });
    },
  });
}

type DeleteTxInput = { id: string; account_id: string; transfer_id: string | null };

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, transfer_id }: DeleteTxInput) => {
      // If part of a transfer, delete both legs so balances stay consistent.
      const filter = transfer_id
        ? { col: "transfer_id", val: transfer_id }
        : { col: "id", val: id };
      const { error } = await supabase.from("transactions").delete().eq(filter.col, filter.val);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: queryKeys.transactions(vars.account_id) });
    },
  });
}

// ---------------- Transfers ----------------

type TransferInput = {
  from_account: string;
  to_account: string;
  amount: number; // positive
  note?: string | null;
};

export function useTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      from_account,
      to_account,
      amount,
      note,
    }: TransferInput): Promise<string> => {
      const { data, error } = await supabase.rpc("transfer", {
        p_from_account: from_account,
        p_to_account: to_account,
        p_amount: Math.abs(amount),
        p_note: note ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: queryKeys.transactions(vars.from_account) });
      qc.invalidateQueries({ queryKey: queryKeys.transactions(vars.to_account) });
    },
  });
}
