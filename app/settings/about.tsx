import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, CheckCircle2, FileText, Zap, Shield, Heart, Globe, Mail } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AboutScreen() {
    const router = useRouter();

    const features = [
        {
            icon: FileText,
            color: '#3B82F6',
            title: "Facturation & Devis",
            desc: "Créez des factures et devis professionnels en quelques secondes. Personnalisez-les à votre image et impressionnez vos clients."
        },
        {
            icon: Zap,
            color: '#F59E0B',
            title: "Scanner de Dépenses IA",
            desc: "Ne perdez plus vos reçus. Prenez une photo, notre IA extrait automatiquement les détails (montant, date, marchand) pour votre comptabilité."
        },
        {
            icon: Shield,
            color: '#10B981',
            title: "Sécurité & Zéro Souci",
            desc: "Vos données sont chiffrées et sauvegardées dans le cloud. Perdez votre téléphone, pas votre business."
        },
        {
            icon: Globe,
            color: '#8B5CF6',
            title: "Gestion Clients",
            desc: "Centralisez votre base de données clients. Suivez les historiques de paiement et relancez facilement les impayés."
        }
    ];

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            {/* Header Modern */}
            <LinearGradient
                colors={['#1E40AF', '#1e3a8a']}
                className="pt-12 pb-6 px-6 rounded-b-[32px] shadow-lg mb-6"
            >
                <View className="flex-row items-center mb-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-white/10 p-2 rounded-xl border border-white/10 mr-4"
                    >
                        <ArrowLeft size={20} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-black tracking-tight">À Propos</Text>
                </View>

                <View className="items-center">
                    <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center mb-3 shadow-xl">
                        <Text className="text-2xl">🚀</Text>
                        {/* Remplacez par le logo Image si disponible */}
                    </View>
                    <Text className="text-white text-2xl font-black tracking-tighter mb-0.5">QuickBill</Text>
                    <Text className="text-blue-200 font-medium text-xs mb-3">L'allié des entrepreneurs modernes</Text>
                    <View className="bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                        <Text className="text-white/80 text-[10px] font-bold">Version 1.0.2</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* Mission Wrapper */}
                <View className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-8">
                    <Text className="text-slate-900 font-black text-xl mb-3">Notre Mission 🎯</Text>
                    <Text className="text-slate-600 leading-6 font-medium">
                        QuickBill a été conçu pour simplifier radicalement la gestion financière des petites entreprises et indépendants.
                        {"\n\n"}
                        Notre but est de vous faire gagner du temps sur l'administratif pour que vous puissiez vous concentrer sur ce que vous faites de mieux : <Text className="text-blue-600 font-bold">votre métier.</Text>
                    </Text>
                </View>

                {/* Features Grid */}
                <Text className="text-slate-900 font-bold text-lg mb-4 ml-2">Pourquoi QuickBill ?</Text>
                <View className="space-y-4">
                    {features.map((feat, idx) => (
                        <View key={idx} className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex-row">
                            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 bg-opacity-10`} style={{ backgroundColor: feat.color + '20' }}>
                                <feat.icon size={24} color={feat.color} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 font-bold text-base mb-1">{feat.title}</Text>
                                <Text className="text-slate-500 text-xs leading-5">{feat.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Contact / Links */}
                <View className="mt-8 mb-6">
                    <Text className="text-slate-900 font-bold text-lg mb-4 ml-2">Nous Contacter</Text>
                    <TouchableOpacity
                        onPress={() => Linking.openURL('mailto:support@quickbill.com')}
                        className="bg-blue-700 p-5 rounded-[24px] flex-row items-center justify-center shadow-lg shadow-blue-300"
                    >
                        <Mail size={20} color="white" className="mr-3" />
                        <Text className="text-white font-bold text-base">Contacter le Support</Text>
                    </TouchableOpacity>
                </View>

                <View className="items-center py-6">
                    <Text className="text-slate-400 text-xs font-semibold">Fait avec ❤️ par l'équipe QuickBill</Text>
                    <Text className="text-slate-300 text-[10px] mt-1">© 2024 Tous droits réservés</Text>
                </View>

            </ScrollView>
        </View>
    );
}
