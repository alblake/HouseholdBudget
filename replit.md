# Household Budget

A Progressive Web App (PWA) for managing household finances across multiple accounts.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: wouter
- **Backend/Auth/DB**: Supabase (PostgreSQL + Auth + RLS)
- **PWA**: vite-plugin-pwa (installable on macOS and iOS)
- **Forms**: react-hook-form + zod

## Project Structure

- `src/auth/` - Authentication provider and Login page
- `src/components/` - Reusable UI components
- `src/lib/` - Supabase client, query hooks, utilities
- `src/pages/` - Main view pages (Overview, Account Details, New Account)
- `supabase/` - Database migrations/schema
- `public/` - Static assets and PWA icons

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase project values:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Development

```bash
npm install
npm run dev
```

Runs on port 5000 (configured for Replit's proxy).

## Deployment

Configured as a static frontend. Build with `npm run build`, serve the `dist/` folder.
