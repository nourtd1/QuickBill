-- Fix schema mismatch: run this in Supabase SQL Editor
-- Date: 23 Mars 2026

-- 1. Fix invoices status check constraint
-- Frontend uses lowercase 'unpaid', 'pending_approval', 'rejected' which were missing
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status IN (
    'draft', 'sent', 'paid', 'overdue', 'unpaid', 'pending_approval', 'rejected',
    'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'UNPAID', 'PENDING_APPROVAL', 'REJECTED'
));

-- 2. Add merchant column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS merchant TEXT;

-- 3. Add updated_at to expenses if missing
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. Reload PostgREST schema cache to recognize new columns immediately
NOTIFY pgrst, 'reload schema';
