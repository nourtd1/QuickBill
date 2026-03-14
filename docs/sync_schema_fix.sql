-- Fix sync errors: add missing columns on Supabase
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Then restart the app so local SQLite gets new columns via migrations.

-- 1. clients: add updated_at if missing (sync uses it for incremental pull)
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill only if created_at exists (optional: run separately if your table has created_at)
-- UPDATE public.clients SET updated_at = created_at WHERE updated_at IS NULL;

-- 2. invoice_items: add updated_at if missing (table may have no created_at)
ALTER TABLE public.invoice_items
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. expenses: add updated_at if missing
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. profiles: ensure phone exists (app sync expects it)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
