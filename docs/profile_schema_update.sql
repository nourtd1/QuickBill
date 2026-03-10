-- Migration SQL pour améliorer la table profiles
-- Ajouter le champ full_name pour séparer le nom personnel du nom d'entreprise
-- Date: 2026-03-03

-- Ajouter la colonne full_name
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Migrer les données existantes (optionnel - copier business_name vers full_name si vide)
UPDATE profiles 
SET full_name = business_name 
WHERE full_name IS NULL AND business_name IS NOT NULL;

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN profiles.full_name IS 'Nom complet de l''utilisateur (personnel)';
COMMENT ON COLUMN profiles.business_name IS 'Nom de l''entreprise (business)';
