import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import {
    ArrowLeft,
    Send,
    Bell,
    TrendingUp,
    MessageCircle,
    Clock
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { BarChart } from 'react-native-gifted-charts';
import { format, subMonths, startOfMonth } from 'date-fns';
import { fr, enUS, ar } from 'date-fns/locale';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;

export default function WhatsAppStatsScreen() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        shares: 0,
        reminders: 0,
        recent: [] as any[],
        messages: [] as { id: string; type: string; message: string; created_at: string }[]
    });

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        setLoading(true);
        try {
            const { data: messages, error } = await supabase
                .from('whatsapp_messages')
                .select('id, type, message, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;
            const list = messages ?? [];

            const shares = list.filter(m => m.type === 'invoice_share').length;
            const reminders = list.filter(m => m.type === 'reminder').length;

            setStats({
                total: list.length,
                shares,
                reminders,
                recent: list.slice(0, 5),
                messages: list
            });
        } catch (err) {
            if (__DEV__) console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    }

    const dateLocale = language === 'fr-FR' ? fr : language === 'ar-SA' ? ar : enUS;

    const messagesByMonth = useMemo(() => {
        const now = new Date();
        const months: { key: string; label: string; total: number; reminders: number; shares: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = subMonths(now, i);
            const key = format(startOfMonth(d), 'yyyy-MM');
            const label = format(d, 'MMM', { locale: dateLocale });
            months.push({ key, label, total: 0, reminders: 0, shares: 0 });
        }
        for (const m of stats.messages) {
            const d = new Date(m.created_at);
            const key = format(startOfMonth(d), 'yyyy-MM');
            const month = months.find(mo => mo.key === key);
            if (month) {
                month.total += 1;
                if (m.type === 'reminder') month.reminders += 1;
                if (m.type === 'invoice_share') month.shares += 1;
            }
        }
        return months;
    }, [stats.messages, language]);

    const barData = useMemo(() =>
        messagesByMonth.map(m => ({
            value: m.total,
            label: m.label,
            frontColor: '#2563EB',
            topColor: '#3b82f6'
        })),
        [messagesByMonth]
    );

    const reminderEffectiveness = useMemo(() => {
        if (stats.total === 0) return 0;
        return Math.round((stats.reminders / stats.total) * 100);
    }, [stats.reminders, stats.total]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    const isRTL = language === 'ar-SA';

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />
            
            {/* Simple Header */}
            <LinearGradient
                colors={['#10b981', '#059669']}
                style={{ paddingTop: insets.top }}
                className="pb-8 px-6"
            >
                <View className={`flex-row justify-between items-center mb-6 mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-white/20 w-11 h-11 rounded-xl items-center justify-center"
                    >
                        <ArrowLeft size={22} color="white" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">WhatsApp Analytics</Text>
                    <View className="w-11" />
                </View>

                {/* Total Counter */}
                <View className="items-center py-4">
                    <Text className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">
                        {t('activity.sections.total') || 'Total Messages'}
                    </Text>
                    <Text className="text-white text-5xl font-bold">{stats.total}</Text>
                </View>
            </LinearGradient>

            <ScrollView 
                className="flex-1 px-6 -mt-4" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Stats Cards */}
                <View className={`flex-row mb-6 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ gap: 12 }}>
                    <View className="flex-1 bg-white p-5 rounded-3xl shadow-sm">
                        <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mb-3">
                            <Send size={22} color="#3B82F6" strokeWidth={2} />
                        </View>
                        <Text className="text-slate-500 text-xs font-semibold mb-1">
                            {t('invoice_details.share_dialog', { number: '' }) || 'Shares'}
                        </Text>
                        <Text className="text-slate-900 text-3xl font-bold">{stats.shares}</Text>
                        <Text className="text-slate-400 text-xs mt-1">
                            {Math.round((stats.shares / (stats.total || 1)) * 100)}% of total
                        </Text>
                    </View>

                    <View className="flex-1 bg-white p-5 rounded-3xl shadow-sm">
                        <View className="w-12 h-12 bg-amber-50 rounded-2xl items-center justify-center mb-3">
                            <Bell size={22} color="#F59E0B" strokeWidth={2} />
                        </View>
                        <Text className="text-slate-500 text-xs font-semibold mb-1">
                            {t('reminders.title') || 'Reminders'}
                        </Text>
                        <Text className="text-slate-900 text-3xl font-bold">{stats.reminders}</Text>
                        <Text className="text-slate-400 text-xs mt-1">
                            {Math.round((stats.reminders / (stats.total || 1)) * 100)}% of total
                        </Text>
                    </View>
                </View>

                {/* Monthly Chart */}
                {barData.some(b => b.value > 0) && (
                    <View className="bg-white p-6 rounded-3xl shadow-sm mb-6">
                        <Text className="text-slate-900 text-base font-bold mb-1">
                            {t('analytics.messages_per_month', { defaultValue: 'Monthly Activity' })}
                        </Text>
                        <Text className="text-slate-400 text-xs mb-6">Last 6 months</Text>
                        <View className="overflow-hidden">
                            <BarChart
                                data={barData}
                                width={screenWidth - 80}
                                height={180}
                                barWidth={32}
                                spacing={16}
                                roundedTop
                                roundedBottom
                                hideRules
                                xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 11, fontWeight: '600' }}
                                yAxisTextStyle={{ color: '#CBD5E1', fontSize: 10 }}
                                noOfSections={4}
                                maxValue={Math.max(1, ...barData.map(b => b.value)) * 1.2}
                                isAnimated
                            />
                        </View>
                    </View>
                )}

                {/* Effectiveness */}
                <View className="bg-white p-6 rounded-3xl shadow-sm mb-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <View>
                            <Text className="text-slate-900 text-base font-bold">Reminder Rate</Text>
                            <Text className="text-slate-400 text-xs">Effectiveness metric</Text>
                        </View>
                        <View className="w-16 h-16 bg-emerald-50 rounded-2xl items-center justify-center">
                            <TrendingUp size={28} color="#10B981" strokeWidth={2} />
                        </View>
                    </View>
                    <View className="flex-row items-end">
                        <Text className="text-emerald-600 text-5xl font-bold">{reminderEffectiveness}</Text>
                        <Text className="text-emerald-500 text-2xl font-bold mb-1">%</Text>
                    </View>
                    <Text className="text-slate-400 text-xs mt-2">
                        {stats.reminders} reminders out of {stats.total} messages
                    </Text>
                </View>

                {/* Recent Activity */}
                <View className="mb-4">
                    <Text className="text-slate-900 text-base font-bold mb-4">Recent Activity</Text>
                </View>
                
                {stats.recent.length > 0 ? (
                    stats.recent.map((msg) => (
                        <View key={msg.id} className="bg-white p-4 rounded-2xl mb-3 shadow-sm">
                            <View className={`flex-row items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                                    msg.type === 'reminder' ? 'bg-amber-100' : 'bg-blue-100'
                                }`}>
                                    {msg.type === 'reminder' ? (
                                        <Bell size={18} color="#F59E0B" strokeWidth={2} />
                                    ) : (
                                        <Send size={18} color="#3B82F6" strokeWidth={2} />
                                    )}
                                </View>
                                
                                <View className="flex-1">
                                    <Text className="text-slate-800 text-sm font-medium mb-1" numberOfLines={2}>
                                        {msg.message}
                                    </Text>
                                    <View className="flex-row items-center">
                                        <Clock size={12} color="#94A3B8" />
                                        <Text className="text-slate-400 text-xs ml-1">
                                            {new Date(msg.created_at).toLocaleDateString(language === 'fr-FR' ? 'fr-FR' : 'en-US', { 
                                                month: 'short', 
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <View className="bg-white rounded-2xl p-8 items-center">
                        <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-3">
                            <MessageCircle size={28} color="#94A3B8" />
                        </View>
                        <Text className="text-slate-500 text-sm font-medium">No messages yet</Text>
                        <Text className="text-slate-400 text-xs mt-1">Start sharing invoices</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
