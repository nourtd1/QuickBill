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
    SafeAreaView,
    Image,
    Alert,
    Linking
} from 'react-native';
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

const SCREEN_WIDTH = Dimensions.get('window').width;

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
    const { role, isOwner, isAdmin } = useTeamRole();
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
            case 'PAID': return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'PAID' };
            case 'SENT': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'SENT' };
            case 'OVERDUE': return { bg: 'bg-red-100', text: 'text-red-600', label: 'OVERDUE' };
            case 'PENDING': return { bg: 'bg-orange-100', text: 'text-orange-600', label: 'PENDING' }; // Matches design "Pending" yellow/orange
            case 'DRAFT': return { bg: 'bg-slate-100', text: 'text-slate-600', label: 'DRAFT' };
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
        <View className="px-5 pt-4 pb-2 bg-[#F9FAFC]">
            {/* Top Bar */}
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-[32px] font-bold text-slate-900">Invoices</Text>
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={() => router.push('/invoice/new')}
                        className="bg-white w-12 h-12 rounded-full items-center justify-center shadow-sm border border-slate-100"
                    >
                        <Plus size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push('/notifications')}
                        className="bg-white w-12 h-12 rounded-full items-center justify-center shadow-sm border border-slate-100 relative"
                    >
                        <Bell size={22} color="#1e293b" />
                        <View className="absolute top-3.5 right-3.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search & Filter Bar */}
            <View className="flex-row gap-3 mb-6">
                <View className="flex-1 h-12 bg-white rounded-full flex-row items-center px-4 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100">
                    <Search size={20} color="#6366F1" className="mr-2" />
                    <TextInput
                        className="flex-1 font-medium text-base text-slate-800 h-full"
                        placeholder="Search client or invoice ID"
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity className="w-12 h-12 bg-[#2563EB] rounded-full items-center justify-center shadow-lg shadow-blue-500/30">
                    <SlidersHorizontal size={20} color="white" />
                </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row mb-2"
                contentContainerStyle={{ paddingRight: 20 }}
            >
                {['all', 'paid', 'pending', 'overdue'].map((filter) => {
                    const isActive = activeFilter === filter || (filter === 'pending' && activeFilter === 'pending_approval');
                    return (
                        <TouchableOpacity
                            key={filter}
                            onPress={() => setActiveFilter(filter === 'pending' ? 'pending_approval' : filter as InvoiceStatus)}
                            className={`mr-3 py-2 px-6 rounded-full border transition-all ${isActive ? 'bg-[#2563EB] border-[#2563EB]' : 'bg-white border-transparent'}`}
                        >
                            <Text className={`font-bold capitalize text-sm ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                {filter}
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
            Alert.alert("No Reminders Needed", "There are no unpaid invoices with client emails found.");
            return;
        }

        // Extract unique emails
        const emails = [...new Set(unpaidInvoices.map(inv => inv.customer.email))];

        if (emails.length === 0) {
            Alert.alert("Missing Emails", "Unpaid invoices found, but no client emails are attached.");
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
            Alert.alert("Error", "Could not open email client.");
        }
    };

    // EXACT Match for the purple gradient total card
    const renderTotalCard = () => (
        <View className="mx-5 mb-8 mt-2">
            <LinearGradient
                colors={['#F0F3FF', '#F5F7FF']}
                className="rounded-[32px] p-6 border border-white max-w-full relative overflow-hidden shadow-sm"
            >
                {/* Purple blurry background effect */}
                <View className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-100 rounded-full blur-[50px]" />

                <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-xs font-bold text-[#6366F1] uppercase tracking-widest mb-2">TOTAL OUTSTANDING</Text>
                    <View className="w-10 h-10 bg-indigo-100 rounded-xl items-center justify-center">
                        <Wallet size={20} color="#4F46E5" />
                    </View>
                </View>

                <Text className="text-[40px] font-black text-slate-900 tracking-tight leading-[48px] mb-2">
                    {formatCurrency(stats.totalOutstanding, profile?.currency || 'USD')}
                </Text>

                <View className="flex-row items-center mb-6">
                    <TrendingUp size={14} color="#EF4444" className="mr-1.5" />
                    <Text className="text-slate-500 text-xs font-bold">Unpaid Invoices: {invoices.filter(i => i.status === 'overdue' || i.status === 'sent').length}</Text>
                </View>

                <TouchableOpacity
                    className="w-full bg-[#2563EB] h-14 rounded-[20px] flex-row items-center justify-center shadow-xl shadow-blue-500/20 active:scale-[0.98]"
                    onPress={handleSendReminders}
                >
                    <Send size={18} color="white" fill="white" className="mr-2" />
                    <Text className="text-white font-bold text-base">Send Reminders</Text>
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );

    const renderEmptyState = () => (
        <View className="items-center justify-center py-20 px-4">
            <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-6">
                <FileText size={32} color="#94a3b8" />
            </View>
            <Text className="text-xl font-bold text-slate-900 mb-2">No Invoices Found</Text>
            <Text className="text-slate-500 font-medium text-center px-10">
                You don't have any invoices matching the current filter criteria.
            </Text>
            <TouchableOpacity
                onPress={() => { setActiveFilter('all'); setSearchQuery(''); }}
                className="mt-6 px-6 py-3 bg-slate-900 rounded-full"
            >
                <Text className="text-white font-bold text-sm">Clear Filters</Text>
            </TouchableOpacity>
        </View>
    );

    // List Item matched to design
    const renderInvoiceItem = ({ item }: { item: any }) => {
        const customerName = item.customer?.name || 'Unknown Client';
        const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return (
            <TouchableOpacity
                onPress={() => router.push(`/invoice/${item.id}`)}
                className="mx-5 mb-4 bg-white p-5 rounded-[24px] shadow-[0_2px_15px_-8px_rgba(0,0,0,0.06)] border border-slate-50 flex-row items-center active:bg-slate-50/80"
            >
                <View className="mr-4">
                    <ClientAvatar name={customerName} size={48} />
                </View>

                <View className="flex-1 mr-2">
                    <Text className="font-bold text-slate-900 text-base mb-1" numberOfLines={1}>{customerName}</Text>
                    <View className="flex-row items-center">
                        <Text className="text-xs text-slate-400 font-bold mr-1">#{item.invoice_number}</Text>
                        <Text className="text-xs text-slate-300">•</Text>
                        <Text className="text-xs text-slate-400 font-medium ml-1">{date}</Text>
                    </View>
                </View>

                <View className="items-end">
                    <Text className="font-black text-slate-900 text-lg mb-2">
                        {formatCurrency(item.total_amount, item.currency || profile?.currency || 'USD')}
                    </Text>
                    <StatusBadge status={item.status} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F9FAFC]">
            <StatusBar style="dark" />
            <FlatList
                data={filteredInvoices}
                keyExtractor={item => item.id}
                renderItem={renderInvoiceItem}
                ListHeaderComponent={
                    <>
                        <View>
                            {renderHeader()}
                            {renderTotalCard()}
                            <View className="flex-row justify-between items-center px-6 mb-4">
                                <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Invoices</Text>
                                <TouchableOpacity>
                                    <Text className="text-[#2563EB] font-bold text-xs">View All</Text>
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

            {loading && invoices.length === 0 && (
                <View className="absolute inset-0 items-center justify-center bg-white/80 backdrop-blur-sm z-50">
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            )}
        </SafeAreaView>
    );
}
