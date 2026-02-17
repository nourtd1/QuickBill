import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Platform
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
    Plus,
    Search,
    Package,
    ChevronRight,
    Box,
    Filter,
    LayoutGrid,
    ArrowRight,
    ShoppingBag,
    BadgePercent,
    TrendingUp
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Item } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

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

    const stats = useMemo(() => {
        const total = items.length;
        const avgPrice = total > 0 ? items.reduce((acc, i) => acc + i.unit_price, 0) / total : 0;
        const withDesc = items.filter(i => i.description).length;
        return { total, avgPrice, withDesc };
    }, [items]);

    const currency = profile?.currency || 'RWF';

    const ListHeader = () => (
        <View className="px-4 pt-4 pb-2">
            {/* Header Title */}
            <View className="flex-row justify-between items-center mb-6">
                <View>
                    <Text className="text-3xl font-bold text-slate-900 tracking-tight">Catalogue</Text>
                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Produits & Services</Text>
                </View>
                <TouchableOpacity
                    onPress={() => router.push('/items/form')}
                    className="bg-blue-50 w-12 h-12 items-center justify-center rounded-2xl border border-blue-100 shadow-sm"
                >
                    <Plus size={24} color="#2563EB" strokeWidth={2.5} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="flex-row gap-3 mb-6">
                <View className="flex-1 flex-row items-center bg-white rounded-2xl px-4 h-12 shadow-sm border border-slate-100">
                    <Search size={20} color="#94A3B8" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-slate-900 font-medium"
                        placeholder="Rechercher un article..."
                        placeholderTextColor="#CBD5E1"
                        value={search}
                        onChangeText={handleSearch}
                    />
                </View>
                <TouchableOpacity className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm border border-slate-100">
                    <Filter size={20} color="#0F172A" />
                </TouchableOpacity>
            </View>

            {/* Stats Grid */}
            <View className="flex-row gap-3 mb-6">
                <View className="flex-1 bg-blue-50 rounded-2xl p-3 border border-blue-100">
                    <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest mb-0.5">Articles</Text>
                    <Text className="text-slate-900 font-black text-lg">{stats.total}</Text>
                </View>
                <View className="flex-1 bg-emerald-50 rounded-2xl p-3 border border-emerald-100">
                    <Text className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-0.5">Moyenne</Text>
                    <Text className="text-slate-900 font-black text-lg" numberOfLines={1}>{Math.round(stats.avgPrice).toLocaleString()}</Text>
                </View>
                <View className="flex-1 bg-amber-50 rounded-2xl p-3 border border-amber-100">
                    <Text className="text-amber-600 text-[10px] font-black uppercase tracking-widest mb-0.5">Détails</Text>
                    <Text className="text-slate-900 font-black text-lg">{stats.withDesc}</Text>
                </View>
            </View>

            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-slate-900 font-bold text-lg">Inventaire</Text>
                <TouchableOpacity className="flex-row items-center bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                    <LayoutGrid size={14} color="#64748B" className="mr-2" />
                    <Text className="text-slate-600 font-bold text-xs uppercase">Vue Liste</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#F9FAFC]" style={{ paddingTop: Platform.OS === 'android' ? 30 : 0 }}>
            <StatusBar style="dark" />

            {loading && items.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement...</Text>
                </View>
            ) : filteredItems.length === 0 ? (
                <FlatList
                    data={[]}
                    renderItem={null}
                    ListHeaderComponent={ListHeader}
                    contentContainerStyle={{ flexGrow: 1 }}
                    ListEmptyComponent={
                        <View className="flex-1 items-center px-10 mt-10">
                            <View className="bg-white p-6 rounded-full mb-4 shadow-sm border border-slate-100">
                                <Box size={40} color="#94A3B8" strokeWidth={1.5} />
                            </View>
                            <Text className="text-slate-900 font-bold text-lg mb-2 text-center">
                                {search ? "Introuvable" : "Catalogue vide"}
                            </Text>
                            <Text className="text-slate-500 text-center text-sm mb-6">
                                {search
                                    ? "Aucun article ne correspond à votre recherche."
                                    : "Commencez à ajouter vos produits."
                                }
                            </Text>
                            {!search && (
                                <TouchableOpacity
                                    onPress={() => router.push('/items/form')}
                                    className="bg-blue-600 px-6 py-3 rounded-xl shadow-lg shadow-blue-200 flex-row items-center"
                                >
                                    <Plus size={18} color="white" strokeWidth={3} className="mr-2" />
                                    <Text className="text-white font-bold uppercase tracking-wide text-xs">Ajouter</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                />
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
                            tintColor="#2563EB"
                        />
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/items/form', params: { id: item.id } })}
                            className="bg-white mx-4 mb-3 p-4 rounded-2xl shadow-sm border border-slate-50 flex-row items-center active:bg-slate-50"
                            activeOpacity={0.7}
                        >
                            <View className="w-12 h-12 rounded-xl items-center justify-center mr-4 bg-blue-50 border border-blue-100">
                                <Package size={20} color="#2563EB" />
                            </View>

                            <View className="flex-1 mr-2">
                                <Text className="text-slate-900 font-bold text-base mb-0.5" numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <Text className="text-slate-400 text-xs font-medium" numberOfLines={1}>
                                    {item.description || "Aucune description"}
                                </Text>
                            </View>

                            <View className="items-end">
                                <Text className="text-slate-900 font-black text-base">
                                    {item.unit_price.toLocaleString()}
                                </Text>
                                <Text className="text-slate-400 text-[10px] font-bold">{currency}</Text>
                            </View>

                            <View className="ml-3 bg-slate-50 p-1.5 rounded-lg">
                                <ChevronRight size={14} color="#CBD5E1" strokeWidth={3} />
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={() => router.push('/items/form')}
                activeOpacity={0.9}
                className="absolute bottom-8 right-8 w-14 h-14 bg-[#2563EB] rounded-full items-center justify-center shadow-xl shadow-blue-500/30"
            >
                <Plus size={24} color="white" strokeWidth={2.5} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
