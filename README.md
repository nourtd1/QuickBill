# QuickBill - Assistant de Gestion & Facturation Premium
#### Video Demo:  <https://youtu.be/96l_Uwy-4pQ>

**Name:** Anouar Mahamat Abdoulaye (Nour)
**GitHub:** Nourtd
**edX:** Annour Mahamat Abdoulaye
**Location:** Gisenyi, Rwanda
**Date:** 28 Février 2026

#### Description:


# 🚀 QuickBill - Assistant de Gestion & Facturation Premium

> **Slogan :** Tes factures professionnelles sur WhatsApp en 30 secondes.
> **Vision :** Permettre à un vendeur informel (Instagram/WhatsApp) de passer du statut de "débrouillard" à celui de "professionnel" grâce à un CRM mobile complet, hors-ligne et intelligent.

**QuickBill** est bien plus qu'une simple application de facturation. C'est un véritable **CRM mobile** conçu pour les entrepreneurs modernes, fonctionnant avec une architecture "Offline-First" robuste, une UI/UX premium et intégrant des fonctionnalités d'Intelligence Artificielle pour automatiser la gestion quotidienne.

---

## 📊 1. Statut Actuel du Projet (MVP Avancé)

L'application a dépassé le stade de simple MVP. Elle est **fonctionnelle à 90% pour un lancement bêta**.
Les fonctionnalités majeures suivantes sont **déjà en place et opérationnelles** :
*   **Mode Hors-Ligne (Offline-First) complet** : Synchronisation bidirectionnelle SQLite <-> Supabase.
*   **Intelligence Artificielle intégrée** : Assistant vocal et Scan de reçus (OCR).
*   **Génération Premium** : PDF, Signatures Électroniques, et QR Codes de paiement.
*   **Dashboard Financier** : Suivi de rentabilité en temps réel.

---

## 🔥 2. Fonctionnalités Détaillées

### A. 🏠 Pilotage & Rentabilité (Dashboard)
*   **Vision 360°** : Indicateurs clés en temps réel (Bénéfice Net, Encaissé, En Attente).
*   **Graphiques Interactifs** : Évolution du C.A. sur 6 mois via `react-native-gifted-charts`.
*   **Actions Rapides (FAB)** : Création de facture, Scan de reçu, Assistant IA.
*   **État des Factures** : Liste des factures récentes avec pastilles de statut colorées.
*   **UX Premium** : Utilisation de "Skeleton Screens" pendant le chargement des données.

### B. 📝 Facturation & Devis Intelligents
*   **Création Ultra-rapide** : Formulaire optimisé pour mobile avec autocomplétion.
*   **Processus Devis -> Facture** : Conversion d'un devis accepté en facture en 1 clic.
*   **Génération de PDF Premium** : 
    *   Design professionnel incluant le **Logo** de l'entreprise.
    *   Inclusion automatique de la **Signature Électronique**.
    *   Intégration d'un **QR Code de Paiement** scannable.
*   **Partage WhatsApp Express** : Envoi en 1 clic avec message pré-rempli (`expo-sharing`, `Linking`).

### C. 🔄 Mode Hors-ligne & Synchronisation (Offline-First)
*   **Architecture Robuste** : Utilisation de SQLite (`expo-sqlite`) pour le stockage local prioritaire.
*   **Synchronisation Automatique** : Transfert vers Supabase dès que la connexion revient (`lib/syncService.ts`).
*   **Gestion des Conflits** : Stratégie "Last Write Wins" et suivi de l'état (pending, synced, error).
*   **Données Couvertes** : Profils, Clients, Factures, Articles, Paiements, Dépenses.

### D. 🧠 Intelligence Artificielle & Automatisation
*   **Scan de Reçus (OCR)** : 
    *   Extraction de données via `Tesseract.js` (Montant, Date, Marchand).
    *   Sauvegarde automatique des preuves d'achat sur Supabase Storage.
*   **Assistant Intelligent (`aiAssistantService`)** : 
    *   Saisie par langage naturel ("Facture 5000 pour Site Web à Alice").
    *   Détection d'anomalies (alertes de doublons de facturation).
    *   Suggestion de prix et appels aux Edge Functions (Supabase).

### E. 👥 Gestion Clients & Catalogue Produits (CRM)
*   **Base Clients Centralisée** : Gestion complète (CRUD) intégrée au flux de facturation.
*   **Catalogue d'Articles** : Sauvegarde des produits/services pour éviter la double saisie (Hooks dédiés `useClients`, `useItems`).

### F. ⚙️ Profil & Personnalisation
*   **Onboarding** : Configuration initiale du business (Nom, Téléphone, Devise, Logo).
*   **Multi-Devises** : Support de devises locales et internationales (RWF, USD, EUR, CFA...).
*   **Freemium Logic** : Modèle de monétisation clair. Les utilisateurs gratuits génèrent des PDF avec un filigrane "Généré par QuickBill", tandis que les comptes Premium affichent exclusivement leur propre marque.

---

## ⚙️ 3. Architecture Technique (Stack)

*   **Moteur / Framework** : Expo SDK 54 (React Native 0.81) - *Nouvelle architecture activée*.
*   **Routing** : Expo Router v6 (Routing basé sur le système de fichiers).
*   **Backend & Base de Données** : Supabase (PostgreSQL, Auth, Storage, Edge Functions) + Row Level Security (RLS).
*   **Stockage Local (Offline)** : SQLite `expo-sqlite`.
*   **Styling (UI)** : NativeWind v2 (Tailwind CSS) pour un design rapide et cohérent.
*   **Composants & Librairies Spécifiques** :
    *   `react-native-gifted-charts` : Graphiques financiers modernes.
    *   `expo-print` & `expo-sharing` : Création et partage de documents.
    *   `lucide-react-native` : Icônes vectorielles.
    *   `react-native-signature-canvas` : Saisie de signature électronique.
    *   `tesseract.js` : Moteur OCR intégré côté client.

---

## 🗄️ 4. Modèle de Données (Schéma Supabase principal)

*   **`profiles`** : `id`, `business_name`, `phone_contact`, `currency`, `logo_url`, `is_premium`
*   **`customers`** : `id`, `user_id`, `name`, `phone`, `email`
*   **`invoices`** : `id`, `user_id`, `customer_id`, `invoice_number`, `status` (PAID/UNPAID), `total_amount`, `created_at`
*   **`invoice_items`** : `id`, `invoice_id`, `description`, `quantity`, `unit_price`
*   **`expenses`** : `id`, `user_id`, `amount`, `category`, `receipt_url`

---

## 🎨 5. Design & Expérience Utilisateur (UX)

L'application a été entièrement repensée pour inspirer confiance et professionnalisme à chaque interaction :
*   **Identité Visuelle** : Thème "Banquier Moderne" avec un Bleu Roi (`#1E40AF`), de l'Or (`#F59E0B`) et un fond lumineux "Ice Blue" (`#EFF6FF`).
*   **Expérience Fluide** : Utilisation de l'API `Animated` pour les micro-interactions, `KeyboardAvoidingView` pour la gestion des formulaires sur mobile, et des retours haptiques via `expo-haptics`.
*   **Qualité du Code Exceptionnelle** : Architecture modulaire stricte (`app/`, `lib/`, `hooks/`, `components/`), gestion globale des erreurs (`try/catch`), intégrations de "fallbacks" robustes, et typage rigoureux en TypeScript.

---

## 🚀 6. Installation & Lancement Rapide

1.  **Cloner le projet**
    ```bash
    git clone https://github.com/votre-username/quickbill.git
    cd quickbill
    ```

2.  **Installer les dépendances**
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **Configurer l'Environnement**
    Créer un fichier `.env` à la racine de votre projet avec vos identifiants :
    ```env
    EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
    EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-publique-supabase
    ```

4.  **Lancer le serveur de développement**
    ```bash
    npx expo start -c
    ```

---

## 🗺️ 7. Roadmap & Prochaines Étapes (V1 Publique / Bêta)

- [x] **Gestion Complète** : Factures, devis, produits, clients et dépenses.
- [x] **Dashboard Financier** : Suivi des indicateurs clés et graphiques.
- [x] **Génération PDF Pro** : QR Code, logo, et signature électronique.
- [x] **Mode Hors-ligne (Offline-First)** : Opérationnel avec synchronisation automatique.
- [x] **Intégration IA** : Scanner de reçus (OCR) et assistant vocal implémentés.
- [ ] **Tests de Performance OCR** : Vérifier la vitesse de `tesseract.js` sur des téléphones d'entrée de gamme (Android/iOS).
- [ ] **Optimisation Data** : Ajouter une pagination limitant la synchronisation `syncService.ts` aux données récentes (ex: 3 à 6 derniers mois).
- [ ] **Finalisation Onboarding / Paramètres** : Assurer que `app/onboarding.tsx` est fluide pour un nouvel inscrit et que la mise à jour du profil (devise, logo) se reflète uniformément sur l'ensemble de l'application.
- [ ] **Portail Client Web (Future release)** : Fournir un lien web dynamique aux clients pour consulter et payer leur facture directement en ligne.

---

*Développé avec ambition - 2026*