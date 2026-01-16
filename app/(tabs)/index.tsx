import React, { useEffect, useCallback, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
    Image
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    Plus,
    Settings,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    ScanLine,
    FileText,
    Users,
    TrendingUp,
    ChevronRight,
    Bell
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LineChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';


import AiVoiceAssistant from '../../components/AiVoiceAssistant';
import { Sparkles } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

function Dashboard() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const { invoices, monthlyRevenue, monthlyExpenses, netProfit, chartData, loading, refresh } = useDashboard();

    const [aiVisible, setAiVisible] = useState(false);

    const [greeting, setGreeting] = useState('Bonjour');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 18) setGreeting('Bonsoir');
        refresh();
    }, []);

    const onRefresh = useCallback(() => {
        refresh();
    }, []);

    const currency = profile?.currency || 'RWF';

    // Prepare Chart Data (Line Chart is smoother/modern)
    const lineData = (chartData || []).map(d => ({ value: d.value, label: d.month }));
    // Mock data if empty for visual appeal
    const displayData = lineData.length > 0 ? lineData : [
        { value: 10000 }, { value: 20000 }, { value: 18000 }, { value: 30000 }, { value: 25000 }, { value: 40000 }
    ];

    if (loading && (!invoices || invoices.length === 0)) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#0F172A" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#0F172A" />
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Header Section */}
                <LinearGradient
                    colors={['#1E40AF', '#1e3a8a']}
                    className="pt-16 pb-8 px-6 rounded-b-[32px] shadow-lg mb-6"
                >
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-blue-200 text-sm font-medium">{greeting},</Text>
                            <Text className="text-white text-2xl font-black">{profile?.business_name || 'Entrepreneur'}</Text>
                        </View>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => router.push('/notifications')}
                                className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/10"
                            >
                                <Bell size={20} color="white" />
                                {/* Badge */}
                                <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => router.push('/settings')}
                                className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/10 shadow-sm"
                            >
                                {profile?.logo_url ?
                                    <Image source={{ uri: profile.logo_url }} className="w-full h-full rounded-full" /> :
                                    <Settings size={20} color="white" />
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>

                {/* Main Content */}
                <View className="px-6">

                    {/* Total Balance Card (Bento Style) */}
                    <View className="bg-slate-900 rounded-[32px] p-6 mb-6 shadow-xl shadow-slate-200 overflow-hidden relative">
                        {/* Abstract Background Shapes */}
                        <View className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <View className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full -ml-12 -mb-12 blur-2xl" />

                        <View className="flex-row justify-between items-start mb-8">
                            <View>
                                <Text className="text-slate-400 font-medium text-sm mb-1">Bénéfice Net (Mois)</Text>
                                <Text className="text-white text-4xl font-black tracking-tighter">
                                    {netProfit.toLocaleString()} <Text className="text-xl text-slate-500 font-bold">{currency}</Text>
                                </Text>
                            </View>
                            <View className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                                <TrendingUp size={24} color="#4ADE80" />
                            </View>
                        </View>

                        <View className="flex-row justify-between items-center">
                            <View className="flex-1 bg-white/5 p-3 rounded-2xl mr-2 flex-row items-center border border-white/5">
                                <View className="bg-emerald-500/20 p-2 rounded-full mr-3">
                                    <ArrowUpRight size={16} color="#4ADE80" />
                                </View>
                                <View>
                                    <Text className="text-slate-400 text-[10px] font-bold uppercase">Entrées</Text>
                                    <Text className="text-white font-bold text-sm">+{monthlyRevenue.toLocaleString()}</Text>
                                </View>
                            </View>
                            <View className="flex-1 bg-white/5 p-3 rounded-2xl ml-2 flex-row items-center border border-white/5">
                                <View className="bg-red-500/20 p-2 rounded-full mr-3">
                                    <ArrowDownRight size={16} color="#F87171" />
                                </View>
                                <View>
                                    <Text className="text-slate-400 text-[10px] font-bold uppercase">Sorties</Text>
                                    <Text className="text-white font-bold text-sm">-{monthlyExpenses.toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Quick Actions Grid */}
                    <Text className="text-slate-900 font-bold text-lg mb-4">Actions Rapides</Text>
                    <View className="flex-row flex-wrap justify-between gap-y-4 mb-8">
                        {/* New Invoice */}
                        <TouchableOpacity
                            onPress={() => router.push('/invoice/new')}
                            className="w-[48%] bg-blue-600 p-4 rounded-[24px] shadow-lg shadow-blue-200 flex-col items-start justify-between h-32"
                        >
                            <View className="bg-white/20 p-2 rounded-xl mb-2">
                                <Plus size={24} color="white" />
                            </View>
                            <Text className="text-white font-bold text-lg leading-6">Nouvelle{'\n'}Facture</Text>
                        </TouchableOpacity>

                        {/* Scanner (Expense) */}
                        <TouchableOpacity
                            onPress={() => router.push('/expenses/scan')}
                            className="w-[48%] bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex-col items-start justify-between h-32"
                        >
                            <View className="bg-purple-50 p-2 rounded-xl mb-2">
                                <ScanLine size={24} color="#7C3AED" />
                            </View>
                            <Text className="text-slate-900 font-bold text-lg leading-6">Scanner{'\n'}Reçu IA</Text>
                        </TouchableOpacity>

                        {/* New Estimate */}
                        <TouchableOpacity
                            onPress={() => router.push('/estimates')}
                            className="w-[48%] bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex-col items-start justify-between h-32"
                        >
                            <View className="bg-amber-50 p-2 rounded-xl mb-2">
                                <FileText size={24} color="#F59E0B" />
                            </View>
                            <Text className="text-slate-900 font-bold text-lg leading-6">Mes{'\n'}Devis</Text>
                        </TouchableOpacity>

                        {/* Clients */}
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/clients')}
                            className="w-[48%] bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex-col items-start justify-between h-32"
                        >
                            <View className="bg-emerald-50 p-2 rounded-xl mb-2">
                                <Users size={24} color="#10B981" />
                            </View>
                            <Text className="text-slate-900 font-bold text-lg leading-6">Gérer{'\n'}Clients</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Growth Chart (Minimalist) */}
                    <View className="bg-white p-6 rounded-[32px] mb-8 border border-slate-100 shadow-sm">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-slate-900 font-bold text-lg">Performance</Text>
                            <TouchableOpacity className="bg-slate-50 px-3 py-1 rounded-full">
                                <Text className="text-slate-500 text-xs font-bold">6 Mois</Text>
                            </TouchableOpacity>
                        </View>
                        <LineChart
                            data={displayData}
                            color="#2563EB"
                            thickness={3}
                            hideRules
                            hideYAxisText
                            hideAxesAndRules
                            curved
                            width={SCREEN_WIDTH - 80}
                            height={120}
                            startFillColor="rgba(37, 99, 235, 0.1)"
                            endFillColor="rgba(37, 99, 235, 0.01)"
                            areaChart
                        />
                    </View>

                    {/* Recent Invoices (Clean List) */}
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-slate-900 font-bold text-lg">Factures Récentes</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/invoices')}>
                            <Text className="text-blue-600 font-bold text-sm">Tout voir</Text>
                        </TouchableOpacity>
                    </View>

                    {invoices && invoices.length > 0 ? (
                        <View className="bg-white rounded-[28px] p-2 shadow-sm border border-slate-100 mb-8">
                            {invoices.slice(0, 5).map((inv, idx) => (
                                <TouchableOpacity
                                    key={inv.id}
                                    onPress={() => router.push(`/invoice/${inv.id}`)}
                                    className={`p-4 flex-row items-center border-b border-slate-50 last:border-0`}
                                >
                                    <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${inv.status === 'PAID' ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-100'}`}>
                                        <Text className="font-bold text-xs text-slate-700">
                                            {(Array.isArray(inv.customer) ? inv.customer[0]?.name : (inv.customer as any)?.name)?.[0] || 'C'}
                                        </Text>
                                    </View>
                                    <View className="flex-1 pr-2">
                                        <Text className="text-slate-900 font-bold text-base mb-0.5" numberOfLines={1}>
                                            {Array.isArray(inv.customer) ? inv.customer[0]?.name : (inv.customer as any)?.name || 'Client Inconnu'}
                                        </Text>
                                        <Text className="text-slate-400 text-xs font-semibold">#{inv.invoice_number}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-slate-900 font-bold text-sm">{(inv.total_amount || 0).toLocaleString()} {currency}</Text>
                                        <Text className={`text-[10px] font-bold ${inv.status === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            {inv.status === 'PAID' ? 'PAYÉ' : 'EN ATTENTE'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View className="items-center py-10 bg-white rounded-[24px] border border-dashed border-slate-200">
                            <Text className="text-slate-400 text-sm">Aucune activité pour le moment</Text>
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* AI Assistant FAB */}
            <TouchableOpacity
                onPress={() => setAiVisible(true)}
                className="absolute bottom-6 right-6 w-16 h-16 bg-violet-600 rounded-2xl shadow-xl shadow-violet-400 items-center justify-center z-50 border border-violet-400"
            >
                <Sparkles size={28} color="white" fill="white" />
            </TouchableOpacity>

            <AiVoiceAssistant visible={aiVisible} onClose={() => setAiVisible(false)} />
        </View>
    );
}

export default Dashboard;
