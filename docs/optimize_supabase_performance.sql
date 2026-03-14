-- Supabase Performance Optimization Migration
-- Run this in your Supabase SQL Editor

-- 1. Profiles Indexes (skip email if your profiles table has no email column)
-- CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. Clients Indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
-- CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email); -- uncomment if column exists

-- 3. Invoices Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);

-- 4. Invoice Items Indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- 5. Expenses Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

-- 6. Payments Indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- 7. Composite indexes (Phase 4 - T4.5) for common filters
CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON public.invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, date DESC);

-- 8. Quotes/Estimates Indexes (if the table exists)
-- CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
-- CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);

-- 9. Refresh Schema Cache
NOTIFY pgrst, 'reload schema';
