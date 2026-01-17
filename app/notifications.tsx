import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, CheckCircle2, AlertCircle, Info, X, ArrowLeft, Trash2, CheckCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    is_read: boolean;
    created_at: string;
}

export default function NotificationsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, [user]);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error || !data || data.length === 0) {
                // Initial mock data if empty for demo purposes
                setNotifications([
                    { id: '1', title: 'Bienvenue sur QuickBill !', message: 'Félicitations ! Votre compte est activé. Vous pouvez dès à présent créer votre première facture.', type: 'success', is_read: false, created_at: new Date().toISOString() },
                    { id: '2', title: 'Profil incomplet', message: 'N\'oubliez pas d\'ajouter votre logo et vos coordonnées bancaires dans les paramètres.', type: 'warning', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
                    { id: '3', title: 'Mise à jour v2.5', message: 'Découvrez les nouvelles fonctionnalités de gestion d\'équipe et les rapports fiscaux.', type: 'info', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
                ]);
            } else {
                setNotifications(data);
            }
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        if (user) {
            await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
        }
    };

    const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

    const renderItem = ({ item }: { item: Notification }) => {
        let Icon = Info;
        let color = '#3B82F6';
        let bg = 'bg-blue-50';
        let borderColor = 'border-blue-100';

        if (item.type === 'success') { Icon = CheckCircle2; color = '#10B981'; bg = 'bg-emerald-50'; borderColor = 'border-emerald-100'; }
        if (item.type === 'warning') { Icon = AlertCircle; color = '#F59E0B'; bg = 'bg-amber-50'; borderColor = 'border-amber-100'; }
        if (item.type === 'error') { Icon = AlertCircle; color = '#EF4444'; bg = 'bg-red-50'; borderColor = 'border-red-100'; }

        return (
            <TouchableOpacity
                onPress={() => markAsRead(item.id)}
                className={`bg-white p-5 mb-4 rounded-[28px] border ${item.is_read ? 'border-slate-100' : `${borderColor} shadow-sm shadow-blue-500/5`} flex-row items-start relative overflow-hidden`}
                activeOpacity={0.7}
            >
                {!item.is_read && (
                    <View className="absolute top-0 left-0 bottom-0 w-1.5 bg-blue-600" />
                )}

                <View className={`p-3 rounded-2xl ${bg} mr-4`}>
                    <Icon size={22} color={color} strokeWidth={2.5} />
                </View>

                <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-1">
                        <Text className={`flex-1 text-sm font-black mr-2 ${item.is_read ? 'text-slate-500' : 'text-slate-900'}`} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: fr })}
                        </Text>
                    </View>
                    <Text className={`text-xs leading-5 ${item.is_read ? 'text-slate-400 font-medium' : 'text-slate-600 font-bold'}`}>
                        {item.message}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            <LinearGradient
                colors={['#1E40AF', '#1e3a8a']}
                className="pt-14 pb-10 px-6 rounded-b-[42px] shadow-2xl z-10"
            >
                <View className="flex-row justify-between items-center mb-6">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white/10 rounded-[14px] items-center justify-center border border-white/20"
                    >
                        <ArrowLeft size={20} color="white" strokeWidth={3} />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-2xl font-black text-white tracking-tight">Activity</Text>
                        <Text className="text-blue-200/60 text-[9px] font-black uppercase tracking-[2px] mt-0.5">Centre de contrôle</Text>
                    </View>
                    <TouchableOpacity
                        onPress={markAllAsRead}
                        className="w-10 h-10 bg-white/10 rounded-[14px] items-center justify-center border border-white/20"
                    >
                        <CheckCircle size={20} color="white" strokeWidth={2.5} />
                    </TouchableOpacity>
                </View>

                {/* Summary Card */}
                <View className="bg-white/10 p-4 rounded-[24px] border border-white/15 backdrop-blur-md flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-lg">
                            <Bell size={20} color="#1E40AF" strokeWidth={3} />
                        </View>
                        <View className="ml-3">
                            <Text className="text-white font-black text-base">{unreadCount} non lues</Text>
                            <Text className="text-blue-200/60 text-[8px] font-bold uppercase tracking-widest">Sur vos {notifications.length} notifications</Text>
                        </View>
                    </View>
                    <View className="bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/20">
                        <Text className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Direct</Text>
                    </View>
                </View>
            </LinearGradient>

            {loading ? (
                <View className="flex-1 items-center justify-center mt-10">
                    <ActivityIndicator size="large" color="#1E40AF" />
                    <Text className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Actualisation du flux...</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 mt-10 bg-white rounded-[40px] border border-dashed border-slate-200 mx-6">
                            <View className="bg-slate-50 p-6 rounded-full mb-4">
                                <Bell size={48} color="#CBD5E1" strokeWidth={1.5} />
                            </View>
                            <Text className="text-slate-900 font-black text-xl mb-1">Tout est à jour !</Text>
                            <Text className="text-slate-400 text-center px-12 font-medium">Vous n'avez aucune notification pour le moment.</Text>
                        </View>
                    }
                />
            )}

            {/* Clear All Floating Action */}
            {notifications.length > 0 && (
                <TouchableOpacity
                    className="absolute bottom-10 self-center bg-slate-900 px-8 py-4 rounded-full shadow-2xl flex-row items-center"
                    onPress={() => setNotifications([])}
                >
                    <Trash2 size={18} color="white" className="mr-2" />
                    <Text className="text-white font-black uppercase tracking-wider text-xs">Tout effacer</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
