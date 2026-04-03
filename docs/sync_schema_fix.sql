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

-- 5. invoices: add due_date if missing (app sync expects it)
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- 6. invoices: add exchange_rate if missing (app sync expects it)
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1;

-- 7. invoice_items: add total if missing (app sync expects it)
ALTER TABLE public.invoice_items
ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
