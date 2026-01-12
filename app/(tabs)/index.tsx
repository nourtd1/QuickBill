import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
    Platform
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
    Wallet,
    ArrowRight,
    MoreHorizontal
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { BarChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
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
            <View className="flex-1 items-center justify-center bg-slate-50">
                <ActivityIndicator size="large" color="#1E40AF" />
                <Text className="mt-4 text-slate-400 font-medium">Chargement...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#fff" progressBackgroundColor="#1E40AF" colors={['#fff']} />
                }
            >
                {/* Header Premium Avec Dégradé */}
                <View className="overflow-hidden rounded-b-[40px] shadow-lg mb-6 bg-primary">
                    <LinearGradient
                        colors={['#172554', '#1E40AF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="pt-16 pb-24 px-6 relative"
                    >
                        {/* Effets de texture "Glass" */}
                        <View className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                        <View className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-blue-400/10 rounded-full blur-2xl" />

                        <View className="flex-row justify-between items-start mb-6 z-10">
                            <View>
                                <Text className="text-blue-200 text-sm font-bold uppercase tracking-wider mb-1">Bonjour, {userName}</Text>
                                <Text className="text-3xl font-black text-white tracking-tight leading-8" numberOfLines={1}>
                                    {profile?.business_name || 'Mon Business'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push('/settings')}
                                className="bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-md active:bg-white/20"
                            >
                                <Settings size={22} color="white" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                <View className="px-6 -mt-20">
                    {/* Carte Bénéfice Net - Style "Carte Bancaire Premium" */}
                    <LinearGradient
                        colors={['#0F172A', '#1E293B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="p-6 rounded-[32px] shadow-xl shadow-slate-900/30 mb-8 border border-slate-700/50 relative overflow-hidden"
                    >
                        {/* Shine Effect */}
                        <View className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] -mr-8 -mt-8" />

                        <View className="flex-row justify-between items-start mb-8">
                            <View>
                                <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Bénéfice Net</Text>
                                <Text className="text-white text-4xl font-black tracking-tight">
                                    {netProfit.toLocaleString()} <Text className="text-xl text-slate-500 font-bold">{currency}</Text>
                                </Text>
                            </View>
                            <View className="bg-white/10 p-3 rounded-2xl border border-white/5">
                                <Wallet size={24} color="#60A5FA" />
                            </View>
                        </View>

                        <View className="flex-row items-center justify-between">
                            <View>
                                <View className="flex-row items-center mb-1">
                                    <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                    <Text className="text-slate-400 text-[10px] font-bold uppercase">Entrées</Text>
                                </View>
                                <Text className="text-emerald-400 text-lg font-bold">
                                    + {(monthlyRevenue || 0).toLocaleString()}
                                </Text>
                            </View>
                            <View className="h-8 w-[1px] bg-white/10" />
                            <View className="items-end">
                                <View className="flex-row items-center mb-1">
                                    <Text className="text-slate-400 text-[10px] font-bold uppercase">Sorties</Text>
                                    <View className="w-1.5 h-1.5 rounded-full bg-red-500 ml-2 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                </View>
                                <Text className="text-red-400 text-lg font-bold">
                                    - {(monthlyExpenses || 0).toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Quick Stats Grid */}
                    <View className="flex-row space-x-4 mb-8" style={{ gap: 16 }}>
                        <View className="flex-1 bg-white p-5 rounded-[28px] shadow-sm border border-slate-100/80">
                            <View className="bg-orange-50 self-start p-3 rounded-2xl mb-3 border border-orange-100">
                                <Clock size={22} color="#F59E0B" />
                            </View>
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">En attente</Text>
                            <Text className="text-slate-900 text-xl font-black" numberOfLines={1}>
                                {(pendingAmount || 0).toLocaleString()}
                            </Text>
                        </View>
                        <View className="flex-1 bg-white p-5 rounded-[28px] shadow-sm border border-slate-100/80">
                            <View className="bg-blue-50 self-start p-3 rounded-2xl mb-3 border border-blue-100">
                                <FileText size={22} color="#2563EB" />
                            </View>
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">Factures</Text>
                            <Text className="text-slate-900 text-xl font-black">
                                {invoices?.length || 0}
                            </Text>
                        </View>
                    </View>

                    {/* Quick Actions - Modern Scroll or Grid */}
                    <View className="mb-8">
                        <Text className="text-slate-900 font-bold text-lg mb-4 ml-2">Raccourcis</Text>
                        <View className="flex-row justify-between" style={{ gap: 12 }}>
                            {[
                                { icon: FileText, label: 'Devis', color: '#F59E0B', bg: 'bg-amber-50', border: 'border-amber-100', route: '/estimates' },
                                { icon: Package, label: 'Services', color: '#2563EB', bg: 'bg-blue-50', border: 'border-blue-100', route: '/items' },
                                { icon: User, label: 'Clients', color: '#64748B', bg: 'bg-slate-100', border: 'border-slate-200', route: '/(tabs)/clients' },
                            ].map((action, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => router.push(action.route as any)}
                                    className="flex-1 bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 items-center justify-between min-h-[110px]"
                                    activeOpacity={0.7}
                                >
                                    <View className={`${action.bg} p-3.5 rounded-2xl mb-3 ${action.border} border`}>
                                        <action.icon size={24} color={action.color} />
                                    </View>
                                    <Text className="text-slate-700 font-bold text-xs text-center">{action.label}</Text>
                                    <View className="bg-slate-50 p-1 rounded-full mt-2">
                                        <ArrowRight size={10} color="#94A3B8" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Growth Chart */}
                    <View className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-8">
                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-row items-center">
                                <View className="bg-blue-50 p-2 rounded-xl mr-3">
                                    <TrendingUp size={20} color="#1E40AF" />
                                </View>
                                <Text className="text-slate-900 font-bold text-lg">Croissance</Text>
                            </View>

                            {!hasData && (
                                <View className="bg-slate-100 px-3 py-1 rounded-full">
                                    <Text className="text-slate-500 text-[10px] font-bold tracking-wide">DEMO</Text>
                                </View>
                            )}
                        </View>
                        <View className="items-center -ml-4 overflow-hidden">
                            <BarChart
                                data={displayData}
                                width={SCREEN_WIDTH - 80}
                                height={160}
                                barWidth={24}
                                spacing={24}
                                noOfSections={3}
                                barBorderRadius={8}
                                frontColor="#1E40AF"
                                yAxisThickness={0}
                                xAxisThickness={0}
                                hideRules
                                yAxisTextStyle={{ color: '#94A3B8', fontSize: 10, fontWeight: '500' }}
                                xAxisLabelTextStyle={{ color: '#64748B', fontSize: 10, fontWeight: 'bold' }}
                                isAnimated
                            />
                        </View>
                    </View>

                    {/* Recent Invoices List */}
                    <View className="mb-8">
                        <View className="flex-row justify-between items-center mb-5 px-2">
                            <Text className="text-slate-900 font-bold text-lg">Activités Récentes</Text>
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/clients')}
                                className="bg-slate-100 px-3 py-1.5 rounded-full"
                            >
                                <Text className="text-slate-600 font-bold text-xs">Tout voir</Text>
                            </TouchableOpacity>
                        </View>

                        {!invoices || invoices.length === 0 ? (
                            <View className="bg-white p-8 rounded-[32px] items-center justify-center border border-dashed border-slate-200">
                                <View className="bg-slate-50 p-4 rounded-full mb-3">
                                    <FileText size={32} color="#94A3B8" />
                                </View>
                                <Text className="text-slate-400 font-medium text-center">Aucune activité récente</Text>
                            </View>
                        ) : (
                            <View className="bg-white rounded-[32px] p-2 shadow-sm border border-slate-100">
                                {invoices.slice(0, 5).map((inv, idx) => (
                                    <TouchableOpacity
                                        key={inv.id}
                                        onPress={() => router.push(`/invoice/${inv.id}`)}
                                        className={`p-4 flex-row items-center active:bg-slate-50 rounded-2xl transition-all ${idx !== invoices.length - 1 ? 'border-b border-slate-50' : ''}`}
                                    >
                                        <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${inv.status === 'PAID' ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                                            {inv.status === 'PAID' ?
                                                <CheckCircle2 size={20} color="#10B981" strokeWidth={2.5} /> :
                                                <Clock size={20} color="#F59E0B" strokeWidth={2.5} />
                                            }
                                        </View>

                                        <View className="flex-1 pr-2">
                                            <Text className="text-slate-900 font-bold text-base mb-0.5" numberOfLines={1}>
                                                {Array.isArray(inv.customer) ? inv.customer[0]?.name : inv.customer?.name || 'Client Inconnu'}
                                            </Text>
                                            <Text className="text-slate-400 text-xs font-semibold">#{inv.invoice_number}</Text>
                                        </View>

                                        <View className="items-end">
                                            <Text className="text-slate-900 font-black text-base">
                                                {(inv.total_amount || 0).toLocaleString()} <Text className="text-xs text-slate-500 font-bold">{currency}</Text>
                                            </Text>
                                            <Text className="text-slate-400 text-[10px] font-bold mt-1">
                                                {new Date(inv.created_at).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Floating Action Buttons */}
            <View className="absolute bottom-6 right-6 flex-col items-end pointer-events-box-none" style={{ gap: 12 }}>

                {/* Secondary: New Expense */}
                <View className="flex-row items-center">
                    <View className="bg-slate-900/90 px-3 py-1.5 rounded-xl mr-3 shadow-sm backdrop-blur-md">
                        <Text className="text-white text-xs font-bold">Dépense</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/expenses/add')}
                        className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg shadow-slate-200 border border-slate-100"
                        activeOpacity={0.8}
                    >
                        <Wallet size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>

                {/* Primary: New Invoice */}
                <TouchableOpacity
                    onPress={() => router.push('/invoice/new')}
                    className="w-16 h-16 bg-primary rounded-full items-center justify-center shadow-2xl shadow-blue-600/50"
                    activeOpacity={0.9}
                >
                    <Plus size={32} color="white" strokeWidth={3} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default Dashboard;
