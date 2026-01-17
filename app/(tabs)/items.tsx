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
        <View>
            <LinearGradient
                colors={['#1E40AF', '#1e3a8a']}
                className="pt-14 pb-10 px-6 rounded-b-[42px] shadow-2xl z-10"
            >
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-3xl font-black text-white tracking-tight">Catalogue</Text>
                        <Text className="text-blue-200/60 text-[10px] font-bold uppercase tracking-[1.5px] mt-0.5">Produits & Services</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/items/form')}
                        className="bg-white/20 w-12 h-12 items-center justify-center rounded-[18px] border border-white/20 shadow-lg"
                    >
                        <Plus size={24} color="white" strokeWidth={3} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar Upgrade */}
                <View className="bg-white/10 p-1 rounded-[20px] flex-row items-center border border-white/20 backdrop-blur-md mb-6">
                    <View className="bg-white flex-1 flex-row items-center px-4 h-11 rounded-[16px] shadow-sm">
                        <Search size={18} color="#94A3B8" />
                        <TextInput
                            className="flex-1 ml-3 text-sm text-slate-800 font-bold"
                            placeholder="Rechercher un article..."
                            value={search}
                            onChangeText={handleSearch}
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
                        <Text className="text-blue-100/60 text-[7px] font-black uppercase tracking-widest mb-0.5">Articles</Text>
                        <Text className="text-white font-black text-sm">{stats.total}</Text>
                    </View>
                    <View className="flex-1 bg-emerald-400/10 rounded-xl p-2.5 border border-emerald-400/20">
                        <Text className="text-emerald-100/60 text-[7px] font-black uppercase tracking-widest mb-0.5">Prix Moyen</Text>
                        <Text className="text-white font-black text-sm" numberOfLines={1}>{Math.round(stats.avgPrice).toLocaleString()}</Text>
                    </View>
                    <View className="flex-1 bg-amber-400/10 rounded-xl p-2.5 border border-amber-400/20">
                        <Text className="text-amber-100/60 text-[7px] font-black uppercase tracking-widest mb-0.5">Descriptions</Text>
                        <Text className="text-white font-black text-sm">{stats.withDesc}</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Section Title Overlay */}
            <View className="px-6 mt-8 mb-6">
                <View className="flex-row justify-between items-end">
                    <View>
                        <Text className="text-slate-900 font-black text-2xl tracking-tight">Inventaire</Text>
                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gérer vos prestations</Text>
                    </View>
                    <TouchableOpacity className="flex-row items-center bg-slate-100 px-4 py-2 rounded-full">
                        <LayoutGrid size={14} color="#64748B" className="mr-2" />
                        <Text className="text-slate-600 font-black text-xs uppercase">Vue Liste</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            {loading && items.length === 0 ? (
                <View className="flex-1 items-center justify-center bg-white">
                    <ActivityIndicator size="large" color="#1E40AF" />
                    <Text className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement du catalogue...</Text>
                </View>
            ) : filteredItems.length === 0 ? (
                <>
                    <ListHeader />
                    <View className="flex-1 items-center px-10 mt-10">
                        <View className="bg-white p-8 rounded-[40px] mb-6 shadow-sm border border-slate-100 items-center justify-center">
                            <View className="bg-blue-50 p-6 rounded-full mb-2">
                                <Box size={48} color="#1E40AF" opacity={0.3} strokeWidth={1.5} />
                            </View>
                        </View>
                        <Text className="text-slate-900 font-black text-xl mb-3 text-center">
                            {search ? "Introuvable" : "Catalogue vide"}
                        </Text>
                        <Text className="text-slate-500 text-center leading-relaxed text-base mb-8">
                            {search
                                ? "Aucun article ne correspond à votre recherche. Essayez d'autres termes."
                                : "Ajoutez vos produits ou services fréquents pour créer vos factures en un éclair."
                            }
                        </Text>
                        {!search && (
                            <TouchableOpacity
                                onPress={() => router.push('/items/form')}
                                className="bg-blue-600 px-8 py-4 rounded-2xl shadow-xl shadow-blue-200 flex-row items-center"
                            >
                                <Plus size={20} color="white" strokeWidth={3} className="mr-2" />
                                <Text className="text-white font-black uppercase tracking-wider">Nouvel Article</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </>
            ) : (
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id}
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
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/items/form', params: { id: item.id } })}
                            className="bg-white mx-6 mb-4 p-5 rounded-[32px] shadow-sm border border-slate-100 flex-row items-center active:bg-slate-50"
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={['#DBEAFE', '#EFF6FF']}
                                className="w-14 h-14 rounded-2xl items-center justify-center mr-4 border border-blue-100 shadow-sm"
                            >
                                <Package size={22} color="#1E40AF" />
                            </LinearGradient>

                            <View className="flex-1 mr-2">
                                <Text className="text-slate-900 font-black text-lg mb-1" numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <Text className="text-slate-400 text-xs font-bold uppercase tracking-tight" numberOfLines={1}>
                                    {item.description || "Aucune description"}
                                </Text>
                            </View>

                            <View className="items-end">
                                <Text className="text-slate-900 font-black text-base">
                                    {item.unit_price.toLocaleString()}
                                </Text>
                                <Text className="text-slate-400 text-[10px] font-bold">{currency}</Text>
                            </View>

                            <View className="ml-3 bg-slate-50 p-2 rounded-xl">
                                <ChevronRight size={16} color="#CBD5E1" strokeWidth={3} />
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Floating Action Button Upgrade */}
            <TouchableOpacity
                onPress={() => router.push('/items/form')}
                activeOpacity={0.9}
                className="absolute bottom-10 right-8 w-20 h-20 items-center justify-center z-50 overflow-hidden rounded-[30px]"
            >
                <LinearGradient
                    colors={['#1E40AF', '#1e3a8a']}
                    className="w-full h-full items-center justify-center shadow-2xl shadow-blue-500"
                >
                    <Plus size={32} color="white" strokeWidth={2.5} />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}
