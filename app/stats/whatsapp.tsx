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
    BarChart3,
    TrendingUp
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { BarChart } from 'react-native-gifted-charts';
import { format, subMonths, startOfMonth } from 'date-fns';
import { fr, enUS, ar } from 'date-fns/locale';

const screenWidth = Dimensions.get('window').width;

export default function WhatsAppStatsScreen() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        shares: 0,
        reminders: 0,
        recent: [] as any[],
        messages: [] as { id: string; type: string; created_at: string }[]
    });

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        setLoading(true);
        try {
            const { data: messages, error } = await supabase
                .from('whatsapp_messages')
                .select('id, type, created_at')
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
            
            <LinearGradient
                colors={['#059669', '#10b981']}
                className="pt-16 pb-24 px-6 rounded-b-[40px]"
            >
                <View className={`flex-row justify-between items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-white/20 p-3 rounded-2xl"
                    >
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-black">WhatsApp Stats</Text>
                    <View className="w-12" />
                </View>

                <View className="items-center">
                    <Text className="text-white/80 text-sm font-bold uppercase tracking-widest mb-1">{t('activity.sections.total') || 'TOTAL SENT'}</Text>
                    <Text className="text-white text-5xl font-black">{stats.total}</Text>
                </View>
            </LinearGradient>

            <ScrollView 
                className="flex-1 px-6 -mt-12" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Stats Cards */}
                <View className={`flex-row mb-6 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ gap: 12 }}>
                    <View className="flex-1 bg-white p-5 rounded-[32px] shadow-sm border border-slate-100">
                        <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center mb-3">
                            <Send size={20} color="#2563EB" />
                        </View>
                        <Text className="text-slate-400 text-[10px] font-black uppercase mb-1">{t('invoice_details.share_dialog', { number: '' }) || 'SHARES'}</Text>
                        <Text className="text-2xl font-black text-slate-800">{stats.shares}</Text>
                    </View>

                    <View className="flex-1 bg-white p-5 rounded-[32px] shadow-sm border border-slate-100">
                        <View className="w-10 h-10 bg-amber-50 rounded-xl items-center justify-center mb-3">
                            <Bell size={20} color="#D97706" />
                        </View>
                        <Text className="text-slate-400 text-[10px] font-black uppercase mb-1">{t('reminders.title') || 'REMINDERS'}</Text>
                        <Text className="text-2xl font-black text-slate-800">{stats.reminders}</Text>
                    </View>
                </View>

                {/* Distribution Chart (Simple Bars) */}
                <View className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6">
                    <View className="flex-row items-center mb-6">
                        <BarChart3 size={20} color="#64748B" />
                        <Text className="text-slate-800 font-bold ml-3">Distribution</Text>
                    </View>

                    <View className="mb-4">
                        <View className={`flex-row justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Text className="text-slate-600 text-xs font-bold">Invoice Shares</Text>
                            <Text className="text-slate-400 text-xs">{Math.round((stats.shares / (stats.total || 1)) * 100)}%</Text>
                        </View>
                        <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <View className="h-full bg-blue-500 rounded-full" style={{ width: `${(stats.shares / (stats.total || 1)) * 100}%` }} />
                        </View>
                    </View>

                    <View>
                        <View className={`flex-row justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Text className="text-slate-600 text-xs font-bold">Reminders</Text>
                            <Text className="text-slate-400 text-xs">{Math.round((stats.reminders / (stats.total || 1)) * 100)}%</Text>
                        </View>
                        <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <View className="h-full bg-amber-500 rounded-full" style={{ width: `${(stats.reminders / (stats.total || 1)) * 100}%` }} />
                        </View>
                    </View>
                </View>

                {/* Messages per month - T2.6 */}
                {barData.some(b => b.value > 0) && (
                    <View className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6">
                        <View className={`flex-row items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <BarChart3 size={20} color="#64748B" />
                            <Text className="text-slate-800 font-bold ml-3">{t('analytics.messages_per_month', { defaultValue: 'Messages per month' })}</Text>
                        </View>
                        <View className="overflow-hidden -ml-2">
                            <BarChart
                                data={barData}
                                width={screenWidth - 80}
                                height={180}
                                barWidth={28}
                                spacing={18}
                                roundedTop
                                roundedBottom
                                hideRules
                                xAxisLabelTextStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}
                                yAxisTextStyle={{ color: '#94a3b8', fontSize: 10 }}
                                noOfSections={4}
                                maxValue={Math.max(1, ...barData.map(b => b.value)) * 1.2}
                            />
                        </View>
                    </View>
                )}

                {/* Efficacité des relances - T2.6 */}
                <View className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6">
                    <View className={`flex-row items-center mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <TrendingUp size={20} color="#059669" />
                        <Text className="text-slate-800 font-bold ml-3">{t('reminders.title') ? `${t('reminders.title')} – ${t('analytics.efficiency', { defaultValue: 'Efficacité' })}` : 'Efficacité des relances'}</Text>
                    </View>
                    <View className="flex-row items-end justify-between">
                        <View>
                            <Text className="text-4xl font-black text-emerald-600">{reminderEffectiveness}%</Text>
                            <Text className="text-slate-500 text-xs mt-1">
                                {t('reminders.title')} / {t('activity.sections.total') || 'Total'} {t('analytics.messages', { defaultValue: 'messages' })}
                            </Text>
                        </View>
                        <View className="w-20 h-20 rounded-full border-4 border-emerald-200 items-center justify-center">
                            <Bell size={24} color="#059669" />
                        </View>
                    </View>
                </View>

                {/* Recent Activity */}
                <Text className={`text-slate-400 text-[10px] font-black uppercase mb-4 tracking-widest ml-1 ${isRTL ? 'text-right' : ''}`}>
                    {t('activity.sections.today') || 'RECENT LOGS'}
                </Text>
                
                {stats.recent.map((msg, idx) => (
                    <View key={msg.id} className="bg-white p-4 rounded-2xl mb-3 flex-row items-center border border-slate-50">
                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${msg.type === 'reminder' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                            {msg.type === 'reminder' ? <Bell size={18} color="#D97706" /> : <Send size={18} color="#2563EB" />}
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-800 text-xs font-medium" numberOfLines={1}>{msg.message}</Text>
                            <Text className="text-slate-400 text-[10px] mt-1">
                                {new Date(msg.created_at).toLocaleDateString()} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
