-- SECURITY FEATURES MIGRATION

-- Add 2FA flag to profiles (Account-wide setting)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

-- We can also track last active session if we want "Recent Activity" to be real,
-- but for now sticking to the requested feature implementation (Toggles).
