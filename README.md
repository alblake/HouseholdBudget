# Household Budget

A self-contained Progressive Web App for managing a household budget across an unlimited number of accounts. Built to install to the **macOS Dock** and the **iPhone Home Screen** like a native app — no Xcode, no App Store, no developer account required.

- Sign up / sign in (Supabase Auth)
- Create unlimited accounts (Checking, Savings, Cash, etc.)
- Deposit, withdraw, and **transfer between any two accounts in one tap**
- Overview screen with **grand total across all accounts**
- Per-user data isolation via Postgres Row-Level Security
- Works on an old MacBook Pro (macOS 11+) and on iPhone

## Tech stack

| Layer    | Choice                                 |
| -------- | -------------------------------------- |
| Frontend | React + TypeScript + Vite              |
| UI       | Tailwind CSS                           |
| PWA      | `vite-plugin-pwa` (Workbox)            |
| Routing  | `wouter`                               |
| Data     | TanStack Query + `@supabase/supabase-js` |
| Backend  | Supabase (Postgres, Auth, RLS, RPC)    |

---

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project dashboard, open **SQL Editor → New query** and paste the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). Run it. This creates:
   - `accounts` and `transactions` tables
   - Row-Level Security policies so each user only sees their own data
   - An `account_balances` view (starting balance + sum of transactions)
   - An atomic `transfer(from, to, amount, note)` RPC
3. Open **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
4. *(Optional)* Open **Authentication → Providers → Email** and turn off "Confirm email" for the easiest first-run experience. Re-enable it any time.

## 2. Configure local env

```bash
cp .env.example .env
# then edit .env and paste your Supabase URL + anon key
```

## 3. Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. Sign up with any email + password and start adding accounts.

## 4. Build for production

```bash
npm run build
npm run preview   # serves the production build at http://localhost:4173
```

The production build includes a service worker and Web App Manifest, so it can be installed as an app.

---

## Deploy (so iPhone can see it)

iOS requires an **HTTPS** URL for "Add to Home Screen" to behave like an installed app, so the easiest path is a free static host.

### Vercel (recommended)

1. `npm install -g vercel` then `vercel` from the project root, or push to GitHub and import at [vercel.com/new](https://vercel.com/new).
2. In **Project Settings → Environment Variables** add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Vercel auto-detects Vite. Build command `npm run build`, output `dist`.

### Netlify

Same idea: connect repo, set the two env vars, build `npm run build`, publish directory `dist`.

---

## Install as an app

### macOS (Mac dock)

- **Safari 17+**: open the deployed URL → menu **File → Add to Dock**.
- **Chrome**: open the URL → click the install icon in the address bar (or **⋮ → Cast, save and share → Install Page as App**).

The app opens in its own window with no browser chrome.

### iPhone (Home Screen)

1. Open the deployed URL in **Safari** (must be Safari, not Chrome).
2. Tap the **Share** button.
3. Tap **Add to Home Screen**.

Launching from the Home Screen opens the app full-screen with no Safari UI.

---

## How transfers stay consistent

A "transfer" is two `transactions` rows that share a `transfer_id` (one negative for the source, one positive for the destination), inserted by the Postgres `transfer()` function. Because both inserts run inside one function call, either both succeed or both fail — balances can never get out of sync. Deleting one leg from the UI also deletes the other.

## Data model (TL;DR)

```text
accounts(id, user_id, name, starting_balance, created_at)
transactions(id, user_id, account_id, amount, kind, transfer_id, note, occurred_at, created_at)
account_balances  -- view: starting_balance + sum(transactions.amount)
```

Both tables have RLS enabled with the policy `user_id = auth.uid()`, so even with a leaked anon key, users can never read or write each other's rows.

## Project layout

```
HouseholdBudget/
  index.html
  vite.config.ts                 # Vite + vite-plugin-pwa
  tailwind.config.ts
  src/
    main.tsx, App.tsx
    auth/
      AuthProvider.tsx, LoginPage.tsx
    pages/
      Overview.tsx, AccountDetail.tsx, NewAccount.tsx
    components/
      AppLayout.tsx, AccountCard.tsx, TransactionRow.tsx
      DepositWithdrawModal.tsx, TransferModal.tsx, Modal.tsx
    lib/
      supabase.ts                # client + types
      queries.ts                 # TanStack Query hooks
      money.ts                   # format/parse currency
  public/
    favicon.svg, icon-192.png, icon-512.png, apple-touch-icon.png
  supabase/
    migrations/0001_init.sql     # schema + RLS + transfer() RPC
```

## License

MIT — do whatever you like with it.
