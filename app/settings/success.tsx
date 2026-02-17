import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    Image,
    Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, Check, Calendar, CreditCard, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Confetti from 'react-native-reanimated'; // Note: Confetti usually requires a specific library, we'll simulate the look or just use static design.

const { width } = Dimensions.get('window');

export default function SuccessScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const planName = params.planName || 'Monthly Pro';
    const renewalDate = new Date();
    renewalDate.setFullYear(renewalDate.getFullYear() + 1); // Mock 1 year or 1 month

    return (
        <View className="flex-1 bg-white items-center justify-center relative overflow-hidden">
            <StatusBar style="dark" />

            {/* Background Pattern */}
            <View className="absolute inset-0 opacity-5">
                <View className="absolute top-10 left-10 w-32 h-32 rounded-full bg-purple-500 blur-3xl" />
                <View className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-blue-500 blur-3xl" />
            </View>

            <SafeAreaView className="flex-1 w-full items-center justify-center p-6">

                {/* 3D Icon Representation */}
                <View className="w-40 h-40 mb-8 relative items-center justify-center">
                    <View className="absolute w-32 h-32 bg-purple-100 rounded-[32px] transform rotate-6 border-4 border-purple-200" />
                    <View className="absolute w-32 h-32 bg-purple-500 rounded-[32px] transform -rotate-3 shadow-2xl shadow-purple-500/50 items-center justify-center border-t-2 border-l-2 border-purple-400">
                        <LinearGradient
                            colors={['#A855F7', '#7C3AED']}
                            className="absolute inset-0 rounded-[32px]"
                        />
                        <Check size={64} color="white" strokeWidth={4} />
                    </View>
                    {/* Floating confetti dots */}
                    <View className="absolute -top-4 -right-4 w-3 h-3 bg-yellow-400 rounded-full" />
                    <View className="absolute top-10 -left-6 w-2 h-2 bg-blue-400 rounded-full" />
                    <View className="absolute -bottom-2 -left-2 w-2.5 h-2.5 bg-red-400 rounded-full" />
                </View>

                <Text className="text-3xl font-black text-slate-900 text-center leading-tight mb-2">
                    Welcome to <Text className="text-[#A855F7]">QuickBill Pro!</Text>
                </Text>

                <Text className="text-slate-500 text-center font-medium px-8 mb-10 leading-6">
                    Your subscription is now active. You have unlocked unlimited invoices and all premium features.
                </Text>

                {/* Transaction Receipt Card */}
                <View className="w-full bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50 mb-10">
                    <View className="flex-row justify-between mb-6 pb-6 border-b border-slate-50">
                        <View>
                            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transaction ID</Text>
                            <Text className="text-slate-900 font-bold">#TRX-89201</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Plan Activated</Text>
                            <Text className="text-slate-900 font-bold">{planName}</Text>
                        </View>
                    </View>
                    <View>
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Next Renewal</Text>
                        <Text className="text-slate-900 font-bold">October 24, 2025</Text>
                    </View>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                    onPress={() => router.push('/(tabs)')}
                    activeOpacity={0.8}
                    className="w-full h-14 rounded-full shadow-lg shadow-purple-500/30 overflow-hidden mb-6"
                >
                    <LinearGradient
                        colors={['#A855F7', '#7C3AED']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="w-full h-full items-center justify-center flex-row"
                    >
                        <Text className="text-white font-bold text-lg mr-2">Explore Pro Features</Text>
                        <ArrowRight size={20} color="white" />
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/(tabs)')}>
                    <Text className="text-slate-400 text-xs font-bold">Go to Dashboard</Text>
                </TouchableOpacity>

            </SafeAreaView>
        </View>
    );
}
