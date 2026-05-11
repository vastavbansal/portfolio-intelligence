-- Portfolio Intelligence Dashboard v2 — Supabase Schema
-- Run this in your Supabase SQL Editor to set up the changelog table.

-- ── Changelog / War Room entries ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS changelog (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Core fields
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('TRADE', 'FORECAST', 'SYSTEM', 'LESSON', 'RISK')),
  impact      TEXT CHECK (impact IN ('HIGH', 'MEDIUM', 'LOW')),
  source      TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('auto', 'manual')),

  -- Narrative
  what_happened   TEXT,
  what_to_do      TEXT[],   -- array of action items
  what_not_to_do  TEXT[],   -- array of things to avoid

  -- Optional
  pnl_impact  NUMERIC,      -- signed INR value
  tags        TEXT[],       -- e.g. ['nifty', 'earnings', 'stop-loss']

  -- Metadata
  author      TEXT DEFAULT 'Vastav'
);

-- Index for common query patterns
CREATE INDEX IF NOT EXISTS changelog_date_idx ON changelog (date DESC);
CREATE INDEX IF NOT EXISTS changelog_category_idx ON changelog (category);
CREATE INDEX IF NOT EXISTS changelog_source_idx ON changelog (source);

-- ── Row Level Security ─────────────────────────────────────────────────────────
-- Enable RLS (optional but recommended for production)
ALTER TABLE changelog ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads (dashboard reads without auth)
CREATE POLICY "Public read access"
  ON changelog FOR SELECT
  USING (true);

-- Allow anonymous inserts (dashboard can add entries)
-- WARNING: In production, replace with proper auth policies
CREATE POLICY "Public insert access"
  ON changelog FOR INSERT
  WITH CHECK (true);

-- ── Sample entries ─────────────────────────────────────────────────────────────
-- Uncomment to seed some initial data:

/*
INSERT INTO changelog (date, title, category, impact, what_happened, what_to_do, what_not_to_do, tags)
VALUES
(
  '2026-04-10',
  'Held through HDFC Bank earnings gap-down — should have trimmed',
  'TRADE',
  'HIGH',
  'HDFC Bank gapped down 4% on earnings miss. Had full position. Did not pre-plan for earnings volatility.',
  ARRAY['Always reduce position 50% before earnings if holding', 'Set a pre-earnings alert 3 days before'],
  ARRAY['Hold full position through earnings without a plan', 'Hope results will be good'],
  ARRAY['hdfc', 'earnings', 'position-sizing']
),
(
  '2026-04-14',
  'Correctly called the geopolitical relief rally timing',
  'FORECAST',
  'HIGH',
  'Called a 3-5% relief rally once ceasefire signals emerged. Nifty moved up 3.2% in 2 sessions.',
  ARRAY['Enter on first day of confirmed diplomatic progress', 'Take profits at 61.8% Fib retracement of the selloff'],
  ARRAY['Wait for full confirmation — miss the first 1-2% of the move', 'Hold through next escalation cycle'],
  ARRAY['geopolitical', 'relief-rally', 'forecast']
);
*/
