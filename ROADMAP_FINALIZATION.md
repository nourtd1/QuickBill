# 🗺️ Roadmap de Finalisation - QuickBill MVP

Ce document trace la route pour transformer les 10% restants de QuickBill en une application prête pour le lancement bêta.

## 🎯 Objectif Principal
Remplacer les dernières données simulées (Mock Data) par des données réelles et connecter les actions "silencieuses" (boutons sans effet) aux services existants.

---

## 📅 Phase 1 : Cerveau du Dashboard (Priorité Haute)
**Fichier cible :** `lib/localServices.ts` & `app/(tabs)/index.tsx`

L'objectif est de rendre les graphiques et les KPIs du tableau de bord dynamiques et basés sur l'activité réelle de l'utilisateur.

- [ ] **1.1 Implémenter l'agrégation du graphique (Chart Data)**
    - *Actuel :* `getDashboardStatsLocal` retourne un tableau vide `[]`.
    - *Action :* Écrire une requête SQL (ou une boucle JS sur les factures récupérées) pour grouper les revenus par mois sur les 6 derniers mois.
    - *Format de sortie attendu :* `[{ value: 5000, label: 'Jan' }, { value: 7200, label: 'Feb' }, ...]`

- [ ] **1.2 Calculer la croissance mensuelle (Monthly Growth)**
    - *Actuel :* Variable hardcodée `+12.5%` dans `index.tsx`.
    - *Action :*
        1.  Calculer le revenu du mois en cours (M).
        2.  Calculer le revenu du mois précédent (M-1).
        3.  Appliquer la formule : `((M - M-1) / M-1) * 100`.
        4.  Gérer le cas de division par zéro (si M-1 = 0).

- [ ] **1.3 Connecter l'UI aux données réelles**
    - *Actuel :* `<Text>$1,250</Text>` (statique).
    - *Action :* Remplacer par `{formatCurrency(stats.pendingAmount)}` venant du hook `useDashboard`.

---

## 🚀 Phase 2 : Actions Réelles de Facturation
**Fichier cible :** `app/(tabs)/invoices.tsx`

Transformer le bouton "Send Reminders" d'une simple alerte en un véritable outil de productivité.

- [ ] **2.1 Logique "Send Reminders" (Relance de masse ou unitaire)**
    - *Option A (MVP) :* Ouvrir le client mail par défaut avec un Cci (BCC) vers tous les clients en retard.
    - *Option B (Recommandée) :* Ouvrir une modale listant les clients en retard et proposer d'envoyer un rappel via WhatsApp un par un (car WhatsApp ne permet pas facilement le bulk sans API business payante).
    - *Action technique :* Créer une fonction `handleBulkReminder` qui utilise `Linking.openURL('mailto:?bcc=client1@mail.com,client2@mail.com&subject=Relance Facture&body=...')`.

- [ ] **2.2 Vérifier le moteur de template WhatsApp**
    - *Fichier :* `app/settings/whatsapp.tsx` (déjà existant).
    - *Action :* S'assurer que le template sauvegardé est bien utilisé lors du clic sur "Share" dans une facture individuelle.

---

## ⚙️ Phase 3 : Validation des Modules Settings
**Fichiers cibles :** `app/settings/*`

Les modules semblent complets, mais nécessitent une vérification finale.

- [ ] **3.1 Signature Électronique** (`signature.tsx`)
    - *Test :* Signer -> Sauvegarder.
    - *Vérification :* Vérifier si l'URL de la signature est bien stockée dans la table `profiles` de Supabase et si elle apparaît sur le PDF généré (via `expo-print`).

- [ ] **3.2 Paramètres de Taxes** (`tax.tsx`)
    - *Action :* Le bouton "Add New" (Ajouter une région fiscale) est actuellement inactif.
    - *Décision :* Soit le cacher pour la V1, soit implémenter une modale simple pour ajouter un taux personnalisé.
    - *Recommendation :* Le cacher pour l'instant et se concentrer sur le "Default Tax Rate".

- [ ] **3.3 Gestion d'Équipe** (`team.tsx`)
    - *État :* Semble très complet (Invitation par email native).
    - *Action :* Tester le flux d'invitation (simuler un envoi d'email).

---

## 🛠️ Phase 4 : Nettoyage & Architecture
- [ ] **4.1 Suppression des Mocks**
    - Scanner le projet pour les commentaires `// TODO: Remove mock` ou les variables statiques restantes.
- [ ] **4.2 Optimisation des Imports**
    - Vérifier qu'il n'y a pas d'imports circulaires ou inutilisés.
- [ ] **4.3 Types TypeScript**
    - S'assurer que `LocalInvoice` et les types Supabase sont synchronisés pour éviter les erreurs de propriétés manquantes (`customer` vs `client`).

---

## 🏁 Ordre d'Exécution Suggéré

1.  **Dashboard Logic** (`localServices.ts`) : C'est le cœur de la "valeur perçue" par l'utilisateur.
2.  **Dashboard UI** (`index.tsx`) : Refléter ces changements visuellement.
3.  **Invoices Actions** : Rendre l'app utile au quotidien.
4.  **Polish Settings** : Finaliser les détails.
