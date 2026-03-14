-- Migration to fix missing columns in the 'clients' table
-- Run this in your Supabase SQL Editor

-- 1. Ensure the 'notes' column exists (the one causing the immediate error)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Ensure other columns used in the form also exist
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS portal_token TEXT UNIQUE;

-- 3. Add comment for documentation
COMMENT ON COLUMN public.clients.notes IS 'Internal notes about the client';

-- 4. Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
