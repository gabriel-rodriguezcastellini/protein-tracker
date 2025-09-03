# Protein & Water Tracker

[![CodeQL Advanced](https://github.com/gabriel-rodriguezcastellini/protein-tracker/actions/workflows/codeql.yml/badge.svg)](https://github.com/gabriel-rodriguezcastellini/protein-tracker/actions/workflows/codeql.yml)

A tiny web app to log daily **protein** (g) and **water** (L), visualize progress, and optionally sync to the cloud with **Supabase** (Google sign-in only). It also works fully **offline/local** using your browser’s storage and supports **CSV export**.

---

## Features

- ✅ Add/edit/delete entries (date, time, protein, water, note)
- ✅ Auto-time (keeps the current HH\:MM while typing, pauses on focus)
- ✅ Per-day totals + “Last 14 days” protein chart
- ✅ Local persistence (LocalStorage) when signed out
- ✅ Cloud sync when signed in (Supabase + RLS)
- ✅ Google OAuth
- ✅ CSV **export** (sorted)
- ✅ Toast notifications and custom confirm dialog (no browser `alert/confirm`)
- ✅ Production favicon & PWA icons included

---

## Tech stack

- **Next.js (App Router)**
- **TypeScript**, **Tailwind CSS**
- **Supabase** (Auth + Postgres + RLS)
- **Recharts** for charts

---

## License

MIT — do whatever you like, no warranty.
