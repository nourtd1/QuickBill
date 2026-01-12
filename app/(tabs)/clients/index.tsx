import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Search, UserPlus, Phone, Mail, ChevronRight, Users } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { Client } from '../../../types';

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
            className="bg-card mx-4 mb-3 p-4 rounded-xl flex-row items-center shadow-sm"
        >
            <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mr-4">
                <Text className="text-blue-600 font-bold text-lg">
                    {item.name.charAt(0).toUpperCase()}
                </Text>
            </View>

            <View className="flex-1">
                <Text className="text-text-main font-bold text-base mb-1" numberOfLines={1}>
                    {item.name}
                </Text>
                <View className="flex-row items-center">
                    {item.phone && (
                        <View className="flex-row items-center mr-3">
                            <Phone size={12} color="#64748B" />
                            <Text className="text-slate-500 text-xs ml-1">{item.phone}</Text>
                        </View>
                    )}
                    {item.email && (
                        <View className="flex-row items-center">
                            <Mail size={12} color="#64748B" />
                            <Text className="text-slate-500 text-xs ml-1" numberOfLines={1}>{item.email}</Text>
                        </View>
                    )}
                </View>
            </View>

            <ChevronRight size={20} color="#CBD5E1" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header & Search */}
            <View className="px-4 py-4 bg-white border-b border-slate-100">
                <Text className="text-2xl font-bold text-slate-900 mb-4">Mes Clients</Text>
                <View className="flex-row items-center bg-slate-100 rounded-xl px-4 h-12">
                    <Search size={20} color="#94A3B8" />
                    <TextInput
                        className="flex-1 ml-3 text-slate-900"
                        placeholder="Rechercher un client..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#007AFF" />
                </View>
            ) : filteredClients.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <View className="bg-slate-100 p-6 rounded-full mb-4">
                        <Users size={48} color="#94A3B8" />
                    </View>
                    <Text className="text-slate-900 font-bold text-lg mb-2 text-center">
                        {search ? "Aucun résultat trouvé" : "Aucun client enregistré"}
                    </Text>
                    <Text className="text-slate-500 text-center leading-relaxed">
                        {search
                            ? "Essayez une autre recherche ou vérifiez l'orthographe."
                            : "Commencez par ajouter votre premier client pour accélérer la création de vos factures."
                        }
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredClients}
                    keyExtractor={(item) => item.id}
                    renderItem={renderClientCard}
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={() => router.push('/clients/form')}
                className="absolute bottom-8 right-6 bg-primary w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-blue-300"
                activeOpacity={0.8}
            >
                <UserPlus size={28} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
