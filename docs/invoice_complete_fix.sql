-- Script de correction complète pour les factures
-- Date: 3 Mars 2026
-- Description: Correction et amélioration du schéma invoices

-- ============================================================================
-- PARTIE 1: CORRIGER LA TABLE INVOICES
-- ============================================================================

-- Ajouter les colonnes manquantes
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS terms TEXT,
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Corriger les valeurs de status pour correspondre au code
-- Le code utilise: PAID, UNPAID, PENDING_APPROVAL, REJECTED
-- Le schéma utilise: draft, sent, paid, overdue
-- On garde les deux formats pour compatibilité
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'PAID', 'UNPAID', 'PENDING_APPROVAL', 'REJECTED', 'SENT', 'DRAFT', 'OVERDUE'));

-- Ajouter un index sur invoice_number pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_share_token ON public.invoices(share_token);

-- Commentaires pour documentation
COMMENT ON COLUMN public.invoices.issue_date IS 'Date d''émission de la facture';
COMMENT ON COLUMN public.invoices.due_date IS 'Date d''échéance de la facture';
COMMENT ON COLUMN public.invoices.discount IS 'Montant de la remise';
COMMENT ON COLUMN public.invoices.tax_amount IS 'Montant de la taxe calculée';
COMMENT ON COLUMN public.invoices.notes IS 'Notes internes sur la facture';
COMMENT ON COLUMN public.invoices.terms IS 'Conditions de paiement';
COMMENT ON COLUMN public.invoices.share_token IS 'Token pour partage public de la facture';

-- ============================================================================
-- PARTIE 2: VÉRIFIER LA TABLE CLIENTS
-- ============================================================================

-- S'assurer que la table clients existe avec tous les champs
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    portal_token TEXT UNIQUE,
    registration_number TEXT,
    industry TEXT,
    contact_person TEXT,
    tax_id TEXT,
    currency TEXT DEFAULT 'USD',
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour clients
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);

-- RLS pour clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
CREATE POLICY "Users can view own clients" ON public.clients
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
CREATE POLICY "Users can insert own clients" ON public.clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
CREATE POLICY "Users can update own clients" ON public.clients
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;
CREATE POLICY "Users can delete own clients" ON public.clients
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger pour clients
DROP TRIGGER IF EXISTS set_updated_at_clients ON public.clients;
CREATE TRIGGER set_updated_at_clients
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- ============================================================================
-- PARTIE 3: FONCTION POUR GÉNÉRER UN NUMÉRO DE FACTURE UNIQUE
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_invoice_number(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    count_part INTEGER;
    new_number TEXT;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Compter les factures de l'utilisateur cette année
    SELECT COUNT(*) + 1 INTO count_part
    FROM public.invoices
    WHERE user_id = user_uuid
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Format: INV-2026-001
    new_number := 'INV-' || year_part || '-' || LPAD(count_part::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTIE 4: FONCTION POUR CALCULER LE TOTAL D'UNE FACTURE
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    items_subtotal NUMERIC;
BEGIN
    -- Calculer le sous-total des items
    SELECT COALESCE(SUM(total), 0) INTO items_subtotal
    FROM public.invoice_items
    WHERE invoice_id = NEW.id;
    
    -- Mettre à jour les totaux
    NEW.subtotal := items_subtotal;
    NEW.tax_amount := items_subtotal * (NEW.tax_rate / 100);
    NEW.total_amount := items_subtotal + NEW.tax_amount - COALESCE(NEW.discount, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour recalculer automatiquement les totaux
DROP TRIGGER IF EXISTS calculate_invoice_totals_trigger ON public.invoices;
CREATE TRIGGER calculate_invoice_totals_trigger
    BEFORE INSERT OR UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE PROCEDURE calculate_invoice_totals();

-- ============================================================================
-- PARTIE 5: FONCTION POUR METTRE À JOUR LE TOTAL DES ITEMS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_invoice_item_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total := NEW.quantity * NEW.unit_price;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement le total d'un item
DROP TRIGGER IF EXISTS update_invoice_item_total_trigger ON public.invoice_items;
CREATE TRIGGER update_invoice_item_total_trigger
    BEFORE INSERT OR UPDATE ON public.invoice_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_invoice_item_total();

-- ============================================================================
-- PARTIE 6: FONCTION POUR METTRE À JOUR LA FACTURE APRÈS MODIFICATION DES ITEMS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_invoice_after_items_change()
RETURNS TRIGGER AS $$
DECLARE
    invoice_uuid UUID;
BEGIN
    -- Récupérer l'ID de la facture
    IF TG_OP = 'DELETE' THEN
        invoice_uuid := OLD.invoice_id;
    ELSE
        invoice_uuid := NEW.invoice_id;
    END IF;
    
    -- Forcer le recalcul en mettant à jour updated_at
    UPDATE public.invoices
    SET updated_at = NOW()
    WHERE id = invoice_uuid;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour la facture quand les items changent
DROP TRIGGER IF EXISTS update_invoice_after_items_change_trigger ON public.invoice_items;
CREATE TRIGGER update_invoice_after_items_change_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_invoice_after_items_change();

-- ============================================================================
-- PARTIE 7: VUE POUR FACILITER LES REQUÊTES
-- ============================================================================

CREATE OR REPLACE VIEW invoices_with_details AS
SELECT 
    i.id,
    i.user_id,
    i.customer_id,
    i.invoice_number,
    i.status,
    i.currency,
    i.exchange_rate,
    i.subtotal,
    i.tax_rate,
    i.tax_amount,
    i.discount,
    i.total_amount,
    i.issue_date,
    i.due_date,
    i.notes,
    i.terms,
    i.share_token,
    i.created_at,
    i.updated_at,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    c.address as customer_address,
    COUNT(ii.id) as items_count
FROM public.invoices i
LEFT JOIN public.clients c ON i.customer_id = c.id
LEFT JOIN public.invoice_items ii ON i.id = ii.invoice_id
GROUP BY i.id, c.id;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

-- Note: Exécutez ce script dans votre Supabase SQL Editor
-- Toutes les opérations sont sécurisées avec IF NOT EXISTS et IF EXISTS

