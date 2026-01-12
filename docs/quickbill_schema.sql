-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to handle updated_at timestamps automatically
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-------------------------------------------------------------------------------
-- 1. PROFILES
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT,
    logo_url TEXT,
    default_currency TEXT DEFAULT 'USD',
    phone_number TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-------------------------------------------------------------------------------
-- 2. CUSTOMERS
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    total_spent NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
CREATE POLICY "Users can view own customers" ON public.customers
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own customers" ON public.customers;
CREATE POLICY "Users can insert own customers" ON public.customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own customers" ON public.customers;
CREATE POLICY "Users can update own customers" ON public.customers
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own customers" ON public.customers;
CREATE POLICY "Users can delete own customers" ON public.customers
    FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_updated_at_customers ON public.customers;
CREATE TRIGGER set_updated_at_customers
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-------------------------------------------------------------------------------
-- 3. INVOICES
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'overdue')) DEFAULT 'draft',
    currency TEXT NOT NULL DEFAULT 'USD',
    exchange_rate NUMERIC DEFAULT 1,
    subtotal NUMERIC DEFAULT 0,
    tax_rate NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    due_date TIMESTAMP WITH TIME ZONE,
    public_link_token TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own invoices" ON public.invoices;
CREATE POLICY "Users can manage own invoices" ON public.invoices
    FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_updated_at_invoices ON public.invoices;
CREATE TRIGGER set_updated_at_invoices
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-------------------------------------------------------------------------------
-- 4. INVOICE ITEMS
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage items of own invoices" ON public.invoice_items;
CREATE POLICY "Users can manage items of own invoices" ON public.invoice_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.id = invoice_items.invoice_id
            AND i.user_id = auth.uid()
        )
    );

DROP TRIGGER IF EXISTS set_updated_at_invoice_items ON public.invoice_items;
CREATE TRIGGER set_updated_at_invoice_items
    BEFORE UPDATE ON public.invoice_items
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-------------------------------------------------------------------------------
-- 5. PAYMENTS
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('MoMo', 'Cash', 'Card')),
    transaction_ref TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage payments of own invoices" ON public.payments;
CREATE POLICY "Users can manage payments of own invoices" ON public.payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.id = payments.invoice_id
            AND i.user_id = auth.uid()
        )
    );

DROP TRIGGER IF EXISTS set_updated_at_payments ON public.payments;
CREATE TRIGGER set_updated_at_payments
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
