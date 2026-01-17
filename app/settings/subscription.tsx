import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    ArrowLeft,
    Check,
    Diamond,
    Zap,
    ShieldCheck,
    Crown,
    Target,
    Users,
    Cloud,
    MessageSquare,
    CheckCircle2,
    Star,
    Sparkles,
    Shield
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const PLANS = [
    {
        id: 'free',
        name: 'Gratuit',
        price: '0',
        period: 'à vie',
        description: 'Pour débuter votre activité sereinement.',
        features: [
            '5 Factures / mois',
            'Gestion de 10 clients',
            'Scanner IA limité (3/mois)',
            'Support par email standard'
        ],
        highlight: false,
        buttonText: 'Plan Actuel',
        icon: Target,
        color: '#64748B'
    },
    {
        id: 'monthly',
        name: '1 Mois Pro',
        price: '5.000',
        period: 'par mois',
        description: 'Idéal pour les petits business et indépendants.',
        features: [
            'Factures & Devis Illimités',
            'Scanner IA Illimité',
            'Relances WhatsApp Auto',
            'QR Code de Paiement Pro'
        ],
        highlight: false,
        buttonText: 'Choisir 1 mois',
        icon: Zap,
        color: '#3B82F6'
    },
    {
        id: 'quarterly',
        name: '3 Mois Pro',
        price: '12.000',
        period: 'soit 4.000/m',
        description: 'L\'offre la plus équilibrée pour évoluer.',
        features: [
            'Toutes les fonctions Pro',
            'Gestion d\'Équipe (3 pers.)',
            'Support Prioritaire',
            'Économisez 20% ✨'
        ],
        highlight: true,
        buttonText: 'Choisir 3 mois',
        badge: 'POPULAIRE',
        icon: Star,
        color: '#8B5CF6'
    },
    {
        id: 'yearly',
        name: 'Annuel Pro',
        price: '40.000',
        period: 'soit 3.300/m',
        description: 'Le meilleur investissement pour l\'année.',
        features: [
            'Toutes les fonctions Pro',
            'Équipe Illimitée',
            'Accès anticipé nouveautés',
            'Économisez 35% 🔥'
        ],
        highlight: false,
        buttonText: 'Choisir Annuel',
        badge: 'OFFRE LIMITÉE',
        icon: Crown,
        color: '#F59E0B'
    }
];

export default function SubscriptionScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState('quarterly');

    const handleUpgrade = (planId: string) => {
        if (planId === 'free') return;

        setLoading(planId);
        // Simulate payment process
        setTimeout(() => {
            setLoading(null);
            Alert.alert(
                "Mode Démo",
                "Le système de paiement (Orange Money, Wave, Stripe) sera activé sur la version finale. 🚀",
                [{ text: "Compris", onPress: () => router.back() }]
            );
        }, 1500);
    };

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            <LinearGradient
                colors={['#1E40AF', '#1e3a8a']}
                className="pt-14 pb-12 px-6 rounded-b-[42px] shadow-2xl z-10"
            >
                <View className="flex-row justify-between items-center mb-8">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white/10 rounded-[14px] items-center justify-center border border-white/20"
                    >
                        <ArrowLeft size={20} color="white" strokeWidth={3} />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-xl font-black text-white tracking-tight">Nos Tarifs</Text>
                        <Text className="text-blue-200/60 text-[9px] font-black uppercase tracking-[2px] mt-0.5">Accessibles à tous</Text>
                    </View>
                    <View className="w-10 h-10 bg-white/10 rounded-[14px] items-center justify-center border border-white/20">
                        <Sparkles size={18} color="#F59E0B" strokeWidth={2.5} />
                    </View>
                </View>

                <View className="items-center">
                    <Text className="text-white font-black text-2xl text-center leading-tight">
                        Des prix justes pour{"\n"}votre business.
                    </Text>
                    <Text className="text-blue-200/60 text-center font-bold text-sm mt-3 px-10">
                        Le meilleur rapport qualité-prix du marché pour entrepreneurs.
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
            >
                {PLANS.map((plan) => (
                    <TouchableOpacity
                        key={plan.id}
                        activeOpacity={0.9}
                        onPress={() => setSelectedPlan(plan.id)}
                        className={`bg-white rounded-[40px] p-6 mb-6 border-2 ${selectedPlan === plan.id ? 'border-blue-600' : 'border-slate-100'
                            } shadow-xl shadow-slate-200/50 overflow-hidden relative`}
                    >
                        {plan.badge && (
                            <View className="absolute top-0 right-0 bg-blue-600 px-4 py-1.5 rounded-bl-[20px]">
                                <Text className="text-white font-black text-[8px] uppercase tracking-widest">{plan.badge}</Text>
                            </View>
                        )}

                        <View className="flex-row justify-between items-start mb-4">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-slate-50" style={{ backgroundColor: plan.color + '15' }}>
                                    <plan.icon size={20} color={plan.color} strokeWidth={2.5} />
                                </View>
                                <View>
                                    <Text className="text-slate-900 font-black text-lg tracking-tight">{plan.name}</Text>
                                    <Text className="text-slate-400 font-black text-[8px] uppercase tracking-wider">{plan.id === 'free' ? 'Indépendants' : 'Croissance'}</Text>
                                </View>
                            </View>
                            <View className="items-end">
                                <Text className="text-slate-900 font-black text-2xl tracking-tighter">{plan.price}</Text>
                                <Text className="text-slate-400 font-bold text-[9px] uppercase">{plan.period}</Text>
                            </View>
                        </View>

                        <Text className="text-slate-500 font-bold text-xs mb-6 leading-5">
                            {plan.description}
                        </Text>

                        <View className="space-y-3 mb-8">
                            {plan.features.map((feature, i) => (
                                <View key={i} className="flex-row items-center">
                                    <View className={`w-4 h-4 rounded-full items-center justify-center mr-3 ${selectedPlan === plan.id ? 'bg-blue-100' : 'bg-slate-100'}`}>
                                        <Check size={10} color={selectedPlan === plan.id ? '#2563EB' : '#94A3B8'} strokeWidth={4} />
                                    </View>
                                    <Text className="text-slate-700 font-bold text-[11px]">{feature}</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={() => handleUpgrade(plan.id)}
                            disabled={!!loading || plan.id === 'free'}
                            activeOpacity={0.8}
                            className={`w-full h-14 rounded-[20px] items-center justify-center flex-row ${plan.id === 'free'
                                    ? 'bg-slate-50 border border-slate-100'
                                    : selectedPlan === plan.id
                                        ? 'bg-slate-900 shadow-lg shadow-slate-300'
                                        : 'bg-white border border-slate-200'
                                }`}
                        >
                            {loading === plan.id ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text className={`font-black text-xs uppercase tracking-widest ${plan.id === 'free'
                                            ? 'text-slate-300'
                                            : selectedPlan === plan.id ? 'text-white' : 'text-slate-900'
                                        }`}>
                                        {plan.buttonText}
                                    </Text>
                                    {plan.id !== 'free' && selectedPlan === plan.id && <Zap size={14} color="white" strokeWidth={3} className="ml-2" />}
                                </>
                            )}
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}

                {/* Secure Payment Info */}
                <View className="flex-row items-center justify-center opacity-40 mt-6">
                    <ShieldCheck size={14} color="#64748B" />
                    <Text className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2 text-center">
                        Paiements sécurisés par Orange Money, Wave & Cartes
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
