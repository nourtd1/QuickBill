import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    ChevronLeft,
    MoreHorizontal,
    Share,
    Bell,
    FileEdit,
    Receipt,
    CreditCard
} from 'lucide-react-native';

const PRIMARY_COLOR = '#1337ec';

export default function InvoicePreviewScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-[#f6f6f8]">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="flex-row justify-between items-center px-4 py-4 bg-[#f6f6f8] z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-200"
                >
                    <ChevronLeft size={24} color="#1e293b" />
                </TouchableOpacity>

                <View className="items-center">
                    <Text className="text-base font-bold text-slate-900 uppercase tracking-wide">Invoice Preview</Text>
                    <Text className="text-xs text-slate-500 font-medium tracking-wider">INV-2023-001</Text>
                </View>

                <TouchableOpacity
                    className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-200"
                >
                    <MoreHorizontal size={24} color="#1e293b" />
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <ScrollView
                className="flex-1 px-4"
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Paper Invoice Card */}
                <View className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden mt-2 mb-6 border border-slate-100">

                    {/* Invoice Header Section */}
                    <View className="p-6 border-b border-slate-50 flex-row justify-between items-start">
                        <View>
                            <View className="bg-amber-100 self-start px-2 py-1 rounded-full mb-3">
                                <Text className="text-amber-700 text-[10px] font-bold uppercase">Pending Payment</Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <View className="w-8 h-8 bg-blue-600 rounded-lg items-center justify-center">
                                    <Receipt size={16} color="white" />
                                </View>
                                <Text className="text-xl font-bold text-slate-900">QuickBill</Text>
                            </View>
                        </View>
                        <View className="items-end">
                            <Text className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Amount Due</Text>
                            <Text className="text-2xl font-black text-slate-900 mb-1">$1,350.00</Text>
                            <Text className="text-xs font-bold text-primary">Due Oct 15, 2023</Text>
                        </View>
                    </View>

                    {/* From / To Section */}
                    <View className="p-6 flex-row gap-8">
                        <View className="flex-1">
                            <Text className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">From</Text>
                            <Text className="font-bold text-slate-900 text-sm mb-0.5">QuickBill Services Inc.</Text>
                            <Text className="text-slate-500 text-xs">123 Design Street</Text>
                            <Text className="text-slate-500 text-xs">San Francisco, CA 94103</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Bill To</Text>
                            <Text className="font-bold text-slate-900 text-sm mb-0.5">Design Studio Co.</Text>
                            <Text className="text-slate-500 text-xs">456 Creative Ave</Text>
                            <Text className="text-slate-500 text-xs">Brooklyn, NY 11201</Text>
                        </View>
                    </View>

                    {/* Items List */}
                    <View className="px-6 py-2">
                        {/* Item 1 */}
                        <View className="py-4 border-b border-slate-50 flex-row justify-between items-start">
                            <View className="flex-1 mr-4">
                                <Text className="font-bold text-slate-900 text-sm mb-1">Brand Identity Design</Text>
                                <Text className="text-xs text-slate-400">Logo, color palette & typography</Text>
                            </View>
                            <View className="items-end">
                                <Text className="font-bold text-slate-900 text-sm">$1,200.00</Text>
                                <Text className="text-[10px] text-slate-400 mt-0.5">Qty: 1</Text>
                            </View>
                        </View>

                        {/* Item 2 (Added for more content) */}
                        <View className="py-4 border-b border-slate-50 flex-row justify-between items-start">
                            <View className="flex-1 mr-4">
                                <Text className="font-bold text-slate-900 text-sm mb-1">UI/UX Consulting</Text>
                                <Text className="text-xs text-slate-400">Hourly consulting session</Text>
                            </View>
                            <View className="items-end">
                                <Text className="font-bold text-slate-900 text-sm">$50.00</Text>
                                <Text className="text-[10px] text-slate-400 mt-0.5">Qty: 3</Text>
                            </View>
                        </View>
                    </View>

                    {/* Totals Section */}
                    <View className="p-6 bg-slate-50/50 space-y-3">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-slate-500 text-xs font-medium">Subtotal</Text>
                            <Text className="text-slate-900 font-bold text-sm">$1,350.00</Text>
                        </View>
                        <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-slate-100">
                            <Text className="text-slate-500 text-xs font-medium">Tax (0%)</Text>
                            <Text className="text-slate-900 font-bold text-sm">$0.00</Text>
                        </View>

                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-slate-900 font-black text-lg">Total Amount</Text>
                            <Text className="text-primary font-black text-2xl">$1,350.00</Text>
                        </View>

                        <TouchableOpacity className="w-full bg-primary py-4 rounded-xl shadow-lg shadow-blue-500/30 flex-row items-center justify-center active:bg-blue-800">
                            <CreditCard size={20} color="white" className="mr-2" />
                            <Text className="text-white font-bold text-base">Pay Now</Text>
                        </TouchableOpacity>

                        <Text className="text-center text-[10px] text-slate-400 mt-4 font-medium">
                            Secured by QuickBill Pay. Terms apply.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action Sheet */}
            <View className="absolute bottom-0 w-full bg-white rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-12">
                <View className="w-12 h-1 bg-slate-200 rounded-full self-center mb-8" />
                <View className="flex-row justify-around items-center px-2">
                    {/* Share Action */}
                    <TouchableOpacity className="items-center gap-2 active:opacity-70">
                        <View className="w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center mb-1">
                            <Share size={24} color={PRIMARY_COLOR} />
                        </View>
                        <Text className="text-xs font-bold text-slate-600">Share PDF</Text>
                    </TouchableOpacity>

                    {/* Remind Action */}
                    <TouchableOpacity className="items-center gap-2 active:opacity-70">
                        <View className="w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center mb-1">
                            <Bell size={24} color={PRIMARY_COLOR} />
                        </View>
                        <Text className="text-xs font-bold text-slate-600">Remind</Text>
                    </TouchableOpacity>

                    {/* Edit Action */}
                    <TouchableOpacity className="items-center gap-2 active:opacity-70">
                        <View className="w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center mb-1">
                            <FileEdit size={24} color={PRIMARY_COLOR} />
                        </View>
                        <Text className="text-xs font-bold text-slate-600">Edit</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
