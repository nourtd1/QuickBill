-- 1. REQUÊTE DE VÉRIFICATION
-- Sélectionner et afficher tous les Buckets qui existent actuellement dans ton projet
SELECT id,
    name,
    public
FROM storage.buckets;
-- ==========================================
-- 2. CRÉATION AUTOMATIQUE DES BUCKETS MANQUANTS
-- Ces commandes vont créer les dossiers nécessaires pour l'application uniement s'ils n'existent pas déjà.
-- ==========================================
-- Création du bucket 'avatars' (Pour les photos de profil)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
-- Création du bucket 'logos' (Pour le logo de ta propre entreprise)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;
-- Création du bucket 'client-logos' (Pour les logos de tes clients)
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-logos', 'client-logos', true) ON CONFLICT (id) DO NOTHING;
-- Création du bucket 'receipts' (Pour les reçus et factures d'achat / Dépenses)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true) ON CONFLICT (id) DO NOTHING;
-- ==========================================
-- 3. PERMISSIONS DE SÉCURITÉ (POLICIES)
-- Ces commandes autorisent l'application mobile à lire et écrire des images dans ces dossiers.
-- (Remarque : Exécute ces commandes sans crainte, les "ON CONFLICT" éviteront les erreurs)
-- ==========================================
-- Autoriser la LECTURE publique (Tout le monde peut voir les logos sur les factures)
CREATE POLICY "Public Access" ON storage.objects FOR
SELECT USING (
        bucket_id IN ('avatars', 'logos', 'client-logos', 'receipts')
    );
-- Autoriser l'ÉCRITURE aux utilisateurs connectés (Uniquement ceux qui ont un compte)
CREATE POLICY "Auth Insert" ON storage.objects FOR
INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND bucket_id IN ('avatars', 'logos', 'client-logos', 'receipts')
    );
-- Autoriser la MODIFICATION aux utilisateurs connectés
CREATE POLICY "Auth Update" ON storage.objects FOR
UPDATE USING (
        auth.role() = 'authenticated'
        AND bucket_id IN ('avatars', 'logos', 'client-logos', 'receipts')
    );
-- Autoriser la SUPPRESSION aux utilisateurs connectés
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING (
    auth.role() = 'authenticated'
    AND bucket_id IN ('avatars', 'logos', 'client-logos', 'receipts')
);