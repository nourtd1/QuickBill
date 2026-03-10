# 🧪 GUIDE DE TEST - FORMULAIRE CLIENT V2

**Date** : 3 Mars 2026  
**Version** : 2.0 avec sélecteur de code pays

---

## ⚠️ PRÉREQUIS

### 1. Exécuter le Script SQL
```sql
-- Ouvrir Supabase Dashboard
-- SQL Editor > New Query
-- Copier-coller le contenu de : docs/client_schema_update.sql
-- Cliquer sur "Run"
```

### 2. Démarrer l'Application
```bash
npx expo start -c
```

---

## ✅ TESTS À EFFECTUER

### TEST 1 : Création d'un Client avec Code Pays Africain

**Objectif** : Vérifier que le sélecteur de code pays fonctionne

**Étapes** :
1. Aller dans l'onglet "Clients"
2. Cliquer sur le bouton "+" (en bas à droite)
3. Cliquer sur "Upload Logo" et sélectionner une image
4. Remplir "Business Name" : `Acme Rwanda Ltd`
5. Cliquer sur "Select Industry" → Choisir "Technology"
6. Remplir "Contact Person" : `Jean Dupont`
7. Remplir "Email" : `jean@acme.rw`
8. **Cliquer sur le code pays** (par défaut +250 🇷🇼)
9. Dans le modal, rechercher "Kenya"
10. Sélectionner "Kenya +254 🇰🇪"
11. Entrer le numéro : `712345678`
12. Remplir "Address" : `Kigali, Rwanda`
13. Cliquer sur "Select Currency" → Choisir "RWF"
14. Cliquer sur "Create Client"

**Résultat Attendu** :
- ✅ Message de succès affiché
- ✅ Retour à la liste des clients
- ✅ Nouveau client visible dans la liste
- ✅ En base de données : phone = `+254712345678`

---

### TEST 2 : Recherche de Code Pays

**Objectif** : Vérifier que la recherche fonctionne

**Étapes** :
1. Créer un nouveau client
2. Cliquer sur le code pays
3. Dans la barre de recherche, taper "Nigeria"
4. **Vérifier** : Seul Nigeria 🇳🇬 apparaît
5. Effacer la recherche
6. Taper "+27"
7. **Vérifier** : Seule l'Afrique du Sud 🇿🇦 apparaît
8. Effacer la recherche
9. Taper "United"
10. **Vérifier** : United Kingdom et UAE apparaissent

**Résultat Attendu** :
- ✅ La recherche filtre correctement par nom
- ✅ La recherche filtre correctement par code
- ✅ Les drapeaux sont visibles
- ✅ Le pays sélectionné a un checkmark bleu

---

### TEST 3 : Édition avec Parsing du Numéro

**Objectif** : Vérifier que le code pays est extrait automatiquement

**Prérequis** : Avoir un client avec un numéro complet (ex: +254712345678)

**Étapes** :
1. Cliquer sur un client existant
2. **Vérifier** : Le code pays affiché est "+254 🇰🇪"
3. **Vérifier** : Le numéro affiché est "712345678" (sans le code)
4. Modifier le code pays → Sélectionner "Rwanda +250 🇷🇼"
5. Modifier le numéro → "788123456"
6. Cliquer sur "Save Changes"

**Résultat Attendu** :
- ✅ Le code pays est correctement extrait à l'ouverture
- ✅ Le numéro est affiché sans le code
- ✅ Après sauvegarde : phone = `+250788123456`
- ✅ Message de succès affiché

---

### TEST 4 : Upload de Logo

**Objectif** : Vérifier que l'upload fonctionne

**Étapes** :
1. Créer un nouveau client
2. Cliquer sur "Upload Logo"
3. Sélectionner une image depuis la galerie
4. **Vérifier** : Indicateur de chargement visible
5. **Vérifier** : Image prévisualisée après upload
6. Remplir les autres champs
7. Sauvegarder

**Résultat Attendu** :
- ✅ Image uploadée vers Supabase Storage
- ✅ URL sauvegardée dans `logo_url`
- ✅ Logo visible dans la liste des clients
- ✅ Logo visible lors de l'édition

---

### TEST 5 : Tous les Pays Africains

**Objectif** : Vérifier que tous les pays africains sont présents

**Étapes** :
1. Ouvrir le sélecteur de code pays
2. Scroller vers le bas
3. **Vérifier la présence de** :
   - 🇿🇦 South Africa (+27)
   - 🇳🇬 Nigeria (+234)
   - 🇰🇪 Kenya (+254)
   - 🇺🇬 Uganda (+256)
   - 🇹🇿 Tanzania (+255)
   - 🇷🇼 Rwanda (+250)
   - 🇬🇭 Ghana (+233)
   - 🇪🇬 Egypt (+20)
   - 🇲🇦 Morocco (+212)
   - 🇪🇹 Ethiopia (+251)
   - ... et 37 autres

**Résultat Attendu** :
- ✅ 47 pays africains présents
- ✅ Tous avec drapeaux emoji
- ✅ Section "African Countries" visible en haut

---

### TEST 6 : Design Cohérent

**Objectif** : Vérifier que le design est cohérent

**Étapes** :
1. Ouvrir le formulaire client
2. **Vérifier que chaque champ a** :
   - ✅ Une icône à gauche
   - ✅ Un fond blanc
   - ✅ Une bordure grise claire
   - ✅ Un placeholder gris
   - ✅ Un texte noir pour les valeurs

3. **Vérifier les icônes** :
   - 🏢 Business Name
   - #️⃣ Registration Number
   - 💼 Industry
   - 👤 Contact Person
   - ✉️ Email
   - 📱 Phone
   - 📍 Address
   - 💳 Tax ID
   - 🌐 Currency
   - 📝 Notes

**Résultat Attendu** :
- ✅ Toutes les icônes présentes
- ✅ Couleurs cohérentes
- ✅ Espacement uniforme
- ✅ Design moderne et épuré

---

### TEST 7 : Suppression de Client

**Objectif** : Vérifier que la suppression fonctionne

**Étapes** :
1. Ouvrir un client en édition
2. Cliquer sur l'icône poubelle (header, à droite)
3. **Vérifier** : Modal de confirmation apparaît
4. Cliquer sur "Delete"
5. **Vérifier** : Message de succès
6. **Vérifier** : Retour à la liste
7. **Vérifier** : Client supprimé de la liste

**Résultat Attendu** :
- ✅ Confirmation avant suppression
- ✅ Suppression en base de données
- ✅ Message de succès
- ✅ Navigation correcte

---

### TEST 8 : Validation

**Objectif** : Vérifier que la validation fonctionne

**Étapes** :
1. Créer un nouveau client
2. Laisser "Business Name" vide
3. Cliquer sur "Create Client"
4. **Vérifier** : Alert "Business Name is required"
5. Remplir "Business Name"
6. Cliquer sur "Create Client"
7. **Vérifier** : Client créé avec succès

**Résultat Attendu** :
- ✅ Business Name obligatoire
- ✅ Tous les autres champs optionnels
- ✅ Message d'erreur clair

---

### TEST 9 : Modals

**Objectif** : Vérifier que tous les modals fonctionnent

**Étapes** :
1. Ouvrir le formulaire
2. Cliquer sur "Select Industry"
   - ✅ Modal s'ouvre
   - ✅ 14 industries listées
   - ✅ Sélection fonctionne
   - ✅ Modal se ferme
3. Cliquer sur le code pays
   - ✅ Modal s'ouvre
   - ✅ Barre de recherche visible
   - ✅ 87+ pays listés
   - ✅ Sélection fonctionne
4. Cliquer sur "Select Currency"
   - ✅ Modal s'ouvre
   - ✅ 7 devises listées
   - ✅ Sélection fonctionne

**Résultat Attendu** :
- ✅ Tous les modals s'ouvrent et se ferment correctement
- ✅ Animations fluides
- ✅ Design cohérent

---

### TEST 10 : Champs Optionnels

**Objectif** : Vérifier qu'on peut créer un client avec le minimum

**Étapes** :
1. Créer un nouveau client
2. Remplir UNIQUEMENT "Business Name" : `Test Minimal`
3. Cliquer sur "Create Client"

**Résultat Attendu** :
- ✅ Client créé avec succès
- ✅ Tous les champs optionnels sont NULL en base
- ✅ Pas d'erreur

---

## 📊 CHECKLIST COMPLÈTE

### Fonctionnalités
- [ ] Création de client
- [ ] Édition de client
- [ ] Suppression de client
- [ ] Upload de logo
- [ ] Sélection de code pays
- [ ] Recherche de pays
- [ ] Sélection d'industrie
- [ ] Sélection de devise
- [ ] Parsing du numéro de téléphone
- [ ] Validation Business Name

### Design
- [ ] Toutes les icônes présentes
- [ ] Couleurs cohérentes
- [ ] Bordures uniformes
- [ ] Espacement correct
- [ ] Modals modernes
- [ ] Animations fluides
- [ ] Helper text visible
- [ ] Indicateurs de chargement

### Données
- [ ] Sauvegarde correcte en base
- [ ] Chargement correct depuis la base
- [ ] Numéro complet sauvegardé (+code)
- [ ] Logo URL sauvegardée
- [ ] Tous les champs optionnels gérés

---

## 🐛 PROBLÈMES CONNUS

Aucun problème connu pour le moment.

---

## 📝 NOTES

### Code Pays par Défaut
Le code par défaut est **+250 (Rwanda)** 🇷🇼

### Ordre des Pays
Les 47 pays africains apparaissent en premier, suivis du reste du monde.

### Recherche
La recherche est insensible à la casse et fonctionne sur le nom et le code.

---

## ✅ VALIDATION FINALE

Une fois tous les tests passés :
- ✅ Le formulaire est 100% fonctionnel
- ✅ Le design est cohérent avec l'app
- ✅ Tous les champs fonctionnent
- ✅ Les modals sont opérationnels
- ✅ La validation fonctionne
- ✅ Prêt pour la production

---

**Bon test ! 🚀**
