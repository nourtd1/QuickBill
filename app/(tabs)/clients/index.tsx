import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    StatusBar as RNStatusBar,
    Platform
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Search, UserPlus, Phone, Mail, ChevronRight, Users, User } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { Client } from '../../../types';
import { StatusBar } from 'expo-status-bar';

export default function ClientsScreen() {
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const fetchClients = async () => {
        try {
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

    const renderClientCard = ({ item }: { item: Client }) => (
        <TouchableOpacity
            onPress={() => router.push({ pathname: '/clients/form', params: { id: item.id } })}
            className="bg-white mx-5 mb-4 p-5 rounded-2xl flex-row items-center shadow-sm border border-slate-100"
            activeOpacity={0.7}
        >
            <View className="w-14 h-14 bg-blue-50/80 rounded-2xl items-center justify-center mr-4 border border-blue-100">
                <Text className="text-primary font-black text-xl">
                    {item.name.charAt(0).toUpperCase()}
                </Text>
            </View>

            <View className="flex-1">
                <Text className="text-slate-900 font-bold text-lg mb-1.5" numberOfLines={1}>
                    {item.name}
                </Text>
                <View className="space-y-1">
                    {item.phone && (
                        <View className="flex-row items-center mr-3">
                            <Phone size={14} color="#64748B" className="mr-1.5" />
                            <Text className="text-slate-500 text-sm font-medium">{item.phone}</Text>
                        </View>
                    )}
                    {item.email && (
                        <View className="flex-row items-center">
                            <Mail size={14} color="#64748B" className="mr-1.5" />
                            <Text className="text-slate-500 text-sm font-medium" numberOfLines={1}>{item.email}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View className="bg-slate-50 p-2 rounded-full ml-2">
                <ChevronRight size={20} color="#94A3B8" />
            </View>
        </TouchableOpacity>
    );

    const ListHeader = () => (
        <View className="bg-primary pt-14 pb-12 px-6 rounded-b-[40px] shadow-lg mb-6">
            <View className="flex-row justify-between items-center mb-6">
                <View>
                    <Text className="text-blue-200 font-medium text-base mb-1">Carnet d'adresses</Text>
                    <Text className="text-white text-3xl font-black tracking-tight">Mes Clients</Text>
                </View>
                <View className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                    <Text className="text-white font-bold">{clients.length} Total</Text>
                </View>
            </View>

            {/* Search Bar Floating Overlay */}
            <View className="bg-white p-2 rounded-2xl flex-row items-center shadow-xl h-14 border border-blue-50/50">
                <View className="w-10 h-10 items-center justify-center rounded-xl bg-slate-50 ml-1">
                    <Search size={20} color="#64748B" />
                </View>
                <TextInput
                    className="flex-1 ml-3 text-slate-900 font-medium text-base h-full"
                    placeholder="Rechercher un client..."
                    placeholderTextColor="#94A3B8"
                    value={search}
                    onChangeText={setSearch}
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
            ) : filteredClients.length === 0 ? (
                <>
                    <ListHeader />
                    <View className="flex-1 items-center px-10 mt-10">
                        <View className="bg-white p-8 rounded-[32px] mb-6 shadow-sm border border-slate-100 items-center justify-center">
                            <View className="bg-blue-50 p-4 rounded-full mb-2">
                                <Users size={48} color="#3B82F6" />
                            </View>
                        </View>
                        <Text className="text-slate-900 font-black text-xl mb-3 text-center">
                            {search ? "Aucun résultat" : "Aucun client"}
                        </Text>
                        <Text className="text-slate-500 text-center leading-relaxed text-base">
                            {search
                                ? "Aucun client ne correspond à votre recherche. Essayez d'autres mots-clés."
                                : "Ajoutez votre premier client pour commencer à créer des factures et devis professionnels."
                            }
                        </Text>
                    </View>
                </>
            ) : (
                <FlatList
                    data={filteredClients}
                    keyExtractor={(item) => item.id}
                    renderItem={renderClientCard}
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
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={() => router.push('/clients/form')}
                className="absolute bottom-8 right-6 bg-slate-900 w-16 h-16 rounded-full items-center justify-center shadow-2xl shadow-slate-400 z-50"
                activeOpacity={0.9}
            >
                <UserPlus size={28} color="white" />
            </TouchableOpacity>
        </View>
    );
}
