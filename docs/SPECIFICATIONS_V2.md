# Cahier des Charges : QuickBill Evolution (V2)

Ce document détaille les spécifications fonctionnelles et techniques pour transformer QuickBill en une solution de gestion d'entreprise unique et leader sur son marché.

---

## 🚀 Vision Globale
Passer d'une simple application de facturation à un **Assistant de Gestion Multi-Canal** qui automatise les encaissements et offre une visibilité totale sur la rentabilité.

---

## 1. Module : Communication WhatsApp Intelligente
*L'objectif est de supprimer la friction de l'envoi de mail et d'utiliser le canal préféré des clients.*

### Fonctionnalités :
- **Bouton "WhatsApp"** dans les détails de facture/devis.
- **Génération de message type** : "Bonjour [Client], votre facture [Numéro] de [Montant] est prête. Vous pouvez la consulter ici : [Lien]."
- **Relance automatique** : Message pré-rempli pour les factures en retard.

### Technique :
- Utilisation de `Linking.openURL('whatsapp://send?phone=...')`.
- Définition de templates de messages personnalisables dans les paramètres.

---

## 2. Module : Gestion des Dépenses & Rentabilité
*L'objectif est d'offrir une vision "Profit réel" à l'entrepreneur.*

### Fonctionnalités :
- **Saisie de dépenses** : Montant, Date, Catégorie (Loyer, Salaire, Matériel, Marketing).
- **Import de reçu** : Prise de photo du ticket de caisse et stockage.
- **Tableau de Bord enrichi** :
  - Revenus (CA)
  - Dépenses (Sorties)
  - **Bénéfice Net** (Revenus - Dépenses)
- **Graphique comparatif** mensuel.

### Technique :
- Nouvelle table Supabase `expenses`.
- Utilisation de `expo-camera` et `expo-image-picker`.
- Intégration optionnelle d'une API OCR (ex: Google Vision) pour extraire le texte des tickets automatiquement.

---

## 3. Module : Paiement par QR Code intégré
*L'objectif est de se faire payer 2x plus vite.*

### Fonctionnalités :
- **Génération de QR Code sur le PDF** : Le client scanne et arrive sur une page de paiement ou ses informations Mobile Money.
- **Configuration** : L'utilisateur entre son numéro Mobile Money ou son lien Stripe/PayPal dans ses réglages.

### Technique :
- Intégration d'une bibliothèque de génération de QR Code dans le template HTML du PDF (`lib/generate-html.ts`).

---

## 4. Module : Portail Client Web (Lien Unique)
*L'objectif est de professionnaliser la relation client.*

### Fonctionnalités :
- Chaque facture/devis possède un lien web public mais sécurisé.
- Le client peut cliquer sur le lien WhatsApp, voir sa facture proprement sur son téléphone sans télécharger de PDF.
- Bouton "Accepter le Devis" directement sur le web.

### Technique :
- Création d'une "Edge Function" Supabase ou d'une application Next.js ultra-légère qui lit la table `invoices` et génère une vue web.

---

## 5. Module : Mode Offline & Synchronisation
*L'objectif est de garantir le fonctionnement même dans les zones à faible réseau.*

### Fonctionnalités :
- Création de factures en mode avion.
- Enregistrement local immédiat.
- Synchronisation automatique en arrière-plan dès que le réseau revient.

### Technique :
- Mise en place d'une couche de stockage locale (`SQLite` ou `AsyncStorage`).
- File d'attente (Queue) pour les requêtes Supabase en attente.

---

## 📅 Roadmap d'implémentation suggérée

1.  **Phase 1 (Rapidité)** : Intégration WhatsApp + QR Code sur PDF. (Gain UX immédiat)
2.  **Phase 2 (Gestion)** : Module Dépenses + Nouveau Dashboard Profits. (Valeur métier)
3.  **Phase 3 (Technologie)** : Mode Offline + Portail Client Web. (Robustesse)

---

**Approuvé par :** [Ton Nom/QuickBill Team]
**Date :** 30 Décembre 2025
