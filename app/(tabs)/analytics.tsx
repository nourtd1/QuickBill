import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import {
    Bell,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    User,
    DollarSign
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useDashboard } from '../../hooks/useDashboard';
import { useClients } from '../../hooks/useClients';
import { useProfile } from '../../hooks/useProfile';
import { formatCurrency } from '../../lib/currencyEngine';
import { COLORS } from '../../constants/colors';
import { supabase } from '../../lib/supabase';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selectedPeriod, setSelectedPeriod] = useState('Month');

    // Real Data Hooks
    const { profile } = useProfile();
    const { data: clients } = useClients();
    const {
        monthlyRevenue,
        monthlyExpenses,
        netProfit,
        pendingAmount,
        chartData,
        invoices,
        recentExpenses,
        growth,
        loading,
        refresh
    } = useDashboard();

    const [topClientsData, setTopClientsData] = useState<any[]>([]);
    const [revenueBreakdown, setRevenueBreakdown] = useState<any[]>([]);

    // Fetch top clients by revenue
    useFocusEffect(
        useCallback(() => {
            fetchTopClients();
            fetchRevenueBreakdown();
        }, [])
    );

    const fetchTopClients = async () => {
        try {
            if (!profile?.id) return;

            // Get all invoices with client info
            const { data: invoicesData, error } = await supabase
                .from('invoices')
                .select('customer_id, total_amount, status, customer:clients(name, email)')
                .eq('user_id', profile.id);

            if (error) throw error;

            // Group by client and calculate total revenue
            const clientRevenue: Record<string, { name: string; email: string; total: number; count: number }> = {};

            invoicesData?.forEach((inv: any) => {
                const clientId = inv.customer_id;
                const clientName = inv.customer?.name || 'Unknown';
                const clientEmail = inv.customer?.email || '';

                if (!clientRevenue[clientId]) {
                    clientRevenue[clientId] = { name: clientName, email: clientEmail, total: 0, count: 0 };
                }

                if (inv.status === 'PAID') {
                    clientRevenue[clientId].total += inv.total_amount || 0;
                }
                clientRevenue[clientId].count++;
            });

            // Convert to array and sort by revenue
            const topClients = Object.entries(clientRevenue)
                .map(([id, data]) => ({
                    id,
                    name: data.name,
                    email: data.email,
                    revenue: data.total,
                    invoiceCount: data.count
                }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            setTopClientsData(topClients);
        } catch (error) {
            console.error('Error fetching top clients:', error);
        }
    };

    const fetchRevenueBreakdown = async () => {
        try {
            if (!profile?.id) return;

            // Get all paid invoices with items
            const { data: invoicesData, error } = await supabase
                .from('invoices')
                .select('id, total_amount, status')
                .eq('user_id', profile.id)
                .eq('status', 'PAID');

            if (error) throw error;

            // For now, we'll create a simple breakdown
            // In a real app, you'd categorize by service type from invoice items
            const total = invoicesData?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

            if (total > 0) {
                // Simple breakdown - you can enhance this based on your data structure
                setRevenueBreakdown([
                    { label: 'Services', value: total * 0.6, color: COLORS.primary, percent: '60%' },
                    { label: 'Products', value: total * 0.25, color: '#6366f1', percent: '25%' },
                    { label: 'Other', value: total * 0.15, color: '#a5b4fc', percent: '15%' }
                ]);
            }
        } catch (error) {
            console.error('Error fetching revenue breakdown:', error);
        }
    };

    // Prepare chart data for the period
    const prepareChartData = () => {
        if (!chartData || chartData.length === 0) {
            return { income: [], expenses: [] };
        }

        // Convert chartData to format needed by LineChart
        const income = chartData.map(item => ({
            value: ((item.income !== undefined ? item.income : item.value) || 0) / 1000, // Convert to thousands for better display
            label: item.label
        }));

        // Use real expense data
        const expenses = chartData.map(item => ({
            value: (item.expense || 0) / 1000,
            label: item.label
        }));

        return { income, expenses };
    };

    const { income: lineData1, expenses: lineData2 } = prepareChartData();

    // Calculate period-specific metrics
    const periodMetrics = useMemo(() => {
        let income = monthlyRevenue;
        let expenses = monthlyExpenses;
        let growthRate = growth;

        // Adjust based on selected period
        if (selectedPeriod === 'Week') {
            income = monthlyRevenue / 4;
            expenses = monthlyExpenses / 4;
        } else if (selectedPeriod === 'Year') {
            income = monthlyRevenue * 12;
            expenses = monthlyExpenses * 12;
        }

        return { income, expenses, growthRate };
    }, [selectedPeriod, monthlyRevenue, monthlyExpenses, growth]);

    const renderPeriodSelector = () => (
        <View className="flex-row bg-slate-100 p-1 rounded-xl mb-6 mx-4">
            {['Month', 'Week', 'Year'].map((period) => {
                const isActive = selectedPeriod === period;
                return (
                    <TouchableOpacity
                        key={period}
                        onPress={() => setSelectedPeriod(period)}
                        className={`flex-1 py-2 items-center rounded-lg ${isActive ? 'bg-white shadow-sm' : ''}`}
                    >
                        <Text className={`text-sm font-semibold ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                            {period}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const renderHeader = () => (
        <View className="flex-row justify-between items-center px-6 pt-2 pb-4">
            <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center mr-3">
                    <TrendingUp size={20} color={COLORS.primary} />
                </View>
                <Text className="text-2xl font-bold text-slate-900">Analytics</Text>
            </View>
            <TouchableOpacity
                onPress={() => router.push('/activity')}
                className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100 relative"
            >
                <Bell size={20} color="#1e293b" />
                {pendingAmount > 0 && (
                    <View className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                )}
            </TouchableOpacity>
        </View>
    );

    if (loading && !monthlyRevenue) {
        return (
            <View className="flex-1 bg-[#F9FAFC] items-center justify-center" style={{ paddingTop: insets.top }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text className="text-slate-400 mt-4 font-medium">Loading analytics...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F9FAFC]" style={{ paddingTop: insets.top }}>
            <StatusBar style="dark" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.primary} />
                }
            >
                {renderHeader()}
                {renderPeriodSelector()}

                {/* Summary Grid */}
                <View className="flex-row px-4 gap-4 mb-6">
                    {/* Income Card */}
                    <View className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-50">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Income</Text>
                            <View className="bg-emerald-50 p-1.5 rounded-full">
                                <ArrowUpRight size={14} color="#10b981" />
                            </View>
                        </View>
                        <Text className="text-2xl font-black text-slate-900 mb-1">
                            {formatCurrency(periodMetrics.income, profile?.currency || 'USD')}
                        </Text>
                        <View className="flex-row items-center">
                            {periodMetrics.growthRate >= 0 ? (
                                <TrendingUp size={12} color="#10b981" />
                            ) : (
                                <TrendingDown size={12} color="#ef4444" />
                            )}
                            <Text className={`text-xs font-bold ml-1 ${periodMetrics.growthRate >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {periodMetrics.growthRate >= 0 ? '+' : ''}{periodMetrics.growthRate.toFixed(1)}%
                            </Text>
                            <Text className="text-slate-400 text-[10px] ml-1">vs last {selectedPeriod.toLowerCase()}</Text>
                        </View>
                    </View>

                    {/* Expenses Card */}
                    <View className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-50">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expenses</Text>
                            <View className="bg-rose-50 p-1.5 rounded-full">
                                <ArrowDownRight size={14} color="#f43f5e" />
                            </View>
                        </View>
                        <Text className="text-2xl font-black text-slate-900 mb-1">
                            {formatCurrency(periodMetrics.expenses, profile?.currency || 'USD')}
                        </Text>
                        <View className="flex-row items-center">
                            <Text className="text-slate-500 text-xs font-medium">
                                {((periodMetrics.expenses / periodMetrics.income) * 100).toFixed(0)}% of income
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Line Chart Section */}
                {lineData1.length > 0 && (
                    <View className="mx-4 bg-white rounded-3xl p-5 shadow-sm border border-slate-50 mb-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-lg font-bold text-slate-900">Income vs Expenses</Text>
                                <Text className="text-xs text-slate-400">Last 6 months trend</Text>
                            </View>
                            <View className="flex-row gap-3">
                                <View className="flex-row items-center">
                                    <View className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: COLORS.primary }} />
                                    <Text className="text-[10px] font-bold text-slate-400 uppercase">Income</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View className="w-2.5 h-2.5 rounded-full bg-slate-300 mr-1.5" />
                                    <Text className="text-[10px] font-bold text-slate-400 uppercase">Expenses</Text>
                                </View>
                            </View>
                        </View>

                        <View className="overflow-hidden -ml-4">
                            <LineChart
                                data={lineData1}
                                data2={lineData2}
                                height={220}
                                width={screenWidth - 80}
                                spacing={50}
                                initialSpacing={20}
                                color1={COLORS.primary}
                                color2="#cbd5e1"
                                textColor1={COLORS.primary}
                                startFillColor1={COLORS.primary}
                                endFillColor1={COLORS.primary}
                                startOpacity1={0.2}
                                endOpacity1={0.01}
                                areaChart
                                curved
                                hideDataPoints
                                hideRules
                                hideYAxisText
                                hideAxesAndRules
                                xAxisLabelTextStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}
                            />
                        </View>
                    </View>
                )}

                {/* Revenue Breakdown */}
                {revenueBreakdown.length > 0 && (
                    <View className="mx-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-50 mb-6">
                        <Text className="text-lg font-bold text-slate-900 mb-6">Revenue Breakdown</Text>

                        <View className="flex-row items-center justify-between">
                            <View className="items-center justify-center relative">
                                <View className="absolute z-10 items-center justify-center">
                                    <Text className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total</Text>
                                    <Text className="text-xl font-black text-slate-900">
                                        {formatCurrency(monthlyRevenue, profile?.currency || 'USD')}
                                    </Text>
                                </View>

                                <PieChart
                                    data={revenueBreakdown.map(item => ({
                                        value: item.value,
                                        color: item.color
                                    }))}
                                    donut
                                    radius={70}
                                    innerRadius={55}
                                    innerCircleColor={'white'}
                                    focusOnPress
                                    sectionAutoFocus
                                />
                            </View>

                            <View className="flex-1 ml-8">
                                {revenueBreakdown.map((item, index) => (
                                    <View key={index} className="flex-row items-center justify-between mb-3">
                                        <View className="flex-row items-center">
                                            <View
                                                style={{ backgroundColor: item.color }}
                                                className="w-2.5 h-2.5 rounded-full mr-2"
                                            />
                                            <Text className="text-slate-600 font-semibold">{item.label}</Text>
                                        </View>
                                        <Text className="text-slate-900 font-bold">{item.percent}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* Top Clients Section */}
                <View className="mx-4 mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-slate-900">Top Clients</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/clients')}>
                            <Text className="text-blue-600 font-bold text-sm">View All</Text>
                        </TouchableOpacity>
                    </View>

                    {topClientsData.length > 0 ? (
                        topClientsData.map((client) => (
                            <TouchableOpacity
                                key={client.id}
                                onPress={() => router.push({ pathname: '/(tabs)/clients/form', params: { id: client.id } })}
                                className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-slate-50 flex-row items-center"
                            >
                                <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
                                    <User size={20} color={COLORS.primary} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-900 font-bold text-base">{client.name}</Text>
                                    <Text className="text-slate-400 text-xs font-medium">
                                        {client.invoiceCount} invoice{client.invoiceCount !== 1 ? 's' : ''}
                                    </Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-slate-900 font-black text-base">
                                        {formatCurrency(client.revenue, profile?.currency || 'USD')}
                                    </Text>
                                    <View className="bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                                        <Text className="text-emerald-700 text-[10px] font-bold uppercase">Paid</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View className="bg-white p-8 rounded-2xl items-center border border-slate-50">
                            <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
                                <User size={32} color="#94A3B8" />
                            </View>
                            <Text className="text-slate-900 font-bold text-base mb-2">No Client Data Yet</Text>
                            <Text className="text-slate-500 text-sm text-center mb-4">
                                Start creating invoices to see your top clients
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push('/invoice/new')}
                                className="bg-blue-600 px-6 py-3 rounded-full"
                            >
                                <Text className="text-white font-bold">Create Invoice</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}
