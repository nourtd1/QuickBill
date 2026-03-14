-- Comprehensive migration to fix missing columns across tables
-- Run this in your Supabase SQL Editor

-- 1. Fix 'clients' table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS portal_token TEXT UNIQUE;

-- 2. Fix 'invoices' table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS terms TEXT,
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- 3. Add comments for documentation
COMMENT ON COLUMN public.clients.notes IS 'Internal notes about the client';
COMMENT ON COLUMN public.invoices.share_token IS 'Token for public sharing of the invoice';

-- 4. Refresh PostgREST cache (CRITICAL to fix 'Could not find column' errors)
NOTIFY pgrst, 'reload schema';
