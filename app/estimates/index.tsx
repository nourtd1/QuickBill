import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Dimensions
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
    ArrowLeft,
    Plus,
    Search,
    FileText,
    ChevronRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Filter,
    LayoutGrid,
    ArrowUpRight
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Estimate } from '../../types';

const SCREEN_WIDTH = Dimensions.get('window').width;

const STATUS_CONFIG = {
    DRAFT: { label: 'BROUILLON', color: 'bg-slate-50', border: 'border-slate-100', textColor: 'text-slate-600', icon: Clock, iconColor: '#64748B' },
    SENT: { label: 'ENVOYÉ', color: 'bg-blue-50', border: 'border-blue-100', textColor: 'text-blue-600', icon: Clock, iconColor: '#2563EB' },
    ACCEPTED: { label: 'ACCEPTÉ', color: 'bg-emerald-50', border: 'border-emerald-100', textColor: 'text-emerald-600', icon: CheckCircle2, iconColor: '#10B981' },
    REJECTED: { label: 'REFUSÉ', color: 'bg-red-50', border: 'border-red-100', textColor: 'text-red-600', icon: AlertCircle, iconColor: '#EF4444' },
    CONVERTED: { label: 'FACTURÉ', color: 'bg-purple-50', border: 'border-purple-100', textColor: 'text-purple-600', icon: Sparkles, iconColor: '#9333EA' },
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

    const stats = useMemo(() => {
        const totalAmount = estimates.reduce((acc, est) => acc + (est.total_amount || 0), 0);
        const pendingCount = estimates.filter(e => e.status === 'SENT' || e.status === 'DRAFT').length;
        const acceptedCount = estimates.filter(e => e.status === 'ACCEPTED' || e.status === 'CONVERTED').length;
        return { totalAmount, pendingCount, acceptedCount };
    }, [estimates]);

    const currency = profile?.currency || 'RWF';

    const ListHeader = () => (
        <View>
            <LinearGradient
                colors={['#1E40AF', '#1e3a8a']}
                className="pt-14 pb-10 px-6 rounded-b-[42px] shadow-2xl z-10"
            >
                <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => router.replace('/(tabs)')}
                            className="bg-white/10 w-10 h-10 items-center justify-center rounded-[14px] border border-white/20 mr-4"
                        >
                            <ArrowLeft size={20} color="white" strokeWidth={3} />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-3xl font-black text-white tracking-tight">Devis</Text>
                            <Text className="text-blue-200/60 text-[10px] font-bold uppercase tracking-[1.5px] mt-0.5">Offres Commerciales</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/estimates/new')}
                        className="bg-white/20 w-12 h-12 items-center justify-center rounded-[18px] border border-white/20 shadow-lg"
                    >
                        <Plus size={24} color="white" strokeWidth={3} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar Upgrade */}
                <View className="bg-white/10 p-1 rounded-[20px] flex-row items-center border border-white/20 backdrop-blur-md mb-6">
                    <View className="bg-white flex-1 flex-row items-center px-4 h-11 rounded-[16px] shadow-sm">
                        <Search size={18} color="#94A3B8" />
                        <TextInput
                            className="flex-1 ml-3 text-sm text-slate-800 font-bold"
                            placeholder="Rechercher un devis..."
                            value={search}
                            onChangeText={handleSearch}
                            placeholderTextColor="#CBD5E1"
                        />
                    </View>
                    <TouchableOpacity className="w-10 h-10 items-center justify-center">
                        <Filter size={18} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Mini Stats Grid */}
                <View className="flex-row gap-2">
                    <View className="flex-1 bg-white/10 rounded-xl p-2.5 border border-white/10">
                        <Text className="text-blue-100/60 text-[7px] font-black uppercase tracking-widest mb-0.5">Potentiel</Text>
                        <Text className="text-white font-black text-sm" numberOfLines={1}>{stats.totalAmount.toLocaleString()}</Text>
                    </View>
                    <View className="flex-1 bg-amber-400/10 rounded-xl p-2.5 border border-amber-400/20">
                        <Text className="text-amber-100/60 text-[7px] font-black uppercase tracking-widest mb-0.5">En cours</Text>
                        <Text className="text-white font-black text-sm">{stats.pendingCount}</Text>
                    </View>
                    <View className="flex-1 bg-emerald-400/10 rounded-xl p-2.5 border border-emerald-400/20">
                        <Text className="text-emerald-100/60 text-[7px] font-black uppercase tracking-widest mb-0.5">Gagnés</Text>
                        <Text className="text-white font-black text-sm">{stats.acceptedCount}</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Section Title Overlay */}
            <View className="px-6 mt-8 mb-6">
                <View className="flex-row justify-between items-end">
                    <View>
                        <Text className="text-slate-900 font-black text-2xl tracking-tight">Mes Devis</Text>
                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Historique des offres</Text>
                    </View>
                    <TouchableOpacity className="flex-row items-center bg-slate-100 px-4 py-2 rounded-full">
                        <LayoutGrid size={14} color="#64748B" className="mr-2" />
                        <Text className="text-slate-600 font-black text-xs uppercase">Vue Liste</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            {loading && estimates.length === 0 ? (
                <View className="flex-1 items-center justify-center bg-white">
                    <ActivityIndicator size="large" color="#1E40AF" />
                    <Text className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement des devis...</Text>
                </View>
            ) : filteredEstimates.length === 0 ? (
                <>
                    <ListHeader />
                    <View className="flex-1 items-center px-10 mt-10">
                        <View className="bg-white p-8 rounded-[40px] mb-6 shadow-sm border border-slate-100 items-center justify-center">
                            <View className="bg-orange-50 p-6 rounded-full mb-2">
                                <FileText size={48} color="#F59E0B" opacity={0.3} strokeWidth={1.5} />
                            </View>
                        </View>
                        <Text className="text-slate-900 font-black text-xl mb-3 text-center">
                            {search ? "Introuvable" : "Aucun devis"}
                        </Text>
                        <Text className="text-slate-500 text-center leading-relaxed text-base mb-8">
                            {search
                                ? "Aucun devis ne correspond à votre recherche."
                                : "Commencez à créer des devis professionnels pour vos clients."
                            }
                        </Text>
                        {!search && (
                            <TouchableOpacity
                                onPress={() => router.push('/estimates/new')}
                                className="bg-orange-500 px-8 py-4 rounded-2xl shadow-xl shadow-orange-200 flex-row items-center"
                            >
                                <Plus size={20} color="white" strokeWidth={3} className="mr-2" />
                                <Text className="text-white font-black uppercase tracking-wider">Nouveau Devis</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </>
            ) : (
                <FlatList
                    data={filteredEstimates}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={ListHeader}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#1E40AF"
                        />
                    }
                    renderItem={({ item }) => {
                        const config = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
                        const StatusIcon = config.icon;
                        const customerName = Array.isArray(item.customer) ? item.customer[0]?.name : item.customer?.name;

                        return (
                            <TouchableOpacity
                                onPress={() => router.push(`/estimates/${item.id}`)}
                                className="bg-white mx-6 mb-4 p-5 rounded-[32px] shadow-sm border border-slate-100 active:bg-slate-50"
                                activeOpacity={0.7}
                            >
                                <View className="flex-row justify-between items-start mb-4">
                                    <View className="flex-1 mr-4">
                                        <Text className="text-slate-900 font-black text-lg mb-1" numberOfLines={1}>
                                            {customerName || 'Client Inconnu'}
                                        </Text>
                                        <View className="flex-row items-center">
                                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mr-2">#{item.estimate_number}</Text>
                                            <View className="w-1 h-1 bg-slate-200 rounded-full mr-2" />
                                            <Text className="text-slate-400 text-[10px] font-bold">{new Date(item.created_at).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <View className={`px-3 py-1.5 rounded-xl flex-row items-center border ${config.color} ${config.border}`}>
                                        <StatusIcon size={12} color={config.iconColor} className="mr-1.5" />
                                        <Text className={`text-[9px] font-black tracking-widest ${config.textColor}`}>
                                            {config.label}
                                        </Text>
                                    </View>
                                </View>

                                <View className="h-[1px] bg-slate-50 mb-4" />

                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Text className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-0.5">Valeur estimée</Text>
                                        <Text className="text-slate-900 font-black text-xl">
                                            {item.total_amount.toLocaleString()} <Text className="text-xs text-slate-400 font-medium">{item.currency}</Text>
                                        </Text>
                                    </View>
                                    <View className="bg-slate-50 p-2.5 rounded-full border border-slate-100">
                                        <ArrowUpRight size={18} color="#94A3B8" strokeWidth={3} />
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
                activeOpacity={0.9}
                className="absolute bottom-10 right-8 w-20 h-20 items-center justify-center z-50 overflow-hidden rounded-[30px]"
            >
                <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    className="w-full h-full items-center justify-center shadow-2xl shadow-orange-500/40"
                >
                    <Plus size={32} color="white" strokeWidth={2.5} />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}
