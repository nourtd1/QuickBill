import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building2, Check } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const CURRENCIES = ['RWF', 'USD', 'EUR', 'FCFA'];

export default function SetupScreen() {
    const router = useRouter();
    const { user, loading: authLoading, refreshProfile } = useAuth();
    const [businessName, setBusinessName] = useState('');
    const [currency, setCurrency] = useState('RWF');
    const [loading, setLoading] = useState(false);

    // Redirection is now handled by the root _layout.tsx

    const handleSetup = async () => {
        if (!businessName.trim()) {
            Alert.alert('Erreur', 'Le nom du business est requis.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user?.id,
                    business_name: businessName,
                    currency: currency,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            // Rafraîchir le profil dans le contexte pour que le garde du _layout voie les changements
            await refreshProfile();

            // La redirection sera soit gérée par le garde, soit on peut la forcer ici
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Impossible de sauvegarder votre profil.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return null;

    return (
        <SafeAreaView className="flex-1 bg-background" style={{ backgroundColor: '#EFF6FF' }} edges={['top', 'bottom']}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                className="px-8 py-12"
            >
                <View className="mb-12">
                    <Text className="text-4xl font-bold text-slate-900 mb-4">
                        Parlons de votre business
                    </Text>
                    <Text className="text-lg text-slate-500">
                        Quelques détails pour personnaliser vos factures.
                    </Text>
                </View>

                <View className="space-y-8">
                    {/* Business Name */}
                    <View>
                        <Text className="text-slate-700 font-semibold mb-3 ml-1">Nom du Business</Text>
                        <View className="flex-row items-center border-2 border-slate-100 bg-white rounded-2xl px-4 h-16">
                            <Building2 size={20} color="#94A3B8" />
                            <TextInput
                                className="flex-1 ml-3 text-lg text-slate-900"
                                placeholder="Ex: Quick Services Ltd"
                                placeholderTextColor="#94A3B8"
                                value={businessName}
                                onChangeText={setBusinessName}
                            />
                        </View>
                    </View>

                    {/* Currency Selector */}
                    <View>
                        <Text className="text-slate-700 font-semibold mb-3 ml-1">Devise</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {CURRENCIES.map((curr) => (
                                <TouchableOpacity
                                    key={curr}
                                    onPress={() => setCurrency(curr)}
                                    className={`px-6 py-3 rounded-xl border-2 ${currency === curr
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-slate-100 bg-white'
                                        }`}
                                >
                                    <Text className={`font-bold ${currency === curr ? 'text-blue-600' : 'text-slate-500'
                                        }`}>
                                        {curr}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleSetup}
                        disabled={loading}
                        className={`bg-blue-600 h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200 mt-10 ${loading ? 'opacity-70' : ''
                            }`}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text className="text-white text-xl font-bold mr-2">
                                    Terminer et Accéder au Dashboard
                                </Text>
                                <Check size={20} color="white" strokeWidth={3} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
