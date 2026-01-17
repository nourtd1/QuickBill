import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Image,
    Platform
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
    Search,
    UserPlus,
    Phone,
    Mail,
    ChevronRight,
    Users,
    User,
    Filter,
    MapPin,
    ArrowRight,
    Star,
    LayoutGrid,
    MoreVertical
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../../lib/supabase';
import { Client } from '../../../types';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ClientsScreen() {
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

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
        } catch (error) {
            console.error('Erreur lors de la récupération des clients:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchClients();
        }, [])
    );

    useEffect(() => {
        const result = clients.filter(client =>
            client.name.toLowerCase().includes(search.toLowerCase()) ||
            client.phone?.includes(search) ||
            client.email?.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredClients(result);
    }, [search, clients]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchClients();
    };

    const stats = useMemo(() => {
        return {
            total: clients.length,
            active: clients.filter(c => c.email && c.phone).length,
            new: clients.filter(c => {
                const created = new Date(c.created_at);
                const now = new Date();
                const diff = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
                return diff < 30;
            }).length
        };
    }, [clients]);

    const renderClientCard = ({ item }: { item: Client }) => (
        <TouchableOpacity
            onPress={() => router.push({ pathname: '/clients/form', params: { id: item.id } })}
            className="bg-white mx-6 mb-4 p-5 rounded-[32px] shadow-sm border border-slate-100 flex-row items-center active:bg-slate-50"
            activeOpacity={0.7}
        >
            <LinearGradient
                colors={['#DBEAFE', '#EFF6FF']}
                className="w-14 h-14 rounded-2xl items-center justify-center mr-4 border border-blue-100 shadow-sm"
            >
                <Text className="text-primary font-black text-2xl">
                    {item.name.charAt(0).toUpperCase()}
                </Text>
            </LinearGradient>

            <View className="flex-1 mr-2">
                <Text className="text-slate-900 font-black text-lg mb-1" numberOfLines={1}>
                    {item.name}
                </Text>
                <View className="flex-row items-center mb-1">
                    <Mail size={12} color="#94A3B8" className="mr-1.5" />
                    <Text className="text-slate-400 text-xs font-bold" numberOfLines={1}>
                        {item.email || 'Pas d\'email'}
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <Phone size={12} color="#94A3B8" className="mr-1.5" />
                    <Text className="text-slate-400 text-xs font-bold">
                        {item.phone || 'Pas de numéro'}
                    </Text>
                </View>
            </View>

            <View className="bg-slate-50 p-2 rounded-xl">
                <ChevronRight size={18} color="#CBD5E1" strokeWidth={3} />
            </View>
        </TouchableOpacity>
    );

    const ListHeader = () => (
        <View>
            <LinearGradient
                colors={['#1E40AF', '#1e3a8a']}
                className="pt-14 pb-10 px-6 rounded-b-[42px] shadow-2xl z-10"
            >
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-3xl font-black text-white tracking-tight">Clients</Text>
                        <Text className="text-blue-200/60 text-[10px] font-bold uppercase tracking-[1.5px] mt-0.5">Annuaire Professionnel</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/clients/form')}
                        className="bg-white/20 w-12 h-12 items-center justify-center rounded-[18px] border border-white/20 shadow-lg"
                    >
                        <UserPlus size={24} color="white" strokeWidth={3} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar Upgrade */}
                <View className="bg-white/10 p-1 rounded-[20px] flex-row items-center border border-white/20 backdrop-blur-md mb-6">
                    <View className="bg-white flex-1 flex-row items-center px-4 h-11 rounded-[16px] shadow-sm">
                        <Search size={18} color="#94A3B8" />
                        <TextInput
                            className="flex-1 ml-3 text-sm text-slate-800 font-bold"
                            placeholder="Nom, email, telephone..."
                            value={search}
                            onChangeText={setSearch}
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
                        <Text className="text-blue-100/60 text-[7px] font-black uppercase tracking-widest mb-0.5">Total</Text>
                        <Text className="text-white font-black text-sm">{stats.total}</Text>
                    </View>
                    <View className="flex-1 bg-emerald-400/10 rounded-xl p-2.5 border border-emerald-400/20">
                        <Text className="text-emerald-100/60 text-[7px] font-black uppercase tracking-widest mb-0.5">Complets</Text>
                        <Text className="text-white font-black text-sm">{stats.active}</Text>
                    </View>
                    <View className="flex-1 bg-purple-400/10 rounded-xl p-2.5 border border-purple-400/20">
                        <Text className="text-purple-100/60 text-[7px] font-black uppercase tracking-widest mb-0.5">Nouveaux</Text>
                        <Text className="text-white font-black text-sm">{stats.new}</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Quick Actions / Filters Row */}
            <View className="px-6 mt-8 mb-6">
                <View className="flex-row justify-between items-end">
                    <View>
                        <Text className="text-slate-900 font-black text-2xl tracking-tight">Liste des Clients</Text>
                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Tous vos contacts</Text>
                    </View>
                    <TouchableOpacity className="flex-row items-center bg-slate-100 px-4 py-2 rounded-full">
                        <LayoutGrid size={14} color="#64748B" className="mr-2" />
                        <Text className="text-slate-600 font-black text-xs uppercase">Vue Grille</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            {loading && clients.length === 0 ? (
                <View className="flex-1 items-center justify-center bg-white">
                    <ActivityIndicator size="large" color="#1E40AF" />
                    <Text className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement des clients...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredClients}
                    keyExtractor={(item) => item.id}
                    renderItem={renderClientCard}
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
                    ListEmptyComponent={() => (
                        <View className="items-center justify-center py-20 mx-6 bg-white rounded-[40px] border border-dashed border-slate-200">
                            <View className="bg-blue-50 p-6 rounded-full mb-4">
                                <Users size={48} color="#1E40AF" opacity={0.3} strokeWidth={1.5} />
                            </View>
                            <Text className="text-slate-900 font-black text-xl mb-1 text-center">Aucun client trouvé</Text>
                            <Text className="text-slate-400 text-center px-10 mb-8 font-medium">Commencez par ajouter un client pour gérer vos factures plus facilement.</Text>
                            <TouchableOpacity
                                onPress={() => router.push('/clients/form')}
                                className="bg-blue-600 px-8 py-4 rounded-2xl shadow-xl shadow-blue-200 flex-row items-center"
                            >
                                <UserPlus size={20} color="white" strokeWidth={3} className="mr-2" />
                                <Text className="text-white font-black uppercase tracking-wider">Ajouter un client</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}

            {/* Floating Action Button Upgrade */}
            <TouchableOpacity
                onPress={() => router.push('/clients/form')}
                activeOpacity={0.9}
                className="absolute bottom-10 right-8 w-20 h-20 items-center justify-center z-50 overflow-hidden rounded-[30px]"
            >
                <LinearGradient
                    colors={['#1E40AF', '#1e3a8a']}
                    className="w-full h-full items-center justify-center shadow-2xl shadow-blue-500"
                >
                    <UserPlus size={32} color="white" strokeWidth={2.5} />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}
