# ✅ CHECKLIST DE TESTS - FORMULAIRE CLIENT

## 🎯 AVANT DE COMMENCER

### Prérequis
- [ ] Script SQL exécuté dans Supabase (`docs/client_schema_update.sql`)
- [ ] Application démarrée (`npx expo start -c`)
- [ ] Connexion à Supabase fonctionnelle
- [ ] Permissions photo accordées

---

## 📝 TEST 1 : CRÉATION D'UN CLIENT SIMPLE

### Étapes
1. [ ] Ouvrir l'app
2. [ ] Aller dans l'onglet "Clients"
3. [ ] Cliquer sur le bouton "+" (en bas à droite)
4. [ ] Remplir "Business Name" : `Test Company`
5. [ ] Cliquer sur "Create Client"

### Résultat Attendu
- [ ] Message de succès affiché
- [ ] Retour automatique à la liste
- [ ] Nouveau client visible dans la liste
- [ ] Nom affiché correctement

---

## 📝 TEST 2 : CRÉATION AVEC TOUS LES CHAMPS

### Étapes
1. [ ] Cliquer sur "+"
2. [ ] **Logo** : Cliquer sur l'icône, sélectionner une image
3. [ ] **Business Name** : `Acme Corporation`
4. [ ] **Registration Number** : `12345678`
5. [ ] **Industry** : Cliquer, sélectionner "Technology"
6. [ ] **Contact Person** : `John Doe`
7. [ ] **Email** : `john@acme.com`
8. [ ] **Phone** : `+1234567890`
9. [ ] **Address** : `123 Main St, City, Country`
10. [ ] **Tax ID** : `TAX123456`
11. [ ] **Currency** : Cliquer, sélectionner "EUR (€)"
12. [ ] **Notes** : `Important client`
13. [ ] Cliquer sur "Create Client"

### Résultat Attendu
- [ ] Logo uploadé et visible
- [ ] Message de succès
- [ ] Tous les champs sauvegardés
- [ ] Client visible dans la liste avec logo

---

## 📝 TEST 3 : UPLOAD DE LOGO

### Étapes
1. [ ] Créer ou éditer un client
2. [ ] Cliquer sur l'icône de logo (Building2 ou image existante)
3. [ ] Sélectionner une image depuis la galerie
4. [ ] Observer l'indicateur de chargement
5. [ ] Attendre la fin de l'upload

### Résultat Attendu
- [ ] Permission demandée (première fois)
- [ ] Galerie photo s'ouvre
- [ ] Indicateur de chargement visible
- [ ] Logo affiché après upload
- [ ] Message "Logo uploaded successfully"

---

## 📝 TEST 4 : SÉLECTEUR D'INDUSTRIE

### Étapes
1. [ ] Créer ou éditer un client
2. [ ] Cliquer sur le champ "Industry / Category"
3. [ ] Observer le modal qui s'ouvre
4. [ ] Faire défiler la liste
5. [ ] Sélectionner "Healthcare"
6. [ ] Observer la fermeture du modal

### Résultat Attendu
- [ ] Modal s'ouvre avec animation
- [ ] Liste de 14 industries visible
- [ ] Sélection visuelle (checkmark bleu)
- [ ] Modal se ferme automatiquement
- [ ] "Healthcare" affiché dans le champ

---

## 📝 TEST 5 : SÉLECTEUR DE DEVISE

### Étapes
1. [ ] Créer ou éditer un client
2. [ ] Cliquer sur le champ "Currency"
3. [ ] Observer le modal qui s'ouvre
4. [ ] Sélectionner "RWF (FRw)"
5. [ ] Observer la fermeture du modal

### Résultat Attendu
- [ ] Modal s'ouvre avec animation
- [ ] Liste de 7 devises visible
- [ ] Nom complet + code + symbole affichés
- [ ] Sélection visuelle (checkmark bleu)
- [ ] Modal se ferme automatiquement
- [ ] "RWF (FRw)" affiché dans le champ

---

## 📝 TEST 6 : ÉDITION D'UN CLIENT

### Étapes
1. [ ] Aller dans la liste des clients
2. [ ] Cliquer sur un client existant
3. [ ] Observer le chargement des données
4. [ ] Vérifier que tous les champs sont pré-remplis
5. [ ] Modifier "Business Name" : `Updated Name`
6. [ ] Changer le logo
7. [ ] Modifier l'industrie
8. [ ] Cliquer sur "Save Changes"

### Résultat Attendu
- [ ] Indicateur de chargement au début
- [ ] Tous les champs chargés correctement
- [ ] Logo affiché si existant
- [ ] Modifications sauvegardées
- [ ] Message "Client updated successfully"
- [ ] Retour à la liste
- [ ] Modifications visibles

---

## 📝 TEST 7 : SUPPRESSION D'UN CLIENT

### Étapes
1. [ ] Ouvrir un client en mode édition
2. [ ] Observer l'icône poubelle dans le header
3. [ ] Cliquer sur l'icône poubelle
4. [ ] Observer la boîte de confirmation
5. [ ] Cliquer sur "Delete"

### Résultat Attendu
- [ ] Icône poubelle visible (rouge)
- [ ] Boîte de confirmation s'affiche
- [ ] Message clair : "Are you sure..."
- [ ] Boutons "Cancel" et "Delete"
- [ ] Suppression effectuée
- [ ] Message "Client deleted successfully"
- [ ] Retour à la liste
- [ ] Client n'apparaît plus

---

## 📝 TEST 8 : VALIDATION

### Test 8.1 : Champ Obligatoire
1. [ ] Créer un nouveau client
2. [ ] Laisser "Business Name" vide
3. [ ] Cliquer sur "Create Client"

**Résultat Attendu** :
- [ ] Alert affiché : "Business Name is required"
- [ ] Formulaire non soumis

### Test 8.2 : Champs Optionnels
1. [ ] Créer un client avec seulement le nom
2. [ ] Laisser tous les autres champs vides
3. [ ] Cliquer sur "Create Client"

**Résultat Attendu** :
- [ ] Client créé avec succès
- [ ] Pas d'erreur
- [ ] Champs vides = null en base

---

## 📝 TEST 9 : UI/UX

### Test 9.1 : Scroll
1. [ ] Ouvrir le formulaire
2. [ ] Faire défiler vers le bas
3. [ ] Observer le footer

**Résultat Attendu** :
- [ ] Scroll fluide
- [ ] Footer reste visible en bas
- [ ] Tous les champs accessibles

### Test 9.2 : Keyboard
1. [ ] Cliquer sur un champ texte
2. [ ] Observer le clavier
3. [ ] Taper du texte
4. [ ] Passer au champ suivant

**Résultat Attendu** :
- [ ] Clavier s'ouvre
- [ ] Vue ajustée (KeyboardAvoidingView)
- [ ] Champ visible au-dessus du clavier
- [ ] Navigation fluide entre champs

### Test 9.3 : Loading States
1. [ ] Observer l'indicateur pendant l'upload de logo
2. [ ] Observer l'indicateur pendant la sauvegarde
3. [ ] Observer l'indicateur pendant le chargement

**Résultat Attendu** :
- [ ] Indicateurs visibles
- [ ] Boutons désactivés pendant le chargement
- [ ] Pas de double soumission possible

---

## 📝 TEST 10 : ERREURS

### Test 10.1 : Erreur Réseau
1. [ ] Désactiver le WiFi/Data
2. [ ] Essayer de créer un client
3. [ ] Observer le message d'erreur

**Résultat Attendu** :
- [ ] Message d'erreur clair
- [ ] Pas de crash
- [ ] Possibilité de réessayer

### Test 10.2 : Erreur Upload
1. [ ] Essayer d'uploader une image très grande
2. [ ] Observer le comportement

**Résultat Attendu** :
- [ ] Upload fonctionne (compression à 0.8)
- [ ] Ou message d'erreur si trop grande

---

## 📊 RÉSUMÉ DES TESTS

### Fonctionnalités Testées
- [ ] Création simple
- [ ] Création complète
- [ ] Upload de logo
- [ ] Sélecteur d'industrie
- [ ] Sélecteur de devise
- [ ] Édition
- [ ] Suppression
- [ ] Validation
- [ ] UI/UX
- [ ] Gestion d'erreurs

### Résultat Global
- [ ] **Tous les tests passés** ✅
- [ ] **Quelques problèmes** ⚠️ (noter ci-dessous)
- [ ] **Problèmes majeurs** ❌ (noter ci-dessous)

---

## 📝 NOTES / PROBLÈMES RENCONTRÉS

```
[Notez ici les problèmes rencontrés pendant les tests]

Exemple :
- Logo ne s'affiche pas après upload
- Modal ne se ferme pas sur Android
- Etc.
```

---

## ✅ VALIDATION FINALE

- [ ] Tous les tests passés
- [ ] Aucun crash rencontré
- [ ] Performance acceptable
- [ ] UI cohérente
- [ ] Messages clairs
- [ ] Données sauvegardées correctement

---

**Date des tests** : _______________
**Testeur** : _______________
**Plateforme** : iOS / Android / Web
**Statut** : ✅ Validé / ⚠️ À corriger / ❌ Bloquant

---

**Bon test ! 🚀**
