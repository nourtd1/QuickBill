import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, CheckCircle2, FileText, Zap, Shield, Heart, Globe, Mail } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
    const router = useRouter();

    const features = [
        {
            icon: FileText,
            color: '#3B82F6',
            colorClass: 'bg-blue-50',
            title: "Facturation & Devis",
            desc: "Créez des factures et devis professionnels en quelques secondes. Personnalisez-les à votre image."
        },
        {
            icon: Zap,
            color: '#F59E0B',
            colorClass: 'bg-amber-50',
            title: "Scanner de Dépenses IA",
            desc: "Ne perdez plus vos reçus. Notre IA extrait automatiquement les détails pour votre comptabilité."
        },
        {
            icon: Shield,
            color: '#10B981',
            colorClass: 'bg-emerald-50',
            title: "Sécurité & Zéro Souci",
            desc: "Vos données sont chiffrées et sauvegardées dans le cloud. Vos informations sont en sécurité."
        },
        {
            icon: Globe,
            color: '#8B5CF6',
            colorClass: 'bg-purple-50',
            title: "Gestion Clients",
            desc: "Centralisez votre base de données clients. Suivez les historiques de paiement."
        }
    ];

    return (
        <View className="flex-1 bg-[#F9FAFB]">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center px-4 py-2 mb-2">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
                        <ArrowLeft size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900">À Propos</Text>
                </View>

                <ScrollView
                    className="flex-1 px-6"
                    contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
                    showsVerticalScrollIndicator={false}
                >

                    {/* Logo/Hero Section - Adjusted for Clean Light Theme */}
                    <View className="items-center mb-8 mt-4">
                        <View className="w-20 h-20 bg-white rounded-2xl items-center justify-center mb-4 shadow-sm border border-slate-100">
                            <Text className="text-4xl">🚀</Text>
                        </View>
                        <Text className="text-slate-900 text-3xl font-black tracking-tighter mb-1">QuickBill</Text>
                        <Text className="text-blue-600 font-bold text-sm mb-3 uppercase tracking-widest">L'allié des entrepreneurs</Text>
                        <View className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            <Text className="text-slate-600 text-[10px] font-black uppercase tracking-wider">Version 1.0.2</Text>
                        </View>
                    </View>

                    {/* Mission Wrapper */}
                    <View className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 mb-8">
                        <Text className="text-slate-900 font-black text-lg mb-3">Notre Mission 🎯</Text>
                        <Text className="text-slate-600 leading-6 font-medium text-sm">
                            QuickBill a été conçu pour simplifier radicalement la gestion financière des petites entreprises et indépendants.
                            {"\n\n"}
                            Notre but est de vous faire gagner du temps sur l'administratif pour que vous puissiez vous concentrer sur ce que vous faites de mieux : <Text className="text-blue-600 font-bold">votre métier.</Text>
                        </Text>
                    </View>

                    {/* Features Grid */}
                    <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-4 ml-2">Pourquoi QuickBill ?</Text>
                    <View className="space-y-4 mb-8">
                        {features.map((feat, idx) => (
                            <View key={idx} className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 flex-row items-center">
                                <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${feat.colorClass}`}>
                                    <feat.icon size={22} color={feat.color} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-900 font-bold text-base mb-1">{feat.title}</Text>
                                    <Text className="text-slate-500 text-xs leading-4 font-medium">{feat.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Contact / Links */}
                    <View className="mb-6">
                        <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-4 ml-2">Support & Contact</Text>
                        <TouchableOpacity
                            onPress={() => Linking.openURL('mailto:support@quickbill.com')}
                            className="bg-blue-600 p-5 rounded-[24px] flex-row items-center justify-center shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
                        >
                            <Mail size={20} color="white" className="mr-3" />
                            <Text className="text-white font-bold text-base uppercase tracking-wide">Contacter le Support</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="items-center py-6 opacity-60">
                        <Text className="text-slate-400 text-xs font-bold">Fait avec ❤️ par l'équipe QuickBill</Text>
                        <Text className="text-slate-300 text-[10px] mt-1 font-bold">© 2024 Tous droits réservés</Text>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
