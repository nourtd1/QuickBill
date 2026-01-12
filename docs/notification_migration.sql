-- Migration to add expo_push_token to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Migration to add invoice_views log table for tracking
CREATE TABLE IF NOT EXISTS public.invoice_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    viewer_ip TEXT, -- Optional
    user_agent TEXT, -- Optional
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tracking
ALTER TABLE public.invoice_views ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (via RPC usually, but allow public for simplicity of tracking script)
-- Better: Use a function with SECURITY DEFINER as planned.
