import React, { useState } from 'react';
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
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building2, Check, Sparkles, ChevronRight, Briefcase } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const CURRENCIES = ['RWF', 'USD', 'EUR', 'FCFA', 'CAD'];

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
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />

            {/* Background Decorative Elements */}
            <View className="absolute top-0 left-0 right-0 h-[45%]">
                <LinearGradient
                    colors={['#DBEAFE', '#F8FAFC']}
                    className="flex-1"
                />
                <View className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400/10 rounded-full" />
                <View className="absolute top-40 -left-20 w-48 h-48 bg-indigo-400/10 rounded-full" />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingTop: 80, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    className="px-8"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Premium Area */}
                    <View className="items-start mb-10">
                        <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center shadow-2xl shadow-blue-500/20 border border-blue-50 mb-6">
                            <LinearGradient
                                colors={['#1E40AF', '#1e3a8a']}
                                className="w-12 h-12 rounded-xl items-center justify-center"
                            >
                                <Briefcase size={24} color="white" />
                            </LinearGradient>
                        </View>
                        <Text className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
                            Votre Business
                        </Text>
                        <Text className="text-slate-400 font-bold leading-6">
                            Personnalisons votre espace QuickBill pour que vos factures soient parfaites dès aujourd'hui.
                        </Text>
                    </View>

                    <View className="space-y-8 mt-2">
                        {/* Business Name Input */}
                        <View>
                            <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-2 ml-1">Nom Légal de l'entreprise</Text>
                            <View className="flex-row items-center bg-white border border-slate-100 rounded-[22px] px-5 h-16 shadow-sm shadow-slate-200/50">
                                <Building2 size={20} color="#94A3B8" strokeWidth={2.5} />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-slate-900 font-bold"
                                    placeholder="Ex: Quick Services Ltd"
                                    placeholderTextColor="#CBD5E1"
                                    value={businessName}
                                    onChangeText={setBusinessName}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        {/* Currency Selector */}
                        <View>
                            <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-2 ml-1">Devise Principale</Text>
                            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                                {CURRENCIES.map((curr) => {
                                    const isSelected = currency === curr;
                                    return (
                                        <TouchableOpacity
                                            key={curr}
                                            onPress={() => setCurrency(curr)}
                                            activeOpacity={0.7}
                                            style={{ marginBottom: 4 }}
                                        >
                                            {isSelected ? (
                                                <LinearGradient
                                                    colors={['#1E40AF', '#1e3a8a']}
                                                    className="px-6 py-4 rounded-[16px] shadow-sm shadow-blue-500/40"
                                                >
                                                    <Text className="font-black text-[12px] uppercase tracking-widest text-white">
                                                        {curr}
                                                    </Text>
                                                </LinearGradient>
                                            ) : (
                                                <View className="px-6 py-4 rounded-[16px] border-2 border-slate-100 bg-white shadow-sm shadow-slate-200/50">
                                                    <Text className="font-black text-[12px] uppercase tracking-widest text-slate-500">
                                                        {curr}
                                                    </Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleSetup}
                            disabled={loading || !businessName}
                            activeOpacity={0.9}
                            className={`mt-8 shadow-2xl \${!businessName ? 'opacity-50' : 'shadow-blue-500/40'}`}
                        >
                            <LinearGradient
                                colors={['#1E40AF', '#1e3a8a']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="h-16 rounded-[22px] flex-row items-center justify-center"
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Text className="text-white text-lg font-black uppercase tracking-widest mr-3">
                                            Accéder au Dashboard
                                        </Text>
                                        <ChevronRight size={20} color="white" strokeWidth={3} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
