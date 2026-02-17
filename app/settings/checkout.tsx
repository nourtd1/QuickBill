import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Image,
    ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    ArrowLeft,
    CreditCard,
    Smartphone,
    Plus,
    Lock,
    Check,
    Circle
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function CheckoutScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [selectedMethod, setSelectedMethod] = useState('card');
    const [processing, setProcessing] = useState(false);

    const planName = params.planName || 'QuickBill Premium';
    const planPrice = params.planPrice || '$24.99';
    const planPeriod = params.planPeriod || '3 Months';

    const handlePayment = () => {
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            router.push({
                pathname: '/settings/success',
                params: {
                    planName: planName === 'Yearly' ? 'Yearly Pro' : planName,
                    price: planPrice
                }
            });
        }, 2000);
    };

    const PaymentOption = ({ id, title, subtitle, icon, isSelected }: any) => (
        <TouchableOpacity
            onPress={() => setSelectedMethod(id)}
            activeOpacity={0.8}
            className={`flex-row items-center p-4 rounded-2xl mb-4 border-2 transition-all ${isSelected ? 'border-purple-500 bg-white' : 'border-transparent bg-white shadow-sm'
                }`}
        >
            <View className="w-12 h-8 rounded-md bg-slate-100 items-center justify-center mr-4 border border-slate-200">
                {icon}
            </View>
            <View className="flex-1">
                <Text className="text-slate-900 font-bold text-base">{title}</Text>
                {subtitle && <Text className="text-slate-400 text-xs font-medium">{subtitle}</Text>}
            </View>
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${isSelected ? 'border-purple-500' : 'border-slate-300'
                }`}>
                {isSelected && <View className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-[#F9FAFB]">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center px-4 py-3 mb-2">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100"
                    >
                        <ArrowLeft size={20} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="flex-1 text-center text-lg font-bold text-slate-900 mr-10">
                        Select Payment Method
                    </Text>
                </View>

                <ScrollView className="flex-1 px-6 pt-2" contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* Plan Summary Card */}
                    <View className="bg-white p-5 rounded-3xl shadow-sm border border-purple-100 mb-8 relative overflow-hidden">
                        <View className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-10 -mt-10 opacity-50" />

                        <View className="flex-row justify-between items-start mb-1">
                            <Text className="text-purple-500 text-xs font-bold uppercase tracking-wider">Subscription Plan</Text>
                            <Text className="text-purple-600 text-2xl font-black">{planPrice}</Text>
                        </View>

                        <Text className="text-slate-900 text-xl font-bold mb-3">{planName}</Text>

                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2">
                                <View className="bg-purple-100 px-3 py-1 rounded-[10px]">
                                    <Text className="text-purple-700 text-xs font-bold">{planPeriod}</Text>
                                </View>
                                <Text className="text-slate-400 text-xs font-medium">Renews at {planPrice}</Text>
                            </View>
                            <TouchableOpacity>
                                <Text className="text-slate-500 font-bold text-xs underline">Change</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 ml-1">
                        PAYMENT OPTIONS
                    </Text>

                    {/* Payment Methods */}
                    <PaymentOption
                        id="card"
                        title="Mastercard ending in 4242"
                        subtitle="Expires 12/26"
                        isSelected={selectedMethod === 'card'}
                        icon={
                            <View className="flex-row -space-x-2">
                                <View className="w-5 h-5 rounded-full bg-red-500 opacity-80" />
                                <View className="w-5 h-5 rounded-full bg-orange-400 opacity-80" />
                            </View>
                        }
                    />

                    <PaymentOption
                        id="momo"
                        title="Mobile Money"
                        subtitle="MTN, Orange, Wave"
                        isSelected={selectedMethod === 'momo'}
                        icon={
                            <View className="w-full h-full bg-yellow-400 items-center justify-center rounded-sm">
                                <Text className="text-[10px] font-black text-black">Mo</Text>
                            </View>
                        }
                    />

                    <PaymentOption
                        id="apple"
                        title="Apple Pay"
                        isSelected={selectedMethod === 'apple'}
                        icon={<View className="bg-black w-full h-full items-center justify-center rounded-sm"><Text className="text-white font-bold text-[10px]">Pays</Text></View>}
                    />

                    <PaymentOption
                        id="paypal"
                        title="PayPal"
                        isSelected={selectedMethod === 'paypal'}
                        icon={<View className="bg-[#003087] w-full h-full items-center justify-center rounded-sm"><Text className="text-white italic font-bold text-[10px]">Pay</Text></View>}
                    />

                    {/* Add New Card Button */}
                    <TouchableOpacity className="flex-row items-center justify-center p-4 rounded-3xl border-2 border-dashed border-purple-200 bg-purple-50/50 mb-8 active:bg-purple-100">
                        <Plus size={20} color="#9333EA" className="mr-2" />
                        <Text className="text-purple-600 font-bold">Add New Card</Text>
                    </TouchableOpacity>

                </ScrollView>

                {/* Footer Action */}
                <View className="absolute bottom-0 left-0 right-0 bg-white p-6 rounded-t-[32px] shadow-2xl shadow-black/10 border-t border-slate-50">
                    <TouchableOpacity
                        onPress={handlePayment}
                        disabled={processing}
                        className="w-full h-14 rounded-full shadow-lg shadow-purple-500/30 overflow-hidden mb-4"
                    >
                        <LinearGradient
                            colors={['#A855F7', '#7C3AED']} // Purple gradient from design
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="w-full h-full items-center justify-center flex-row"
                        >
                            {processing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Confirm & Pay {planPrice}</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View className="flex-row items-center justify-center opacity-60">
                        <Lock size={12} color="#64748B" className="mr-1.5" />
                        <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                            Secure SSL Encrypted Transaction
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}
