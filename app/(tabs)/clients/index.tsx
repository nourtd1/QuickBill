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
    MoreVertical,
    Megaphone,
    CheckCircle2,
    AlertCircle,
    X,
    MessageSquare,
    Mail as MailIcon,
    CheckSquare,
    Square
} from 'lucide-react-native';
import { Linking, Modal, Pressable, Alert } from 'react-native';
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
    const [statsMap, setStatsMap] = useState<Record<string, { total: number; unpaid: number; count: number }>>({});
    const [showMarketing, setShowMarketing] = useState(false);
    const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
    const [marketingMode, setMarketingMode] = useState<string | null>(null); // 'email' | 'sms'

    const fetchClients = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setClients(data || []);
            if (error) throw error;
            setClients(data || []);
            setFilteredClients(data || []);

            // Fetch Invoices for Stats
            const { data: invoices } = await supabase
                .from('invoices')
                .select('customer_id, status, total_amount');

            if (invoices) {
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

            <View className="bg-slate-50 p-2 rounded-xl items-end justify-center">
                {/* Health Score Indicator */}
                {(() => {
                    const s = statsMap[item.id];
                    if (!s || s.count === 0) return (
                        <View className="flex-row items-center bg-blue-100 px-2 py-1 rounded-full mb-1">
                            <Star size={10} color="#3B82F6" className="mr-1" />
                            <Text className="text-blue-700 text-[8px] font-black uppercase">Nouveau</Text>
                        </View>
                    );
                    if (s.unpaid > 0) return (
                        <View className="flex-row items-center bg-red-100 px-2 py-1 rounded-full mb-1">
                            <AlertCircle size={10} color="#EF4444" className="mr-1" />
                            <Text className="text-red-700 text-[8px] font-black uppercase">Risque</Text>
                        </View>
                    );
                    return (
                        <View className="flex-row items-center bg-emerald-100 px-2 py-1 rounded-full mb-1">
                            <CheckCircle2 size={10} color="#10B981" className="mr-1" />
                            <Text className="text-emerald-700 text-[8px] font-black uppercase">Bon Payeur</Text>
                        </View>
                    );
                })()}
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

            <View className="px-6 mt-8 mb-6">
                <View className="flex-row justify-between items-end">
                    <View>
                        <Text className="text-slate-900 font-black text-2xl tracking-tight">Liste des Clients</Text>
                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Tous vos contacts</Text>
                    </View>
                    <View className="flex-row gap-2">
                        <TouchableOpacity
                            className="flex-row items-center bg-indigo-100 px-4 py-2 rounded-full border border-indigo-200"
                            onPress={() => setShowMarketing(true)}
                        >
                            <Megaphone size={14} color="#4338ca" className="mr-2" />
                            <Text className="text-indigo-800 font-black text-xs uppercase">Campagnes</Text>
                        </TouchableOpacity>
                    </View>
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

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={() => router.push('/clients/form')}
                activeOpacity={0.9}
                className="absolute bottom-10 right-8 w-16 h-16 items-center justify-center z-50 overflow-hidden rounded-[24px]"
            >
                <LinearGradient
                    colors={['#1E40AF', '#1e3a8a']}
                    className="w-full h-full items-center justify-center shadow-2xl shadow-blue-500"
                >
                    <UserPlus size={28} color="white" strokeWidth={2.5} />
                </LinearGradient>
            </TouchableOpacity>

            {/* Marketing Modal */}
            <Modal
                visible={showMarketing}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowMarketing(false)}
            >
                <View className="flex-1 bg-slate-50">
                    <View className="bg-white px-6 py-4 border-b border-slate-100 flex-row justify-between items-center">
                        <Text className="text-slate-900 font-black text-xl">Marketing & Relances</Text>
                        <TouchableOpacity onPress={() => setShowMarketing(false)} className="bg-slate-100 p-2 rounded-full">
                            <X size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <View className="p-6">
                        <Text className="text-slate-500 font-bold mb-4">Sélectionnez les clients cibles :</Text>

                        <View className="bg-white rounded-2xl border border-slate-200 h-2/3 mb-6">
                            <FlatList
                                data={clients}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => {
                                    const isSelected = selectedClients.has(item.id);
                                    return (
                                        <TouchableOpacity
                                            className={`flex-row items-center p-4 border-b border-slate-100 ${isSelected ? 'bg-blue-50' : ''}`}
                                            onPress={() => {
                                                const newSet = new Set(selectedClients);
                                                if (newSet.has(item.id)) newSet.delete(item.id);
                                                else newSet.add(item.id);
                                                setSelectedClients(newSet);
                                            }}
                                        >
                                            {isSelected ?
                                                <CheckSquare size={20} color="#1E40AF" className="mr-3" /> :
                                                <Square size={20} color="#CBD5E1" className="mr-3" />
                                            }
                                            <View>
                                                <Text className="font-bold text-slate-800">{item.name}</Text>
                                                <Text className="text-xs text-slate-400">{item.phone || item.email || 'Pas de contact'}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>

                        <View className="flex-row gap-4">
                            <TouchableOpacity
                                className="flex-1 bg-blue-600 p-4 rounded-xl flex-row items-center justify-center shadow-lg shadow-blue-200"
                                onPress={() => {
                                    const targets = clients.filter(c => selectedClients.has(c.id)).map(c => c.email).filter(Boolean);
                                    if (targets.length === 0) return Alert.alert('Erreur', 'Aucun email trouvé');
                                    Linking.openURL(`mailto:?bcc=${targets.join(',')}`);
                                }}
                            >
                                <MailIcon size={20} color="white" className="mr-2" />
                                <Text className="text-white font-bold">Email Groupé</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="flex-1 bg-indigo-600 p-4 rounded-xl flex-row items-center justify-center shadow-lg shadow-indigo-200"
                                onPress={() => {
                                    const targets = clients.filter(c => selectedClients.has(c.id)).map(c => c.phone).filter(Boolean);
                                    if (targets.length === 0) return Alert.alert('Erreur', 'Aucun numéro trouvé');
                                    Linking.openURL(`sms:${Platform.OS === 'ios' ? '&' : '?'}addresses=${targets.join(',')}`);
                                }}
                            >
                                <MessageSquare size={20} color="white" className="mr-2" />
                                <Text className="text-white font-bold">SMS Groupé</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
