-- Migration SQL pour ajouter les nouveaux champs au formulaire client
-- Date: 3 Mars 2026
-- Description: Ajout des champs manquants dans la table clients

-- Ajouter les nouvelles colonnes à la table clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Ajouter des commentaires pour la documentation
COMMENT ON COLUMN clients.registration_number IS 'Numéro d''enregistrement de l''entreprise (optionnel)';
COMMENT ON COLUMN clients.industry IS 'Secteur d''activité ou catégorie (optionnel)';
COMMENT ON COLUMN clients.contact_person IS 'Nom de la personne de contact (optionnel)';
COMMENT ON COLUMN clients.tax_id IS 'Numéro d''identification fiscale / TVA (optionnel)';
COMMENT ON COLUMN clients.currency IS 'Devise préférée pour ce client';
COMMENT ON COLUMN clients.logo_url IS 'URL du logo du client (optionnel)';

-- Créer un index sur l'industrie pour les recherches futures
CREATE INDEX IF NOT EXISTS idx_clients_industry ON clients(industry);

-- Note: Exécutez ce script dans votre dashboard Supabase SQL Editor
