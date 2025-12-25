import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from './env';

// Récupération des clés depuis les variables d'environnement Expo avec validation
// Assure-toi d'avoir créé le fichier .env avec EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY
let supabaseUrl: string;
let supabaseAnonKey: string;

try {
    supabaseUrl = getSupabaseUrl();
    supabaseAnonKey = getSupabaseAnonKey();
} catch (error: any) {
    console.error('❌ Erreur de configuration Supabase:', error.message);
    // Fallback values to prevent app crash, but app won't work properly
    supabaseUrl = '';
    supabaseAnonKey = '';
    console.warn('⚠️ L\'application ne fonctionnera pas correctement sans les variables d\'environnement.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Important pour React Native
    },
});
