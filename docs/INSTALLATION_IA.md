# 🚀 Installation Rapide : IA Gratuite dans QuickBill

> **Guide étape par étape pour intégrer l'OCR gratuit (Tesseract.js) dans votre application**

---

## ✅ Ce que vous avez maintenant

J'ai créé pour vous :
1. ✅ `lib/ocr.ts` - Fonctions OCR gratuites
2. ✅ `hooks/useOCR.ts` - Hook React pour utiliser l'OCR
3. ✅ `docs/GUIDE_IA_COUTS.md` - Guide complet des coûts IA

---

## 📦 Étape 1 : Installer Tesseract.js

```bash
npm install tesseract.js
```

**Coût : 0$** (100% gratuit)

---

## 🔧 Étape 2 : Utiliser l'OCR dans votre écran de dépenses

### **Exemple d'intégration dans `app/expenses/add.tsx`**

```typescript
import { useOCR } from '../../hooks/useOCR';
import { Sparkles } from 'lucide-react-native'; // Icône magie

// Dans votre composant :
const { scanReceipt, processing, extractedData, error } = useOCR();

// Quand l'utilisateur prend une photo :
const handleReceiptScanned = async (imageUri: string) => {
  try {
    const data = await scanReceipt(imageUri);
    
    // Pré-remplir le formulaire avec les données extraites
    if (data.amount) {
      setAmount(data.amount.toString());
    }
    if (data.date) {
      setDate(data.date);
    }
    if (data.merchant) {
      setDescription(data.merchant);
    }
    
    // Catégoriser automatiquement
    if (data.merchant) {
      const category = categorizeExpense(data.merchant);
      setCategory(category);
    }
    
    Alert.alert('Succès', 'Reçu scanné avec succès !');
  } catch (err) {
    Alert.alert('Erreur', 'Impossible de scanner le reçu');
  }
};

// Ajouter un bouton "Scanner Reçu" dans votre UI :
<TouchableOpacity
  onPress={async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      await handleReceiptScanned(result.assets[0].uri);
    }
  }}
  className="bg-blue-50 p-4 rounded-2xl flex-row items-center"
>
  <Sparkles size={20} color="#1E40AF" />
  <Text className="text-blue-700 font-bold ml-2">
    {processing ? 'Scan en cours...' : 'Scanner le Reçu (IA)'}
  </Text>
</TouchableOpacity>
```

---

## 🎯 Fonctionnalités Disponibles

### **1. Scan de Reçu**
```typescript
const data = await scanReceipt(imageUri);
// Retourne : { amount, date, merchant, items, tax, confidence }
```

### **2. Extraction de Texte**
```typescript
const text = await extractTextFromImage(imageUri);
// Retourne le texte brut de l'image
```

---

## ⚙️ Configuration Avancée

### **Changer la Langue**

Dans `lib/ocr.ts`, modifiez :
```typescript
worker = await createWorker('fra'); // Français
// Options : 'eng' (anglais), 'fra' (français), 'spa' (espagnol), etc.
```

### **Améliorer la Précision**

```typescript
// Dans lib/ocr.ts, ajustez les patterns regex selon vos besoins
const amountPatterns = [
  /total[:\s]+([\d\s,]+\.?\d*)\s*(RWF|USD|EUR)/i,
  // Ajoutez vos propres patterns ici
];
```

---

## 🐛 Résolution de Problèmes

### **Problème : "Module not found"**
```bash
npm install tesseract.js
npm start -- --reset-cache
```

### **Problème : OCR lent**
- Normal au premier scan (téléchargement du modèle)
- Les scans suivants sont plus rapides
- Le modèle est mis en cache localement

### **Problème : Précision faible**
- Assurez-vous que l'image est nette et bien éclairée
- Évitez les angles bizarres
- Utilisez une résolution minimale de 300x300px

---

## 📊 Performance

- **Premier scan** : 5-10 secondes (téléchargement modèle)
- **Scans suivants** : 2-5 secondes
- **Taille modèle** : ~50MB (téléchargé une seule fois)
- **Stockage** : Cache local automatique

---

## 🚀 Prochaines Étapes

### **Option 1 : Rester Gratuit**
- Continuer avec Tesseract.js
- Améliorer les patterns d'extraction
- Ajouter plus de langues

### **Option 2 : Améliorer (Quand vous avez des revenus)**
- Passer à Google Cloud Vision API
- 1000 requêtes/mois gratuites
- Meilleure précision (95%+)

Voir `docs/GUIDE_IA_COUTS.md` pour plus de détails.

---

## ✅ Checklist

- [ ] Installer tesseract.js : `npm install tesseract.js`
- [ ] Tester `lib/ocr.ts` avec une image de reçu
- [ ] Intégrer `useOCR` dans l'écran de dépenses
- [ ] Tester avec un vrai reçu
- [ ] Ajuster les patterns selon vos besoins

---

## 💡 Astuce

Pour tester rapidement :
```typescript
import { parseReceipt } from '../lib/ocr';

// Dans votre console ou un écran de test
const test = async () => {
  const data = await parseReceipt('chemin/vers/image.jpg');
  console.log('Données extraites:', data);
};
```

---

**Vous êtes maintenant prêt à utiliser l'IA gratuitement dans QuickBill ! 🎉**

*Pour toute question, consultez `docs/GUIDE_IA_COUTS.md`*

