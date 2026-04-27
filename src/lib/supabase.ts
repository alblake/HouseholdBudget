import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Surfaced in the LoginPage so users get a friendly setup hint.
  console.warn(
    "[Household Budget] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase project values.",
  );
}

export const supabase = createClient(url ?? "http://localhost:54321", anonKey ?? "public-anon-key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

export const isSupabaseConfigured = Boolean(url && anonKey);

export type AccountRow = {
  id: string;
  user_id: string;
  name: string;
  starting_balance: number;
  created_at: string;
};

export type AccountBalanceRow = AccountRow & {
  balance: number;
  transaction_count: number;
};

export type TransactionKind = "deposit" | "withdrawal" | "transfer";

export type TransferDetails = {
  from_account_name: string;
  to_account_name: string;
};

export type TransactionRow = {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  kind: TransactionKind;
  transfer_id: string | null;
  note: string | null;
  occurred_at: string;
  created_at: string;
  transfer_details?: TransferDetails;
};

export type TransactionWithAccountRow = TransactionRow & {
  account_name: string;
};
