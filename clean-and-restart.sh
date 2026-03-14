#!/bin/bash

echo "🧹 Nettoyage complet de QuickBill..."

# Supprimer les caches
echo "Suppression des caches..."
rm -rf .expo
rm -rf node_modules/.cache
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*

echo "✅ Caches supprimés"

# Redémarrer Expo avec cache clear
echo "🚀 Redémarrage d'Expo..."
npx expo start -c

echo "✅ Terminé !"
