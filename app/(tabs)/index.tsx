import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, TrendingUp, AlertCircle, FileText } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useDashboard } from '../../hooks/useDashboard';
import { useProfile } from '../../hooks/useProfile';

export default function Dashboard() {
    const router = useRouter();
    const { invoices, monthlyRevenue, pendingAmount, loading, refresh } = useDashboard();
    const { profile } = useProfile(); // For proper currency display

    // Initial load
    useEffect(() => {
        refresh();
    }, []);

    const currency = profile?.currency || 'RWF';

    const getStatusColor = (status: string) => {
        return status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const isPaid = status === 'PAID';
        return (
            <View className={`px-2 py-1 rounded-full ${isPaid ? 'bg-green-100' : 'bg-red-100'}`}>
                <Text className={`text-xs font-bold ${isPaid ? 'text-green-700' : 'text-red-700'}`}>
                    {isPaid ? 'PAYÉ' : 'IMPAYÉ'}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />

            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={refresh} />
                }
            >
                {/* Header Section */}
                <View className="p-6 pb-0">
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <Text className="text-gray-500 text-sm font-medium">Bon retour,</Text>
                            <Text className="text-2xl font-bold text-gray-900">{profile?.business_name || 'Entrepreneur'}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => router.push('/settings')}
                            className="h-10 w-10 bg-gray-200 rounded-full items-center justify-center"
                        >
                            {/* Fallback avatar */}
                            <Text className="text-lg font-bold text-gray-500">{(profile?.business_name || 'E').charAt(0)}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Key Metrics Cards */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
                        {/* Monthly Revenue Card */}
                        <View className="bg-primary p-5 rounded-2xl w-64 mr-4 shadow-lg shadow-blue-200">
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="bg-white/20 p-2 rounded-lg">
                                    <TrendingUp color="white" size={20} />
                                </View>
                                <Text className="text-white/80 text-xs font-medium bg-white/10 px-2 py-1 rounded-full">Ce mois</Text>
                            </View>
                            <Text className="text-white/70 text-sm font-medium">Chiffre d'Affaires</Text>
                            <Text className="text-white text-3xl font-bold mt-1">
                                {monthlyRevenue.toLocaleString()} <Text className="text-lg font-normal">{currency}</Text>
                            </Text>
                        </View>

                        {/* Pending Amount Card */}
                        <View className="bg-white p-5 rounded-2xl w-64 mr-4 border border-gray-100 shadow-sm">
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="bg-orange-100 p-2 rounded-lg">
                                    <AlertCircle color="#F97316" size={20} />
                                </View>
                                <Text className="text-gray-400 text-xs font-medium">À recouvrir</Text>
                            </View>
                            <Text className="text-gray-500 text-sm font-medium">En attente</Text>
                            <Text className="text-gray-900 text-3xl font-bold mt-1">
                                {pendingAmount.toLocaleString()} <Text className="text-lg font-normal text-gray-400">{currency}</Text>
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Recent Operations Title */}
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-gray-900">Factures Récentes</Text>
                        <TouchableOpacity onPress={() => { }}>
                            <Text className="text-primary text-sm font-medium">Voir tout</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Invoice List */}
                <View className="px-6">
                    {loading && invoices.length === 0 ? (
                        <ActivityIndicator size="large" color="#007AFF" className="mt-8" />
                    ) : invoices.length === 0 ? (
                        <View className="items-center justify-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                            <FileText size={40} color="#D1D5DB" className="mb-3" />
                            <Text className="text-gray-400 font-medium">Aucune facture pour le moment</Text>
                        </View>
                    ) : (
                        invoices.map((inv) => (
                            <TouchableOpacity
                                key={inv.id}
                                onPress={() => {
                                    router.push(`/invoice/${inv.id}`);
                                }}
                                className="bg-white p-4 rounded-xl mb-3 flex-row items-center justify-between shadow-sm border border-gray-50"
                            >
                                <View className="flex-row items-center flex-1">
                                    <View className="h-10 w-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                                        <Text className="font-bold text-gray-500">
                                            {(inv.customer?.name || '?').charAt(0)}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text className="font-bold text-gray-900 text-base">{inv.customer?.name || 'Inconnu'}</Text>
                                        <Text className="text-xs text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</Text>
                                    </View>
                                </View>

                                <View className="items-end">
                                    <Text className="font-bold text-gray-900 text-base mb-1">
                                        {inv.total_amount.toLocaleString()} {currency}
                                    </Text>
                                    <StatusBadge status={inv.status} />
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Floating Action Button (FAB) */}
            <TouchableOpacity
                onPress={() => router.push('/invoice/new')}
                className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-blue-300 elevation-5"
            >
                <Plus color="white" size={28} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
