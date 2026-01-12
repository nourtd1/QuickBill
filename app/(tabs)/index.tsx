import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    Plus,
    Settings,
    Clock,
    CheckCircle2,
    FileText,
    TrendingUp,
    CreditCard,
    Package,
    User,
    TrendingDown,
    Wallet
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BarChart } from 'react-native-gifted-charts';
import * as LinearGradient from 'expo-linear-gradient';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../context/AuthContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

function Dashboard() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const { invoices, monthlyRevenue, monthlyExpenses, netProfit, pendingAmount, chartData, loading, refresh } = useDashboard();

    useEffect(() => {
        refresh();
    }, []);

    const onRefresh = useCallback(() => {
        refresh();
    }, []);

    const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Entrepreneur';
    const currency = profile?.currency || 'RWF';

    const hasData = (chartData || []).some(d => d.value > 0);
    const displayData = hasData
        ? chartData.map(d => ({ value: d.value, label: d.month }))
        : [
            { value: 15000, label: 'Jan' },
            { value: 28000, label: 'Fév' },
            { value: 19000, label: 'Mar' },
            { value: 34000, label: 'Avr' },
            { value: 22000, label: 'Mai' },
            { value: 45000, label: 'Juin' },
        ];

    if (loading && (!invoices || invoices.length === 0)) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="mt-4 text-slate-400 font-medium">Chargement du dashboard...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" style={{ backgroundColor: '#EFF6FF' }} edges={['top']}>
            <StatusBar style="dark" />

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#2563EB" />
                }
            >
                <View className="px-6 py-6 flex-row justify-between items-start">
                    <View>
                        <Text className="text-slate-500 text-base font-medium">Bonjour, {userName} 👋</Text>
                        <Text className="text-2xl font-black text-slate-900 mt-1">{profile?.business_name || 'Mon Business'}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/settings')}
                        className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100"
                    >
                        <Settings size={24} color="#64748B" />
                    </TouchableOpacity>
                </View>

                <View className="flex-row px-6 space-x-4 mb-8" style={{ gap: 16 }}>
                    <View className="flex-1 bg-emerald-500 p-5 rounded-2xl shadow-sm shadow-emerald-200">
                        <View className="bg-white/20 self-start p-2 rounded-xl mb-3">
                            <TrendingUp size={20} color="white" />
                        </View>
                        <Text className="text-white/90 text-xs font-bold uppercase tracking-wider">Encaissé</Text>
                        <Text className="text-white text-xl font-black mt-1" numberOfLines={1}>
                            {(monthlyRevenue || 0).toLocaleString()} {currency}
                        </Text>
                        <Text className="text-emerald-50 text-[10px] mt-2 font-medium">Ce mois-ci</Text>
                    </View>

                    <View className="flex-1 bg-orange-500 p-5 rounded-2xl shadow-sm shadow-orange-200">
                        <View className="bg-white/20 self-start p-2 rounded-xl mb-3">
                            <CreditCard size={20} color="white" />
                        </View>
                        <Text className="text-white/90 text-xs font-bold uppercase tracking-wider">En attente</Text>
                        <Text className="text-white text-xl font-black mt-1" numberOfLines={1}>
                            {(pendingAmount || 0).toLocaleString()} {currency}
                        </Text>
                        <Text className="text-orange-50 text-[10px] mt-2 font-medium">Total impayé</Text>
                    </View>
                </View>

                {/* Profit Section */}
                <View className="px-6 mb-8">
                    <View className="bg-primary p-6 rounded-2xl shadow-lg flex-row items-center justify-between">
                        <View>
                            <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Bénéfice Net</Text>
                            <Text className="text-white text-3xl font-black">
                                {netProfit.toLocaleString()} <Text className="text-sm font-normal text-white/50">{currency}</Text>
                            </Text>
                        </View>
                        <View className="items-end">
                            <View className="flex-row items-center mb-1">
                                <TrendingUp size={14} color="#10B981" />
                                <Text className="text-emerald-400 text-xs font-bold ml-1">{(monthlyRevenue || 0).toLocaleString()}</Text>
                            </View>
                            <View className="flex-row items-center">
                                <TrendingDown size={14} color="#EF4444" />
                                <Text className="text-red-400 text-xs font-bold ml-1">{(monthlyExpenses || 0).toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View className="flex-row px-6 mb-8" style={{ gap: 12 }}>
                    <TouchableOpacity
                        onPress={() => router.push('/estimates')}
                        className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex-row items-center justify-center"
                    >
                        <FileText size={18} color="#F59E0B" />
                        <Text className="text-slate-900 font-bold ml-2">Devis</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/items')}
                        className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex-row items-center justify-center"
                    >
                        <Package size={18} color="#2563EB" />
                        <Text className="text-slate-900 font-bold ml-2">Services</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/clients')}
                        className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex-row items-center justify-center"
                    >
                        <User size={18} color="#64748B" />
                        <Text className="text-slate-900 font-bold ml-2">Clients</Text>
                    </TouchableOpacity>
                </View>

                <View className="px-6 mb-8">
                    <View className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-50">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-slate-900 font-black text-lg">Évolution du CA</Text>
                            {!hasData && (
                                <View className="bg-slate-100 px-2.5 py-1 rounded-full">
                                    <Text className="text-slate-400 text-[10px] font-bold">MODE DEMO</Text>
                                </View>
                            )}
                        </View>

                        <View className="items-center">
                            <BarChart
                                data={displayData}
                                width={SCREEN_WIDTH - 100}
                                height={180}
                                barWidth={30}
                                spacing={20}
                                noOfSections={3}
                                barBorderRadius={8}
                                frontColor="#1E40AF"
                                yAxisThickness={0}
                                xAxisThickness={0}
                                hideRules
                                yAxisTextStyle={{ color: '#94A3B8', fontSize: 10 }}
                                xAxisLabelTextStyle={{ color: '#64748B', fontSize: 10, fontWeight: 'bold' }}
                                isAnimated
                            />
                        </View>
                    </View>
                </View>

                <View className="px-6 pb-24">
                    <View className="flex-row justify-between items-center mb-4 px-2">
                        <Text className="text-slate-900 font-black text-xl">Récemment</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/clients')}>
                            <Text className="text-primary font-bold">Voir tout</Text>
                        </TouchableOpacity>
                    </View>

                    {!invoices || invoices.length === 0 ? (
                        <View className="bg-white p-8 rounded-[40px] items-center justify-center border border-dashed border-slate-200">
                            <FileText size={48} color="#CBD5E1" strokeWidth={1} />
                            <Text className="text-slate-400 font-medium mt-4">Aucune facture récente</Text>
                        </View>
                    ) : (
                        invoices.map((inv) => (
                            <TouchableOpacity
                                key={inv.id}
                                onPress={() => router.push(`/invoice/${inv.id}`)}
                                className="bg-card p-5 rounded-xl mb-4 flex-row items-center shadow-sm"
                            >
                                <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${inv.status === 'PAID' ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                                    {inv.status === 'PAID' ? <CheckCircle2 size={24} color="#10B981" /> : <Clock size={24} color="#F59E0B" />}
                                </View>

                                <View className="flex-1">
                                    <Text className="text-text-main font-bold text-base" numberOfLines={1}>
                                        {Array.isArray(inv.customer) ? inv.customer[0]?.name : inv.customer?.name || 'Client Inconnu'}
                                    </Text>
                                    <Text className="text-text-muted text-xs mt-0.5">{new Date(inv.created_at).toLocaleDateString()}</Text>
                                </View>

                                <View className="items-end">
                                    <Text className="text-text-main font-black text-base">{(inv.total_amount || 0).toLocaleString()} {currency}</Text>
                                    <View className={`mt-1 px-2 py-0.5 rounded-full ${inv.status === 'PAID' ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                                        <Text className={`text-[10px] font-black tracking-tighter ${inv.status === 'PAID' ? 'text-emerald-700' : 'text-orange-700'}`}>
                                            {inv.status === 'PAID' ? 'ENCAISSÉ' : 'À PAYER'}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

            </ScrollView>

            <View className="absolute bottom-10 right-8 items-center" style={{ gap: 16 }}>
                <TouchableOpacity
                    onPress={() => router.push('/expenses/add')}
                    className="w-14 h-14 bg-danger rounded-full items-center justify-center shadow-lg shadow-red-200"
                    style={{ elevation: 5 }}
                >
                    <Wallet size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push('/invoice/new')}
                    className="w-16 h-16 bg-primary rounded-full items-center justify-center shadow-xl shadow-blue-300"
                    style={{ elevation: 8 }}
                >
                    <Plus size={32} color="white" strokeWidth={3} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

export default Dashboard;
