import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar as RNStatusBar,
    Platform
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
    Search,
    SlidersHorizontal,
    Plus,
    User
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../../lib/supabase';
import { Client } from '../../../types';

// Constants
const PRIMARY_COLOR = '#2563EB'; // Blue-600
const BG_LIGHT = '#F9FAFC';
const BG_DARK = '#101322';

export default function ClientsScreen() {
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All Clients');
    const [statsMap, setStatsMap] = useState<Record<string, { total: number; unpaid: number; count: number }>>({});

    const fetchClients = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setClients(data || []);
            setFilteredClients(data || []);

            // Fetch Invoices for Stats (Balance)
            const { data: invoices, error: invError } = await supabase
                .from('invoices')
                .select('customer_id, status, total_amount');

            if (!invError && invoices) {
                const map: Record<string, { total: number; unpaid: number; count: number }> = {};
                invoices.forEach(inv => {
                    if (!map[inv.customer_id]) map[inv.customer_id] = { total: 0, unpaid: 0, count: 0 };
                    map[inv.customer_id].count++;
                    map[inv.customer_id].total += inv.total_amount || 0;
                    if (inv.status === 'UNPAID' || inv.status === 'PENDING_APPROVAL') {
                        map[inv.customer_id].unpaid += inv.total_amount || 0;
                    }
                });
                setStatsMap(map);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchClients();
        }, [])
    );

    // Filter Logic
    useEffect(() => {
        let result = clients;

        // Search Filter
        if (search) {
            result = result.filter(client =>
                client.name.toLowerCase().includes(search.toLowerCase()) ||
                client.phone?.includes(search) ||
                client.email?.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Category Filter (Mock logic for tabs other than 'All Clients')
        if (activeFilter === 'Outstanding') {
            result = result.filter(c => (statsMap[c.id]?.unpaid || 0) > 0);
        } else if (activeFilter === 'Settled') {
            result = result.filter(c => (statsMap[c.id]?.unpaid || 0) === 0);
        }

        setFilteredClients(result);
    }, [search, clients, activeFilter, statsMap]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const renderClientCard = ({ item }: { item: Client }) => {
        const balance = statsMap[item.id]?.unpaid || 0;
        const hasBalance = balance > 0;

        return (
            <TouchableOpacity
                onPress={() => router.push({ pathname: '/clients/form', params: { id: item.id } })}
                className="bg-white/90 border border-white/40 p-4 rounded-3xl mb-4 flex-row justify-between items-center shadow-sm"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}
            >
                <View className="flex-row items-center gap-3">
                    {/* Avatar */}
                    <View className="w-12 h-12 rounded-full bg-slate-200 items-center justify-center overflow-hidden">
                        <User size={24} color="#64748B" />
                    </View>

                    <View>
                        <Text className="font-bold text-slate-900 text-base">{item.name}</Text>
                        <Text className="text-slate-500 text-sm">{(item as any).business_name || (item as any).company_name || 'Individual'}</Text>
                    </View>
                </View>

                <View className="items-end">
                    <Text className="text-slate-400 text-xs font-medium mb-0.5">Balance</Text>
                    <Text className={`font-bold text-base ${hasBalance ? 'text-red-500' : 'text-emerald-500'}`}>
                        {formatCurrency(balance)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const ListHeader = () => (
        <View>
            {/* Header Title Section */}
            <View className="flex-row justify-between items-center mb-6 pt-2">
                <Text className="text-4xl font-extrabold text-slate-900 tracking-tight">Clients</Text>
                <TouchableOpacity className="bg-blue-100 p-2 rounded-full">
                    <User size={24} color={PRIMARY_COLOR} fill={PRIMARY_COLOR} strokeWidth={0} opacity={0.2} style={{ position: 'absolute' }} />
                    <User size={24} color={PRIMARY_COLOR} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="flex-row gap-3 mb-6">
                <View className="flex-1 flex-row items-center bg-white rounded-2xl px-4 h-12 shadow-sm border border-slate-100">
                    <Search size={20} color="#94A3B8" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-slate-900"
                        placeholder="Search clients..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <TouchableOpacity className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm border border-slate-100">
                    <SlidersHorizontal size={20} color="#0F172A" />
                </TouchableOpacity>
            </View>

            {/* Filter Pills */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingRight: 20 }}
                className="mb-8"
            >
                {['All Clients', 'Outstanding', 'Settled', 'Recently Active'].map((filter) => {
                    const isActive = activeFilter === filter;
                    return (
                        <TouchableOpacity
                            key={filter}
                            onPress={() => setActiveFilter(filter)}
                            className={`px-5 py-2.5 rounded-full border ${isActive
                                ? 'bg-[#1337ec] border-[#1337ec]'
                                : 'bg-white border-slate-200'
                                }`}
                        >
                            <Text className={`font-semibold ${isActive ? 'text-white' : 'text-slate-600'}`}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Section Title */}
            <Text className="text-slate-400 font-bold text-xs tracking-widest uppercase mb-4">
                High-Value Clients
            </Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#F9FAFC]" style={{ paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 }}>
            <StatusBar style="dark" />

            <FlatList
                data={filteredClients}
                keyExtractor={(item) => item.id}
                renderItem={renderClientCard}
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                ListHeaderComponent={ListHeader}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    !loading ? (
                        <Text className="text-center text-slate-400 mt-10">No clients found</Text>
                    ) : null
                }
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={() => router.push('/clients/form')}
                className="absolute bottom-8 right-8 w-16 h-16 bg-[#1337ec] rounded-full items-center justify-center shadow-xl shadow-blue-500/30"
                activeOpacity={0.9}
            >
                <Plus size={32} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
