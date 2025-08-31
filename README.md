# Protein & Water Tracker

[![CodeQL Advanced](https://github.com/gabriel-rodriguezcastellini/protein-tracker/actions/workflows/codeql.yml/badge.svg)](https://github.com/gabriel-rodriguezcastellini/protein-tracker/actions/workflows/codeql.yml)

A tiny web app to log daily **protein** (g) and **water** (L), visualize progress, and optionally sync to the cloud with **Supabase** (Google sign-in only). It also works fully **offline/local** using your browser’s storage and supports **CSV import/export**.

---

## Features

* ✅ Add/edit/delete entries (date, time, protein, water, note)
* ✅ Auto-time (keeps the current HH\:MM while typing, pauses on focus)
* ✅ Per-day totals + “Last 14 days” protein chart
* ✅ Local persistence (LocalStorage) when signed out
* ✅ Cloud sync when signed in (Supabase + RLS)
* ✅ Google OAuth
* ✅ CSV **export** (sorted) and **import** with duplicates protection & subtotal/total line skipping
* ✅ Toast notifications and custom confirm dialog (no browser `alert/confirm`)
* ✅ Production favicon & PWA icons included

---

## Tech stack

* **Next.js (App Router)**
* **TypeScript**, **Tailwind CSS**
* **Supabase** (Auth + Postgres + RLS)
* **Recharts** for charts

---

## Quick start (local)

### 1) Prereqs

* Node 18+ (LTS recommended)
* A Supabase project (free tier is fine)

### 2) Install & run

```bash
# from the project root
npm install
cp .env.example .env.local   # or create the file and fill in the values below
npm run dev
```

### 3) Environment variables (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...
```

> Tip: These keys are **public** client keys intended for use in the browser when RLS is enabled.

---

## Supabase setup

1. **Create project** → copy your `URL` and `anon` key into `.env.local`.
2. **Auth → Providers**: enable **Google** (fill client ID/secret from Google Cloud).
   *Auth → Settings*: **disable anonymous sign-in** if you don’t want unauthenticated users.
3. **SQL** → run the schema below.

### Tables

```sql
-- entries
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,     -- "YYYY-MM-DD"
  time text not null,     -- "HH:MM" 24h
  protein numeric not null default 0,
  water numeric not null default 0,
  note text,
  created_at timestamptz default now()
);

-- goals (one row per user)
create table if not exists public.goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_protein numeric not null default 160,
  daily_water numeric not null default 2
);
```

### Row-Level Security (RLS)

```sql
alter table public.entries enable row level security;
alter table public.goals  enable row level security;

-- entries policies
create policy "entries select own" 
on public.entries for select
using (auth.uid() = user_id);

create policy "entries insert own"
on public.entries for insert
with check (auth.uid() = user_id);

create policy "entries update own"
on public.entries for update
using (auth.uid() = user_id);

create policy "entries delete own"
on public.entries for delete
using (auth.uid() = user_id);

-- goals policies
create policy "goals select own"
on public.goals for select
using (auth.uid() = user_id);

create policy "goals upsert own"
on public.goals for insert
with check (auth.uid() = user_id);

create policy "goals update own"
on public.goals for update
using (auth.uid() = user_id);
```

### Indexes (recommended)

```sql
-- Speeds up user timeline queries
create index if not exists idx_entries_user_date_time
  on public.entries (user_id, date, time);
```

---

## CSV format

**Header (preferred):**

```
date,time,grams_of_protein,liters_of_water,note
```

* Dates like `2025-08-19`; times like `13:15` or `1:00 PM` (12/24h accepted)
* The importer:

  * Skips lines where any cell is `total` / `subtotal`
  * Forward-fills missing date cells (like Sheets)
  * Normalizes time (`1:00 PM` → `13:00`)
  * Ignores perfect duplicates (same date|time|protein|water|note)
  * Accepts numbers with symbols (e.g., `35.00 g`)

---

## Icons / favicon

Files (already generated):

* `public/favicon.ico` (multi-size)
* `public/icon-192.png`, `public/icon-256.png`, `public/icon-512.png`
* `public/icon-master-1024.png` (source)

If you’re using Next **metadata**, in `app/layout.tsx`:

```ts
export const metadata = {
  title: "Protein & Water Tracker",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};
```

---

## Deploy

### Vercel (recommended)

1. Push to GitHub.
2. Import the repo in Vercel.
3. Add the two env vars (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in *Project Settings → Environment Variables*.
4. Deploy.

> “Fast Refresh done in NaNms” is a dev-only console message—**won’t appear in production**.

---

## Useful scripts

```bash
npm run dev     # start local dev (Next.js)
npm run build   # typecheck + production build
npm run start   # run production build locally
```

---

## Troubleshooting

* **400 “column … does not exist”**
  Make sure the app expects `daily_protein` / `daily_water` column names in `goals` (snake\_case).

* **Google sign-in fails (“provider is not enabled”)**
  Enable Google in Supabase → Auth → Providers. Add valid OAuth credentials.

* **“API key not found” when hitting REST URLs in a browser tab**
  That message is normal when calling `rest/v1` directly without `apikey` headers. The app uses the Supabase JS client which sets headers for you.

* **Hydration mismatch during dev**
  Usually from time/date rendering before mount. The code defers auto-time updates until the component is mounted; a full reload fixes transient warnings.

---

## License

MIT — do whatever you like, no warranty.

---

## Roadmap / Ideas

* Progress rings for daily goals
* Weekly averages
* Export as XLSX
* Optional reminders / notifications

---

