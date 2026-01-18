import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
    Plus,
    Search,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    Filter,
    ArrowUpRight,
    MessageSquare,
    Calendar,
    ArrowRight
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useOffline } from '../../context/OfflineContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/currencyEngine';
import { supabase } from '../../lib/supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;

type InvoiceStatus = 'paid' | 'sent' | 'overdue' | 'draft' | 'pending_approval' | 'rejected';

import { useTeamRole } from '../../hooks/useTeamRole';

export default function InvoicesScreen() {
    const router = useRouter();
    const { getInvoices, isOffline } = useOffline();
    const { profile } = useAuth();
    const { role, isOwner, isAdmin } = useTeamRole();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<InvoiceStatus | 'all'>('all');

    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);
            if (!isOffline && profile?.id) {
                const { data: allInvoices, error: allErr } = await supabase
                    .from('invoices')
                    .select('*, customer:clients(*)')
                    .eq('user_id', profile.id)
                    .order('created_at', { ascending: false });

                if (allErr) throw allErr;

                // Fetch unread counts
                const { data: unreadCounts, error: unreadErr } = await supabase
                    .from('invoice_messages')
                    .select('invoice_id')
                    .eq('sender_type', 'client')
                    .is('read_at', null);

                const unreadMap = (unreadCounts || []).reduce((acc: any, curr: any) => {
                    acc[curr.invoice_id] = (acc[curr.invoice_id] || 0) + 1;
                    return acc;
                }, {});

                const enrichedInvoices = (allInvoices || []).map(inv => ({
                    ...inv,
                    unread_count: unreadMap[inv.id] || 0
                }));

                setInvoices(enrichedInvoices);
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

    const stats = useMemo(() => {
        const total = invoices.reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
        const paidCount = invoices.filter(inv => inv.status === 'paid' || inv.status === 'PAID').length;
        const pendingApprovalCount = invoices.filter(inv => inv.status === 'PENDING_APPROVAL').length;
        const pendingCount = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'PAID').length;
        return { total, paidCount, pendingCount, pendingApprovalCount };
    }, [invoices]);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const matchesSearch = inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (inv.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

            if (activeFilter === 'all') return matchesSearch;

            const status = inv.status.toUpperCase();

            if (activeFilter === 'pending_approval') return matchesSearch && status === 'PENDING_APPROVAL';
            if (activeFilter === 'rejected') return matchesSearch && status === 'REJECTED';

            return matchesSearch && status === activeFilter.toUpperCase();
        });
    }, [invoices, searchQuery, activeFilter]);

    const getStatusStyle = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PAID': return { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 size={12} color="#059669" /> };
            case 'SENT': return { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', icon: <Clock size={12} color="#2563EB" /> };
            case 'OVERDUE': return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', icon: <AlertCircle size={12} color="#DC2626" /> };
            case 'PENDING_APPROVAL': return { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', icon: <AlertCircle size={12} color="#D97706" /> };
            case 'REJECTED': return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', icon: <AlertCircle size={12} color="#DC2626" /> };
            default: return { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-600', icon: <FileText size={12} color="#475569" /> };
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const statusStyle = getStatusStyle(item.status);
        const customerName = item.customer?.name || 'Client Inconnu';
        const date = new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

        return (
            <TouchableOpacity
                onPress={() => router.push(`/invoice/${item.id}`)}
                className="bg-white p-5 rounded-[32px] mb-4 shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
            >
                <View className="flex-row items-center mb-4">
                    <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 border ${item.status === 'paid' || item.status === 'PAID' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                        <Text className={`font-black text-lg ${item.status === 'paid' || item.status === 'PAID' ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {customerName.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-slate-900 font-black text-lg mb-0.5" numberOfLines={1}>{customerName}</Text>
                        <View className="flex-row items-center">
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mr-2">#{item.invoice_number}</Text>
                            <View className="w-1 h-1 bg-slate-300 rounded-full mr-2" />
                            <Text className="text-slate-400 text-[10px] font-bold uppercase">{date}</Text>
                        </View>
                    </View>
                    <View className="items-end">
                        <Text className="text-slate-900 font-black text-lg">{formatCurrency(item.total_amount, item.currency || profile?.currency || 'USD')}</Text>
                        <View className={`mt-1 flex-row items-center px-2 py-0.5 rounded-md border ${statusStyle.bg} ${statusStyle.border}`}>
                            {statusStyle.icon}
                            <Text className={`text-[9px] font-black ml-1 uppercase ${statusStyle.text}`}>
                                {item.status === 'PENDING_APPROVAL' ? 'Validation' : item.status}
                            </Text>
                        </View>
                    </View>
                </View>

                {(item.unread_count > 0) && (
                    <View className="bg-blue-50 border border-blue-100 p-3 rounded-2xl flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <MessageSquare size={14} color="#2563EB" className="mr-2" />
                            <Text className="text-blue-700 text-xs font-bold">{item.unread_count} nouveau(x) message(s)</Text>
                        </View>
                        <ArrowRight size={14} color="#2563EB" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            <LinearGradient
                colors={['#1E40AF', '#1e3a8a']}
                className="pt-16 pb-12 px-6 rounded-b-[48px] shadow-2xl z-10"
            >
                <View className="flex-row justify-between items-center mb-8">
                    <View>
                        <Text className="text-4xl font-black text-white tracking-tight">Factures</Text>
                        <Text className="text-blue-200/60 text-xs font-bold uppercase tracking-[2px] mt-1">Gérer vos revenus</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/invoice/new')}
                        className="bg-white/20 w-14 h-14 items-center justify-center rounded-[22px] border border-white/20 shadow-lg"
                    >
                        <Plus size={28} color="white" strokeWidth={3} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar Upgrade */}
                <View className="bg-white/10 p-1.5 rounded-[24px] flex-row items-center border border-white/20 backdrop-blur-md mb-6">
                    <View className="bg-white flex-1 flex-row items-center px-4 h-12 rounded-[20px] shadow-sm">
                        <Search size={20} color="#94A3B8" />
                        <TextInput
                            className="flex-1 ml-3 text-base text-slate-800 font-bold"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#CBD5E1"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <AlertCircle size={18} color="#CBD5E1" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity className="w-12 h-12 items-center justify-center">
                        <Filter size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Mini Stats Grid */}
                <View className="flex-row gap-3">
                    <View className="flex-1 bg-white/10 rounded-2xl p-3 border border-white/10">
                        <Text className="text-blue-100/60 text-[8px] font-black uppercase tracking-widest mb-1">Total CA</Text>
                        <Text className="text-white font-black text-sm" numberOfLines={1}>{stats.total.toLocaleString()} <Text className="text-[10px] opacity-60">{profile?.currency}</Text></Text>
                    </View>
                    {(isAdmin || isOwner) && stats.pendingApprovalCount > 0 ? (
                        <TouchableOpacity
                            onPress={() => setActiveFilter('pending_approval')}
                            className={`flex-1 rounded-2xl p-3 border ${activeFilter === 'pending_approval' ? 'bg-amber-500 border-amber-400' : 'bg-amber-400/20 border-amber-400/30'}`}
                        >
                            <Text className={`${activeFilter === 'pending_approval' ? 'text-white' : 'text-amber-100'} text-[8px] font-black uppercase tracking-widest mb-1 flex-row items-center`}>
                                À Valider <View className="w-2 h-2 rounded-full bg-red-500 ml-1" />
                            </Text>
                            <Text className="text-white font-black text-sm">{stats.pendingApprovalCount} Factures</Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="flex-1 bg-emerald-400/10 rounded-2xl p-3 border border-emerald-400/20">
                            <Text className="text-emerald-100/60 text-[8px] font-black uppercase tracking-widest mb-1">Payées</Text>
                            <Text className="text-white font-black text-sm">{stats.paidCount} Factures</Text>
                        </View>
                    )}

                    <View className="flex-1 bg-amber-400/10 rounded-2xl p-3 border border-amber-400/20">
                        {/* Reuse pending count for general stats */}
                        <Text className="text-amber-100/60 text-[8px] font-black uppercase tracking-widest mb-1">En attente</Text>
                        <Text className="text-white font-black text-sm">{stats.pendingCount} Factures</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Filter Chips Overlay */}
            <View className="px-6 -mt-6 z-20">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 10 }}
                    className="flex-row"
                >
                    {(['all', 'pending_approval', 'paid', 'sent', 'overdue'] as const).map((filter) => {
                        const labels: any = {
                            all: 'Toutes',
                            pending_approval: 'À Valider',
                            paid: 'Payées',
                            sent: 'Envoyées',
                            overdue: 'Retard',
                            rejected: 'Rejetées'
                        };

                        return (
                            <TouchableOpacity
                                key={filter}
                                onPress={() => setActiveFilter(filter)}
                                className={`mr-3 px-6 py-3 rounded-full border shadow-sm ${activeFilter === filter
                                    ? 'bg-slate-900 border-slate-900'
                                    : 'bg-white border-slate-100'
                                    }`}
                            >
                                <View className="flex-row items-center">
                                    {filter === 'pending_approval' && stats.pendingApprovalCount > 0 && activeFilter !== filter && (
                                        <View className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                                    )}
                                    <Text className={`font-black text-xs uppercase tracking-widest ${activeFilter === filter ? 'text-white' : 'text-slate-500'
                                        }`}>
                                        {labels[filter] || filter}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center mt-10">
                    <ActivityIndicator size="large" color="#1E40AF" />
                    <Text className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement des factures...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredInvoices}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 24, paddingBottom: 120, paddingTop: 10 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E40AF" />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center py-24 bg-white rounded-[40px] border border-dashed border-slate-200 shadow-inner">
                            <View className="bg-slate-50 p-6 rounded-full mb-4">
                                <FileText size={48} color="#CBD5E1" strokeWidth={1.5} />
                            </View>
                            <Text className="text-slate-900 font-black text-xl mb-1">Aucune facture</Text>
                            <Text className="text-slate-400 text-center px-12 mb-8 font-medium">Vous n'avez pas encore de factures {activeFilter !== 'all' ? `avec le statut "${activeFilter}"` : ''}.</Text>
                            <TouchableOpacity
                                onPress={() => router.push('/invoice/new')}
                                className="bg-blue-600 px-8 py-4 rounded-2xl shadow-xl shadow-blue-200"
                            >
                                <Text className="text-white font-black uppercase tracking-wider">Créer une facture</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
}
