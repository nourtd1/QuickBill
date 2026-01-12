# 🚀 QuickBill - Assistant de Gestion & Facturation

> **Gérez votre business depuis votre poche.**
> Factures, Devis, Clients, Dépenses et Rentabilité dans une seule application mobile premium.

**QuickBill** n'est pas seulement une application de facturation. C'est un véritable **CRM mobile** conçu pour les entrepreneurs modernes en Afrique et ailleurs, permettant de piloter l'activité commerciale avec une simplicité déconcertante.

---

## 📱 Aperçu Visuel

| Dashboard Pro | Facture PDF | Gestion Clients | Menu Paramètres |
|:---:|:---:|:---:|:---:|
| *(Insérer capture Dashboard)* | *(Insérer capture PDF)* | *(Insérer capture Clients)* | *(Insérer capture Menu)* |

---

## 🔥 Fonctionnalités Principales

### 1. 📊 Pilotage & Rentabilité (Dashboard 2.0)
* **Vision 360°** : Indicateurs clés en temps réel.
    * 🟢 **Encaissé** : Chiffre d'affaires réel du mois.
    * 🟠 **En Attente** : Argent dehors (factures envoyées mais non payées).
    * 🔵 **Bénéfice Net** : Calcul automatique (*Revenus - Dépenses*).
* **Graphiques Interactifs** : Évolution du C.A. sur les 6 derniers mois (Bar Chart).
* **Actions Rapides (FAB)** : Création instantanée de facture ou dépense.

### 2. 📝 Facturation Intelligente
* **Factures & Devis** : Création ultra-rapide.
* **Conversion Magique** : Transformez un Devis accepté en Facture en 1 clic.
* **Catalogue Produits/Services** : Importez vos articles pré-enregistrés pour ne pas tout retaper.
* **Génération PDF Premium** :
    * Design professionnel avec votre **Logo**.
    * Inclusion automatique de la **Signature Électronique**.
    * Intégration d'un **QR Code de Paiement** scannable.

### 3. 💸 Gestion des Dépenses
* **Suivi des Coûts** : Enregistrez vos sorties d'argent (Loyer, Transport, Matériel).
* **Catégorisation** : Classez les dépenses pour mieux analyser vos coûts.
* **Preuve d'Achat** : (Prévu) Scan et stockage des reçus.
* **Impact Direct** : Met à jour automatiquement le calcul du Bénéfice Net.

### 4. 🤝 CRM Clients
* **Base de Données** : Centralisez tous vos clients (Nom, Téléphone, Email, Adresse).
* **Import Rapide** : Sélectionnez un client existant lors de la facturation.
* **Historique** : Retrouvez facilement qui vous doit quoi.

### 5. ⚡ Outils de Productivité (Settings)
* **WhatsApp Express** : Envoi de factures via WhatsApp avec un message pré-rempli et personnalisé (Templates dynamiques).
* **Signature Numérique** : Dessinez votre signature une fois, elle s'applique partout.
* **Paiement QR** : Configurez vos infos Mobile Money ou Banque pour générer les QR Codes sur les PDF.
* **Profil Business** : Gestion complète de l'identité de l'entreprise (Devise, Logo, Contact).

---

## 🎨 Design & Expérience Utilisateur (UX)

L'application a été entièrement repensée pour inspirer confiance et professionnalisme :
* **Thème "Banquier Moderne"** : Utilisation du Bleu Roi (`#1E40AF`) et de l'Or (`#F59E0B`) pour l'élégance.
* **Fond "Ice Blue"** : Interface lumineuse sur fond `#EFF6FF` pour un contraste optimal avec les cartes blanches.
* **Composants Natifs** : Animations fluides, interactions tactiles réactives et navigation intuitive via Expo Router.

---

## ⚙️ Architecture Technique

Projet robuste construit avec les dernières technologies React Native :

* **Moteur** : [Expo SDK 54](https://expo.dev) (La dernière version stable).
* **Navigation** : [Expo Router v3](https://docs.expo.dev/router/introduction/) (Routing basé sur les fichiers).
* **Langage** : TypeScript (Typage strict pour la fiabilité).
* **Base de Données & Auth** : [Supabase](https://supabase.com) (PostgreSQL, Row Level Security, Auth, Storage).
* **Styling** : [NativeWind](https://www.nativewind.dev/) (Tailwind CSS pour React Native).
* **Composants Clés** :
    * `react-native-gifted-charts` : Pour les graphiques financiers.
    * `expo-print` & `expo-sharing` : Génération et partage PDF.
    * `qrcode` : Génération des QR codes de paiement.
    * `lucide-react-native` : Icônes vectorielles modernes.

---

## 🚀 Installation & Lancement

1.  **Cloner le projet**
    ```bash
    git clone [https://github.com/votre-username/quickbill.git](https://github.com/votre-username/quickbill.git)
    cd quickbill
    ```

2.  **Installer les dépendances**
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **Configuration Environnement**
    Créer un fichier `.env` à la racine avec vos clés Supabase :
    ```env
    EXPO_PUBLIC_SUPABASE_URL=[https://votre-projet.supabase.co](https://votre-projet.supabase.co)
    EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-publique
    ```

4.  **Lancer le serveur de développement**
    ```bash
    npx expo start -c
    ```

---

## 🗺️ Roadmap (Prochaines étapes)

- [x] Gestion Factures & Devis
- [x] Dashboard de Rentabilité
- [x] Intégration WhatsApp & QR Code
- [ ] **Mode Hors-ligne (Offline First)** : Synchronisation locale pour travailler sans internet.
- [ ] **Portail Client Web** : Lien unique pour que le client voie sa facture en ligne.
- [ ] **Multi-devises** : Gérer des factures en USD et RWF simultanément.

---

*Développé par Nour - 2026*