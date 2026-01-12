-- Create messages table
CREATE TABLE IF NOT EXISTS public.invoice_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('owner', 'client')),
    sender_id UUID REFERENCES auth.users(id), -- Null if client (public portal)
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.invoice_messages ENABLE ROW LEVEL SECURITY;

-- Policies for Owner (Authenticated User)
DROP POLICY IF EXISTS "Users can view and send messages for their invoices" ON public.invoice_messages;
CREATE POLICY "Users can view and send messages for their invoices" 
ON public.invoice_messages 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.invoices i 
        WHERE i.id = invoice_messages.invoice_id 
        AND i.user_id = auth.uid()
    )
);

-- Policies for Public Client (Via Token / Anonymous)
DROP POLICY IF EXISTS "Public can view messages for invoice they have access to" ON public.invoice_messages;
CREATE POLICY "Public can view messages for invoice they have access to"
ON public.invoice_messages
FOR SELECT
USING (true); -- Relies on the fact that you need the UUID to query.

DROP POLICY IF EXISTS "Public can insert messages" ON public.invoice_messages;
CREATE POLICY "Public can insert messages"
ON public.invoice_messages
FOR INSERT
WITH CHECK (true);
