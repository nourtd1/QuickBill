import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Lock, Trash2, LogOut, Mail, Shield, CheckCircle2, AlertTriangle, Key } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function SecuritySettingsScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);

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
                            Alert.alert("Email envoyé", "Vérifiez votre boîte de réception/spam pour réinitialiser votre mot de passe.");
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
            "Cette action est irréversible. Toutes vos données seront perdues.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        Alert.alert("Contactez le support", "Pour des raisons de sécurité, veuillez écrire à support@quickbill.com pour la suppression définitive.");
                    }
                }
            ]
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
                    className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 mb-8 flex-row items-center active:bg-slate-50"
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

                {/* Danger Zone */}
                <View className="mt-4">
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
