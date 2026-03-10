import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Image,

    ScrollView,
    StatusBar as RNStatusBar,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
    Search,
    SlidersHorizontal,
    Plus,
    User
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
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
    const insets = useSafeAreaInsets();

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
                className="bg-white p-5 rounded-[24px] mb-4 flex-row justify-between items-center shadow-sm shadow-slate-200/50 border border-slate-100 active:bg-slate-50/80"
            >
                <View className="flex-row items-center gap-4">
                    {/* Avatar */}
                    <View className="w-14 h-14 rounded-[18px] bg-slate-50 border border-slate-100 items-center justify-center shadow-sm shadow-slate-200">
                        <User size={24} color="#1E40AF" strokeWidth={2.5} />
                    </View>

                    <View>
                        <Text className="font-black text-slate-900 text-base tracking-tight mb-0.5">{item.name}</Text>
                        <Text className="text-slate-500 font-bold text-xs">{(item as any).business_name || (item as any).company_name || 'Individual'}</Text>
                    </View>
                </View>

                <View className="items-end">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Balance</Text>
                    <Text className={`font-black text-lg tracking-tighter ${hasBalance ? 'text-red-500' : 'text-emerald-500'}`}>
                        {formatCurrency(balance)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const ListHeader = () => (
        <View className="bg-transparent">
            {/* Header Title Section */}
            <View className="flex-row justify-between items-center mb-6 pt-2">
                <Text className="text-[36px] font-black text-slate-900 tracking-tight">Clients</Text>
                <TouchableOpacity className="bg-white w-12 h-12 rounded-[18px] items-center justify-center shadow-sm shadow-slate-200/50 border border-slate-100">
                    <User size={24} color="#1E40AF" strokeWidth={2.5} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="flex-row gap-3 mb-6">
                <View className="flex-1 h-14 bg-white rounded-[22px] flex-row items-center px-5 shadow-sm shadow-slate-200/50 border border-slate-100">
                    <Search size={20} color="#94A3B8" strokeWidth={2.5} className="mr-2" />
                    <TextInput
                        className="flex-1 font-bold text-base text-slate-900 h-full"
                        placeholder="Search clients..."
                        placeholderTextColor="#CBD5E1"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <TouchableOpacity className="w-14 h-14 bg-slate-50 rounded-[22px] items-center justify-center shadow-sm shadow-slate-200/50 border border-slate-100">
                    <SlidersHorizontal size={20} color="#1E40AF" strokeWidth={2.5} />
                </TouchableOpacity>
            </View>

            {/* Filter Pills */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row mb-8 -mx-6 px-6"
                contentContainerStyle={{ paddingRight: 40 }}
            >
                {['All Clients', 'Outstanding', 'Settled', 'Recently Active'].map((filter) => {
                    const isActive = activeFilter === filter;
                    return (
                        <TouchableOpacity
                            key={filter}
                            onPress={() => setActiveFilter(filter)}
                            className={`mr-3 py-2.5 px-6 rounded-full border transition-all ${isActive ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-500/30' : 'bg-white border-slate-100 shadow-sm shadow-slate-200/50'}`}
                        >
                            <Text className={`font-black uppercase tracking-widest text-[10px] ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Section Title */}
            <View className="flex-row justify-between items-center mb-4 ml-1">
                <Text className="font-black text-slate-900 text-[10px] uppercase tracking-widest">
                    Your Clients Directory
                </Text>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-white relative">
            <StatusBar style="dark" />

            {/* Background Decorative Elements */}
            <View className="absolute top-0 left-0 right-0 h-[45%] pointer-events-none">
                <LinearGradient
                    colors={['#DBEAFE', '#F8FAFC', '#ffffff']}
                    locations={[0, 0.4, 1]}
                    className="flex-1"
                />
                <View className="absolute -top-32 -right-32 w-80 h-80 bg-blue-400/10 rounded-full" />
                <View className="absolute top-20 -left-20 w-48 h-48 bg-indigo-400/10 rounded-full" />
            </View>

            <View style={{ paddingTop: insets.top, flex: 1 }}>
                <FlatList
                    data={filteredClients}
                    keyExtractor={(item) => item.id}
                    renderItem={renderClientCard}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
                    ListHeaderComponent={ListHeader}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        !loading ? (
                            <Text className="text-center font-bold text-slate-400 mt-10">No clients found</Text>
                        ) : null
                    }
                />
            </View>

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={() => router.push('/clients/form')}
                className="absolute bottom-8 right-6 w-16 h-16 rounded-[22px] shadow-2xl shadow-blue-500/50"
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#1e3a8a', '#1E40AF', '#3b82f6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="flex-1 items-center justify-center rounded-[22px]"
                >
                    <Plus size={32} color="white" strokeWidth={2.5} />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}
