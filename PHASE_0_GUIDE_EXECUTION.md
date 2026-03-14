# 🚀 PHASE 0 - GUIDE D'EXÉCUTION

**Date**: 12 Mars 2026  
**Durée estimée**: 2-3 jours  
**Statut**: ⏳ En cours

---

## ✅ JOUR 1: CONFIGURATION BASE DE DONNÉES

### 📋 Tâche T0.1: Exécuter le script SQL clients

#### Étape 1: Ouvrir Supabase Dashboard
1. Aller sur https://supabase.com
2. Se connecter à votre compte
3. Sélectionner votre projet QuickBill

#### Étape 2: Ouvrir SQL Editor
1. Dans le menu latéral gauche, cliquer sur **SQL Editor**
2. Cliquer sur **New Query** (ou le bouton +)

#### Étape 3: Copier le script clients
1. Ouvrir le fichier `docs/client_schema_update.sql`
2. Copier TOUT le contenu (Ctrl+A puis Ctrl+C)
3. Coller dans l'éditeur SQL de Supabase

#### Étape 4: Exécuter le script
1. Cliquer sur le bouton **Run** (ou Ctrl+Enter)
2. Attendre la confirmation "Success"
3. Vérifier qu'il n'y a pas d'erreurs

#### Étape 5: Vérifier les colonnes ajoutées
```sql
-- Exécuter cette requête pour vérifier
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;
```

**Résultat attendu**: Vous devriez voir les 6 nouvelles colonnes :
- ✅ registration_number (TEXT)
- ✅ industry (TEXT)
- ✅ contact_person (TEXT)
- ✅ tax_id (TEXT)
- ✅ currency (TEXT)
- ✅ logo_url (TEXT)

#### ✅ Validation T0.1
- [ ] Script exécuté sans erreur
- [ ] 6 nouvelles colonnes visibles
- [ ] Index créé sur industry
- [ ] Commentaires ajoutés

---

### 📋 Tâche T0.2: Exécuter le script SQL profiles

#### Étape 1: Nouvelle requête
1. Dans SQL Editor, cliquer sur **New Query**

#### Étape 2: Copier le script profiles
1. Ouvrir le fichier `docs/profile_schema_update.sql`
2. Copier TOUT le contenu
3. Coller dans l'éditeur SQL

#### Étape 3: Exécuter le script
1. Cliquer sur **Run**
2. Attendre la confirmation "Success"

#### Étape 4: Vérifier la colonne ajoutée
```sql
-- Exécuter cette requête pour vérifier
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

**Résultat attendu**: Vous devriez voir la nouvelle colonne :
- ✅ full_name (TEXT)

#### Étape 5: Vérifier la migration des données
```sql
-- Vérifier que les données ont été migrées
SELECT id, full_name, business_name
FROM profiles
LIMIT 5;
```

**Résultat attendu**: 
- Si vous aviez des profils existants, `full_name` devrait contenir la valeur de `business_name`

#### ✅ Validation T0.2
- [ ] Script exécuté sans erreur
- [ ] Colonne full_name créée
- [ ] Données migrées (si profils existants)
- [ ] Commentaires ajoutés

---

### 📋 Tâche T0.3: Vérifier les données existantes

#### Test 1: Créer un nouveau client
1. Lancer l'application
   ```bash
   npx expo start -c
   ```

2. Aller dans **Clients** → **+** (Nouveau client)

3. Remplir le formulaire :
   - Business Name: "Test Company"
   - Email: "test@company.com"
   - Phone: "+250712345678"
   - Registration Number: "RC123456"
   - Industry: "Technology"
   - Currency: "RWF"

4. Cliquer sur **Create Client**

5. Vérifier dans Supabase :
   ```sql
   SELECT * FROM clients 
   WHERE name = 'Test Company';
   ```

**Résultat attendu**:
- ✅ Client créé avec tous les champs
- ✅ Nouveaux champs remplis correctement

#### Test 2: Modifier le profil
1. Dans l'app, aller dans **Settings** → **Personal Info**

2. Modifier le nom complet :
   - Full Name: "Votre Nom"

3. Cliquer sur **Save Changes**

4. Vérifier dans Supabase :
   ```sql
   SELECT id, full_name, business_name, email
   FROM profiles
   WHERE email = 'votre-email@example.com';
   ```

**Résultat attendu**:
- ✅ full_name mis à jour
- ✅ business_name reste inchangé

#### Test 3: Éditer un client existant
1. Ouvrir un client existant
2. Modifier un champ (ex: Industry)
3. Sauvegarder
4. Vérifier que la modification est persistée

#### ✅ Validation T0.3
- [ ] Création de client fonctionne
- [ ] Tous les nouveaux champs sont sauvegardés
- [ ] Modification du profil fonctionne
- [ ] full_name est bien utilisé
- [ ] Édition de client fonctionne

---

## ✅ JOUR 2: TESTS MANUELS COMPLETS

### 📋 Tâche T0.4: Tester sur iOS

#### Prérequis
```bash
# Si vous n'avez pas encore l'app sur iOS
npx expo start
# Puis scanner le QR code avec l'app Expo Go
```

#### Tests à effectuer

##### 1. Authentification
- [ ] Inscription nouveau compte
- [ ] Connexion
- [ ] Déconnexion
- [ ] Mot de passe oublié

##### 2. Clients
- [ ] Créer un client (avec tous les champs)
- [ ] Créer un client (champs minimaux)
- [ ] Modifier un client
- [ ] Supprimer un client
- [ ] Rechercher un client
- [ ] Upload logo client

##### 3. Factures
- [ ] Créer une facture
- [ ] Ajouter plusieurs items
- [ ] Modifier une facture
- [ ] Supprimer une facture
- [ ] Générer PDF
- [ ] Partager via WhatsApp
- [ ] Marquer comme payée

##### 4. Devis
- [ ] Créer un devis
- [ ] Convertir en facture
- [ ] Partager

##### 5. Dépenses
- [ ] Ajouter une dépense manuelle
- [ ] Scanner un reçu
- [ ] Upload photo de reçu

##### 6. Dashboard
- [ ] Vérifier les statistiques
- [ ] Vérifier les graphiques
- [ ] Pull to refresh
- [ ] Changer la période (Week/Month/Year)

##### 7. Analytics
- [ ] Voir les revenus
- [ ] Voir les dépenses
- [ ] Top clients
- [ ] Revenue breakdown

##### 8. Paramètres
- [ ] Modifier profil personnel
- [ ] Modifier profil entreprise
- [ ] Changer la langue (tester les 5)
- [ ] Configurer WhatsApp template
- [ ] Ajouter signature
- [ ] Configurer taxes

##### 9. Mode Offline
- [ ] Activer le mode avion
- [ ] Créer une facture offline
- [ ] Créer un client offline
- [ ] Désactiver le mode avion
- [ ] Vérifier la synchronisation

#### ✅ Validation T0.4
- [ ] Tous les tests passent sur iOS
- [ ] Aucun crash
- [ ] UI correcte
- [ ] Performance acceptable

---

### 📋 Tâche T0.5: Tester sur Android

#### Prérequis
```bash
# Lancer sur Android
npx expo start --android
# Ou scanner le QR code avec Expo Go
```

#### Tests à effectuer
**Répéter TOUS les tests de T0.4 sur Android**

#### Points spécifiques Android
- [ ] Bouton retour système fonctionne
- [ ] Permissions caméra/galerie
- [ ] Notifications
- [ ] Partage fonctionne
- [ ] Clavier ne cache pas les champs

#### ✅ Validation T0.5
- [ ] Tous les tests passent sur Android
- [ ] Aucun crash
- [ ] UI correcte
- [ ] Performance acceptable
- [ ] Pas de différence majeure avec iOS

---

### 📋 Tâche T0.6: Créer une liste de bugs

#### Template de Bug Report
```markdown
## Bug #[Numéro]

**Titre**: [Description courte]

**Priorité**: 🔴 Critique / 🟡 Important / 🟢 Mineur

**Plateforme**: iOS / Android / Les deux

**Étapes pour reproduire**:
1. 
2. 
3. 

**Résultat attendu**:
[Ce qui devrait se passer]

**Résultat actuel**:
[Ce qui se passe réellement]

**Screenshots**: [Si applicable]

**Logs**: [Si disponibles]
```

#### Créer le fichier de bugs
Créer `BUGS_PHASE_0.md` avec tous les bugs trouvés

#### Priorisation
- 🔴 **Critique**: Bloque l'utilisation, crash, perte de données
- 🟡 **Important**: Fonctionnalité ne marche pas, UX dégradée
- 🟢 **Mineur**: Cosmétique, amélioration

#### ✅ Validation T0.6
- [ ] Fichier BUGS_PHASE_0.md créé
- [ ] Tous les bugs documentés
- [ ] Bugs priorisés
- [ ] Screenshots ajoutés si nécessaire

---

## ✅ JOUR 3: PRÉPARATION ENVIRONNEMENT

### 📋 Tâche T0.7: Configurer Sentry

#### Étape 1: Créer un compte Sentry
1. Aller sur https://sentry.io
2. Créer un compte (gratuit pour commencer)
3. Créer un nouveau projet "QuickBill"
4. Sélectionner "React Native"

#### Étape 2: Installer Sentry
```bash
npm install @sentry/react-native
npx @sentry/wizard -i reactNative
```

#### Étape 3: Configuration
Le wizard va créer/modifier :
- `sentry.properties`
- `app.json` (ajout du plugin)

#### Étape 4: Initialiser dans le code
Créer `lib/sentry.ts` :
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'VOTRE_DSN_ICI',
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 1.0,
});

export default Sentry;
```

#### Étape 5: Intégrer dans l'app
Modifier `app/_layout.tsx` :
```typescript
import Sentry from '../lib/sentry';

// Wrapper l'app
export default Sentry.wrap(RootLayout);
```

#### Étape 6: Tester
```typescript
// Ajouter temporairement pour tester
throw new Error('Test Sentry');
```

Vérifier que l'erreur apparaît dans le dashboard Sentry.

#### ✅ Validation T0.7
- [ ] Sentry installé
- [ ] Configuration complète
- [ ] Test d'erreur fonctionne
- [ ] Dashboard Sentry accessible

---

### 📋 Tâche T0.8: Créer un projet de test

#### Étape 1: Installer Jest
```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
```

#### Étape 2: Configuration Jest
Créer `jest.config.js` :
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@supabase)/)',
  ],
};
```

#### Étape 3: Créer le premier test
Créer `__tests__/example.test.ts` :
```typescript
describe('Example Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
```

#### Étape 4: Ajouter le script
Dans `package.json` :
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

#### Étape 5: Exécuter
```bash
npm test
```

#### ✅ Validation T0.8
- [ ] Jest installé et configuré
- [ ] Premier test créé
- [ ] Test passe
- [ ] Script npm test fonctionne

---

### 📋 Tâche T0.9: Backup complet

#### Étape 1: Backup Base de Données
1. Aller dans Supabase Dashboard
2. Settings → Database
3. Cliquer sur "Backup now"
4. Télécharger le backup

#### Étape 2: Commit Git
```bash
# Vérifier le statut
git status

# Ajouter tous les fichiers
git add .

# Commit avec message descriptif
git commit -m "Phase 0 completed: SQL migrations, tests, monitoring setup"

# Créer un tag
git tag v2.0-stable

# Push
git push origin main
git push origin v2.0-stable
```

#### Étape 3: Backup du code
```bash
# Créer une archive
tar -czf quickbill-backup-$(date +%Y%m%d).tar.gz .

# Ou zipper
zip -r quickbill-backup-$(date +%Y%m%d).zip . -x "node_modules/*" ".expo/*"
```

#### Étape 4: Sauvegarder ailleurs
- Google Drive
- Dropbox
- GitHub (déjà fait)
- Disque externe

#### ✅ Validation T0.9
- [ ] Backup Supabase téléchargé
- [ ] Code commité sur Git
- [ ] Tag v2.0-stable créé
- [ ] Archive créée
- [ ] Backup sauvegardé ailleurs

---

## 📊 RÉCAPITULATIF PHASE 0

### Checklist Complète

#### Jour 1: Base de Données
- [ ] T0.1: Script SQL clients exécuté
- [ ] T0.2: Script SQL profiles exécuté
- [ ] T0.3: Données vérifiées

#### Jour 2: Tests
- [ ] T0.4: Tests iOS complets
- [ ] T0.5: Tests Android complets
- [ ] T0.6: Liste de bugs créée

#### Jour 3: Environnement
- [ ] T0.7: Sentry configuré
- [ ] T0.8: Tests unitaires setup
- [ ] T0.9: Backup complet

### Livrables
✅ Base de données à jour (6 colonnes clients + 1 colonne profiles)  
✅ Application testée sur iOS et Android  
✅ Liste de bugs documentée et priorisée  
✅ Monitoring Sentry opérationnel  
✅ Framework de tests configuré  
✅ Backup complet effectué

### Métriques
- **Bugs trouvés**: [À remplir]
- **Bugs critiques**: [À remplir]
- **Temps total**: [À remplir]
- **Statut**: ✅ Complété / ⏳ En cours / ❌ Bloqué

---

## 🚀 PROCHAINE ÉTAPE

Une fois la Phase 0 terminée, passer à la **Phase 1: Stabilisation**

**Première tâche Phase 1**: T1.1 - Compléter les traductions Kinyarwanda

---

**Créé le**: 12 Mars 2026  
**Mis à jour**: [Date]  
**Statut**: ⏳ En cours
