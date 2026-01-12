import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Plus, Search, FileText, ChevronRight, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Estimate } from '../../types';

const STATUS_CONFIG = {
    DRAFT: { label: 'BROUILLON', color: 'bg-slate-100/50', textColor: 'text-slate-600', icon: Clock, iconColor: '#64748B' },
    SENT: { label: 'ENVOYÉ', color: 'bg-blue-50', textColor: 'text-blue-600', icon: Clock, iconColor: '#2563EB' },
    ACCEPTED: { label: 'ACCEPTÉ', color: 'bg-emerald-50', textColor: 'text-emerald-600', icon: CheckCircle2, iconColor: '#10B981' },
    REJECTED: { label: 'REFUSÉ', color: 'bg-red-50', textColor: 'text-red-600', icon: AlertCircle, iconColor: '#EF4444' },
    CONVERTED: { label: 'FACTURÉ', color: 'bg-purple-50', textColor: 'text-purple-600', icon: Sparkles, iconColor: '#9333EA' },
};

export default function EstimatesList() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [filteredEstimates, setFilteredEstimates] = useState<Estimate[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

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
            setRefreshing(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchEstimates();
        }, [fetchEstimates])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchEstimates();
    };

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

    const ListHeader = () => (
        <View className="bg-primary pt-14 pb-12 px-6 rounded-b-[40px] shadow-lg mb-6">
            <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.replace('/(tabs)')}
                        className="bg-white/10 p-2.5 rounded-xl border border-white/10 mr-4"
                    >
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-blue-200 font-medium text-base mb-1">Espace Commercial</Text>
                        <Text className="text-white text-3xl font-black tracking-tight">Mes Devis</Text>
                    </View>
                </View>
                <View className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                    <Text className="text-white font-bold">{estimates.length}</Text>
                </View>
            </View>

            {/* Search Bar Floating Overlay */}
            <View className="bg-white p-2 rounded-2xl flex-row items-center shadow-xl h-14 border border-blue-50/50">
                <View className="w-10 h-10 items-center justify-center rounded-xl bg-slate-50 ml-1">
                    <Search size={20} color="#64748B" />
                </View>
                <TextInput
                    className="flex-1 ml-3 text-slate-900 font-medium text-base h-full"
                    placeholder="Chercher par client ou numéro..."
                    placeholderTextColor="#94A3B8"
                    value={search}
                    onChangeText={handleSearch}
                    selectionColor="#1E40AF"
                />
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#1E40AF" />
                </View>
            ) : filteredEstimates.length === 0 ? (
                <>
                    <ListHeader />
                    <View className="flex-1 items-center px-10 mt-10">
                        <View className="bg-white p-8 rounded-[32px] mb-6 shadow-sm border border-slate-100 items-center justify-center">
                            <View className="bg-orange-50 p-4 rounded-full mb-2">
                                <FileText size={48} color="#F59E0B" />
                            </View>
                        </View>
                        <Text className="text-slate-900 font-black text-xl mb-3 text-center">
                            {search ? "Aucun devis trouvé" : "Aucun devis créé"}
                        </Text>
                        <Text className="text-slate-500 text-center leading-relaxed text-base">
                            {search
                                ? "Essayez une autre recherche ou vérifiez l'orthographe."
                                : "Commencez à créer des devis professionnels pour vos clients dès maintenant."
                            }
                        </Text>
                    </View>
                </>
            ) : (
                <FlatList
                    data={filteredEstimates}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={ListHeader}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#1E40AF"
                            colors={["#1E40AF"]}
                        />
                    }
                    renderItem={({ item }) => {
                        const config = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
                        const StatusIcon = config.icon;
                        const customerName = Array.isArray(item.customer) ? item.customer[0]?.name : item.customer?.name;

                        return (
                            <TouchableOpacity
                                onPress={() => router.push(`/estimates/${item.id}`)}
                                className="bg-white mx-5 mb-4 p-5 rounded-2xl shadow-sm border border-slate-100 flex-col"
                                activeOpacity={0.7}
                            >
                                <View className="flex-row justify-between items-start mb-4">
                                    <View className="flex-1 mr-4">
                                        <Text className="text-slate-900 font-bold text-lg mb-1" numberOfLines={1}>
                                            {customerName || 'Client Inconnu'}
                                        </Text>
                                        <View className="flex-row items-center">
                                            <Text className="text-slate-400 text-xs font-semibold bg-slate-50 px-2 py-1 rounded-md overflow-hidden">
                                                #{item.estimate_number}
                                            </Text>
                                            <Text className="text-slate-400 text-xs ml-2">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className={`px-3 py-1.5 rounded-full flex-row items-center ${config.color}`}>
                                        <StatusIcon size={12} color={config.iconColor} className="mr-1.5" />
                                        <Text className={`text-[10px] font-black tracking-wide ${config.textColor}`}>
                                            {config.label}
                                        </Text>
                                    </View>
                                </View>

                                <View className="h-[1px] bg-slate-50 mb-3" />

                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-0.5 tracking-wider">Montant Total</Text>
                                        <Text className="text-slate-900 font-black text-xl">
                                            {item.total_amount.toLocaleString()} <Text className="text-sm text-slate-500 font-medium">{item.currency}</Text>
                                        </Text>
                                    </View>
                                    <View className="bg-slate-50 p-2.5 rounded-full border border-slate-100">
                                        <ChevronRight size={18} color="#94A3B8" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={() => router.push('/estimates/new')}
                className="absolute bottom-8 right-6 bg-slate-900 w-16 h-16 rounded-full items-center justify-center shadow-2xl shadow-slate-400 z-50"
                activeOpacity={0.9}
            >
                <Plus size={28} color="white" />
            </TouchableOpacity>
        </View>
    );
}
