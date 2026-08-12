import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    Dimensions,

    Image,
    Alert,
    Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
    Plus,
    Search,
    FileText,
    Bell,
    SlidersHorizontal,
    Wallet,
    TrendingUp,
    Send,
    User,
    MoreHorizontal
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useOffline } from '../../context/OfflineContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/currencyEngine';
import { supabase } from '../../lib/supabase';
import { useTeamRole } from '../../hooks/useTeamRole';
import { useLanguage } from '../../context/LanguageContext';
import { useColorScheme } from 'nativewind';
import { COLORS, GRADIENTS } from '../../constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

import { InvoiceListSkeleton } from '../../components/InvoiceListSkeleton';

type InvoiceStatus = 'paid' | 'unpaid' | 'sent' | 'overdue' | 'draft' | 'pending_approval' | 'rejected' | 'all';

const StatusBadge = ({ bg, text, label }: { bg: string; text: string; label: string }) => (
    <View className={`flex-row items-center px-2.5 py-1 rounded-full ${bg}`}>
        <Text className={`text-[10px] font-bold tracking-tight ${text}`}>
            {label}
        </Text>
    </View>
);

// Component for Avatar Display
const ClientAvatar = ({ name, size = 48 }: { name: string, size?: number }) => {
    const initials = name
        ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '??';

    // Generate a consistent color based on name
    const colors = ['bg-indigo-100', 'bg-blue-100', 'bg-emerald-100', 'bg-amber-100', 'bg-purple-100', 'bg-pink-100'];
    const colorIndex = name.length % colors.length;
    const bgColor = colors[colorIndex];
    const textColor = bgColor.replace('100', '600').replace('bg-', 'text-');

    return (
        <View className={`${bgColor} rounded-full items-center justify-center`} style={{ width: size, height: size }}>
            <Text className={`font-bold text-base ${textColor}`}>{initials}</Text>
        </View>
    );
};

export default function InvoicesScreen() {
    const router = useRouter();
    const { getInvoices, isOffline } = useOffline();
    const { profile } = useAuth();
    const { t, language } = useLanguage();
    const { role, isOwner, isAdmin } = useTeamRole();
    const { colorScheme } = useColorScheme();
    const insets = useSafeAreaInsets();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<InvoiceStatus>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'amount'>('newest');

    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);
            if (!isOffline && profile?.id) {
                const { data: allInvoices, error: allErr } = await supabase
                    .from('invoices')
                    .select('*, customer:clients(*)')
                    .eq('user_id', profile.id)
                    .order('created_at', { ascending: false });

                if (allErr) throw allErr;
                if ((allInvoices || []).length > 0) {
                    setInvoices(allInvoices || []);
                } else {
                    // If Supabase is empty/out-of-sync, fallback to local SQLite
                    // so the user still sees their newly created invoices.
                    const localInvoices = await getInvoices(profile.id);
                    setInvoices(localInvoices);
                }
            } else {
                const data = await getInvoices(profile?.id || '');
                setInvoices(data);
            }
        } catch (error) {
            console.error('Failed to fetch invoices', error);
            // Supabase can be temporarily empty/out-of-sync (sync failures or schema cache delays).
            // In that case, fallback to local SQLite so the user sees their invoices immediately.
            try {
                if (profile?.id) {
                    const data = await getInvoices(profile.id);
                    setInvoices(data);
                }
            } catch (fallbackErr) {
                console.error('Failed to fetch local invoices fallback', fallbackErr);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getInvoices, profile?.id, isOffline]);

    useFocusEffect(
        useCallback(() => {
            fetchInvoices();
        }, [fetchInvoices])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchInvoices();
    };

    const stats = useMemo(() => {
        const totalOutstanding = invoices
            .filter(inv => inv.status !== 'paid')
            .reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
        return { totalOutstanding };
    }, [invoices]);

    const filteredInvoices = useMemo(() => {
        const filtered = invoices.filter(inv => {
            const matchesSearch = inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (inv.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

            if (activeFilter === 'all') return matchesSearch;

            const status = inv.status.toUpperCase();
            if (activeFilter === 'pending_approval') return matchesSearch && status === 'PENDING_APPROVAL';
            return matchesSearch && status === activeFilter.toUpperCase();
        });

        if (sortOrder === 'oldest') {
            return [...filtered].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        } else if (sortOrder === 'amount') {
            return [...filtered].sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0));
        }
        return filtered;
    }, [invoices, searchQuery, activeFilter, sortOrder]);

    // Custom Status Badge Style matching design
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', label: t('invoices.status.paid') };
            case 'unpaid': return { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', label: t('invoices.status.unpaid') };
            case 'sent': return { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', label: t('invoices.status.sent') };
            case 'overdue': return { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500', label: t('invoices.status.overdue') };
            case 'pending_approval': return { bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-500', label: t('invoices.status.pending') };
            case 'draft': return { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400', label: t('invoices.status.draft') };
            default: return { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400', label: status };
        }
    };


    const renderHeader = () => (
        <View className="px-6 pt-4 pb-2 z-10 bg-transparent">
            {/* Top Bar */}
            <View className="flex-row justify-between items-center mb-6 mt-4">
                <Text className="text-[36px] font-bold text-slate-900 dark:text-white tracking-tight" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{t('invoices.title')}</Text>
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={() => router.push('/invoice/new')}
                        accessibilityLabel={t('home.actions.invoice')}
                        accessibilityRole="button"
                        className="bg-white dark:bg-[#151a2e] w-12 h-12 rounded-xl items-center justify-center shadow-sm shadow-slate-200/50 dark:shadow-black/60 border border-slate-100 dark:border-white/10"
                    >
                        <Plus size={24} color={COLORS.primaryDark} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push('/activity')}
                        accessibilityLabel={t('home.notifications.title')}
                        accessibilityRole="button"
                        className="bg-white dark:bg-[#151a2e] w-11 h-11 rounded-full items-center justify-center shadow-sm shadow-slate-200/50 dark:shadow-black/60 border border-slate-100 dark:border-white/10 relative"
                    >
                        <Bell size={20} color={colorScheme === 'dark' ? '#F8FAFC' : '#0F172A'} strokeWidth={2} />
                        <View className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 rounded-full items-center justify-center border-2 border-white">
                            <Text className="text-white text-[8px] font-bold">!</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search & Filter Bar */}
            <View className="flex-row gap-3 mb-6">
                <View className="flex-1 h-14 bg-white dark:bg-[#151a2e] rounded-2xl flex-row items-center px-5 shadow-sm shadow-slate-200/50 dark:shadow-black/60 border border-slate-100 dark:border-white/10">
                    <Search size={20} color={COLORS.slate400} strokeWidth={2.5} className="mr-2" />
                    <TextInput
                        className="flex-1 font-medium text-base text-slate-900 dark:text-white h-full"
                        placeholder={t('invoices.search_placeholder')}
                        placeholderTextColor="#64748B"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity
                    onPress={handleSortPress}
                    accessibilityLabel={t('invoices.sort', { defaultValue: `Sort: ${sortOrder}` })}
                    accessibilityRole="button"
                    className="w-14 h-14 bg-slate-50 dark:bg-[#151a2e] rounded-2xl items-center justify-center shadow-sm shadow-slate-200/50 dark:shadow-black/60 border border-slate-100 dark:border-white/10"
                >
                    <SlidersHorizontal size={20} color={COLORS.primaryDark} strokeWidth={2.5} />
                </TouchableOpacity>
            </View>

            {/* Sort Indicator */}
            {sortOrder !== 'newest' && (
                <View className="flex-row mb-4">
                    <TouchableOpacity
                        onPress={() => setSortOrder('newest')}
                        className="flex-row items-center bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full"
                    >
                        <Text className="text-blue-700 dark:text-blue-300 text-[11px] font-semibold mr-1.5">
                            {sortOrder === 'oldest' ? t('invoices.sort_oldest', { defaultValue: 'Oldest first' }) : t('invoices.sort_amount', { defaultValue: 'Highest amount' })}
                        </Text>
                        <Text className="text-blue-400 dark:text-blue-500 text-[11px]">✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Filter Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row mb-2 -mx-6 px-6"
                contentContainerStyle={{ paddingRight: 40 }}
            >
                {['all', 'unpaid', 'paid', 'sent', 'overdue', 'pending'].map((filter) => {
                    const isActive = activeFilter === filter || (filter === 'pending' && activeFilter === 'pending_approval');
                    return (
                        <TouchableOpacity
                            key={filter}
                            onPress={() => setActiveFilter(filter === 'pending' ? 'pending_approval' : filter as InvoiceStatus)}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: isActive }}
                            accessibilityLabel={t(`invoices.filters.${filter}`)}
                            className={`mr-3 py-2.5 px-6 rounded-full border transition-all ${isActive ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-500/30' : 'bg-white dark:bg-[#151a2e] border-slate-100 dark:border-white/10 shadow-sm shadow-slate-200/50 dark:shadow-black/60'}`}
                        >
                            <Text className={`font-bold uppercase tracking-wide text-[11px] ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-300'}`}>
                                {t(`invoices.filters.${filter}`)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    const handleSendReminders = async () => {
        // Filter for unpaid invoices that might need reminding
        const unpaidInvoices = invoices.filter(inv =>
            (inv.status === 'overdue' || inv.status === 'sent' || inv.status === 'pending') &&
            inv.customer?.email
        );

        if (unpaidInvoices.length === 0) {
            Alert.alert(t('invoices.no_reminders_title', { defaultValue: 'No Reminders Needed' }), t('invoices.no_reminders_desc', { defaultValue: 'There are no unpaid invoices with client emails found.' }));
            return;
        }

        // Extract unique emails
        const emails = [...new Set(unpaidInvoices.map(inv => inv.customer.email))];

        if (emails.length === 0) {
            Alert.alert(t('invoices.missing_emails_title', { defaultValue: 'Missing Emails' }), t('invoices.missing_emails_desc', { defaultValue: 'Unpaid invoices found, but no client emails are attached.' }));
            return;
        }

        const subject = encodeURIComponent(`Payment Reminder - ${profile?.business_name || 'Invoices'}`);
        const body = encodeURIComponent("Dear Client,\n\nThis is a gentle reminder regarding outstanding invoices. Please check your dashboard or contact us for payment details.\n\nBest regards,");

        // Use BCC to protect privacy used in bulk
        const url = `mailto:?bcc=${emails.join(',')}&subject=${subject}&body=${body}`;

        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
        } else {
            Alert.alert(t('common.error'), t('invoices.email_client_error', { defaultValue: 'Could not open email client.' }));
        }
    };

    // EXACT Match for the purple gradient total card
    const renderTotalCard = () => (
        <View className="mx-6 mb-8 mt-2">
            <View className="rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/30 relative">
                <LinearGradient
                    colors={GRADIENTS.primaryButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-6 h-full w-full absolute inset-0"
                />

                <View className="p-6 relative">
                    <View className="flex-row justify-between items-start mb-4">
                        <Text className="text-xs font-semibold text-blue-100 uppercase tracking-wide mt-1">{t('invoices.total_outstanding')}</Text>
                        <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
                            <Wallet size={20} color="white" strokeWidth={2.5} />
                        </View>
                    </View>

                    <Text className="text-[40px] font-black text-white tracking-tighter mb-1" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                        {formatCurrency(stats.totalOutstanding, profile?.currency || 'USD')}
                    </Text>

                    <View className="flex-row items-center mb-8">
                        <TrendingUp size={14} color="#FCA5A5" className="mr-1.5" strokeWidth={3} />
                        <Text className="text-white/80 text-xs font-semibold uppercase tracking-wide">
                            {t('invoices.unpaid_count')} <Text className="text-white">{invoices.filter(i => i.status === 'overdue' || i.status === 'sent').length}</Text>
                        </Text>
                    </View>

                    <TouchableOpacity
                        className="w-full bg-white dark:bg-slate-800 h-14 rounded-2xl flex-row items-center justify-center active:scale-[0.98] shadow-sm"
                        onPress={handleSendReminders}
                    >
                        <Send size={18} color={COLORS.primaryDark} className="mr-2" strokeWidth={2.5} />
                        <Text className="text-[#1E40AF] font-bold text-sm uppercase tracking-wide">{t('invoices.send_reminders')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View className="items-center justify-center py-20 px-4">
            <View className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mb-6">
                <FileText size={32} color={COLORS.slate400} />
            </View>
            <Text className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{t('invoices.no_invoices')}</Text>
            <Text className="text-slate-500 font-medium text-center px-10">
                {t('invoices.empty_desc')}
            </Text>
            <TouchableOpacity
                onPress={() => { setActiveFilter('all'); setSearchQuery(''); }}
                className="mt-6 px-6 py-3 bg-slate-900 rounded-full"
            >
                <Text className="text-white font-bold text-sm">{t('invoices.clear_filters')}</Text>
            </TouchableOpacity>
        </View>
    );

    const handleMarkPaid = async (invoiceId: string) => {
        try {
            await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoiceId);
            fetchInvoices();
        } catch (error) {
            Alert.alert(t('common.error'), t('invoices.mark_paid_error', { defaultValue: 'Failed to update invoice status.' }));
        }
    };

    const handleLongPress = (item: any) => {
        const actions: any[] = [];
        if (item.status !== 'paid') {
            actions.push({ text: t('invoices.mark_paid', { defaultValue: 'Mark as Paid' }), onPress: () => handleMarkPaid(item.id) });
        }
        actions.push({ text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' });

        Alert.alert(
            item.customer?.name || 'Invoice',
            `#${item.invoice_number}`,
            actions
        );
    };

    const handleSortPress = () => {
        const next = sortOrder === 'newest' ? 'oldest' : sortOrder === 'oldest' ? 'amount' : 'newest';
        setSortOrder(next);
    };

    // List Item matched to design
    const renderInvoiceItem = ({ item }: { item: any }) => {
        const customerName = item.customer?.name || 'Unknown Client';
        const date = new Date(item.created_at).toLocaleDateString(language === 'fr-FR' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return (
            <TouchableOpacity
                onPress={() => router.push(`/invoice/${item.id}`)}
                onLongPress={() => handleLongPress(item)}
                accessibilityLabel={`${customerName} — ${formatCurrency(item.total_amount, item.currency || profile?.currency || 'USD')}`}
                accessibilityRole="button"
                className="mx-6 mb-4 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm shadow-slate-200/50 dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700/50 flex-row items-center active:bg-slate-50/80 dark:active:bg-slate-700/50"
            >
                <View className="mr-4 shadow-sm shadow-slate-200">
                    <ClientAvatar name={customerName} size={48} />
                </View>

                <View className="flex-1 mr-2">
                    <Text className="font-bold text-slate-900 dark:text-white text-base mb-1 tracking-tight" numberOfLines={1}>{customerName}</Text>
                    <View className="flex-row items-center">
                        <Text className="text-xs text-slate-500 font-semibold">#{item.invoice_number}</Text>
                        <Text className="text-xs text-slate-300 mx-1.5">•</Text>
                        <Text className="text-xs text-slate-500 font-medium">{date}</Text>
                    </View>
                </View>

                <View className="items-end">
                    <View className="flex-row items-center mb-2">
                        <Text className="font-black text-slate-900 dark:text-white text-lg tracking-tight">
                            {formatCurrency(item.total_amount, item.currency || profile?.currency || 'USD')}
                        </Text>
                        <TouchableOpacity
                            onPress={() => handleLongPress(item)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityLabel={t('invoices.actions', { defaultValue: 'Invoice actions' })}
                            className="ml-2 w-6 h-6 items-center justify-center"
                        >
                            <MoreHorizontal size={16} color={COLORS.slate400} />
                        </TouchableOpacity>
                    </View>
                    <StatusBadge {...getStatusStyle(item.status)} />
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && invoices.length === 0) {
        return <InvoiceListSkeleton />;
    }

    return (
        <View className="flex-1 bg-white dark:bg-[#0a0f1e] relative">
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />


            <View style={{ paddingTop: insets.top, flex: 1 }}>
                <FlatList
                    data={filteredInvoices}
                    keyExtractor={item => item.id}
                    renderItem={renderInvoiceItem}
                    ListHeaderComponent={
                        <>
                            <View>
                                {renderHeader()}
                                {renderTotalCard()}
                                <View className="flex-row justify-between items-center px-7 mb-4">
                                    <Text className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wide">{t('invoices.recent_invoices')}</Text>
                                    <TouchableOpacity
                                        accessibilityLabel={t('common.view_all')}
                                        accessibilityRole="button"
                                    >
                                        <Text className="text-[#1E40AF] font-bold text-[11px] uppercase tracking-wide">{t('common.view_all')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    }
                    ListFooterComponent={<View className="h-24" />}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                    ListEmptyComponent={!loading ? renderEmptyState() : null}
                />

            </View>
        </View>
    );
}
