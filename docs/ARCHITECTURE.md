# 🏗️ ARCHITECTURE DE L'APPLICATION QUICK BILL

## 📁 Structure des Dossiers

```
QuickBill/
├── app/                          # Routes de l'application (Expo Router)
│   ├── (tabs)/                   # Navigation par onglets
│   │   ├── index.tsx             # 🏠 Dashboard principal
│   │   ├── invoices.tsx          # 📄 Liste des factures
│   │   ├── clients/              # 👥 Gestion clients
│   │   │   ├── index.tsx         # Liste des clients
│   │   │   └── form.tsx          # Formulaire client (create/edit)
│   │   ├── analytics.tsx         # 📊 Rapports et analytics
│   │   ├── settings.tsx          # ⚙️ Profil utilisateur
│   │   └── _layout.tsx           # Configuration des tabs
│   │
│   ├── invoice/                  # Gestion des factures
│   │   ├── new.tsx               # Créer une nouvelle facture
│   │   ├── [id].tsx              # Détails d'une facture
│   │   └── preview.tsx           # Prévisualisation PDF
│   │
│   ├── estimates/                # Gestion des devis
│   │   ├── index.tsx             # Liste des devis
│   │   ├── new.tsx               # Créer un nouveau devis
│   │   └── [id].tsx              # Détails d'un devis
│   │
│   ├── expenses/                 # Gestion des dépenses
│   │   ├── add.tsx               # Ajouter une dépense
│   │   └── scan.tsx              # Scanner un reçu (OCR)
│   │
│   ├── items/                    # Catalogue produits/services
│   │   └── form.tsx              # Formulaire produit (create/edit)
│   │
│   ├── finance/                  # Outils financiers
│   │   └── reconcile.tsx         # Rapprochement bancaire
│   │
│   ├── settings/                 # Sous-menus des paramètres
│   │   ├── about.tsx
│   │   ├── business.tsx
│   │   ├── checkout.tsx
│   │   ├── contact.tsx
│   │   ├── help.tsx
│   │   ├── language.tsx
│   │   ├── notifications.tsx
│   │   ├── payment.tsx
│   │   ├── personal-info.tsx
│   │   ├── profile.tsx
│   │   ├── security.tsx
│   │   ├── signature.tsx
│   │   ├── subscription.tsx
│   │   ├── success.tsx
│   │   ├── tax.tsx
│   │   ├── team.tsx
│   │   ├── theme.tsx
│   │   ├── whatsapp.tsx
│   │   └── _layout.tsx
│   │
│   ├── public/                   # Portails publics (sans auth)
│   │   ├── invoice/[token].tsx   # Vue publique facture
│   │   ├── estimate/[token].tsx  # Vue publique devis
│   │   └── client/[token].tsx    # Portail client
│   │
│   ├── auth.tsx                  # Authentification
│   ├── setup.tsx                 # Configuration initiale
│   ├── onboarding.tsx            # Onboarding utilisateur
│   ├── activity.tsx              # Journal d'activité
│   └── _layout.tsx               # Layout racine
│
├── components/                   # Composants réutilisables
│   ├── ActivityLogList.tsx
│   ├── AiAssistant.tsx
│   ├── AiVoiceAssistant.tsx
│   ├── ChatModal.tsx
│   ├── ConfigError.tsx
│   ├── InvoiceQRCode.tsx
│   ├── InvoiceViewer.tsx
│   ├── PaymentModal.tsx
│   ├── ReceiptScanner.tsx
│   ├── TaxReportModal.tsx
│   └── TeamSettings.tsx
│
├── context/                      # Contextes React
│   ├── AuthContext.tsx           # Authentification
│   ├── OfflineContext.tsx        # Mode offline
│   └── PreferencesContext.tsx    # Préférences utilisateur
│
├── hooks/                        # Hooks personnalisés
│   ├── useChat.ts
│   ├── useClients.ts
│   ├── useCurrency.ts
│   ├── useDashboard.ts
│   ├── useInvoice.ts
│   ├── useInvoiceDetails.ts
│   ├── useItems.ts
│   ├── useOCR.ts
│   ├── useProfile.ts
│   ├── useSync.ts
│   ├── useTeamRole.ts
│   └── useUnreadMessages.ts
│
├── lib/                          # Services et utilitaires
│   ├── aiAssistantService.ts     # Assistant IA
│   ├── currencyEngine.ts         # Gestion des devises
│   ├── database.ts               # SQLite local
│   ├── env.ts                    # Variables d'environnement
│   ├── error-handler.ts          # Gestion des erreurs
│   ├── exchangeRateService.ts    # Taux de change
│   ├── gemini.ts                 # API Gemini
│   ├── generate-html.ts          # Génération PDF
│   ├── localServices.ts          # Services locaux
│   ├── notificationService.ts    # Notifications
│   ├── ocr.ts                    # OCR Tesseract
│   ├── ocrService.ts             # Service OCR
│   ├── openai.ts                 # API OpenAI
│   ├── paymentService.ts         # Paiements
│   ├── qrCodeHelper.ts           # QR Codes
│   ├── react-query.ts            # Configuration React Query
│   ├── supabase.ts               # Client Supabase
│   ├── syncService.ts            # Synchronisation
│   ├── taxService.ts             # Calculs fiscaux
│   ├── teamService.ts            # Gestion d'équipe
│   ├── upload.ts                 # Upload fichiers
│   └── validation.ts             # Validation
│
├── constants/                    # Constantes
│   └── colors.ts                 # Couleurs unifiées
│
├── types/                        # Types TypeScript
│   └── index.ts                  # Interfaces principales
│
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md           # Ce fichier
│   ├── SPECIFICATIONS_V2.md      # Spécifications V2
│   ├── FEATURES_PRIORITAIRES.md
│   ├── GUIDE_IA_COUTS.md
│   ├── INSTALLATION_IA.md
│   ├── STRATEGIE_BUSINESS_MARKETING.md
│   ├── STRATEGIE_DIFFERENCIATION.md
│   ├── client_schema_update.sql  # Migration clients
│   └── [autres fichiers SQL]
│
├── assets/                       # Ressources statiques
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
│
├── .expo/                        # Configuration Expo
├── node_modules/                 # Dépendances
├── .env                          # Variables d'environnement
├── .env.example                  # Template .env
├── .gitignore
├── app.json                      # Configuration Expo
├── babel.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── nativewind-env.d.ts
├── index.ts                      # Point d'entrée
├── CORRECTION_ROADMAP.md         # Cahier de route corrections
└── MVP_ANALYSIS_QUICKBILL.md     # Analyse MVP
```

## 🎯 Principes d'Architecture

### 1. Navigation
- **Expo Router** : Navigation basée sur le système de fichiers
- **Tabs** : Navigation principale via `(tabs)/`
- **Stack** : Navigation modale pour les détails
- **Public Routes** : Routes accessibles sans authentification

### 2. Gestion d'État
- **React Context** : Auth, Offline, Preferences
- **React Query** : Cache et synchronisation des données
- **Local State** : useState pour l'UI locale

### 3. Données
- **Supabase** : Backend principal (PostgreSQL)
- **SQLite** : Stockage local (mode offline)
- **Sync Service** : Synchronisation bidirectionnelle

### 4. Styling
- **NativeWind** : Tailwind CSS pour React Native
- **Constantes** : Couleurs unifiées dans `constants/colors.ts`
- **Composants** : Réutilisables et cohérents

## 🔄 Flux de Données

```
User Action
    ↓
Component (UI)
    ↓
Hook (useInvoice, useClients, etc.)
    ↓
Service (lib/)
    ↓
[Online] → Supabase → Database
[Offline] → SQLite → Local DB
    ↓
Sync Service (background)
    ↓
Supabase (when online)
```

## 🎨 Design System

### Couleurs Principales
- **Primary** : `#2563EB` (Blue-600)
- **Accent** : `#6366F1` (Indigo-500)
- **Success** : `#10B981` (Emerald-500)
- **Warning** : `#F59E0B` (Amber-500)
- **Danger** : `#EF4444` (Red-500)

### Typographie
- **Headings** : font-bold, font-black
- **Body** : font-medium, font-semibold
- **Captions** : text-xs, text-sm

### Espacements
- **Padding** : p-4, p-6, p-8
- **Margin** : mb-4, mb-6, mb-8
- **Gap** : gap-3, gap-4, gap-6

## 🔐 Sécurité

### Authentification
- Supabase Auth (Email/Password)
- Row Level Security (RLS)
- JWT Tokens

### Données Sensibles
- `.env` pour les clés API
- Secure Store pour les tokens
- Chiffrement des données locales

## 📱 Compatibilité

- **iOS** : 13.0+
- **Android** : API 21+ (Android 5.0)
- **Web** : Navigateurs modernes (Chrome, Safari, Firefox)

## 🚀 Performance

### Optimisations
- Lazy loading des images
- Pagination des listes
- Cache React Query
- Debounce sur les recherches
- Memoization des calculs

### Mode Offline
- SQLite pour le stockage local
- Queue de synchronisation
- Indicateurs visuels
- Retry automatique

## 📊 Monitoring

### Logs
- Console.log pour le développement
- Sentry pour la production (à configurer)

### Analytics
- Événements utilisateur
- Erreurs et crashes
- Performance metrics

---

**Dernière mise à jour** : 3 Mars 2026
**Version** : 2.0.0
**Auteur** : QuickBill Team
