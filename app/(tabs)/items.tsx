import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Search, Package, ChevronRight, Box } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Item } from '../../types';

export default function ItemsTab() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const [items, setItems] = useState<Item[]>([]);
    const [filteredItems, setFilteredItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const fetchItems = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('user_id', user.id)
                .order('name');

            if (error) throw error;
            setItems(data || []);
            setFilteredItems(data || []);
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchItems();
        }, [fetchItems])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchItems();
    };

    const handleSearch = (text: string) => {
        setSearch(text);
        if (text.trim() === '') {
            setFilteredItems(items);
        } else {
            const filtered = items.filter(item =>
                item.name.toLowerCase().includes(text.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(text.toLowerCase()))
            );
            setFilteredItems(filtered);
        }
    };

    const currency = profile?.currency || 'RWF';

    const ListHeader = () => (
        <View className="pt-12 pb-6 px-4 bg-white mb-4 shadow-sm border-b border-gray-100/50">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-3xl font-black text-slate-900 tracking-tight">Catalogue</Text>
                <View className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    <Text className="text-blue-700 font-bold text-xs">{items.length} produits</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View className="bg-slate-50 p-3 rounded-2xl flex-row items-center border border-slate-200">
                <Search size={20} color="#94A3B8" />
                <TextInput
                    className="flex-1 ml-3 text-slate-900 font-medium text-base"
                    placeholder="Rechercher un produit/service..."
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
            <StatusBar style="dark" />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#1E40AF" />
                </View>
            ) : filteredItems.length === 0 ? (
                <>
                    <ListHeader />
                    <View className="flex-1 items-center px-10 mt-10">
                        <View className="bg-white p-8 rounded-[32px] mb-6 shadow-sm border border-slate-100 items-center justify-center">
                            <View className="bg-blue-50 p-4 rounded-full mb-2">
                                <Box size={48} color="#2563EB" />
                            </View>
                        </View>
                        <Text className="text-slate-900 font-black text-xl mb-3 text-center">
                            {search ? "Introuvable" : "Catalogue vide"}
                        </Text>
                        <Text className="text-slate-500 text-center leading-relaxed text-base">
                            {search
                                ? "Aucun article ne correspond à votre recherche. Essayez d'autres termes."
                                : "Ajoutez vos produits ou services fréquents pour créer vos factures en un éclair."
                            }
                        </Text>
                    </View>
                </>
            ) : (
                <FlatList
                    data={filteredItems}
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
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/items/form', params: { id: item.id } })}
                            className="bg-white mx-4 mb-3 p-4 rounded-2xl flex-row items-center shadow-sm border border-slate-100"
                            activeOpacity={0.7}
                        >
                            <View className="w-12 h-12 bg-blue-50 rounded-xl items-center justify-center mr-4">
                                <Package size={20} color="#1E40AF" />
                            </View>

                            <View className="flex-1">
                                <Text className="text-slate-900 font-bold text-base mb-0.5" numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <Text className="text-slate-400 text-xs font-medium" numberOfLines={1}>
                                    {item.description || "Aucune description"}
                                </Text>
                            </View>

                            <View className="items-end pl-2">
                                <Text className="text-slate-900 font-black text-base">
                                    {item.unit_price.toLocaleString()} <Text className="text-xs text-slate-500 font-medium">{currency}</Text>
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={() => router.push('/items/form')}
                className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-blue-500/40 z-50"
                activeOpacity={0.9}
            >
                <Plus size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
}
