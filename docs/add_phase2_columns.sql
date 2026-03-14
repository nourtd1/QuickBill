-- Migration to add columns for Phase 2: Advanced WhatsApp & Reminders
-- Run this in your Supabase SQL Editor

-- 1. Add columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_template TEXT,
ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_intervals INTEGER[] DEFAULT '{7, 14, 30}',
ADD COLUMN IF NOT EXISTS reminder_template TEXT;

-- 2. Create whatsapp_messages table for history (T2.3)
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'invoice_share', -- 'invoice_share', 'reminder', 'custom'
    status TEXT DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add indexes for history
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON public.whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_invoice_id ON public.whatsapp_messages(invoice_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_client_id ON public.whatsapp_messages(client_id);

-- 4. Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS Policies
CREATE POLICY "Users can view their own WhatsApp history" 
ON public.whatsapp_messages FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WhatsApp logs" 
ON public.whatsapp_messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 6. Refresh Schema Cache
NOTIFY pgrst, 'reload schema';
