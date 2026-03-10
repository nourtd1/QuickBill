-- Script de correction pour la table invoices et création de la table clients
-- Date: 3 Mars 2026
-- Description: Correction des incohérences entre customers/clients et amélioration du schéma invoices

-- ============================================================================
-- PARTIE 1: CRÉER LA TABLE CLIENTS (si elle n'existe pas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    portal_token TEXT UNIQUE,
    -- Nouveaux champs ajoutés
    registration_number TEXT,
    industry TEXT,
    contact_person TEXT,
    tax_id TEXT,
    currency TEXT DEFAULT 'USD',
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_portal_token ON public.clients(portal_token);

-- RLS Policies
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

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS set_updated_at_clients ON public.clients;
CREATE TRIGGER set_updated_at_clients
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- ============================================================================
-- PARTIE 2: CORRIGER LA TABLE INVOICES
-- ============================================================================

-- Ajouter les colonnes manquantes si elles n'existent pas
ALTER TABLE public.invoices 
ADD COLUMN IF NO