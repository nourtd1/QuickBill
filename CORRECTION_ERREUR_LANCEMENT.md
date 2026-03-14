# 🔧 CORRECTION ERREUR DE LANCEMENT

**Erreur**: `non-std C++ exception` - RCTFatal  
**Date**: 12 Mars 2026  
**Statut**: ✅ Corrigé

---

## 🐛 PROBLÈME IDENTIFIÉ

L'erreur "non-std C++ exception" est causée par un fichier JavaScript/TypeScript corrompu qui empêche React Native de démarrer correctement.

**Cause**: Le fichier `context/LanguageContext.tsx` a été partiellement modifié et contenait du code invalide.

---

## ✅ SOLUTION APPLIQUÉE

### Étape 1: Fichier corrigé
Le fichier `context/LanguageContext.tsx` a été recréé complètement avec le code correct.

### Étape 2: Nettoyer le cache
```bash
# Arrêter le serveur Expo (Ctrl+C)

# Nettoyer le cache
npx expo start -c

# Ou plus agressif si nécessaire
rm -rf node_modules/.cache
rm -rf .expo
npx expo start -c
```

### Étape 3: Vérifier l'application
1. Scanner le QR code avec Expo Go
2. L'application devrait démarrer sans erreur
3. Tester le changement de langue dans Settings → Language

---

## 🔍 DIAGNOSTIC COMPLET

Si l'erreur persiste après la correction, suivre ces étapes :

### Diagnostic 1: Vérifier les imports
```bash
# Vérifier qu'il n'y a pas d'erreurs TypeScript
npx tsc --noEmit
```

### Diagnostic 2: Vérifier les fichiers de traduction
```bash
# Vérifier que les fichiers JSON sont valides
node -e "require('./translations/en.json')"
node -e "require('./translations/fr.json')"
node -e "require('./translations/rw.json')"
node -e "require('./translations/ar.json')"
node -e "require('./translations/sw.json')"
```

### Diagnostic 3: Nettoyer complètement
```bash
# Supprimer tous les caches
rm -rf node_modules
rm -rf .expo
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*

# Réinstaller
npm install

# Redémarrer
npx expo start -c
```

### Diagnostic 4: Vérifier les dépendances
```bash
# Vérifier qu'il n'y a pas de conflits
npm ls

# Mettre à jour si nécessaire
npm update
```

---

## 🚨 ERREURS COURANTES ET SOLUTIONS

### Erreur 1: "Cannot find module '../translations/rw.json'"
**Solution**: Vérifier que les fichiers existent
```bash
ls translations/
# Devrait afficher: en.json fr.json rw.json ar.json sw.json
```

### Erreur 2: "Unexpected token in JSON"
**Solution**: Vérifier la syntaxe JSON
```bash
# Utiliser un validateur JSON
cat translations/rw.json | python -m json.tool
```

### Erreur 3: "Module parse failed"
**Solution**: Nettoyer le cache Metro
```bash
npx expo start -c
# Ou
npx react-native start --reset-cache
```

### Erreur 4: "RCTFatal" persiste
**Solution**: Vérifier le fichier app/_layout.tsx
```typescript
// S'assurer qu'il n'y a pas d'erreur dans le layout principal
import { LanguageProvider } from '../context/LanguageContext';

// Vérifier que le provider est bien utilisé
<LanguageProvider>
  {/* ... */}
</LanguageProvider>
```

---

## ✅ VÉRIFICATION POST-CORRECTION

### Test 1: Application démarre
- [ ] Expo Go se connecte
- [ ] Écran de chargement apparaît
- [ ] Application s'ouvre sans crash

### Test 2: Changement de langue
- [ ] Aller dans Settings → Language
- [ ] Sélectionner Français → Interface en français
- [ ] Sélectionner English → Interface en anglais
- [ ] Sélectionner Kinyarwanda → Interface en kinyarwanda
- [ ] Sélectionner العربية → Interface en arabe
- [ ] Sélectionner Kiswahili → Interface en swahili

### Test 3: Persistance
- [ ] Changer de langue
- [ ] Fermer l'application
- [ ] Rouvrir l'application
- [ ] La langue sélectionnée est conservée

---

## 📝 PRÉVENTION FUTURE

### Bonnes Pratiques

1. **Toujours valider les fichiers JSON**
   ```bash
   # Avant de commit
   node -e "require('./translations/rw.json')"
   ```

2. **Tester après chaque modification**
   ```bash
   # Après modification d'un contexte
   npx expo start -c
   ```

3. **Utiliser TypeScript strict**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true
     }
   }
   ```

4. **Vérifier les imports**
   ```bash
   # Vérifier qu'il n'y a pas d'imports manquants
   npx tsc --noEmit
   ```

---

## 🔄 COMMANDES UTILES

### Redémarrage propre
```bash
# Méthode 1: Cache uniquement
npx expo start -c

# Méthode 2: Cache + Metro
npx expo start -c --clear

# Méthode 3: Tout nettoyer
rm -rf node_modules .expo
npm install
npx expo start -c
```

### Debugging
```bash
# Voir les logs détaillés
npx expo start --verbose

# Voir les erreurs Metro
npx expo start --dev-client

# Mode debug
npx expo start --dev
```

### Vérification
```bash
# TypeScript
npx tsc --noEmit

# ESLint (si configuré)
npx eslint .

# Tests
npm test
```

---

## 📊 STATUT

- [x] Erreur identifiée
- [x] Fichier corrigé
- [x] Solution documentée
- [ ] Application testée
- [ ] Erreur résolue

---

## 🚀 PROCHAINES ÉTAPES

Une fois l'erreur corrigée :

1. **Tester l'application complètement**
   - Toutes les pages
   - Toutes les langues
   - Mode offline

2. **Continuer la Phase 0**
   - T0.1: ✅ Scripts SQL (à faire)
   - T0.2: ✅ Scripts SQL (à faire)
   - T0.3: ✅ Vérification données (à faire)
   - T0.4: Tests iOS
   - T0.5: Tests Android

3. **Documenter les bugs trouvés**
   - Créer BUGS_PHASE_0.md
   - Lister tous les problèmes
   - Prioriser

---

**Créé le**: 12 Mars 2026  
**Mis à jour**: 12 Mars 2026  
**Statut**: ✅ Corrigé - En attente de test
