import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Search, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useOffline } from '../../context/OfflineContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/currencyEngine';
import { supabase } from '../../lib/supabase';

export default function InvoicesScreen() {
    const router = useRouter();
    const { getInvoices, isOffline } = useOffline();
    const { profile } = useAuth();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);
            if (!isOffline && profile?.id) {
                const { data, error } = await supabase
                    .from('invoices')
                    .select('*, customer:clients(*)')
                    .eq('user_id', profile.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (data) setInvoices(data);
            } else {
                const data = await getInvoices(profile?.id || '');
                setInvoices(data);
            }
        } catch (error) {
            console.error('Failed to fetch invoices', error);
            const localData = await getInvoices(profile?.id || '');
            if (localData.length > 0) setInvoices(localData);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getInvoices, profile?.id, isOffline]);

    useFocusEffect(
        useCallback(() => {
            fetchInvoices();
        }, [fetchInvoices])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchInvoices();
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-100 text-emerald-700';
            case 'sent': return 'bg-blue-100 text-blue-700';
            case 'overdue': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid': return <CheckCircle2 size={16} color="#059669" />;
            case 'sent': return <Clock size={16} color="#2563EB" />;
            case 'overdue': return <AlertCircle size={16} color="#DC2626" />;
            default: return <FileText size={16} color="#475569" />;
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => router.push(`/invoice/${item.id}`)}
            className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-slate-100 flex-row items-center"
        >
            <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 bg-slate-50`}>
                <FileText size={20} color="#64748B" />
            </View>
            <View className="flex-1">
                <View className="flex-row justify-between mb-1">
                    <Text className="font-bold text-slate-900 text-base">{item.customer?.name || 'Client Inconnu'}</Text>
                    <Text className="font-bold text-slate-900 text-base">{formatCurrency(item.total_amount, item.currency || 'USD')}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                    <Text className="text-slate-400 text-xs">#{item.invoice_number} • {new Date(item.created_at).toLocaleDateString()}</Text>
                    <View className={`flex-row items-center px-2 py-1 rounded-full ${getStatusColor(item.status).split(' ')[0]}`}>
                        {getStatusIcon(item.status)}
                        <Text className={`text-xs font-bold ml-1.5 capitalize ${getStatusColor(item.status).split(' ')[1]}`}>
                            {item.status}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            <LinearGradient
                colors={['#1E40AF', '#1e3a8a']}
                className="pt-16 pb-8 px-6 rounded-b-[32px] shadow-lg z-10"
            >
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-3xl font-black text-white">Factures</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/invoice/new')}
                        className="w-10 h-10 bg-white/20 rounded-full items-center justify-center border border-white/20"
                    >
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <View className="bg-white p-3 rounded-2xl flex-row items-center shadow-sm">
                    <Search size={20} color="#94A3B8" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-slate-800 font-medium"
                        placeholder="Rechercher une facture..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#94A3B8"
                    />
                </View>
            </LinearGradient>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#1E40AF" />
                </View>
            ) : (
                <FlatList
                    data={filteredInvoices}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E40AF" />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <FileText size={48} color="#CBD5E1" />
                            <Text className="text-slate-400 mt-4 text-center font-medium">Aucune facture trouvée</Text>
                            <TouchableOpacity onPress={() => router.push('/invoice/new')} className="mt-4">
                                <Text className="text-primary font-bold">Créer une facture</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
}
