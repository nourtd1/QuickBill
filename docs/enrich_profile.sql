-- ENRICH PROFILE MIGRATION

-- Add enrichment columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT, -- NINEA / NIF
ADD COLUMN IF NOT EXISTS rccm TEXT; -- Registre de Commerce

-- No RLS changes needed as owner update policy already exists via 'for update using uid = id'
-- and select policy 'using true'.
