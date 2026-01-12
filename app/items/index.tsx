import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Plus, Search, Package, ChevronRight, ShoppingBag } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchItems();
        }, [fetchItems])
    );

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

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <StatusBar style="dark" />

            {/* Header */}
            <View className="px-6 py-4 bg-white border-b border-slate-100 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 bg-slate-50 rounded-full mr-4">
                    <ArrowLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text className="text-xl font-black text-slate-900">Produits & Services</Text>
            </View>

            {/* Search Bar */}
            <View className="px-6 py-4">
                <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-14 shadow-sm">
                    <Search size={20} color="#94A3B8" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-slate-900 font-medium"
                        placeholder="Rechercher un article..."
                        value={search}
                        onChangeText={handleSearch}
                    />
                </View>
            </View>

            {loading && items.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchItems} tintColor="#2563EB" />
                    }
                    ListEmptyComponent={() => (
                        <View className="items-center justify-center mt-10 p-10 bg-white rounded-[40px] border border-dashed border-slate-200">
                            <ShoppingBag size={48} color="#CBD5E1" strokeWidth={1} />
                            <Text className="text-slate-400 font-bold mt-4 text-center">Aucun article enregistré</Text>
                            <Text className="text-slate-300 text-sm text-center mt-2 px-6">Ajoutez vos produits ou services fréquents pour facturer plus vite.</Text>
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/items/form', params: { id: item.id } })}
                            className="bg-white p-5 rounded-[30px] mb-4 flex-row items-center shadow-sm border border-slate-50"
                        >
                            <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mr-4">
                                <Package size={24} color="#2563EB" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 font-bold text-base">{item.name}</Text>
                                <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>
                                    {item.description || 'Pas de description'}
                                </Text>
                            </View>
                            <View className="items-end ml-2">
                                <Text className="text-slate-900 font-black text-base">
                                    {item.unit_price.toLocaleString()} {currency}
                                </Text>
                                <ChevronRight size={18} color="#CBD5E1" />
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* FAB */}
            <TouchableOpacity
                onPress={() => router.push('/items/form')}
                className="absolute bottom-10 right-8 w-16 h-16 bg-blue-600 rounded-full items-center justify-center shadow-xl shadow-blue-300"
                style={{ elevation: 8 }}
            >
                <Plus size={32} color="white" strokeWidth={3} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
