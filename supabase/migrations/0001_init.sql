-- Household Budget initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.accounts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  starting_balance numeric(14,2) not null default 0,
  created_at       timestamptz not null default now()
);

create index if not exists accounts_user_id_idx on public.accounts(user_id);

create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  account_id   uuid not null references public.accounts(id) on delete cascade,
  amount       numeric(14,2) not null,                            -- signed: +deposit, -withdrawal
  kind         text not null check (kind in ('deposit','withdrawal','transfer')),
  transfer_id  uuid,                                              -- pairs the two legs of a transfer
  note         text,
  occurred_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists transactions_account_id_idx  on public.transactions(account_id);
create index if not exists transactions_user_id_idx     on public.transactions(user_id);
create index if not exists transactions_transfer_id_idx on public.transactions(transfer_id);

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table public.accounts     enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "accounts owner select" on public.accounts;
drop policy if exists "accounts owner insert" on public.accounts;
drop policy if exists "accounts owner update" on public.accounts;
drop policy if exists "accounts owner delete" on public.accounts;

create policy "accounts owner select" on public.accounts
  for select using (user_id = auth.uid());
create policy "accounts owner insert" on public.accounts
  for insert with check (user_id = auth.uid());
create policy "accounts owner update" on public.accounts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "accounts owner delete" on public.accounts
  for delete using (user_id = auth.uid());

drop policy if exists "transactions owner select" on public.transactions;
drop policy if exists "transactions owner insert" on public.transactions;
drop policy if exists "transactions owner update" on public.transactions;
drop policy if exists "transactions owner delete" on public.transactions;

create policy "transactions owner select" on public.transactions
  for select using (user_id = auth.uid());
create policy "transactions owner insert" on public.transactions
  for insert with check (user_id = auth.uid());
create policy "transactions owner update" on public.transactions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "transactions owner delete" on public.transactions
  for delete using (user_id = auth.uid());

-- ============================================================
-- View: account balance = starting_balance + sum(transactions.amount)
-- Exposed as a normal view; RLS on the underlying tables protects rows.
-- ============================================================

create or replace view public.account_balances as
  select
    a.id,
    a.user_id,
    a.name,
    a.starting_balance,
    a.created_at,
    a.starting_balance + coalesce(sum(t.amount), 0) as balance,
    count(t.id)::int                                as transaction_count
  from public.accounts a
  left join public.transactions t on t.account_id = a.id
  group by a.id;

-- Make the view return rows under the caller's identity (Postgres 15+).
alter view public.account_balances set (security_invoker = true);

-- ============================================================
-- RPC: transfer() — atomically inserts two linked transactions.
-- ============================================================

create or replace function public.transfer(
  p_from_account uuid,
  p_to_account   uuid,
  p_amount       numeric,
  p_note         text default null
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_user_id     uuid := auth.uid();
  v_transfer_id uuid := gen_random_uuid();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  if p_from_account = p_to_account then
    raise exception 'source and destination accounts must differ';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be greater than zero';
  end if;

  -- Both inserts are bound by RLS; if either account does not belong to the
  -- caller, the insert fails and the whole function rolls back.
  insert into public.transactions (user_id, account_id, amount, kind, transfer_id, note)
    values (v_user_id, p_from_account, -p_amount, 'transfer', v_transfer_id, p_note);

  insert into public.transactions (user_id, account_id, amount, kind, transfer_id, note)
    values (v_user_id, p_to_account,    p_amount, 'transfer', v_transfer_id, p_note);

  return v_transfer_id;
end;
$$;

grant execute on function public.transfer(uuid, uuid, numeric, text) to authenticated;
