import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Plus, Search, FileText, ChevronRight, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Estimate } from '../../types';

const STATUS_CONFIG = {
    DRAFT: { label: 'BROUILLON', color: 'bg-slate-100 text-slate-700', icon: Clock },
    SENT: { label: 'ENVOYÉ', color: 'bg-blue-100 text-blue-700', icon: Clock },
    ACCEPTED: { label: 'ACCEPTÉ', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    REJECTED: { label: 'REFUSÉ', color: 'bg-red-100 text-red-700', icon: AlertCircle },
    CONVERTED: { label: 'CONVERTI', color: 'bg-orange-100 text-orange-700', icon: Sparkles },
};

export default function EstimatesList() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [filteredEstimates, setFilteredEstimates] = useState<Estimate[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchEstimates = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('estimates')
                .select(`
                    *,
                    customer:clients (name)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEstimates(data || []);
            setFilteredEstimates(data || []);
        } catch (error) {
            console.error('Error fetching estimates:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchEstimates();
        }, [fetchEstimates])
    );

    const handleSearch = (text: string) => {
        setSearch(text);
        if (text.trim() === '') {
            setFilteredEstimates(estimates);
        } else {
            const filtered = estimates.filter(est => {
                const customerName = Array.isArray(est.customer) ? est.customer[0]?.name : est.customer?.name;
                return (
                    customerName?.toLowerCase().includes(text.toLowerCase()) ||
                    est.estimate_number.toLowerCase().includes(text.toLowerCase())
                );
            });
            setFilteredEstimates(filtered);
        }
    };

    const currency = profile?.currency || 'RWF';

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <StatusBar style="dark" />

            {/* Header */}
            <View className="px-6 py-4 bg-white border-b border-slate-100 flex-row items-center">
                <TouchableOpacity onPress={() => router.replace('/(tabs)')} className="p-2 -ml-2 bg-slate-50 rounded-full mr-4">
                    <ArrowLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text className="text-xl font-black text-slate-900">Mes Devis</Text>
            </View>

            {/* Search Bar */}
            <View className="px-6 py-4">
                <View className="flex-row items-center bg-white border border-slate-100 rounded-2xl px-4 h-14 shadow-sm">
                    <Search size={20} color="#94A3B8" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-slate-900 font-medium"
                        placeholder="Rechercher un devis ou client..."
                        value={search}
                        onChangeText={handleSearch}
                    />
                </View>
            </View>

            {loading && estimates.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#F59E0B" />
                </View>
            ) : (
                <FlatList
                    data={filteredEstimates}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchEstimates} tintColor="#F59E0B" />
                    }
                    ListEmptyComponent={() => (
                        <View className="items-center justify-center mt-10 p-10 bg-white rounded-[40px] border border-dashed border-slate-200">
                            <FileText size={48} color="#CBD5E1" strokeWidth={1} />
                            <Text className="text-slate-400 font-bold mt-4 text-center">Aucun devis</Text>
                            <Text className="text-slate-300 text-sm text-center mt-2 px-6">Créez votre premier devis pour commencer à vendre.</Text>
                        </View>
                    )}
                    renderItem={({ item }) => {
                        const config = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
                        const StatusIcon = config.icon;
                        const customerName = Array.isArray(item.customer) ? item.customer[0]?.name : item.customer?.name;

                        return (
                            <TouchableOpacity
                                onPress={() => router.push(`/estimates/${item.id}`)}
                                className="bg-white p-5 rounded-[30px] mb-4 shadow-sm border border-slate-50 transition-all active:scale-[0.98]"
                            >
                                <View className="flex-row justify-between items-start mb-4">
                                    <View className="flex-1">
                                        <Text className="text-slate-900 font-bold text-base" numberOfLines={1}>{customerName || 'Client Inconnu'}</Text>
                                        <Text className="text-slate-400 text-xs mt-0.5">{item.estimate_number}</Text>
                                    </View>
                                    <View className={`px-2.5 py-1 rounded-full flex-row items-center ${config.color.split(' ')[0]}`}>
                                        <StatusIcon size={12} color={config.color.includes('slate') ? '#64748B' : config.color.includes('blue') ? '#2563EB' : config.color.includes('emerald') ? '#10B981' : config.color.includes('orange') ? '#F59E0B' : '#EF4444'} className="mr-1.5" />
                                        <Text className={`text-[10px] font-black tracking-wider ${config.color.split(' ')[1]}`}>
                                            {config.label}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row justify-between items-end border-t border-slate-50 pt-3">
                                    <View>
                                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-0.5">Montant Total</Text>
                                        <Text className="text-slate-900 font-black text-lg">
                                            {item.total_amount.toLocaleString()} {item.currency}
                                        </Text>
                                    </View>
                                    <View className="bg-orange-50 p-2 rounded-xl">
                                        <ChevronRight size={18} color="#F59E0B" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}

            {/* FAB */}
            <TouchableOpacity
                onPress={() => router.push('/estimates/new')}
                className="absolute bottom-10 right-8 w-16 h-16 bg-orange-500 rounded-full items-center justify-center shadow-xl shadow-orange-200"
                style={{ elevation: 8 }}
            >
                <Plus size={32} color="white" strokeWidth={3} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
