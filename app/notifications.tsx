import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase'; // Ensure this path is correct
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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
            // Mocking data if table doesn't exist yet for smooth UI demo
            // Ideally: const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

            // Simulating fetch
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error || !data) {
                // Fallback mock
                setNotifications([
                    { id: '1', title: 'Bienvenue !', message: 'Bienvenue sur QuickBill. Configurez votre profil pour commencer.', type: 'info', is_read: false, created_at: new Date().toISOString() },
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
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    };

    const renderItem = ({ item }: { item: Notification }) => {
        let Icon = Info;
        let color = '#3B82F6';
        let bg = 'bg-blue-50';

        if (item.type === 'success') { Icon = CheckCircle2; color = '#22C55E'; bg = 'bg-green-50'; }
        if (item.type === 'warning') { Icon = AlertCircle; color = '#F59E0B'; bg = 'bg-amber-50'; }
        if (item.type === 'error') { Icon = AlertCircle; color = '#EF4444'; bg = 'bg-red-50'; }

        return (
            <TouchableOpacity
                onPress={() => markAsRead(item.id)}
                className={`bg-white p-4 mb-3 rounded-2xl border ${item.is_read ? 'border-slate-100 opacity-60' : 'border-blue-100 shadow-sm'}`}
            >
                <View className="flex-row items-start">
                    <View className={`p-2 rounded-full ${bg} mr-3`}>
                        <Icon size={20} color={color} />
                    </View>
                    <View className="flex-1">
                        <View className="flex-row justify-between items-start">
                            <Text className={`text-sm font-bold mb-1 ${item.is_read ? 'text-slate-600' : 'text-slate-900'}`}>{item.title}</Text>
                            <Text className="text-[10px] text-slate-400">
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: fr })}
                            </Text>
                        </View>
                        <Text className="text-slate-500 text-xs leading-5">{item.message}</Text>
                    </View>
                    {!item.is_read && (
                        <View className="w-2 h-2 rounded-full bg-blue-500 ml-2 mt-1" />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="pt-14 px-6 pb-4 bg-white flex-row justify-between items-center shadow-sm z-10">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                    <X size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text className="text-xl font-black text-slate-900">Notifications</Text>
                <View className="w-10" />
            </View>

            {/* Content */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#0F172A" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 24 }}
                    ListEmptyComponent={
                        <View className="items-center justify-center mt-20">
                            <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-4">
                                <Bell size={32} color="#94A3B8" />
                            </View>
                            <Text className="text-slate-400 font-medium">Aucune notification</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
