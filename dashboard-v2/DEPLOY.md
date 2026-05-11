# Portfolio Intelligence Dashboard v2 — Deployment Guide

Complete step-by-step guide to get the dashboard live on Vercel + Supabase.

---

## Prerequisites

- Node.js 18+ installed locally
- Git repo already set up (the one sync.sh pushes to)
- Vercel account (free tier works)
- Supabase account (free tier works) — **optional**, only needed for manual War Room entries

---

## Step 1 — Add Supabase package back

The `@supabase/supabase-js` dependency needs to be added before deploying:

```bash
cd "Stock portfolio/dashboard-v2"
npm install @supabase/supabase-js
```

---

## Step 2 — Set up Supabase (for War Room manual entries)

> **Skip this step** if you only want auto-generated entries. The dashboard works without Supabase — you just won't be able to save manual War Room entries.

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it `portfolio-intelligence` (or anything)
3. Note your **Project URL** and **anon/public key** (Settings → API)
4. Open the SQL Editor and run the contents of `supabase/schema.sql`
5. Create `.env.local` in the `dashboard-v2/` folder:

```bash
cp .env.local.example .env.local
# Edit .env.local and fill in your Supabase URL and anon key
```

---

## Step 3 — Test locally

```bash
cd "Stock portfolio/dashboard-v2"
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dashboard reads JSON data from `../data/` (the sibling `data/` folder in your repo).

**Verify the data path is correct:** The `lib/data.ts` file uses:
```
DATA_DIR = path.join(process.cwd(), '..', 'data')
```
This assumes `dashboard-v2/` sits next to `data/` in your repo. Adjust if your folder structure differs.

---

## Step 4 — Deploy to Vercel

### Option A — Vercel CLI (recommended)

```bash
cd "Stock portfolio/dashboard-v2"
npx vercel
# Follow the prompts:
# - Link to existing project or create new one
# - Root directory: dashboard-v2 (if deploying from repo root)
# - Framework: Next.js (auto-detected)
```

### Option B — Vercel Dashboard

1. Push your code to GitHub (sync.sh already does this)
2. Go to [vercel.com](https://vercel.com) → New Project → Import your Git repo
3. Set **Root Directory** to `dashboard-v2`
4. Vercel auto-detects Next.js — click Deploy

### Configure environment variables on Vercel

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` |

---

## Step 5 — The data problem on Vercel

**Important:** Vercel is a serverless environment. It cannot read files from `../data/` on your local machine.

You have two options:

### Option A — Include data files in the repo (recommended, easiest)

Your `sync.sh` already commits JSON data files to git. As long as `data/*.json` is tracked (not gitignored), Vercel will have access to them at build time AND via the API routes.

**Check your .gitignore** — make sure these are NOT ignored:
```
data/market-prices.json
data/holdings.json
data/actions.json
data/predictions.json
data/context.json
data/forecast-accuracy-log.json
data/next-run-context.json
```

The API route reads files at request time (`force-dynamic`), so each Vercel deployment will use the data that was in the repo at deploy time. Since sync.sh runs every 5 minutes and each push triggers a Vercel deploy, your data will be ~5 minutes stale — which matches the local refresh cadence.

### Option B — Supabase for all data (advanced)

Migrate all JSON data to Supabase tables. This gives true real-time data but requires more setup. Not recommended unless you want to eliminate the git-sync dependency.

---

## Step 6 — Configure auto-deploy on each sync.sh push

Vercel auto-deploys on every git push by default. Since `sync.sh` pushes to your repo every ~5 minutes, each push will trigger a new Vercel build.

**Tip:** Vercel free tier includes 100 builds/day. At 5-min sync cadence that's 288 builds/day — too many. To avoid this:

Option 1 — Reduce sync.sh push frequency (keep syncing data but push less often):
```bash
# In your sync.sh, push to git only every 30 minutes
# Keep data files updating locally every 5 minutes
```

Option 2 — Use Vercel's "Ignored Build Step" to skip deploys when only data changes:
In Vercel Settings → Git → Ignored Build Step:
```bash
# Only build if dashboard-v2/ source files changed (not data/)
git diff HEAD^ HEAD --quiet -- dashboard-v2/
```

Option 3 — Use the Vercel API to trigger deployments manually from sync.sh every 30 min.

---

## Folder Structure Reference

```
Stock portfolio/
├── data/                    ← JSON data files (synced by scheduled tasks + sync.sh)
│   ├── market-prices.json
│   ├── holdings.json
│   ├── actions.json
│   ├── predictions.json
│   ├── context.json
│   ├── forecast-accuracy-log.json
│   └── next-run-context.json
├── briefings/               ← Morning/EOD briefing markdown files
├── daily-briefings/         ← Alternative briefing location
├── dashboard-v2/            ← THIS PROJECT
│   ├── app/
│   │   ├── api/
│   │   │   ├── data/route.ts       ← Reads all JSON data
│   │   │   ├── briefing/route.ts   ← Reads markdown briefings
│   │   │   └── changelog/route.ts  ← Merges auto + Supabase entries
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                ← Main shell, 6 tabs
│   ├── components/
│   │   ├── CommandCenter.tsx        ← Tab 1: Overview + live forecast
│   │   ├── IntelligenceTab.tsx      ← Tab 2: Briefings + forecast track
│   │   ├── PredictionsTab.tsx       ← Tab 3: Full prediction lab
│   │   ├── PortfolioTab.tsx         ← Tab 4: Holdings + actions
│   │   ├── ChangelogTab.tsx         ← Tab 5: War Room
│   │   └── PlaybookTab.tsx          ← Tab 6: Regime playbook + rules
│   ├── lib/
│   │   ├── types.ts                 ← TypeScript type definitions
│   │   ├── data.ts                  ← Server-side data loading
│   │   └── supabase.ts              ← Supabase client (graceful fallback)
│   ├── supabase/
│   │   └── schema.sql               ← Run this in Supabase SQL editor
│   ├── .env.local.example
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── DEPLOY.md                   ← This file
```

---

## Troubleshooting

**"Data fetch failed: 404"** — The `/api/data` route can't find the JSON files. Check that `DATA_DIR` in `lib/data.ts` resolves to the correct path. Run `console.log(DATA_DIR)` in the route to debug.

**"No active actions"** — Check `actions.json` exists and has entries with `status: "ACTIVE"`.

**"War Room entries not saving"** — Supabase env vars not configured. Check `.env.local` or Vercel environment variables. The auto-generated entries (from forecast outcomes) will still show.

**Build error: Cannot find module '@/...'** — Make sure `tsconfig.json` has `"paths": { "@/*": ["./*"] }`.

**Vercel error: Module not found 'recharts'** — Run `npm install` locally first, then push the generated `package-lock.json` to git. Vercel uses the lockfile.
