import React, { useCallback, useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    Bell,
    TrendingUp,
    Plus,
    ScanLine,
    Users,
    Clock,
    ArrowUpRight,
    PenTool,
    Server,
    ShieldCheck,
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
import { useNotifications } from '../../hooks/useNotifications';
import { AppNotification as NotificationItem } from '../../types';
import { useColorScheme } from 'nativewind';
import { getInitials } from '../../lib/profile';
import { COLORS, GRADIENTS } from '../../constants/colors';

const OVERLAY_STYLE = { backgroundColor: 'rgba(0,0,0,0.15)' };


// --- Main Balance Card Component ---
const MainBalanceCard = ({ children, className, style }: { children: React.ReactNode, className?: string, style?: any }) => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <LinearGradient
            colors={isDark ? GRADIENTS.primaryCardDark : GRADIENTS.primaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className={`rounded-3xl overflow-hidden ${className || ''}`}
            style={[
                {
                    shadowColor: '#1e3a8a',
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.28,
                    shadowRadius: 24,
                    elevation: 8,
                },
                style
            ]}
        >
            <View className="p-6 relative">
                {children}
            </View>
        </LinearGradient>
    );
};

const ActivityItem = ({ icon: Icon, iconBg, iconColor, title, date, amount, status, statusColor, statusBg, isPositive = true }: any) => (
    <TouchableOpacity className="flex-row items-center p-4 bg-white dark:bg-[#1e293b] rounded-2xl mb-3 shadow-sm shadow-slate-200/50 dark:shadow-black/60 border border-slate-50 dark:border-slate-700/50 active:bg-slate-50 dark:active:bg-slate-700/40">
        <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${iconBg}`}>
            <Icon size={20} color={iconColor} />
        </View>
        <View className="flex-1">
            <Text className="text-slate-900 dark:text-slate-50 font-semibold text-sm tracking-tight">{title}</Text>
            <Text className="text-slate-500 dark:text-slate-300 text-xs font-medium mt-0.5">{date}</Text>
        </View>
        <View className="items-end">
            <Text className={`font-black text-base text-slate-900 dark:text-slate-50`} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {amount}
            </Text>
            {status && (
                <View className={`px-2 py-1 rounded-md mt-1 ${statusBg}`}>
                    <Text className={`text-[10px] font-semibold ${statusColor} dark:text-slate-100`}>{status}</Text>
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
    const { activities: notifications, unreadCount, markAllAsRead } = useNotifications();
    const [aiVisible, setAiVisible] = useState(false);
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [notificationsVisible, setNotificationsVisible] = useState(false);

    const onRefresh = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        refresh();
    }, [refresh]);

    const userName = profile?.business_name || profile?.full_name || 'User';

    // Real Data
    const upcomingInvoicesAmount = formatCurrency(pendingAmount, profile?.currency || 'USD');
    const monthlyGrowth = growth > 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
    const growthColor = growth >= 0 ? COLORS.success : COLORS.danger;

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
            title: exp.merchant || exp.category || 'Expense',
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

        if (status === 'paid') {
            statusBg = 'bg-emerald-100';
            statusColor = 'text-emerald-700';
            displayStatus = t('invoices.status.paid');
        } else if (status === 'overdue') {
            statusBg = 'bg-red-100';
            statusColor = 'text-red-700';
            displayStatus = t('invoices.status.overdue');
        } else if (status === 'sent') {
            statusBg = 'bg-blue-100';
            statusColor = 'text-blue-700';
            displayStatus = t('invoices.status.sent');
        } else if (status === 'draft') {
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
            // amount already carries its sign in `amountText`
            // (no extra '+' here, avoids "++").
            amountText: `${formatCurrency(item.amount, profile?.currency || 'USD')}`,
            status: displayStatus
        };
    };

    if (loading && !profile) {
        return <DashboardSkeleton />;
    }

    return (
        <View className="flex-1 bg-white dark:bg-[#0f172a] relative">
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Background Decorative Elements */}
            <View className="absolute top-0 left-0 right-0 h-[55%]">
                {isDark ? (
                    <>
                        <LinearGradient
                            colors={GRADIENTS.heroDark}
                            locations={[0, 0.5, 1]}
                            className="flex-1"
                        />
                        <View className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full dark:opacity-20" />
                        <View className="absolute top-40 -left-20 w-48 h-48 bg-blue-500/10 rounded-full dark:opacity-20" />
                    </>
                ) : (
                    <>
                        <LinearGradient
                            colors={GRADIENTS.heroLight}
                            locations={[0, 0.6, 1]}
                            className="flex-1"
                        />
                        <View className="absolute -top-32 -right-32 w-80 h-80 bg-blue-400/10 rounded-full" />
                        <View className="absolute top-40 -left-20 w-48 h-48 bg-indigo-400/10 rounded-full" />
                    </>
                )}
            </View>

            <View className="flex-1" style={{ paddingTop: insets.top }}>
                <ScrollView
                    className="flex-1 px-6 pt-2"
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Header - Pro Design */}
                    <View className="flex-row justify-between items-center mb-6 mt-4 z-20">
                        <View className="flex-row items-center">
                            <View className="relative mr-4">
                                <View className="w-14 h-14 rounded-xl border-[3px] border-white shadow-xl shadow-blue-300/40 overflow-hidden bg-white/80 dark:bg-slate-900">
                                    {profile?.logo_url ? (
                                        <Image
                                            source={{ uri: profile.logo_url }}
                                            className="w-full h-full"
                                        />
                                    ) : (
                                        <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-800">
                                            <Text className="text-base font-extrabold text-slate-500 dark:text-slate-400 tracking-wider">
                                                {getInitials(profile?.business_name || profile?.full_name || profile?.id || '')}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                {/* Online Status Dot */}
                                <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                            </View>

                            <View>
                                <Text className="text-blue-900/60 dark:text-slate-400 font-medium text-xs mb-0.5">
                                    {(() => {
                                        const hour = new Date().getHours();
                                        if (language === 'fr-FR') {
                                            return hour < 12 ? t('home.greeting.morning') : hour < 18 ? t('home.greeting.afternoon') : t('home.greeting.evening');
                                        }
                                        return hour < 12 ? t('home.greeting.morning') : hour < 18 ? t('home.greeting.afternoon') : t('home.greeting.evening');
                                    })()},
                                </Text>
                                <View className="flex-row items-center">
                                <Text className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight mr-2" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{userName}</Text>
                                    <LinearGradient
                                        colors={GRADIENTS.primaryCard}
                                        className="px-2 py-0.5 rounded-full"
                                    >
                                    <Text className="text-[10px] dark:text-white font-bold text-white uppercase tracking-wider">PRO</Text>
                                    </LinearGradient>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setNotificationsVisible(!notificationsVisible)}
                            accessibilityLabel={t('home.notifications.title')}
                            accessibilityRole="button"
                            className={`w-11 h-11 rounded-full items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 transition-all ${notificationsVisible ? 'bg-slate-900 dark:bg-slate-800' : 'bg-white dark:bg-slate-800'}`}
                        >
                            <Bell size={20} color={notificationsVisible ? 'white' : '#334155'} />
                            {unreadCount > 0 && (
                                <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full items-center justify-center border-2 border-white">
                                    <Text className="text-white text-[9px] font-bold">{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Hero Card / Main Balance Card */}
                    <MainBalanceCard className="mb-6">
                        <View className="min-h-[140px] justify-between">
                            <View className="flex-row justify-between items-start">
                                <Text className="text-white/70 font-semibold text-[11px] uppercase tracking-wider">{t('home.total_revenue')}</Text>
                                <View className="w-8 h-8 rounded-full bg-white/15 items-center justify-center border border-white/20">
                                    <TrendingUp size={16} color="white" />
                                </View>
                            </View>

                            <Text className="text-white text-[44px] font-[800] tracking-tighter my-2">
                                {formatCurrency(netProfit, profile?.currency || 'USD')}
                            </Text>

                            <View className="flex-row gap-3 mt-1">
                                <View className="bg-white/15 px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border border-white/20">
                                    <View className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <Text className="text-white text-[10px] font-semibold tracking-wider uppercase">+{growth.toFixed(0)}% {t('home.income_label')}</Text>
                                </View>
                            </View>
                        </View>
                    </MainBalanceCard>

                    {/* Stats Row */}
                    <View className="flex-row justify-between mb-8">
                        {/* Upcoming Invoices */}
                        <View className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 w-[48%] shadow-sm shadow-slate-200/50 dark:shadow-black/60 border border-slate-100 dark:border-slate-700/50">
                            <View className="w-10 h-10 rounded-xl bg-orange-100 items-center justify-center mb-4">
                                <Clock size={20} color={COLORS.warning} strokeWidth={2.5} />
                            </View>
                            <Text className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wide mb-1.5">{t('home.pending')}</Text>
                            <Text className="text-slate-900 dark:text-white text-xl font-black tracking-tight" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                                {upcomingInvoicesAmount}
                            </Text>
                        </View>

                        {/* Monthly Growth */}
                        <View className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 w-[48%] shadow-sm shadow-slate-200/50 dark:shadow-black/60 border border-slate-100 dark:border-slate-700/50">
                            <View className={`w-10 h-10 rounded-xl items-center justify-center mb-4 ${growth >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                <TrendingUp size={20} color={growthColor} strokeWidth={2.5} />
                            </View>
                            <Text className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wide mb-1.5">{t('home.growth')}</Text>
                            <View className="flex-row items-center">
                            <Text className="text-slate-900 dark:text-white text-xl font-black tracking-tight mr-1" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{monthlyGrowth}</Text>
                                <ArrowUpRight size={18} color={growthColor} strokeWidth={3} style={{ transform: [{ rotate: growth >= 0 ? '0deg' : '90deg' }] }} />
                            </View>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <Text className="text-slate-900 dark:text-slate-100 font-semibold text-xs uppercase tracking-wide mb-4 ml-1">{t('home.quick_actions')}</Text>
                    <View className="flex-row justify-between mb-8 px-1">
                        {/* Invoice */}
                        <TouchableOpacity
                            onPress={() => router.push('/invoice/new')}
                            accessibilityLabel={t('home.actions.invoice')}
                            accessibilityRole="button"
                            className="items-center"
                        >
                            <LinearGradient
                                colors={GRADIENTS.primaryCard}
                                className="w-16 h-16 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/40 mb-3"
                            >
                                <Plus size={28} color="white" strokeWidth={2.5} />
                            </LinearGradient>
                            <Text className="text-slate-600 dark:text-slate-300 font-semibold text-xs">{t('home.actions.invoice')}</Text>
                        </TouchableOpacity>

                        {/* Scan */}
                        <TouchableOpacity
                            onPress={() => router.push('/expenses/scan')}
                            accessibilityLabel={t('home.actions.scan')}
                            accessibilityRole="button"
                            className="items-center"
                        >
                            <View className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl items-center justify-center shadow-sm shadow-slate-200/50 dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700/50 mb-3">
                                <ScanLine size={24} color={COLORS.primaryDark} strokeWidth={2.5} />
                            </View>
                            <Text className="text-slate-600 dark:text-slate-300 font-semibold text-xs">{t('home.actions.scan')}</Text>
                        </TouchableOpacity>

                        {/* Clients */}
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/clients')}
                            accessibilityLabel={t('tabs.clients')}
                            accessibilityRole="button"
                            className="items-center"
                        >
                            <View className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl items-center justify-center shadow-sm shadow-slate-200/50 dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700/50 mb-3">
                                <Users size={24} color={COLORS.primaryDark} strokeWidth={2.5} />
                            </View>
                            <Text className="text-slate-600 dark:text-slate-300 font-semibold text-xs">{t('tabs.clients')}</Text>
                        </TouchableOpacity>

                        {/* Reconcile */}
                        <TouchableOpacity
                            onPress={() => router.push('/finance/reconcile')}
                            accessibilityLabel={t('home.actions.reconcile', { defaultValue: 'Reconcile' })}
                            accessibilityRole="button"
                            className="items-center"
                        >
                            <View className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl items-center justify-center shadow-sm shadow-slate-200/50 dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700/50 mb-3">
                                <ShieldCheck size={24} color={COLORS.primaryDark} strokeWidth={2.5} />
                            </View>
                            <Text className="text-slate-600 dark:text-slate-300 font-semibold text-xs">{t('home.actions.reconcile', { defaultValue: 'Reconcile' })}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Recent Activity */}
                    <View className="flex-row justify-between items-center mb-4 ml-1">
                            <Text className="text-slate-900 dark:text-white font-semibold text-xs uppercase tracking-wide">{t('home.recent_activity')}</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/invoices')}
                            accessibilityLabel={t('common.view_all')}
                            accessibilityRole="link"
                        >
                            <Text className="text-blue-600 dark:text-blue-300 font-bold text-[11px] uppercase tracking-wide">{t('common.view_all')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Activity List - Real Data */}
                    {activities.length > 0 ? activities.map((item, index) => {
                        const style = getActivityStyling(item);
                        return (
                            <ActivityItem
                                key={item.id ? `${item.type}-${item.id}` : `${item.type}-${index}`}
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
                        <TouchableOpacity
                            onPress={() => router.push('/invoice/new')}
                            activeOpacity={0.9}
                            className="bg-white dark:bg-[#1e293b] rounded-2xl border border-blue-100 dark:border-slate-700/50 shadow-sm mb-6 overflow-hidden"
                        >
                            <LinearGradient
                                colors={isDark ? ['rgba(30,64,175,0.08)', 'transparent'] : ['rgba(37,99,235,0.04)', 'transparent']}
                                className="p-6 items-center"
                            >
                                <View className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl items-center justify-center mb-4">
                                    <Plus size={24} color={COLORS.primary} strokeWidth={2.5} />
                                </View>
                                <Text className="text-slate-900 dark:text-white font-bold text-base mb-1">{t('home.getting_started.title', { defaultValue: 'Send your first invoice' })}</Text>
                                <Text className="text-slate-500 dark:text-slate-300 text-xs text-center px-6 mb-4">
                                    {t('home.getting_started.desc', { defaultValue: 'Create a professional invoice in under 60 seconds. Your activity will appear here.' })}
                                </Text>
                                <View className="bg-blue-600 px-5 py-2.5 rounded-full">
                                    <Text className="text-white font-bold text-xs">{t('home.getting_started.cta', { defaultValue: 'Create Invoice' })}</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                </ScrollView>
            </View>

            {/* Notification Popover - fixed overlay */}
            {notificationsVisible && (
                <>
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setNotificationsVisible(false)}
                        className="absolute inset-0 z-40"
                        style={OVERLAY_STYLE}
                    />
                    <View className="absolute z-50 right-6 left-6" style={{ top: insets.top + 64 }}>
                        <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl shadow-blue-900/15 border border-slate-100 dark:border-slate-700/50">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-lg font-semibold text-slate-900 dark:text-white">{t('home.notifications.title')}</Text>
                                {unreadCount > 0 && (
                                    <TouchableOpacity onPress={markAllAsRead}>
                                        <Text className="text-blue-600 dark:text-blue-300 font-semibold text-xs">{t('home.notifications.mark_all_read')}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View className="mb-2">
                                {notifications.length === 0 ? (
                                    <Text className="text-slate-500 dark:text-slate-300 text-center py-4">{t('home.notifications.empty')}</Text>
                                ) : (
                                    notifications.slice(0, 3).map((notif: any, idx: number) => (
                                        <TouchableOpacity
                                            key={notif.id}
                                            className={`flex-row ${idx === 2 ? 'mb-4' : 'mb-6'} relative`}
                                            onPress={() => {
                                                setNotificationsVisible(false);
                                                router.push('/notifications');
                                            }}
                                        >
                                            <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mr-4">
                                                <Bell size={20} color="#6366f1" />
                                            </View>
                                            <View className="flex-1 pr-4">
                                                <Text className="text-slate-900 dark:text-white font-semibold text-sm mb-0.5" numberOfLines={1}>{notif.title}</Text>
                                                <Text className="text-slate-500 dark:text-slate-300 text-xs leading-4 mb-2" numberOfLines={2}>
                                                    {notif.message}
                                                </Text>
                                                <Text className="text-slate-500 dark:text-slate-300 text-[10px] font-medium">
                                                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>
                                            {notif.read_status === 0 && (
                                                <View className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" />
                                            )}
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>

                            <View className="h-[1px] bg-slate-100 mb-4" />

                            <TouchableOpacity className="items-center py-2" onPress={() => { setNotificationsVisible(false); router.push('/notifications'); }}>
                                <Text className="text-blue-600 dark:text-blue-300 font-bold text-[11px] uppercase tracking-wide">{t('home.notifications.view_all')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            )}

            <AiVoiceAssistant visible={aiVisible} onClose={() => setAiVisible(false)} />
        </View>
    );
}
