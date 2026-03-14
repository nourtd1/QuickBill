import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    ActivityIndicator,
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

const SCREEN_WIDTH = Dimensions.get('window').width;

import { InvoiceListSkeleton } from '../../components/InvoiceListSkeleton';

type InvoiceStatus = 'paid' | 'sent' | 'overdue' | 'draft' | 'pending_approval' | 'rejected' | 'all';

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
    const insets = useSafeAreaInsets();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<InvoiceStatus>('all');

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
                setInvoices(allInvoices || []);
            } else {
                const data = await getInvoices(profile?.id || '');
                setInvoices(data);
            }
        } catch (error) {
            console.error('Failed to fetch invoices', error);
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
            .filter(inv => inv.status !== 'paid' && inv.status !== 'PAID')
            .reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
        return { totalOutstanding };
    }, [invoices]);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const matchesSearch = inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (inv.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

            if (activeFilter === 'all') return matchesSearch;

            const status = inv.status.toUpperCase();
            if (activeFilter === 'pending_approval') return matchesSearch && status === 'PENDING_APPROVAL';
            return matchesSearch && status === activeFilter.toUpperCase();
        });
    }, [invoices, searchQuery, activeFilter]);

    // Custom Status Badge Style matching design
    const getStatusStyle = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PAID': return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: t('invoices.status.paid') };
            case 'SENT': return { bg: 'bg-blue-100', text: 'text-blue-700', label: t('invoices.status.sent') };
            case 'OVERDUE': return { bg: 'bg-red-100', text: 'text-red-600', label: t('invoices.status.overdue') };
            case 'PENDING': return { bg: 'bg-orange-100', text: 'text-orange-600', label: t('invoices.status.pending') }; 
            case 'DRAFT': return { bg: 'bg-slate-100', text: 'text-slate-600', label: t('invoices.status.draft') };
            default: return { bg: 'bg-slate-100', text: 'text-slate-600', label: status };
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const style = getStatusStyle(status);
        return (
            <View className={`px-3 py-1.5 rounded-lg ${style.bg}`}>
                <Text className={`text-[10px] font-bold ${style.text} uppercase tracking-wide`}>
                    {style.label}
                </Text>
            </View>
        );
    };

    const renderHeader = () => (
        <View className="px-6 pt-4 pb-2 z-10 bg-transparent">
            {/* Top Bar */}
            <View className="flex-row justify-between items-center mb-6 mt-4">
                <Text className="text-[36px] font-black text-slate-900 tracking-tight">{t('invoices.title')}</Text>
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={() => router.push('/invoice/new')}
                        className="bg-white w-12 h-12 rounded-[18px] items-center justify-center shadow-sm shadow-slate-200/50 border border-slate-100"
                    >
                        <Plus size={24} color="#1E40AF" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push('/activity')}
                        className="bg-white w-12 h-12 rounded-[18px] items-center justify-center shadow-sm shadow-slate-200/50 border border-slate-100 relative"
                    >
                        <Bell size={22} color="#0F172A" strokeWidth={2} />
                        <View className="absolute top-3.5 right-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search & Filter Bar */}
            <View className="flex-row gap-3 mb-6">
                <View className="flex-1 h-14 bg-white rounded-[22px] flex-row items-center px-5 shadow-sm shadow-slate-200/50 border border-slate-100">
                    <Search size={20} color="#94A3B8" strokeWidth={2.5} className="mr-2" />
                    <TextInput
                        className="flex-1 font-bold text-base text-slate-900 h-full"
                        placeholder={t('invoices.search_placeholder')}
                        placeholderTextColor="#CBD5E1"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity className="w-14 h-14 bg-slate-50 rounded-[22px] items-center justify-center shadow-sm shadow-slate-200/50 border border-slate-100">
                    <SlidersHorizontal size={20} color="#1E40AF" strokeWidth={2.5} />
                </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row mb-2 -mx-6 px-6"
                contentContainerStyle={{ paddingRight: 40 }}
            >
                {['all', 'paid', 'pending', 'overdue'].map((filter) => {
                    const isActive = activeFilter === filter || (filter === 'pending' && activeFilter === 'pending_approval');
                    return (
                        <TouchableOpacity
                            key={filter}
                            onPress={() => setActiveFilter(filter === 'pending' ? 'pending_approval' : filter as InvoiceStatus)}
                            className={`mr-3 py-2.5 px-6 rounded-full border transition-all ${isActive ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-500/30' : 'bg-white border-slate-100 shadow-sm shadow-slate-200/50'}`}
                        >
                            <Text className={`font-black uppercase tracking-widest text-[10px] ${isActive ? 'text-white' : 'text-slate-500'}`}>
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
            <View className="rounded-[32px] overflow-hidden shadow-2xl shadow-indigo-900/30 relative">
                <LinearGradient
                    colors={['#1e3a8a', '#1E40AF', '#3b82f6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-6 h-full w-full absolute inset-0"
                />

                {/* Decorative Elements */}
                <View className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
                <View className="absolute bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full" />

                <View className="p-6 relative">
                    <View className="flex-row justify-between items-start mb-4">
                        <Text className="text-[10px] font-black text-blue-100 uppercase tracking-widest mt-1">{t('invoices.total_outstanding')}</Text>
                        <View className="w-10 h-10 bg-white/20 rounded-[14px] items-center justify-center">
                            <Wallet size={20} color="white" strokeWidth={2.5} />
                        </View>
                    </View>

                    <Text className="text-[40px] font-black text-white tracking-tighter mb-1">
                        {formatCurrency(stats.totalOutstanding, profile?.currency || 'USD')}
                    </Text>

                    <View className="flex-row items-center mb-8">
                        <TrendingUp size={14} color="#FCA5A5" className="mr-1.5" strokeWidth={3} />
                        <Text className="text-white/80 text-[10px] font-black uppercase tracking-widest">
                            {t('invoices.unpaid_count')} <Text className="text-white">{invoices.filter(i => i.status === 'overdue' || i.status === 'sent').length}</Text>
                        </Text>
                    </View>

                    <TouchableOpacity
                        className="w-full bg-white h-14 rounded-[20px] flex-row items-center justify-center active:scale-[0.98] shadow-sm"
                        onPress={handleSendReminders}
                    >
                        <Send size={18} color="#1E40AF" className="mr-2" strokeWidth={2.5} />
                        <Text className="text-[#1E40AF] font-black text-sm uppercase tracking-widest">{t('invoices.send_reminders')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View className="items-center justify-center py-20 px-4">
            <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-6">
                <FileText size={32} color="#94a3b8" />
            </View>
            <Text className="text-xl font-bold text-slate-900 mb-2">{t('invoices.no_invoices')}</Text>
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

    // List Item matched to design
    const renderInvoiceItem = ({ item }: { item: any }) => {
        const customerName = item.customer?.name || 'Unknown Client';
        const date = new Date(item.created_at).toLocaleDateString(language === 'fr-FR' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return (
            <TouchableOpacity
                onPress={() => router.push(`/invoice/${item.id}`)}
                className="mx-6 mb-4 bg-white p-5 rounded-[24px] shadow-sm shadow-slate-200/50 border border-slate-100 flex-row items-center active:bg-slate-50/80"
            >
                <View className="mr-4 shadow-sm shadow-slate-200">
                    <ClientAvatar name={customerName} size={48} />
                </View>

                <View className="flex-1 mr-2">
                    <Text className="font-black text-slate-900 text-base mb-1 tracking-tight" numberOfLines={1}>{customerName}</Text>
                    <View className="flex-row items-center">
                        <Text className="text-xs text-slate-500 font-black">#{item.invoice_number}</Text>
                        <Text className="text-xs text-slate-300 mx-1.5">•</Text>
                        <Text className="text-xs text-slate-400 font-bold">{date}</Text>
                    </View>
                </View>

                <View className="items-end">
                    <Text className="font-black text-slate-900 text-lg mb-2 tracking-tighter">
                        {formatCurrency(item.total_amount, item.currency || profile?.currency || 'USD')}
                    </Text>
                    <StatusBadge status={item.status} />
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && invoices.length === 0) {
        return <InvoiceListSkeleton />;
    }

    return (
        <View className="flex-1 bg-white relative">
            <StatusBar style="dark" />

            {/* Background Decorative Elements */}
            <View className="absolute top-0 left-0 right-0 h-[45%] pointer-events-none">
                <LinearGradient
                    colors={['#DBEAFE', '#F8FAFC', '#ffffff']}
                    locations={[0, 0.4, 1]}
                    className="flex-1"
                />
                <View className="absolute -top-32 -right-32 w-96 h-96 bg-blue-400/10 rounded-full" />
                <View className="absolute top-20 -left-20 w-64 h-64 bg-indigo-400/10 rounded-full" />
            </View>

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
                                    <Text className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{t('invoices.recent_invoices')}</Text>
                                    <TouchableOpacity>
                                        <Text className="text-[#1E40AF] font-black text-[10px] uppercase tracking-widest">{t('common.view_all')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    }
                    ListFooterComponent={<View className="h-24" />}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
                    }
                    ListEmptyComponent={!loading ? renderEmptyState() : null}
                />

            </View>
        </View>
    );
}
