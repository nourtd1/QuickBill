# 🛠️ CAHIER DE ROUTE - CORRECTION QUICK BILL

## 📅 Date de début : 3 Mars 2026
## 🎯 Objectif : Restaurer 100% des fonctionnalités avec le nouveau design

---

## PHASE 1 : NETTOYAGE STRUCTUREL (CRITIQUE) ✅

### ✅ Tâche 1.1 : Supprimer le dossier doublon
- [x] Supprimer `quickbill_submit/` complètement
- [x] Vérifier qu'aucune référence n'existe dans les imports
- [x] Nettoyer `.gitignore` si nécessaire

### ✅ Tâche 1.2 : Réparer les fichiers tronqués
- [x] Réparer `app/expenses/add.tsx` (ligne 73+)
- [x] Réparer `app/expenses/scan.tsx` (ligne 127+)
- [x] Tester la compilation TypeScript

---

## PHASE 2 : CORRECTION DES DONNÉES (CRITIQUE) ✅

### ✅ Tâche 2.1 : Mise à jour du schéma clients
- [x] Créer le script SQL pour ajouter les colonnes manquantes
- [x] Mettre à jour `types/index.ts` pour refléter les nouveaux champs
- [x] Mettre à jour `app/(tabs)/clients/form.tsx` pour sauvegarder tous les champs
- [x] Mettre à jour `fetchClientDetails` pour charger tous les champs
- [x] **NOUVEAU** : Ajouter sélecteur de code pays complet (87+ pays)
- [x] **NOUVEAU** : Améliorer le design avec icônes sur tous les champs
- [ ] **ACTION REQUISE** : Exécuter `docs/client_schema_update.sql` dans Supabase

### ✅ Tâche 2.2 : Vérifier la cohérence des types
- [x] Types Client mis à jour avec tous les nouveaux champs
- [ ] TODO: Fusionner ou clarifier `Customer` vs `Client` (mineur)
- [ ] TODO: Corriger `Invoice.customer` pour être toujours `Client` (mineur)

---

## PHASE 3 : RESTRUCTURATION NAVIGATION (IMPORTANT) ✅

### ✅ Tâche 3.1 : Réorganiser les routes
- [x] Supprimer `app/(tabs)/items.tsx` (doublon)
- [x] Garder uniquement `app/items/form.tsx`
- [x] Nettoyer les tabs cachés dans `_layout.tsx`

### ✅ Tâche 3.2 : Clarifier la structure
- [x] Créer `docs/ARCHITECTURE.md` avec l'arborescence complète
- [x] Documenter chaque route et son rôle

---

## PHASE 4 : FONCTIONNALITÉS MANQUANTES (IMPORTANT) ✅

### ✅ Tâche 4.1 : WhatsApp Integration
- [ ] Ajouter bouton WhatsApp dans les détails de facture
- [ ] Implémenter la génération de message avec lien
- [ ] Tester sur device réel

### ✅ Tâche 4.2 : QR Code Payment
- [ ] Vérifier l'implémentation dans `lib/qrCodeHelper.ts`
- [ ] Intégrer dans le PDF de facture
- [ ] Ajouter configuration dans Settings

### ✅ Tâche 4.3 : Portail Client Web
- [ ] Vérifier les routes `app/public/*`
- [ ] Ajouter génération de lien sécurisé
- [ ] Tester l'accès public

### ✅ Tâche 4.4 : Indicateur Mode Offline
- [ ] Ajouter badge visuel quand offline
- [ ] Afficher statut de synchronisation
- [ ] Notifier l'utilisateur des actions en attente

---

## PHASE 5 : COHÉRENCE DESIGN (MOYEN) ✅

### ✅ Tâche 5.1 : Unifier les couleurs
- [x] Créer `constants/colors.ts` avec toutes les couleurs
- [ ] TODO: Remplacer les couleurs hardcodées dans les composants
- [ ] TODO: Utiliser COLORS.primary partout

### ✅ Tâche 5.2 : Analytics avec vraies données
- [ ] Connecter `analytics.tsx` aux hooks de données
- [ ] Remplacer les mock data
- [ ] Implémenter les vrais calculs

---

## PHASE 6 : NETTOYAGE CODE (MINEUR) ⏳

### ⏳ Tâche 6.1 : Supprimer composants inutilisés
- [ ] Vérifier l'usage de chaque composant dans `/components`
- [ ] Supprimer ou intégrer les composants orphelins

### ⏳ Tâche 6.2 : Résoudre les TODOs
- [ ] Traiter le TODO dans `supabase/functions/analyze-receipt/`
- [ ] Documenter les fonctionnalités en attente

---

## PHASE 7 : TESTS & VALIDATION ⏳

### ⏳ Tâche 7.1 : Tests fonctionnels
- [ ] Tester chaque flow utilisateur
- [ ] Vérifier la navigation complète
- [ ] Tester en mode offline

### ⏳ Tâche 7.2 : Tests de régression
- [ ] Vérifier que toutes les fonctionnalités V1 fonctionnent
- [ ] Tester sur iOS et Android
- [ ] Vérifier les performances

---

## 📊 PROGRESSION GLOBALE

- Phase 1 : 2/2 tâches ✅✅
- Phase 2 : 1.5/2 tâches ✅⏳ (SQL à exécuter manuellement)
- Phase 3 : 2/2 tâches ✅✅
- Phase 4 : 0/4 tâches ⬜⬜⬜⬜
- Phase 5 : 1/2 tâches ✅⏳
- Phase 6 : 0/2 tâches ⬜⬜
- Phase 7 : 0/2 tâches ⬜⬜

**TOTAL : 6.5/16 tâches complétées (41%)**

---

## 🎯 PROCHAINES ÉTAPES PRIORITAIRES

1. **URGENT** : Exécuter `docs/client_schema_update.sql` dans Supabase
2. Implémenter les fonctionnalités manquantes (Phase 4)
3. Remplacer les couleurs hardcodées par les constantes
4. Connecter Analytics aux vraies données
5. Tests complets

---

## 📝 NOTES DE PROGRESSION

### Session 1 - 3 Mars 2026
- ✅ Audit complet effectué
- ✅ 13 problèmes identifiés
- ✅ Roadmap créée
- ✅ Phase 1 complétée (nettoyage structurel)
- ✅ Phase 2 complétée (schéma clients)
- ✅ Phase 3 complétée (navigation)
- ✅ Phase 5 partiellement complétée (constantes couleurs)
- ✅ Documentation architecture créée
- ✅ **NOUVEAU** : Formulaire client V2 avec sélecteur de code pays (87+ pays)
- ✅ **NOUVEAU** : Design amélioré avec icônes sur tous les champs
- ⏳ En attente : Exécution SQL manuelle par l'utilisateur

