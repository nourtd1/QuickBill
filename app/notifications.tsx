import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
    ArrowLeft, 
    Bell, 
    CheckCheck, 
    Trash2, 
    Banknote, 
    FileText, 
    ShieldAlert, 
    Info,
    Clock
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { 
    getNotificationsLocal, 
    markNotificationAsReadLocal, 
    markAllNotificationsAsReadLocal, 
    deleteNotificationLocal,
    LocalNotification 
} from '../lib/localServices';
import { useColorScheme } from 'nativewind';
import { format, isToday, isYesterday } from 'date-fns';

const NotificationIcon = ({ type, read }: { type: string, read: boolean }) => {
    let Icon = Bell;
    let color = '#3b82f6'; // Blue
    let bg = 'bg-blue-50';

    switch (type) {
        case 'payment':
            Icon = Banknote;
            color = '#10b981'; // Emerald
            bg = 'bg-emerald-50';
            break;
        case 'invoice':
            Icon = FileText;
            color = '#6366f1'; // Indigo
            bg = 'bg-indigo-50';
            break;
        case 'system':
            Icon = ShieldAlert;
            color = '#f59e0b'; // Amber
            bg = 'bg-amber-50';
            break;
    }

    return (
        <View className={`w-12 h-12 rounded-2xl items-center justify-center ${read ? 'bg-slate-50' : bg}`}>
            <Icon size={24} color={read ? '#94a3b8' : color} />
        </View>
    );
};

export default function NotificationsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<LocalNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        if (!user) return;
        try {
            const data = await getNotificationsLocal(user.id);
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string, read: boolean) => {
        if (read) return;
        try {
            await markNotificationAsReadLocal(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_status: 1 as const } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user) return;
        try {
            await markAllNotificationsAsReadLocal(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, read_status: 1 as const })));
            Alert.alert('Success', 'All notifications marked as read');
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteNotificationLocal(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const groupNotifications = (items: LocalNotification[]) => {
        const groups: { [key: string]: LocalNotification[] } = {
            'Today': [],
            'Yesterday': [],
            'Earlier': []
        };

        items.forEach(item => {
            const date = new Date(item.created_at);
            if (isToday(date)) {
                groups['Today'].push(item);
            } else if (isYesterday(date)) {
                groups['Yesterday'].push(item);
            } else {
                groups['Earlier'].push(item);
            }
        });

        return Object.entries(groups).filter(([_, list]) => list.length > 0);
    };

    const grouped = groupNotifications(notifications);

    return (
        <View className="flex-1 bg-white dark:bg-[#0a0f1e]">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            {/* Header Background */}
            <View className="absolute top-0 left-0 right-0 h-64">
                <LinearGradient
                    colors={isDark ? ['#020617', '#020617', '#020617'] : ['#1e293b', '#334155', 'white']}
                    className="flex-1"
                />
            </View>

            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="flex-1 px-6">
                    {/* Top Navigation */}
                    <View className="flex-row justify-between items-center py-4 mb-6">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20"
                        >
                            <ArrowLeft size={20} color="white" />
                        </TouchableOpacity>
                        
                        <Text className="text-xl font-black text-white">Notifications</Text>

                        <TouchableOpacity
                            onPress={handleMarkAllAsRead}
                            className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20"
                        >
                            <CheckCheck size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#1e293b" className="mt-20" />
                    ) : notifications.length === 0 ? (
                        <View className="flex-1 items-center justify-center mb-20">
                            <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
                                <Bell size={40} color="#cbd5e1" />
                            </View>
                            <Text className="text-slate-900 font-bold text-xl mb-2">No notifications yet</Text>
                            <Text className="text-slate-400 text-center px-10">We'll let you know when something important happens.</Text>
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {grouped.map(([title, list]) => (
                                <View key={title} className="mb-6">
                                    <View className="flex-row items-center mb-4 ml-1">
                                        <Text className="text-slate-400 text-xs font-black uppercase tracking-widest">{title}</Text>
                                        <View className="h-[1px] bg-slate-100 flex-1 ml-4" />
                                    </View>

                                    {list.map((item) => (
                                        <View key={item.id} className="relative mb-3">
                                            <TouchableOpacity
                                                onPress={() => handleMarkAsRead(item.id, item.read_status === 1)}
                                                className={`flex-row p-4 rounded-[24px] border ${item.read_status === 0 ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50/50 border-transparent'}`}
                                            >
                                                <NotificationIcon type={item.type} read={item.read_status === 1} />
                                                
                                                <View className="flex-1 ml-4 pr-2">
                                                    <View className="flex-row justify-between items-start mb-1">
                                                        <Text className={`text-sm font-bold flex-1 ${item.read_status === 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                                                            {item.title}
                                                        </Text>
                                                        <Text className="text-[10px] text-slate-400 font-medium ml-2">
                                                            {format(new Date(item.created_at), 'HH:mm')}
                                                        </Text>
                                                    </View>
                                                    <Text className={`text-xs leading-4 ${item.read_status === 0 ? 'text-slate-600' : 'text-slate-400'}`}>
                                                        {item.message}
                                                    </Text>
                                                </View>

                                                {item.read_status === 0 && (
                                                    <View className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
                                                )}
                                            </TouchableOpacity>

                                            <View className="absolute -right-2 top-0 bottom-3 justify-center">
                                                <TouchableOpacity 
                                                    onPress={() => handleDelete(item.id)}
                                                    className="w-8 h-8 rounded-full bg-rose-50 items-center justify-center border border-rose-100"
                                                >
                                                    <Trash2 size={14} color="#f43f5e" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ))}
                            <View className="h-10" />
                        </ScrollView>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}
