# 🎯 Fonctionnalités Prioritaires - Spécifications Techniques

> **Objectif** : Implémenter les fonctionnalités qui apportent le plus de valeur et de différenciation.

---

## 🥇 PRIORITÉ 1 : Portail Client Web

### **Pourquoi c'est critique ?**
- **Différenciation majeure** : Très peu d'apps mobiles offrent un portail web client
- **Expérience client premium** : Les clients adorent pouvoir accéder à leurs factures en ligne
- **Réduction du support** : Moins de "pouvez-vous renvoyer la facture ?"
- **Monétisation** : Fonctionnalité premium exclusive

### **Spécifications**

#### **1. Génération de Lien Unique**
```typescript
// Nouveau champ dans la table invoices
share_token: string (UUID unique)
expires_at: timestamp (optionnel, par défaut jamais)
access_count: number
last_accessed_at: timestamp
```

#### **2. Page Web Client**
- **URL** : `https://quickbill.app/invoice/{share_token}`
- **Design** : Responsive, identique au PDF mais interactif
- **Fonctionnalités** :
  - Voir la facture complète
  - Télécharger PDF
  - Bouton "Marquer comme payé" (notification au vendeur)
  - Commentaire/Question (messagerie intégrée)
  - Partage social (optionnel)

#### **3. Tracking & Analytics**
- Voir quand le client a ouvert la facture
- Nombre de fois consultée
- Téléchargements PDF
- Clics sur boutons d'action

#### **4. Sécurité**
- Token unique et non devinable
- Rate limiting (max 100 requêtes/heure)
- Option d'expiration automatique
- Option de mot de passe pour accès

### **Stack Technique**
- **Frontend** : Next.js 14 (React Server Components)
- **Backend** : Supabase Edge Functions
- **Hosting** : Vercel
- **Base de données** : Supabase (table `invoice_shares`)

### **Estimation** : 2-3 semaines

---

## 🥈 PRIORITÉ 2 : Mode Hors-Ligne Premium

### **Pourquoi c'est critique ?**
- **Marché africain** : Connexions internet instables
- **Expérience utilisateur** : L'app doit fonctionner partout, tout le temps
- **Différenciation** : Très peu d'apps de facturation fonctionnent vraiment offline

### **Spécifications**

#### **1. Stockage Local**
```typescript
// Utiliser expo-sqlite pour base de données locale
// Structure identique à Supabase mais locale
// Synchronisation bidirectionnelle
```

#### **2. Queue de Synchronisation**
- Toutes les actions offline sont mises en queue
- Synchronisation automatique quand connexion retrouvée
- Résolution de conflits intelligente (dernière modification gagne)

#### **3. Indicateurs Visuels**
- Badge "Offline" en haut de l'écran
- Badge "Synchronisation..." pendant sync
- Badge "Synchronisé" quand tout est à jour
- Compteur de modifications en attente

#### **4. Fonctionnalités Offline**
- ✅ Créer/modifier factures
- ✅ Créer/modifier clients
- ✅ Créer/modifier dépenses
- ✅ Voir dashboard (données locales)
- ❌ Générer PDF (nécessite serveur)
- ❌ Partager facture (nécessite serveur)

### **Stack Technique**
- **Base de données locale** : `expo-sqlite`
- **Synchronisation** : Supabase Realtime + Custom sync logic
- **Queue** : AsyncStorage + Background tasks

### **Estimation** : 3-4 semaines

---

## 🥉 PRIORITÉ 3 : OCR Intelligent pour Reçus

### **Pourquoi c'est critique ?**
- **Gain de temps énorme** : Plus besoin de saisir manuellement
- **Expérience premium** : "Wow, ça marche vraiment !"
- **Différenciation** : Fonctionnalité très rare dans les apps de facturation

### **Spécifications**

#### **1. Capture Photo**
- Utiliser `expo-image-picker` (déjà intégré)
- Option caméra ou galerie
- Prévisualisation avant traitement

#### **2. Traitement OCR**
- **Option 1** : Google Cloud Vision API (meilleure précision)
- **Option 2** : Tesseract.js (gratuit mais moins précis)
- **Option 3** : Supabase Edge Function avec ML model

#### **3. Extraction de Données**
```typescript
interface ExtractedReceipt {
  total: number;
  date: string;
  merchant: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  tax: number;
  confidence: number; // 0-1
}
```

#### **4. Interface Utilisateur**
- Afficher l'image scannée
- Surligner les données extraites
- Permettre correction manuelle
- Bouton "Créer dépense" avec données pré-remplies

#### **5. Catégorisation Automatique**
- ML model pour catégoriser automatiquement
- "Loyer", "Transport", "Matériel", etc.
- Apprentissage basé sur historique utilisateur

### **Stack Technique**
- **OCR** : Google Cloud Vision API (recommandé)
- **ML Catégorisation** : Supabase Edge Function + TensorFlow.js
- **Stockage images** : Supabase Storage

### **Estimation** : 2-3 semaines

---

## 🎯 PRIORITÉ 4 : Notifications Push Intelligentes

### **Pourquoi c'est critique ?**
- **Engagement utilisateur** : Garde les utilisateurs actifs
- **Valeur immédiate** : "J'ai reçu un paiement !"
- **Différenciation** : Notifications contextuelles intelligentes

### **Spécifications**

#### **1. Types de Notifications**

##### **A. Paiements Reçus**
```
"💰 Paiement reçu ! 50,000 RWF de Jean Dupont pour la facture #INV-123"
```

##### **B. Rappels de Paiement**
```
"⏰ Rappel : La facture #INV-456 de 75,000 RWF n'est toujours pas payée (15 jours)"
```

##### **C. Alertes de Trésorerie**
```
"📊 Votre trésorerie est faible : 25,000 RWF restants ce mois"
```

##### **D. Insights Proactifs**
```
"💡 Votre meilleur mois ! Vous avez généré 500K RWF ce mois (+25% vs mois dernier)"
```

##### **E. Activité Client**
```
"👤 Votre client Marie a ouvert la facture #INV-789"
```

#### **2. Configuration Utilisateur**
- Préférences de notifications (quelles notifications activer)
- Fréquence des rappels
- Heures silencieuses

#### **3. Actions Directes depuis Notification**
- Ouvrir la facture concernée
- Marquer comme payé
- Envoyer rappel

### **Stack Technique**
- **Push Notifications** : Expo Notifications
- **Backend** : Supabase Edge Functions (cron jobs)
- **Scheduling** : Supabase pg_cron ou external service

### **Estimation** : 1-2 semaines

---

## 🚀 PRIORITÉ 5 : Multi-Devises avec Taux de Change

### **Pourquoi c'est critique ?**
- **Marché africain** : Beaucoup d'entreprises travaillent en USD/EUR localement
- **Expérience premium** : Fonctionnalité très demandée
- **Différenciation** : Peu d'apps gèrent vraiment le multi-devises bien

### **Spécifications**

#### **1. Gestion Multi-Devises**
- Créer factures en différentes devises
- Conversion automatique pour affichage
- Taux de change en temps réel

#### **2. Devises Supportées**
- RWF, USD, EUR, XOF, XAF, NGN, KES, ZAR, GHS, etc.
- Ajout de devises personnalisées

#### **3. Taux de Change**
- API : ExchangeRate-API (gratuit) ou Fixer.io
- Mise à jour quotidienne automatique
- Cache local pour offline

#### **4. Interface Utilisateur**
- Sélecteur de devise lors de création facture
- Affichage montant principal + équivalent devise de référence
- Graphiques multi-devises dans dashboard

#### **5. Rapports Multi-Devises**
- Conversion automatique pour totaux
- Rapport par devise
- Gains/pertes de change

### **Stack Technique**
- **API Taux de Change** : ExchangeRate-API (gratuit jusqu'à 1500 req/mois)
- **Stockage** : Supabase (table `exchange_rates` avec cache)
- **Frontend** : Composants React avec sélecteurs

### **Estimation** : 1-2 semaines

---

## 📊 PRIORITÉ 6 : Analytics Avancés

### **Pourquoi c'est critique ?**
- **Valeur business** : Aide les entrepreneurs à prendre de meilleures décisions
- **Monétisation** : Fonctionnalité premium exclusive
- **Rétention** : Plus les utilisateurs comprennent leurs données, plus ils restent

### **Spécifications**

#### **1. Tableaux de Bord Avancés**

##### **A. Comparaison Périodes**
- Ce mois vs mois dernier
- Cette année vs année dernière
- Graphiques comparatifs

##### **B. Top Clients**
- Clients qui génèrent le plus de revenus
- Graphique avec pourcentages
- Clic pour voir détails

##### **C. Top Produits/Services**
- Services les plus vendus
- Revenus par service
- Tendances

##### **D. Analyse de Rentabilité**
- Marge bénéficiaire par client
- Marge bénéficiaire par service
- Coûts vs revenus

#### **2. Rapports Exportables**
- PDF professionnel
- Excel avec données brutes
- Envoi automatique par email (mensuel)

#### **3. Prévisions**
- Prédiction revenus mois suivant
- Tendances saisonnières
- Alertes si baisse prévue

### **Stack Technique**
- **Graphiques** : `react-native-gifted-charts` (déjà intégré)
- **Calculs** : Supabase RPC functions
- **Export** : `expo-print` pour PDF, `xlsx` pour Excel

### **Estimation** : 2-3 semaines

---

## 💬 PRIORITÉ 7 : Messagerie Intégrée

### **Pourquoi c'est critique ?**
- **Expérience fluide** : Plus besoin de quitter l'app pour WhatsApp
- **Historique centralisé** : Toutes les conversations liées aux factures
- **Différenciation** : Fonctionnalité très rare

### **Spécifications**

#### **1. Chat par Client**
- Messagerie intégrée dans la fiche client
- Historique de toutes les conversations
- Liens automatiques vers factures dans messages

#### **2. Templates de Messages**
- Templates pré-écrits
- Variables dynamiques ({client}, {montant}, etc.)
- Envoi rapide depuis facture

#### **3. Notifications**
- Notification quand client répond
- Badge de messages non lus
- Son de notification personnalisable

#### **4. Intégration WhatsApp**
- Option d'envoyer via WhatsApp natif
- Ou via messagerie intégrée (si client a compte)

### **Stack Technique**
- **Backend** : Supabase Realtime pour messages
- **Frontend** : Composant chat custom
- **Intégration WhatsApp** : `expo-linking` pour deep links

### **Estimation** : 2-3 semaines

---

## 🎨 PRIORITÉ 8 : Templates Personnalisables

### **Pourquoi c'est critique ?**
- **Personnalisation** : Les utilisateurs adorent personnaliser
- **Monétisation** : Templates premium payants
- **Différenciation** : Éditeur visuel drag-and-drop

### **Spécifications**

#### **1. Éditeur Visuel**
- Drag-and-drop pour réorganiser sections
- Personnalisation couleurs, fonts, logos
- Prévisualisation en temps réel

#### **2. Bibliothèque de Templates**
- Templates gratuits inclus
- Templates premium (achat unique ou abonnement)
- Templates créés par la communauté

#### **3. Sauvegarde & Partage**
- Sauvegarder templates personnalisés
- Partager templates avec autres utilisateurs
- Marketplace de templates

### **Stack Technique**
- **Éditeur** : React DnD pour drag-and-drop
- **Rendu** : React Native WebView pour prévisualisation
- **Stockage** : Supabase Storage pour templates

### **Estimation** : 3-4 semaines

---

## 📅 Plan d'Implémentation Recommandé

### **Sprint 1 (2 semaines)**
1. ✅ Portail Client Web (MVP)
2. ✅ Notifications Push basiques

### **Sprint 2 (2 semaines)**
3. ✅ Mode Hors-Ligne (MVP)
4. ✅ Multi-Devises basique

### **Sprint 3 (2 semaines)**
5. ✅ OCR Reçus (MVP)
6. ✅ Analytics Avancés (MVP)

### **Sprint 4 (2 semaines)**
7. ✅ Messagerie Intégrée
8. ✅ Templates Personnalisables (MVP)

---

## 🎯 Critères de Succès

Chaque fonctionnalité doit :
- ✅ Résoudre un problème réel utilisateur
- ✅ Être intuitive (< 30 secondes pour comprendre)
- ✅ Fonctionner offline (si applicable)
- ✅ Être testée avec 10+ utilisateurs réels
- ✅ Avoir une documentation claire

---

*Document créé le 12 Janvier 2026 - À mettre à jour après chaque sprint*

