import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Plus, Search, Package, ChevronRight, ShoppingBag, Box } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Item } from '../../types';

export default function ItemsList() {
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
        <View className="bg-primary pt-14 pb-12 px-6 rounded-b-[40px] shadow-lg mb-6">
            <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-white/10 p-2.5 rounded-xl border border-white/10 mr-4"
                    >
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-blue-200 font-medium text-base mb-1">Catalogue</Text>
                        <Text className="text-white text-3xl font-black tracking-tight">Produits</Text>
                    </View>
                </View>
                <View className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                    <Text className="text-white font-bold">{items.length}</Text>
                </View>
            </View>

            {/* Search Bar Floating Overlay */}
            <View className="bg-white p-2 rounded-2xl flex-row items-center shadow-xl h-14 border border-blue-50/50">
                <View className="w-10 h-10 items-center justify-center rounded-xl bg-slate-50 ml-1">
                    <Search size={20} color="#64748B" />
                </View>
                <TextInput
                    className="flex-1 ml-3 text-slate-900 font-medium text-base h-full"
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
            <StatusBar style="light" />

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
                            className="bg-white mx-5 mb-4 p-5 rounded-2xl flex-row items-center shadow-sm border border-slate-100"
                            activeOpacity={0.7}
                        >
                            <View className="w-14 h-14 bg-blue-50/80 rounded-2xl items-center justify-center mr-4 border border-blue-100">
                                <Package size={24} color="#1E40AF" />
                            </View>

                            <View className="flex-1">
                                <Text className="text-slate-900 font-bold text-lg mb-1" numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <Text className="text-slate-400 text-sm font-medium" numberOfLines={1}>
                                    {item.description || "Aucune description"}
                                </Text>
                            </View>

                            <View className="items-end pl-2">
                                <Text className="text-slate-900 font-black text-lg">
                                    {item.unit_price.toLocaleString()} <Text className="text-sm text-slate-500 font-medium">{currency}</Text>
                                </Text>
                                <View className="mt-1">
                                    <ChevronRight size={18} color="#CBD5E1" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={() => router.push('/items/form')}
                className="absolute bottom-8 right-6 bg-slate-900 w-16 h-16 rounded-full items-center justify-center shadow-2xl shadow-slate-400 z-50"
                activeOpacity={0.9}
            >
                <Plus size={28} color="white" />
            </TouchableOpacity>
        </View>
    );
}
