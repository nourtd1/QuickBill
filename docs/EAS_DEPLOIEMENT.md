# QuickBill — Guide déploiement EAS (Expo Application Services)

Ce document regroupe les commandes et points de configuration pour construire et soumettre l’app en production (Android `.aab`, iOS).

---

## Prérequis

- Compte [Expo](https://expo.dev) et [EAS](https://docs.expo.dev/eas/) configuré.
- **Apple Developer** (compte payant) pour les builds iOS de production.
- **Google Play Console** pour publier l’AAB.

Installer la CLI EAS (globalement ou via `npx`) :

```bash
npm install -g eas-cli
```

---

## Configuration projet (résumé)

| Fichier | Rôle |
|---------|------|
| `app.json` | Identifiants (`com.nourdevtd.quickbill`), version, `versionCode` / `buildNumber`, plugins (caméra, images, notifications, biométrie, micro), assets. |
| `eas.json` | Profils de build : `production` avec `autoIncrement`, Node 20, AAB Android. |

**Important :** remplacer `YOUR_EAS_PROJECT_ID` dans `app.json` → `expo.extra.eas.projectId` par l’ID réel après `eas init` (sinon les builds EAS ne sont pas liés au bon projet).

**Identifiants :** si une ancienne version était déjà publiée sous un autre bundle id (ex. `com.quickbill.app`), le nouveau id est traité comme **une nouvelle application** sur les stores.

---

## Variables d’environnement (EAS)

Les clés côté client doivent être préfixées par **`EXPO_PUBLIC_`** : Metro les injecte au moment du bundle.

**À configurer sur Expo** : *Project → Environment variables* (environnement **production**), ou en CLI :

```bash
eas env:create
```

**Obligatoires pour une app fonctionnelle :**

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Optionnelles** (selon les fonctionnalités utilisées) :

- `EXPO_PUBLIC_GEMINI_API_KEY` / `EXPO_PUBLIC_OPENAI_API_KEY`
- `EXPO_PUBLIC_EMAILJS_*` (service, clé publique, templates)
- `EXPO_PUBLIC_PROJECT_ID` (notifications push Expo)

Ne **pas** commiter de secrets : le fichier `.env` local est dans `.gitignore` et **n’est pas** envoyé automatiquement sur les serveurs EAS.

---

## Commandes de validation avant build

À lancer depuis la racine du projet (`QuickBill`) :

```bash
npx expo-doctor
```

```bash
npm run typecheck
```

*(Script `typecheck` = `tsc --noEmit` ; des erreurs peuvent encore exister dans le code — à corriger pour un CI strict.)*

Aligner les dépendances avec le SDK Expo :

```bash
npx expo install --check
```

Exemple : corriger `@react-native-community/datetimepicker` si `expo-doctor` le signale :

```bash
npx expo install @react-native-community/datetimepicker
```

Si `npm install` échoue à cause des *peer dependencies* (ex. React 19 / lucide) :

```bash
npm install --legacy-peer-deps
```

*(Optionnel, si vous générez des dossiers natifs en local)*

```bash
npx expo prebuild --clean
```

---

## Première configuration EAS

```bash
npx eas-cli login
```

```bash
eas init
```

Suivre les instructions ; mettre à jour `expo.extra.eas.projectId` dans `app.json` si besoin.

**Credentials iOS** (certificats, profils) : au premier build iOS, EAS guide la configuration, ou :

```bash
eas credentials
```

---

## Builds production

**Android (AAB - Play Store)** :
```bash
npx eas build --platform android --profile production
```

**Android (APK - Test interne / Preview)** :
*Génère un fichier installable directement.*
```bash
npx eas build --platform android --profile preview
```

**iOS (App Store / TestFlight)** :
```bash
npx eas build --platform ios --profile production
```

**Les deux plateformes** :

```bash
eas build --platform all --profile production
```

`autoIncrement: true` sur le profil `production` incrémente automatiquement le **versionCode** Android et le **buildNumber** iOS à chaque build de production (les valeurs de départ sont dans `app.json`).

---

## Soumission aux stores (après build réussi)

**Android** :
```bash
npx eas submit --platform android --profile production
```

**iOS (TestFlight / App Store)** :
```bash
npx eas submit --platform ios --profile production
```

Vous pouvez aussi soumettre en indiquant l’artefact (URL ou chemin) selon les options de `eas submit --help`.

---

## Profils utiles dans `eas.json`

| Profil | Usage |
|--------|--------|
| `development` | Client de développement, APK interne. |
| `preview` | APK interne / tests sans store. |
| `production` | AAB + iOS release, `autoIncrement`, Node 20. |

---

## Rappels store & conformité

- **Android :** politique de confidentialité, fiche Play, signatures (EAS gère la clé si vous le choisissez).
- **iOS :** descriptions d’usage (caméra, photos, micro, Face ID) déjà renseignées dans `app.json` (`infoPlist` + plugins) ; vérifier qu’elles correspondent à l’usage réel.
- **Notifications :** permission Android 13+ (`POST_NOTIFICATIONS`) est déclarée dans `app.json`.

---

## Dépannage rapide

- **`expo-doctor`** : corriger les avertissements dépendances / config avant un build critique.
- **Build qui « manque » de clés API :** revérifier les variables **EXPO_PUBLIC_*** sur le dashboard Expo pour l’environnement utilisé par le build.
- **Même code, comportement différent local / EAS :** les variables d’environnement du build cloud peuvent différer du `.env` local.

---

*Dernière mise à jour : alignée sur la configuration QuickBill (Expo SDK ~54, `eas.json` / `app.json` du dépôt).*
