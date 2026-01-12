import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    Platform,
    Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Lock, Trash2, LogOut, Mail, Shield, CheckCircle2, AlertTriangle, Key, ScanFace, Smartphone, MapPin } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function SecuritySettingsScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);

    // Toggles
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [biometricsEnabled, setBiometricsEnabled] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);

    useEffect(() => {
        checkBiometrics();
        loadSettings();
    }, []);

    const checkBiometrics = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricSupported(compatible && enrolled);
    };

    const loadSettings = async () => {
        try {
            // Load Biometrics (Local)
            const bio = await AsyncStorage.getItem('biometrics_enabled');
            setBiometricsEnabled(bio === 'true');

            // Load 2FA (Remote)
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('two_factor_enabled')
                    .eq('id', user.id)
                    .single();
                if (data) setTwoFactorEnabled(data.two_factor_enabled || false);
            }
        } catch (e) {
            console.log("Error loading settings", e);
        }
    };

    const toggleBiometrics = async (value: boolean) => {
        if (!isBiometricSupported) {
            Alert.alert("Non supporté", "Votre appareil ne supporte pas la biométrie ou elle n'est pas configurée.");
            return;
        }

        try {
            // Verify identity before changing setting
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: value ? "Activer la biométrie" : "Désactiver la biométrie",
                fallbackLabel: "Utiliser le code PIN"
            });

            if (result.success) {
                setBiometricsEnabled(value);
                await AsyncStorage.setItem('biometrics_enabled', String(value));
                Alert.alert("Succès", value ? "Biométrie activée." : "Biométrie désactivée.");
            } else {
                Alert.alert("Échec", "Authentification échouée.");
            }
        } catch (error) {
            Alert.alert("Erreur", "Une erreur est survenue.");
        }
    };

    const toggleTwoFactor = async (value: boolean) => {
        if (!user) return;

        // Optimistic update
        setTwoFactorEnabled(value);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ two_factor_enabled: value })
                .eq('id', user.id);

            if (error) throw error;

            // If enabling, show info
            if (value) {
                Alert.alert("2FA Activé", "La double authentification est maintenant active. Vous recevrez des codes de validation.");
            }
        } catch (error) {
            setTwoFactorEnabled(!value); // Revert
            Alert.alert("Erreur", "Impossible de mettre à jour le paramètre.");
        }
    };

    const handleChangePassword = async () => {
        if (!user?.email) return;

        Alert.alert(
            "Réinitialisation",
            `Un email de réinitialisation sera envoyé à ${user.email}. Continuer ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Envoyer",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const { error } = await supabase.auth.resetPasswordForEmail(user.email!);
                            if (error) throw error;
                            Alert.alert("Email envoyé", "Vérifiez votre boîte de réception pour réinitialiser le mot de passe.");
                        } catch (error: any) {
                            Alert.alert("Erreur", error.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Supprimer mon compte",
            "Cette action est irréversible. Contactez le support pour finaliser.",
            [{ text: "OK", style: "cancel" }]
        );
    };

    const handleSignOut = () => {
        Alert.alert(
            "Déconnexion",
            "Voulez-vous vraiment vous déconnecter ?",
            [
                { text: "Annuler", style: "cancel" },
                { text: "Se déconnecter", style: "destructive", onPress: signOut }
            ]
        );
    };

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            {/* Header Modern Banker */}
            <View className="bg-primary pt-16 pb-8 px-6 rounded-b-[40px] shadow-lg z-10">
                <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()} className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-black tracking-tight">Sécurité & Compte</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View className="flex-row items-center justify-center bg-blue-800/30 p-2 rounded-full self-center px-4 border border-blue-400/20">
                    <Shield size={14} color="#93C5FD" className="mr-2" />
                    <Text className="text-blue-100 font-medium text-xs">Protection active</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-5 pt-8" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* Email Section */}
                <Text className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-3 ml-2">Identifiant</Text>
                <View className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 mb-8">
                    <View className="flex-row items-center">
                        <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mr-4 border border-blue-100">
                            <Mail size={22} color="#1E40AF" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-400 text-xs font-bold uppercase mb-0.5">Email associé</Text>
                            <Text className="text-slate-900 font-bold text-base">{user?.email}</Text>
                        </View>
                        <CheckCircle2 size={20} color="#10B981" />
                    </View>
                </View>

                {/* Security Actions */}
                <Text className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-3 ml-2">Authentification</Text>
                <TouchableOpacity
                    onPress={handleChangePassword}
                    disabled={loading}
                    className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 mb-6 flex-row items-center active:bg-slate-50"
                >
                    <View className="w-12 h-12 bg-orange-50 rounded-2xl items-center justify-center mr-4 border border-orange-100">
                        <Key size={22} color="#EA580C" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-slate-900 font-bold text-lg mb-0.5">Mot de passe</Text>
                        <Text className="text-slate-400 text-sm font-medium">Réinitialiser votre mot de passe</Text>
                    </View>
                    {loading ? <ActivityIndicator size="small" color="#1E40AF" /> : <View className="bg-slate-50 p-2 rounded-full"><ArrowLeft size={16} color="#CBD5E1" className="rotate-180" /></View>}
                </TouchableOpacity>

                {/* Advanced Security */}
                <Text className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-3 ml-2">Sécurité Avancée</Text>
                <View className="bg-white rounded-[24px] shadow-sm border border-slate-100 mb-8 overflow-hidden">
                    <View className="p-5 flex-row items-center justify-between border-b border-slate-50">
                        <View className="flex-row items-center flex-1 mr-4">
                            <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3">
                                <Shield size={20} color="#4F46E5" />
                            </View>
                            <View>
                                <Text className="text-slate-900 font-bold text-base">Double Authentification</Text>
                                <Text className="text-slate-400 text-xs font-medium">Validation par SMS/Email (2FA)</Text>
                            </View>
                        </View>
                        <Switch
                            value={twoFactorEnabled}
                            onValueChange={toggleTwoFactor}
                            trackColor={{ false: "#E2E8F0", true: "#4F46E5" }}
                            thumbColor={"#fff"}
                            ios_backgroundColor="#E2E8F0"
                        />
                    </View>
                    <View className="p-5 flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1 mr-4">
                            <View className="w-10 h-10 bg-purple-50 rounded-xl items-center justify-center mr-3">
                                <ScanFace size={20} color="#9333EA" />
                            </View>
                            <View>
                                <Text className="text-slate-900 font-bold text-base">Biométrie</Text>
                                <Text className="text-slate-400 text-xs font-medium">FaceID / TouchID</Text>
                            </View>
                        </View>
                        <Switch
                            value={biometricsEnabled}
                            onValueChange={toggleBiometrics}
                            trackColor={{ false: "#E2E8F0", true: "#9333EA" }}
                            thumbColor={"#fff"}
                            ios_backgroundColor="#E2E8F0"
                            disabled={!isBiometricSupported}
                        />
                    </View>
                </View>

                {/* Recent Activity */}
                <Text className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-3 ml-2">Dernières Activités</Text>
                <View className="bg-white rounded-[24px] shadow-sm border border-slate-100 mb-8 p-2">
                    {[
                        { device: 'iPhone 15 Pro', loc: 'Dakar, Sénégal', time: 'À l\'instant', active: true },
                        { device: 'Chrome / Windows', loc: 'Abidjan, Côte d\'Ivoire', time: 'Il y a 2h', active: false },
                    ].map((session, idx) => (
                        <View key={idx} className={`flex-row items-center p-4 ${idx !== 1 ? 'border-b border-slate-50' : ''}`}>
                            <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-3">
                                <Smartphone size={20} color="#64748B" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 font-bold text-sm">{session.device}</Text>
                                <View className="flex-row items-center">
                                    <MapPin size={10} color="#94A3B8" className="mr-1" />
                                    <Text className="text-slate-400 text-xs">{session.loc}</Text>
                                </View>
                            </View>
                            <View className="items-end">
                                <View className={`px-2 py-0.5 rounded-full ${session.active ? 'bg-emerald-50' : 'bg-slate-100'} mb-1`}>
                                    <Text className={`text-[10px] font-bold ${session.active ? 'text-emerald-600' : 'text-slate-500'}`}>
                                        {session.active ? 'ACTIF' : 'DÉCONNECTÉ'}
                                    </Text>
                                </View>
                                <Text className="text-slate-400 text-[10px] font-medium">{session.time}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Danger Zone */}
                <View className="mt-2">
                    <View className="flex-row items-center mb-3 ml-2">
                        <AlertTriangle size={14} color="#EF4444" className="mr-2" />
                        <Text className="text-red-500 font-bold uppercase text-xs tracking-widest">Zone de Danger</Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleDeleteAccount}
                        className="bg-red-50 p-5 rounded-[24px] border border-red-100 flex-row items-center mb-6 active:scale-[0.98] transition-all"
                    >
                        <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mr-4 shadow-sm">
                            <Trash2 size={22} color="#DC2626" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-red-900 font-bold text-lg">Supprimer le compte</Text>
                            <Text className="text-red-700/60 text-sm font-medium">Cette action est irréversible</Text>
                        </View>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Logout Button */}
            <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 rounded-t-[32px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <TouchableOpacity
                    onPress={handleSignOut}
                    className="w-full h-16 bg-slate-900 rounded-2xl flex-row items-center justify-center shadow-lg shadow-slate-300"
                >
                    <LogOut size={20} color="white" className="mr-2" />
                    <Text className="text-white font-black text-lg uppercase tracking-wide">Se déconnecter</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
