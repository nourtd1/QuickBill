import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
    SafeAreaView,
    Alert,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    X,
    Check,
    Lock,
    Sparkles,
    Diamond
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const FEATURES = [
    'Unlimited Invoices',
    'AI Receipt Scanning',
    'Advanced Analytics',
    'Custom Branding'
];

const PLANS = [
    {
        id: 'monthly',
        name: 'Monthly',
        price: '$9.99',
        period: '/mo',
        description: 'Flexible billing',
        save: null
    },
    {
        id: 'quarterly',
        name: '3 Months',
        price: '$24.99',
        period: '',
        description: 'Best Value',
        save: 'POPULAR'
    },
    {
        id: 'yearly',
        name: 'Yearly',
        price: '$79.99',
        period: '/yr',
        description: 'Save 33%',
        save: 'BEST VALUE'
    }
];

export default function ProAccessScreen() {
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState('quarterly');

    const handlePurchase = () => {
        const plan = PLANS.find(p => p.id === selectedPlan);
        if (!plan) return;

        router.push({
            pathname: '/settings/checkout',
            params: {
                planName: 'QuickBill Premium',
                planPrice: plan.price,
                planPeriod: plan.name
            }
        });
    };

    return (
        <View className="flex-1 bg-[#F9FAFB]">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1">
                <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View className="items-center relative py-4 mb-2">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="absolute left-6 top-4 z-10 p-2 -ml-2"
                        >
                            <X size={24} color="#0F172A" />
                        </TouchableOpacity>
                        <Text className="text-[#A855F7] font-bold text-sm tracking-widest uppercase mt-2">
                            PRO ACCESS
                        </Text>
                    </View>

                    {/* Hero Section */}
                    <View className="items-center mb-8">
                        <View className="relative mb-6">
                            {/* Inner glow effect */}
                            <View className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 transform scale-150 rounded-full" />

                            <View className="w-32 h-32 rounded-full bg-black items-center justify-center shadow-2xl shadow-purple-500/50 border-4 border-purple-500/20 overflow-hidden relative">
                                <LinearGradient
                                    colors={['#3b0764', '#000000']}
                                    className="absolute inset-0"
                                />
                                <Diamond size={64} color="#A855F7" style={{ opacity: 0.9 }} />

                                {/* Glint overlay */}
                                <View className="absolute top-0 right-0 w-full h-full bg-white opacity-10 rotate-45 transform translate-x-10 -translate-y-10" />
                            </View>

                            {/* Sparkle Badge */}
                            <View className="absolute -top-1 -right-1 bg-[#FBBF24] rounded-full p-1.5 shadow-sm border-2 border-white">
                                <Sparkles size={14} color="white" fill="white" />
                            </View>
                        </View>

                        <Text className="text-3xl font-black text-slate-900 text-center mb-2 px-10">
                            You've reached your free limit
                        </Text>
                        <Text className="text-slate-500 text-center px-12 leading-5">
                            Upgrade to QuickBill Pro to create unlimited invoices and unlock premium features.
                        </Text>
                    </View>

                    {/* Usage Card */}
                    <View className="mx-6 bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-8">
                        <View className="flex-row justify-between items-center mb-3">
                            <View className="flex-row items-center">
                                <View className="w-5 h-5 rounded-full bg-red-100 items-center justify-center mr-2">
                                    <View className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                </View>
                                <Text className="font-bold text-slate-900">7 / 7 Invoices used</Text>
                            </View>
                            <View className="bg-purple-100 px-3 py-1 rounded-full">
                                <Text className="text-[#A855F7] text-[10px] font-bold uppercase">Limit Reached</Text>
                            </View>
                        </View>
                        <View className="h-3 bg-purple-100 rounded-full overflow-hidden">
                            <LinearGradient
                                colors={['#A855F7', '#C084FC']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="h-full w-full"
                            />
                        </View>
                    </View>

                    {/* Features List */}
                    <View className="mx-6 mb-10 space-y-4">
                        {FEATURES.map((feature, index) => (
                            <View key={index} className="flex-row items-center">
                                <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-3">
                                    <Check size={14} color="#10B981" strokeWidth={3} />
                                </View>
                                <Text className="text-slate-700 font-semibold text-base">{feature}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Pricing Plans */}
                    <View className="mx-6 mb-8">
                        {PLANS.map((plan) => {
                            const isSelected = selectedPlan === plan.id;
                            return (
                                <TouchableOpacity
                                    key={plan.id}
                                    activeOpacity={0.9}
                                    onPress={() => setSelectedPlan(plan.id)}
                                    className={`relative mb-4 bg-white rounded-3xl p-1 overflow-hidden transition-all ${isSelected
                                        ? 'border-2 border-[#A855F7] shadow-xl shadow-purple-200'
                                        : 'border border-slate-100'
                                        }`}
                                >
                                    {/* Best Value Badge */}
                                    {plan.save && (
                                        <View className="absolute top-0 right-0 z-10">
                                            <View className="bg-[#A855F7] px-4 py-1.5 rounded-bl-2xl">
                                                <Text className="text-white text-[10px] font-black uppercase tracking-wide">
                                                    {plan.save}
                                                </Text>
                                            </View>
                                        </View>
                                    )}

                                    <View className={`rounded-[20px] p-5 flex-row items-center justify-between ${isSelected ? 'bg-purple-50/50' : 'bg-white'}`}>
                                        <View className="flex-row items-center">
                                            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-4 ${isSelected ? 'border-[#A855F7]' : 'border-slate-300'}`}>
                                                {isSelected && <View className="w-3 h-3 rounded-full bg-[#A855F7]" />}
                                            </View>
                                            <View>
                                                <Text className="text-slate-900 font-bold text-lg">{plan.name}</Text>
                                                <Text className="text-slate-400 text-xs">{plan.description}</Text>
                                            </View>
                                        </View>
                                        <View className="items-end pt-1">
                                            <Text className="text-slate-900 font-bold text-xl">{plan.price}</Text>
                                            {plan.period ? (
                                                <Text className="text-slate-400 text-[10px]">{plan.period}</Text>
                                            ) : null}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Unlock Button */}
                    <View className="mx-6 mb-6">
                        <TouchableOpacity
                            onPress={handlePurchase}
                            activeOpacity={0.8}
                            className="w-full h-14 rounded-full shadow-lg shadow-purple-500/30 overflow-hidden"
                        >
                            <LinearGradient
                                colors={['#A855F7', '#7C3AED']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="w-full h-full items-center justify-center flex-row"
                            >
                                <Lock size={20} color="white" className="mr-2" />
                                <Text className="text-white font-bold text-lg">Unlock Pro Now</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Footer Links */}
                    <View className="flex-row justify-center items-center space-x-4 mb-4">
                        <TouchableOpacity><Text className="text-slate-400 text-[10px] font-bold">Terms of Service</Text></TouchableOpacity>
                        <TouchableOpacity><Text className="text-[#A855F7] text-[10px] font-bold">Restore Purchase</Text></TouchableOpacity>
                        <TouchableOpacity><Text className="text-slate-400 text-[10px] font-bold">Privacy Policy</Text></TouchableOpacity>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
