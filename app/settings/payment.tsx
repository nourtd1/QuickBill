import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Plus,
    Lock,
    Wifi,
    Landmark,
    MoreVertical,
    ChevronRight,
    CheckCircle,
    RefreshCw,
    Receipt
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function PaymentMethodsScreen() {
    const router = useRouter();
    const [autoInvoicing, setAutoInvoicing] = useState(true);

    const SectionHeader = ({ title, extra }: { title: string, extra?: React.ReactNode }) => (
        <View className="flex-row items-center justify-between mt-6 mb-4 px-1">
            <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</Text>
            {extra}
        </View>
    );

    const PaymentServiceRow = ({ icon: Icon, iconBg, iconColor, name, status, details, connected = false }: any) => (
        <TouchableOpacity className="flex-row items-center justify-between py-4 bg-white px-5 border-b border-slate-50 last:border-0 active:bg-slate-50">
            <View className="flex-row items-center flex-1">
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${iconBg}`}>
                    {/* For mocked icons P and S, using Text for now or Lucide if match */}
                    {typeof Icon === 'string' ? (
                        <Text className={`text-xl font-bold ${iconColor}`}>{Icon}</Text>
                    ) : (
                        <Icon size={24} color={iconColor.replace('text-', '')} /> // Fallback if using Icon component
                    )}
                </View>
                <View>
                    <Text className="text-slate-900 font-bold text-base">{name}</Text>
                    <Text className="text-slate-400 text-xs font-medium mt-0.5">{details}</Text>
                </View>
            </View>
            <View className="flex-row items-center">
                {connected && <CheckCircle size={18} color="#22C55E" style={{ marginRight: 8 }} />}
                <ChevronRight size={20} color="#CBD5E1" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-[#F9FAFB]">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-2 mb-2">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900">Payment Methods</Text>
                    <TouchableOpacity className="w-10 h-10 bg-slate-100 items-center justify-center rounded-full">
                        <Plus size={20} color="#0F172A" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                    {/* SAVED CARDS */}
                    <SectionHeader
                        title="SAVED CARDS"
                        extra={
                            <View className="flex-row items-center">
                                <Lock size={12} color="#22C55E" style={{ marginRight: 4 }} />
                                <Text className="text-[#22C55E] text-[10px] font-bold uppercase">SECURE</Text>
                            </View>
                        }
                    />

                    {/* Credit Card */}
                    <LinearGradient
                        colors={['#4F46E5', '#7C3AED']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="rounded-[24px] p-6 mb-4 h-56 justify-between shadow-lg shadow-indigo-200"
                    >
                        <View className="flex-row justify-between items-start">
                            <View>
                                <Text className="text-white/70 text-[10px] font-bold tracking-widest uppercase mb-2">BUSINESS PLATINUM</Text>
                                <Wifi size={24} color="white" style={{ opacity: 0.8 }} />
                            </View>
                            <View className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                                <Text className="text-white font-bold text-xs italic">VISA</Text>
                            </View>
                        </View>

                        <View>
                            <Text className="text-white text-2xl font-mono tracking-widest mb-1">•••• •••• •••• 4242</Text>
                        </View>

                        <View className="flex-row justify-between items-end">
                            <View>
                                <Text className="text-white/60 text-[8px] font-bold uppercase mb-1">CARD HOLDER</Text>
                                <Text className="text-white font-bold text-sm tracking-wide">ALEX STERLING</Text>
                            </View>
                            <View>
                                <Text className="text-white/60 text-[8px] font-bold uppercase mb-1 text-right">EXPIRES</Text>
                                <Text className="text-white font-bold text-sm tracking-wide">09/28</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Bank Account */}
                    <View className="bg-white rounded-[20px] p-4 flex-row items-center shadow-sm border border-slate-50 mb-6">
                        <View className="w-12 h-12 bg-slate-50 rounded-full items-center justify-center mr-4">
                            <Landmark size={22} color="#475569" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-900 font-bold text-base">Chase Business Checking</Text>
                            <Text className="text-slate-500 text-sm font-medium mt-0.5">•••• 8839</Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="bg-green-100 px-2 py-1 rounded-md mr-3">
                                <Text className="text-green-700 text-[10px] font-bold uppercase">PRIMARY</Text>
                            </View>
                            <TouchableOpacity>
                                <MoreVertical size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* PAYMENT SERVICES */}
                    <SectionHeader title="PAYMENT SERVICES" />

                    <View className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-slate-50 mb-6">
                        <PaymentServiceRow
                            icon="S"
                            iconBg="bg-indigo-50"
                            iconColor="text-indigo-600"
                            name="Stripe"
                            details="Connected • id_...8s9d"
                            connected={true}
                        />
                        <PaymentServiceRow
                            icon="P"
                            iconBg="bg-blue-50"
                            iconColor="text-blue-500" // PayPal Blue
                            name="PayPal"
                            details="Not connected"
                            connected={false}
                        />
                    </View>

                    {/* SETTINGS (Using custom layout instead of SectionHeader component to match list perfectly) */}
                    <SectionHeader title="SETTINGS & PREFERENCES" />

                    <View className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-slate-50 mb-8">
                        <TouchableOpacity className="flex-row items-center justify-between p-5 border-b border-slate-50 active:bg-slate-50">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center mr-4">
                                    <RefreshCw size={20} color="#475569" />
                                </View>
                                <Text className="text-slate-900 font-bold text-base">Default Currency</Text>
                            </View>
                            <View className="flex-row items-center">
                                <Text className="text-slate-500 font-medium text-sm mr-2">USD ($)</Text>
                                <ChevronRight size={20} color="#CBD5E1" />
                            </View>
                        </TouchableOpacity>

                        <View className="flex-row items-center justify-between p-5">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center mr-4">
                                    <Receipt size={20} color="#475569" />
                                </View>
                                <Text className="text-slate-900 font-bold text-base">Auto-Invoicing</Text>
                            </View>
                            <Switch
                                value={autoInvoicing}
                                onValueChange={setAutoInvoicing}
                                trackColor={{ false: "#E2E8F0", true: "#2563EB" }}
                                thumbColor={"#FFFFFF"}
                                ios_backgroundColor="#E2E8F0"
                            />
                        </View>
                    </View>

                    {/* Add Button */}
                    <TouchableOpacity
                        className="w-full bg-blue-600 rounded-2xl py-4 flex-row items-center justify-center shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform mb-8"
                        onPress={() => Alert.alert("Add Payment Method", "Flow to add new card.")}
                    >
                        <Plus size={22} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold text-lg">Add New Payment Method</Text>
                    </TouchableOpacity>

                    {/* Footer */}
                    <View className="items-center mb-8">
                        <View className="flex-row items-center mb-2">
                            <Lock size={14} color="#94A3B8" style={{ marginRight: 6 }} />
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">END-TO-END ENCRYPTED</Text>
                        </View>
                        <Text className="text-slate-400 text-[10px] text-center px-4 leading-4">
                            Your payment information is stored securely. QuickBill complies with PCI DSS standards to ensure your financial data remains safe.
                        </Text>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
