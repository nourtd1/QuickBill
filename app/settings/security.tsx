import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Lock, Trash2, LogOut, Mail, ShieldAlert } from 'lucide-react-native';
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
            "Cette action est irréversible. Toutes vos données (factures, clients, etc.) seront supprimées définitivement.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer définitivement",
                    style: "destructive",
                    onPress: async () => {
                        // Note: In a real app, this requires a secure Edge Function.
                        // For now, we'll just sign out contextually or show technical limitation.
                        Alert.alert("Attention", "Pour des raisons de sécurité, veuillez contacter le support pour supprimer définitivement votre compte : support@quickbill.com");
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
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <StatusBar style="dark" />

            {/* Creates a header similar to other pages */}
            <View className="px-6 py-4 bg-white border-b border-slate-100 flex-row items-center">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="p-2 -ml-2 bg-slate-50 rounded-full mr-4"
                >
                    <ArrowLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text className="text-xl font-black text-text-main">Sécurité</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-8">

                {/* Email Display */}
                <View className="bg-card p-6 rounded-2xl shadow-sm mb-6">
                    <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
                            <Mail size={20} color="#1E40AF" />
                        </View>
                        <View>
                            <Text className="text-text-muted text-xs font-bold uppercase tracking-wider">Email associé</Text>
                            <Text className="text-text-main font-bold text-base">{user?.email}</Text>
                        </View>
                    </View>
                    <View className="bg-blue-50 p-3 rounded-xl">
                        <Text className="text-blue-700 text-xs">
                            Cet email est utilisé pour votre connexion et pour recevoir vos notifications. Il ne peut pas être modifié.
                        </Text>
                    </View>
                </View>

                {/* Password Action */}
                <TouchableOpacity
                    onPress={handleChangePassword}
                    className="bg-card p-6 rounded-2xl shadow-sm mb-6 flex-row items-center"
                    disabled={loading}
                >
                    <View className="w-12 h-12 bg-orange-50 rounded-full items-center justify-center mr-4">
                        <Lock size={24} color="#F59E0B" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-text-main font-bold text-lg">Mot de passe</Text>
                        <Text className="text-text-muted text-sm">Modifier votre mot de passe</Text>
                    </View>
                    {loading && <ActivityIndicator size="small" color="#1E40AF" />}
                </TouchableOpacity>

                {/* Danger Zone */}
                <View className="mt-8">
                    <Text className="text-danger font-bold uppercase tracking-widest text-xs mb-4 ml-2">Zone Danger</Text>

                    <TouchableOpacity
                        onPress={handleDeleteAccount}
                        className="bg-red-50 p-6 rounded-2xl border border-red-100 flex-row items-center mb-4"
                    >
                        <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4">
                            <Trash2 size={24} color="#DC2626" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-red-900 font-bold text-lg">Supprimer le compte</Text>
                            <Text className="text-red-700/70 text-sm">Cette action est irréversible</Text>
                        </View>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            <View className="p-6 pb-8">
                <TouchableOpacity
                    onPress={handleSignOut}
                    className="w-full bg-slate-900 h-16 rounded-2xl flex-row items-center justify-center shadow-lg"
                >
                    <LogOut size={20} color="white" className="mr-2" />
                    <Text className="text-white font-bold text-lg">Se déconnecter</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
