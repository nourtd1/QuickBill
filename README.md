# 🚀 QuickBill - Gestion de Factures Mobile

**QuickBill** est une application mobile moderne conçue pour les entrepreneurs et petites entreprises, permettant de créer, gérer et partager des factures professionnelles en quelques secondes directement depuis un smartphone.

---

## 📊 Analyse de l'État Actuel (Décembre 2025)

### ⚙️ Architecture Technique
- **Framework**: Expo (SDK 54) avec Expo Router.
- **Backend & Auth**: Supabase (PostgreSQL, Auth, Storage).
- **Styling**: NativeWind (Tailwind CSS) pour une interface réactive et moderne.
- **PDF & Partage**: `expo-print` pour la génération HTML to PDF et `expo-sharing` pour l'envoi via WhatsApp/Email.

### ✅ Fonctionnalités Implémentées
1.  **Onboarding & Auth**: 
    *   Parcours d'accueil pour les nouveaux utilisateurs.
    *   Système de connexion/inscription sécurisé avec distinction visuelle claire.
    *   Garde de navigation global (Auth Guard) assurant que l'utilisateur est connecté et que son profil est complet.
2.  **Configuration du Business**:
    *   Profil obligatoire (Nom du business, Devise, Contact).
    *   Support du logo d'entreprise via Supabase Storage.
3.  **Tableau de Bord**:
    *   Indicateurs de performance (Revenue du mois, Montant en attente).
    *   Liste des factures récentes avec badge de statut (Payé/Impayé).
4.  **Gestion des Factures**:
    *   Création multi-articles avec calcul automatique des totaux.
    *   Recherche/Création automatique de clients.
    *   Génération de PDF professionnels à la volée.
    *   Partage instantané.

### 🌟 Points Forts
- **Design Premium**: Utilisation d'une palette de couleurs moderne, d'animations fluides (`LayoutAnimation`) et d'une typographie soignée.
- **Expérience Utilisateur (UX)**: Flux de création de facture très rapide ("30 secondes").
- **Robustesse**: Validation des données côté client et gestion centralisée des erreurs.

### 🛠️ Axes d'Amélioration & Futur
- **Numérotation Séquentielle**: Remplacer la numérotation basée sur le timestamp par des numéros séquentiels (ex: INV-001).
- **Mode Hors-ligne**: Implémenter une persistance locale des données (SQLite ou TanStack Query) pour une utilisation sans réseau.
- **Gestion Avancée**: Ajouter la possibilité de modifier ou supprimer des factures et des clients.
- **Statistiques**: Graphiques plus détaillés sur l'évolution du chiffre d'affaires.
- **Relances**: Système de notifications ou rappels pour les factures impayées.

---

## 🚀 Installation & Lancement

1.  **Installer les dépendances**:
    ```bash
    npm install
    ```
2.  **Configurer les variables d'environnement**:
    Créer un fichier `.env` à la racine :
    ```env
    EXPO_PUBLIC_SUPABASE_URL=votre_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
    ```
3.  **Lancer le projet**:
    ```bash
    npx expo start
    ```

---

## 📱 Aperçu de l'Application

| Authentification | Dashboard | Création Facture |
| :---: | :---: | :---: |
| ✨ Design Épuré | 📈 Métriques Clés | 📝 Multi-Articles |

---
*Développé avec ❤️ pour simplifier la vie des entrepreneurs.*
