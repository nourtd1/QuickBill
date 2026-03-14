import React, { useCallback, useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Dimensions,
    Image,
    Platform,
    ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    Bell,
    TrendingUp,
    Plus,
    ScanLine,
    Users,
    BarChart3,
    Clock,
    ArrowUpRight,
    Wallet,
    PenTool,
    Palette,
    Server,
    ShieldCheck,
    AlertTriangle,
    UserPlus
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import AiVoiceAssistant from '../../components/AiVoiceAssistant';
import { formatCurrency } from '../../lib/currencyEngine';
import { DashboardSkeleton } from '../../components/DashboardSkeleton';

const { width } = Dimensions.get('window');

// --- Main Balance Card Component (Glassmorphism) ---
const MainBalanceCard = ({ children, className, style }: { children: React.ReactNode, className?: string, style?: any }) => {
    return (
        <View
            className={`bg-white/70 rounded-[32px] overflow-hidden border border-white/60 ${className || ''}`}
            style={[
                {
                    shadowColor: '#1313EC',
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.08,
                    shadowRadius: 24,
                    elevation: 4,
                },
                style
            ]}
        >
            <LinearGradient
                colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.3)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0 pointer-events-none"
            />
            {/* Decorative inner circles for GlassCard */}
            <View className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50/40 rounded-full pointer-events-none" />
            <View className="absolute bottom-10 -left-10 w-32 h-32 bg-indigo-50/30 rounded-full pointer-events-none" />
            
            <View className="p-6 relative">
                {children}
            </View>
        </View>
    );
};

const ActivityItem = ({ icon: Icon, iconBg, iconColor, title, date, amount, status, statusColor, statusBg, isPositive = true }: any) => (
    <TouchableOpacity className="flex-row items-center p-4 bg-white rounded-[24px] mb-3 shadow-sm shadow-slate-200/50 border border-slate-50 active:bg-slate-50">
        <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${iconBg}`}>
            <Icon size={20} color={iconColor} />
        </View>
        <View className="flex-1">
            <Text className="text-slate-900 font-bold text-sm tracking-tight">{title}</Text>
            <Text className="text-slate-400 text-xs font-bold mt-0.5">{date}</Text>
        </View>
        <View className="items-end">
            <Text className={`font-bold text-base ${isPositive ? 'text-slate-900' : 'text-slate-900'}`}>
                {isPositive ? '+' : ''}{amount}
            </Text>
            {status && (
                <View className={`px-2 py-1 rounded-md mt-1 ${statusBg}`}>
                    <Text className={`text-[10px] font-bold ${statusColor}`}>{status}</Text>
                </View>
            )}
        </View>
    </TouchableOpacity>
);

export default function Dashboard() {
    const router = useRouter();
    const { profile } = useAuth();
    const { t, language } = useLanguage();
    const { netProfit, loading, refresh, pendingAmount, growth, invoices, recentExpenses } = useDashboard(); // Connected to Real Data
    const [aiVisible, setAiVisible] = useState(false);
    const insets = useSafeAreaInsets();

    const [notificationsVisible, setNotificationsVisible] = useState(false);

    const onRefresh = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        refresh();
    }, [refresh]);

    const userName = profile?.business_name || 'James';

    // Real Data
    const upcomingInvoicesAmount = formatCurrency(pendingAmount, profile?.currency || 'USD');
    const monthlyGrowth = growth > 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
    const growthColor = growth >= 0 ? '#10B981' : '#EF4444';

    // Combine and sort activities from invoices and expenses
    const activities = useMemo(() => {
        const invs = (invoices || []).map(inv => ({
            id: inv.id,
            type: 'invoice',
            title: (Array.isArray(inv.customer) ? inv.customer[0]?.name : inv.customer?.name) || 'Unknown Client',
            date: new Date(inv.created_at).toLocaleDateString(language === 'fr-FR' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            dateObj: new Date(inv.created_at),
            amount: inv.total_amount,
            status: inv.status,
            isPositive: true
        }));

        const exps = (recentExpenses || []).map(exp => ({
            id: exp.id,
            type: 'expense',
            title: exp.category || 'Expense',
            date: new Date(exp.date || exp.created_at).toLocaleDateString(language === 'fr-FR' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            dateObj: new Date(exp.date || exp.created_at),
            amount: exp.amount,
            status: 'Expensed',
            isPositive: false
        }));

        return [...invs, ...exps]
            .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
            .slice(0, 5);
    }, [invoices, recentExpenses]);

    const getActivityStyling = (item: any) => {
        if (item.type === 'expense') {
            return {
                icon: Server,
                iconBg: 'bg-pink-100',
                iconColor: '#DB2777',
                statusBg: 'bg-slate-100',
                statusColor: 'text-slate-600',
                amountText: `-${formatCurrency(item.amount, profile?.currency || 'USD')}`,
                status: t('invoices.status.expensed')
            };
        }

        const status = (item.status || '').toUpperCase();
        let statusBg = 'bg-orange-100';
        let statusColor = 'text-orange-700';
        let displayStatus = t('invoices.status.pending');

        if (status === 'PAID') {
            statusBg = 'bg-emerald-100';
            statusColor = 'text-emerald-700';
            displayStatus = t('invoices.status.paid');
        } else if (status === 'OVERDUE') {
            statusBg = 'bg-red-100';
            statusColor = 'text-red-700';
            displayStatus = t('invoices.status.overdue');
        } else if (status === 'SENT') {
            statusBg = 'bg-blue-100';
            statusColor = 'text-blue-700';
            displayStatus = t('invoices.status.sent');
        } else if (status === 'DRAFT') {
            statusBg = 'bg-slate-100';
            statusColor = 'text-slate-600';
            displayStatus = t('invoices.status.draft');
        }

        return {
            icon: PenTool,
            iconBg: 'bg-indigo-100',
            iconColor: '#4F46E5',
            statusBg,
            statusColor,
            amountText: `+${formatCurrency(item.amount, profile?.currency || 'USD')}`,
            status: displayStatus
        };
    };

    if (loading && !profile) {
        return <DashboardSkeleton />;
    }

    return (
        <View className="flex-1 bg-white relative">
            <StatusBar style="dark" />

            {/* Background Decorative Elements */}
            <View className="absolute top-0 left-0 right-0 h-[55%]">
                <LinearGradient
                    colors={['#DBEAFE', '#F8FAFC', '#ffffff']}
                    locations={[0, 0.6, 1]}
                    className="flex-1"
                />
                <View className="absolute -top-32 -right-32 w-80 h-80 bg-blue-400/10 rounded-full" />
                <View className="absolute top-40 -left-20 w-48 h-48 bg-indigo-400/10 rounded-full" />
            </View>

            <View className="flex-1" style={{ paddingTop: insets.top }}>
                <ScrollView
                    className="flex-1 px-6 pt-2"
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#2563EB" />}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Header - Pro Design */}
                    <View className="flex-row justify-between items-center mb-6 mt-4 z-20">
                        <View className="flex-row items-center">
                            <View className="relative mr-4">
                                <View className="w-14 h-14 rounded-[18px] border-[3px] border-white shadow-xl shadow-blue-300/40 overflow-hidden">
                                    <Image
                                        source={{ uri: profile?.logo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop' }}
                                        className="w-full h-full"
                                    />
                                </View>
                                {/* Online Status Dot */}
                                <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                            </View>

                            <View>
                                <Text className="text-blue-900/60 font-black text-[10px] uppercase tracking-widest mb-0.5">
                                    {(() => {
                                        const hour = new Date().getHours();
                                        if (language === 'fr-FR') {
                                            return hour < 12 ? t('home.greeting.morning') : hour < 18 ? t('home.greeting.afternoon') : t('home.greeting.evening');
                                        }
                                        return hour < 12 ? t('home.greeting.morning') : hour < 18 ? t('home.greeting.afternoon') : t('home.greeting.evening');
                                    })()},
                                </Text>
                                <View className="flex-row items-center">
                                    <Text className="text-slate-900 text-2xl font-black tracking-tight mr-2">{userName}</Text>
                                    <LinearGradient
                                        colors={['#1E40AF', '#1e3a8a']}
                                        className="px-2 py-0.5 rounded-full"
                                    >
                                        <Text className="text-[10px] font-black text-white uppercase tracking-widest">PRO</Text>
                                    </LinearGradient>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setNotificationsVisible(!notificationsVisible)}
                            className={`w-12 h-12 rounded-full items-center justify-center shadow-sm border border-slate-100 transition-all ${notificationsVisible ? 'bg-slate-900' : 'bg-white'}`}
                        >
                            <Bell size={22} color={notificationsVisible ? 'white' : '#334155'} />
                            {/* Notification Dot */}
                            <View className="absolute top-3 right-3.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                        </TouchableOpacity>
                    </View>

                    {/* Notification Popover Overlay */}
                    {notificationsVisible && (
                        <View className="absolute top-24 right-6 left-6 z-50">
                            <View className="bg-white rounded-[32px] p-6 shadow-2xl shadow-blue-900/15 border border-slate-100">
                                <View className="flex-row justify-between items-center mb-6">
                                    <Text className="text-lg font-bold text-slate-900">{t('home.notifications.title')}</Text>
                                    <TouchableOpacity>
                                        <Text className="text-blue-600 font-bold text-xs">{t('home.notifications.mark_all_read')}</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Notification Items */}
                                <View className="mb-2">
                                    {/* Item 1 */}
                                    <TouchableOpacity className="flex-row mb-6 relative">
                                        <View className="w-12 h-12 rounded-full bg-emerald-100 items-center justify-center mr-4">
                                            <Wallet size={20} color="#10B981" />
                                        </View>
                                        <View className="flex-1 pr-4">
                                            <View className="flex-row justify-between items-start">
                                                <Text className="text-slate-900 font-bold text-sm mb-0.5">{t('home.notifications.paid_title')}</Text>
                                                <View className="w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
                                            </View>
                                            <Text className="text-slate-500 text-xs leading-4 mb-1">{t('home.notifications.paid_msg', { number: '1024', amount: '$1,200.00' })}</Text>
                                            <Text className="text-slate-400 text-[10px] font-bold">{t('home.notifications.time_ago', { count: 2, unit: language === 'fr-FR' ? 'min' : 'min' })}</Text>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Item 2 */}
                                    <TouchableOpacity className="flex-row mb-6 bg-transparent">
                                        <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center mr-4">
                                            <AlertTriangle size={20} color="#F59E0B" />
                                        </View>
                                        <View className="flex-1 pr-4">
                                            <View className="flex-row justify-between items-start">
                                                <Text className="text-slate-900 font-bold text-sm mb-0.5">{t('home.notifications.subscription_title')}</Text>
                                                <View className="w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
                                            </View>
                                            <Text className="text-slate-500 text-xs leading-4 mb-1">{t('home.notifications.subscription_msg', { days: 3 })}</Text>
                                            <Text className="text-slate-400 text-[10px] font-bold">{t('home.notifications.time_ago', { count: 1, unit: language === 'fr-FR' ? 'heure' : 'hour' })}</Text>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Item 3 */}
                                    <TouchableOpacity className="flex-row mb-4 bg-transparent">
                                        <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
                                            <UserPlus size={20} color="#2563EB" />
                                        </View>
                                        <View className="flex-1 pr-4">
                                            <Text className="text-slate-900 font-bold text-sm mb-0.5">{t('home.notifications.client_added_title')}</Text>
                                            <Text className="text-slate-500 text-xs leading-4 mb-1">{t('home.notifications.client_added_msg', { name: 'Design Studio Ltd' })}</Text>
                                            <Text className="text-slate-400 text-[10px] font-bold">{t('home.notifications.time_ago', { count: 5, unit: language === 'fr-FR' ? 'heures' : 'hours' })}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <View className="h-[1px] bg-slate-100 mb-4" />

                                <TouchableOpacity className="items-center py-2" onPress={() => router.push('/activity')}>
                                    <Text className="text-slate-500 font-bold text-xs">{t('home.notifications.view_all')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Hero Card / Main Balance Card */}
                    <MainBalanceCard className="mb-6">
                        <View className="min-h-[140px] justify-between">
                            <View className="flex-row justify-between items-start">
                                <Text style={{ color: '#4B5563' }} className="font-medium text-[11px] uppercase tracking-widest">{t('home.total_revenue')}</Text>
                                <View className="w-8 h-8 rounded-full bg-blue-50/80 items-center justify-center border border-blue-100">
                                    <TrendingUp size={16} color="#1313EC" />
                                </View>
                            </View>

                            <Text style={{ color: '#1313EC' }} className="text-[44px] font-[800] tracking-tighter my-2">
                                {formatCurrency(netProfit, profile?.currency || 'USD')}
                            </Text>

                            <View className="flex-row gap-3 mt-1">
                                <View className="bg-emerald-50/80 px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border border-emerald-100">
                                    <View className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                                    <Text className="text-emerald-700 text-[10px] font-bold tracking-widest uppercase">+{growth.toFixed(0)}% {t('home.income_label')}</Text>
                                </View>
                            </View>
                        </View>
                    </MainBalanceCard>

                    {/* Stats Row */}
                    <View className="flex-row justify-between mb-8">
                        {/* Upcoming Invoices */}
                        <View className="bg-white rounded-[24px] p-5 w-[48%] shadow-sm shadow-slate-200/50 border border-slate-100">
                            <View className="w-10 h-10 rounded-xl bg-orange-100 items-center justify-center mb-4">
                                <Clock size={20} color="#F97316" strokeWidth={2.5} />
                            </View>
                            <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1.5">{t('home.pending')}</Text>
                            <Text className="text-slate-900 text-xl font-black tracking-tight" numberOfLines={1}>
                                {upcomingInvoicesAmount}
                            </Text>
                        </View>

                        {/* Monthly Growth */}
                        <View className="bg-white rounded-[24px] p-5 w-[48%] shadow-sm shadow-slate-200/50 border border-slate-100">
                            <View className={`w-10 h-10 rounded-xl items-center justify-center mb-4 ${growth >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                <TrendingUp size={20} color={growthColor} strokeWidth={2.5} />
                            </View>
                            <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1.5">{t('home.growth')}</Text>
                            <View className="flex-row items-center">
                                <Text className="text-slate-900 text-xl font-black tracking-tight mr-1">{monthlyGrowth}</Text>
                                <ArrowUpRight size={18} color={growthColor} strokeWidth={3} style={{ transform: [{ rotate: growth >= 0 ? '0deg' : '90deg' }] }} />
                            </View>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <Text className="text-slate-900 font-black text-xs uppercase tracking-widest mb-4 ml-1">{t('home.quick_actions')}</Text>
                    <View className="flex-row justify-between mb-8 px-1">
                        {/* Invoice */}
                        <TouchableOpacity
                            onPress={() => router.push('/invoice/new')}
                            className="items-center"
                        >
                            <LinearGradient
                                colors={['#1E40AF', '#1e3a8a']}
                                className="w-16 h-16 rounded-[20px] items-center justify-center shadow-lg shadow-blue-500/40 mb-3"
                            >
                                <Plus size={28} color="white" strokeWidth={2.5} />
                            </LinearGradient>
                            <Text className="text-slate-600 font-black text-[10px] uppercase tracking-widest">{t('home.actions.invoice')}</Text>
                        </TouchableOpacity>

                        {/* Scan */}
                        <TouchableOpacity
                            onPress={() => router.push('/expenses/scan')}
                            className="items-center"
                        >
                            <View className="w-16 h-16 bg-white rounded-[20px] items-center justify-center shadow-sm shadow-slate-200 border border-slate-100 mb-3">
                                <ScanLine size={24} color="#1E40AF" strokeWidth={2.5} />
                            </View>
                            <Text className="text-slate-600 font-black text-[10px] uppercase tracking-widest">{t('home.actions.scan')}</Text>
                        </TouchableOpacity>

                        {/* Clients */}
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/clients')}
                            className="items-center"
                        >
                            <View className="w-16 h-16 bg-white rounded-[20px] items-center justify-center shadow-sm shadow-slate-200 border border-slate-100 mb-3">
                                <Users size={24} color="#1E40AF" strokeWidth={2.5} />
                            </View>
                            <Text className="text-slate-600 font-black text-[10px] uppercase tracking-widest">{t('tabs.clients')}</Text>
                        </TouchableOpacity>

                        {/* Verify */}
                        <TouchableOpacity
                            onPress={() => router.push('/finance/reconcile')}
                            className="items-center"
                        >
                            <View className="w-16 h-16 bg-white rounded-[20px] items-center justify-center shadow-sm shadow-slate-200 border border-slate-100 mb-3">
                                <ShieldCheck size={24} color="#1E40AF" strokeWidth={2.5} />
                            </View>
                            <Text className="text-slate-600 font-black text-[10px] uppercase tracking-widest">{t('home.actions.verify')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Recent Activity */}
                    <View className="flex-row justify-between items-center mb-4 ml-1">
                        <Text className="text-slate-900 font-black text-xs uppercase tracking-widest">{t('home.recent_activity')}</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/invoices')}>
                            <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest">{t('common.view_all')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Activity List - Real Data */}
                    {activities.length > 0 ? activities.map((item, index) => {
                        const style = getActivityStyling(item);
                        return (
                            <ActivityItem
                                key={item.id || index}
                                icon={style.icon}
                                iconBg={style.iconBg}
                                iconColor={style.iconColor}
                                title={item.title}
                                date={item.date}
                                amount={style.amountText}
                                status={style.status}
                                statusBg={style.statusBg}
                                statusColor={style.statusColor}
                                isPositive={item.isPositive}
                            />
                        );
                    }) : (
                        <View className="items-center py-8 bg-white rounded-[24px] border border-slate-50 shadow-sm mb-6">
                            <Clock size={32} color="#CBD5E1" className="mb-3" />
                            <Text className="text-slate-900 font-bold mb-1">{t('home.empty_activity.title')}</Text>
                            <Text className="text-slate-500 text-xs text-center px-10">
                                {t('home.empty_activity.desc')}
                            </Text>
                        </View>
                    )}

                </ScrollView>
            </View>

            <AiVoiceAssistant visible={aiVisible} onClose={() => setAiVisible(false)} />
        </View>
    );
}
