import React, { useEffect, useCallback, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
    Image,
    Platform,
    StyleSheet
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
    DollarSign,
    Users,
    TrendingUp,
    ChevronRight,
    Bell,
    CreditCard,
    LayoutGrid,
    Calendar,
    ArrowRight
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

    // Prepare Chart Data
    const lineData = (chartData || []).map(d => ({ value: d.value, label: d.month }));
    const displayData = lineData.length > 0 ? lineData : [
        { value: 12000 }, { value: 15000 }, { value: 13000 }, { value: 24000 }, { value: 18000 }, { value: 35000 }
    ];

    if (loading && (!invoices || invoices.length === 0)) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#1E40AF" />
                <Text className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Chargement du Dashboard...</Text>
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
                    <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#1E40AF" />
                }
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Header Premium */}
                <LinearGradient
                    colors={['#1E40AF', '#1e3a8a']}
                    className="pt-14 pb-10 px-6 rounded-b-[48px] shadow-2xl z-10"
                >
                    <View className="flex-row justify-between items-center mb-4">
                        <View className="flex-row items-center">
                            <TouchableOpacity
                                onPress={() => router.push('/settings')}
                                className="w-12 h-12 bg-white/20 rounded-[18px] items-center justify-center border border-white/20 shadow-sm mr-3 overflow-hidden"
                            >
                                {profile?.logo_url ?
                                    <Image source={{ uri: profile.logo_url }} className="w-full h-full" /> :
                                    <View className="w-full h-full bg-blue-500/30 items-center justify-center">
                                        <Text className="text-white font-black text-lg">{profile?.business_name?.charAt(0) || 'Q'}</Text>
                                    </View>
                                }
                            </TouchableOpacity>
                            <View>
                                <Text className="text-blue-200/80 text-[10px] font-bold uppercase tracking-widest mb-0.5">{greeting}, 👋</Text>
                                <Text className="text-white text-lg font-black tracking-tight" numberOfLines={1}>
                                    {profile?.business_name || 'Votre Business'}
                                </Text>
                            </View>
                        </View>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => router.push('/notifications')}
                                className="w-10 h-10 bg-white/15 rounded-xl items-center justify-center border border-white/10"
                            >
                                <Bell size={18} color="white" />
                                <View className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1E40AF]" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Stats Card Glassmorphism - More compact */}
                    <View className="bg-white/10 p-5 rounded-[28px] border border-white/20 backdrop-blur-xl relative overflow-hidden">
                        <View className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />

                        <View className="flex-row justify-between items-start mb-4">
                            <View>
                                <Text className="text-blue-100/60 font-bold text-[9px] uppercase tracking-[1.5px] mb-1">Bénéfice Net (Mois)</Text>
                                <Text className="text-white text-3xl font-black tracking-tight">
                                    {netProfit.toLocaleString()} <Text className="text-lg text-blue-200/60 font-medium">{currency}</Text>
                                </Text>
                            </View>
                            <View className="bg-emerald-400/20 p-2 rounded-xl border border-emerald-400/30">
                                <TrendingUp size={18} color="#34D399" />
                            </View>
                        </View>

                        <View className="h-[1px] bg-white/10 w-full mb-4 rounded-full" />

                        <View className="flex-row justify-between">
                            <View className="flex-1">
                                <View className="flex-row items-center mb-0.5">
                                    <View className="w-1 h-1 bg-emerald-400 rounded-full mr-1.5" />
                                    <Text className="text-blue-100/60 text-[9px] font-bold uppercase">Entrées</Text>
                                </View>
                                <Text className="text-white font-black text-sm">+{monthlyRevenue.toLocaleString()}</Text>
                            </View>
                            <View className="w-[1px] bg-white/10 mx-3" />
                            <View className="flex-1 items-end">
                                <View className="flex-row items-center mb-0.5">
                                    <Text className="text-blue-100/60 text-[9px] font-bold uppercase">Sorties</Text>
                                    <View className="w-1 h-1 bg-red-400 rounded-full ml-1.5" />
                                </View>
                                <Text className="text-white font-black text-sm">-{monthlyExpenses.toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                {/* Body Content */}
                <View className="px-6 mt-8">

                    {/* Floating Action Cards Grid */}
                    <View className="flex-row gap-4 mb-8">
                        <TouchableOpacity
                            onPress={() => router.push('/invoice/new')}
                            className="flex-1 bg-white p-5 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 items-start active:scale-95 transition-all"
                        >
                            <LinearGradient colors={['#3B82F6', '#1E40AF']} className="w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-blue-200">
                                <Plus size={24} color="white" strokeWidth={3} />
                            </LinearGradient>
                            <Text className="text-slate-900 font-black text-base leading-tight">Facturer</Text>
                            <Text className="text-slate-400 text-[10px] font-bold mt-1 uppercase">Nouveau</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/expenses/scan')}
                            className="flex-1 bg-white p-5 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 items-start active:scale-95 transition-all"
                        >
                            <LinearGradient colors={['#A855F7', '#7C3AED']} className="w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-purple-200">
                                <ScanLine size={24} color="white" />
                            </LinearGradient>
                            <Text className="text-slate-900 font-black text-base leading-tight">Scanner</Text>
                            <Text className="text-slate-400 text-[10px] font-bold mt-1 uppercase">IA Reçu</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/finance/reconcile')}
                            className="flex-1 bg-white p-5 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 items-start active:scale-95 transition-all"
                        >
                            <LinearGradient colors={['#10B981', '#059669']} className="w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-emerald-200">
                                <DollarSign size={24} color="white" />
                            </LinearGradient>
                            <Text className="text-slate-900 font-black text-base leading-tight">Vérifier</Text>
                            <Text className="text-slate-400 text-[10px] font-bold mt-1 uppercase">Paiements</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Chart Section Unified */}
                    <View className="bg-white p-6 rounded-[40px] mb-8 border border-slate-100 shadow-sm">
                        <View className="flex-row justify-between items-center mb-8">
                            <View>
                                <Text className="text-slate-900 font-black text-xl tracking-tight">Analyse Croissance</Text>
                                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Évolution des revenus</Text>
                            </View>
                            <TouchableOpacity className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl">
                                <Text className="text-slate-600 text-xs font-black">MENSUEL</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="items-center">
                            <LineChart
                                data={displayData}
                                color="#1E40AF"
                                thickness={4}
                                hideRules
                                hideAxesAndRules
                                hideYAxisText
                                curved
                                width={SCREEN_WIDTH - 88}
                                height={140}
                                startFillColor="rgba(30, 64, 175, 0.15)"
                                endFillColor="rgba(30, 64, 175, 0)"
                                areaChart
                                spacing={55}
                                verticalLinesColor="rgba(0,0,0,0.03)"
                                showVerticalLines
                                pointerConfig={{
                                    pointerColor: '#1E40AF',
                                    radius: 6,
                                    pointerLabelComponent: (items: any) => (
                                        <View className="bg-slate-900 px-3 py-1.5 rounded-lg -ml-10 -mt-10 border border-slate-700">
                                            <Text className="text-white font-black text-xs">{items[0].value.toLocaleString()} {currency}</Text>
                                        </View>
                                    )
                                }}
                            />
                        </View>
                    </View>

                    {/* Secondary Actions Row */}
                    <View className="flex-row gap-4 mb-10">
                        <TouchableOpacity onPress={() => router.push('/estimates')} className="flex-1 bg-amber-50/50 border border-amber-100/50 p-4 rounded-3xl flex-row items-center">
                            <View className="bg-amber-100 p-2 rounded-xl mr-3">
                                <FileText size={18} color="#D97706" />
                            </View>
                            <Text className="text-amber-900 font-bold text-sm">Mes Devis</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/clients')} className="flex-1 bg-blue-50/50 border border-blue-100/50 p-4 rounded-3xl flex-row items-center">
                            <View className="bg-blue-100 p-2 rounded-xl mr-3">
                                <Users size={18} color="#1E40AF" />
                            </View>
                            <Text className="text-blue-900 font-bold text-sm">Clients</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Recent Invoices - PRO VERSION */}
                    <View className="flex-row justify-between items-end mb-6">
                        <View>
                            <Text className="text-slate-900 font-black text-2xl tracking-tight">Factures Récentes</Text>
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Activités de facturation</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/invoices')} className="flex-row items-center bg-slate-100 px-4 py-2 rounded-full active:bg-slate-200">
                            <Text className="text-slate-600 font-black text-xs mr-2">TOUT VOIR</Text>
                            <ArrowRight size={12} color="#475569" strokeWidth={3} />
                        </TouchableOpacity>
                    </View>

                    {invoices && invoices.length > 0 ? (
                        <View className="gap-y-4">
                            {invoices.slice(0, 4).map((inv, idx) => {
                                const customerName = Array.isArray(inv.customer) ? inv.customer[0]?.name : (inv.customer as any)?.name || 'Client';
                                const isPaid = inv.status === 'PAID';

                                return (
                                    <TouchableOpacity
                                        key={inv.id}
                                        onPress={() => router.push(`/invoice/${inv.id}`)}
                                        className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 flex-row items-center active:bg-slate-50 transition-colors"
                                    >
                                        <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 border ${isPaid ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                            <Text className={`font-black text-xl ${isPaid ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {customerName.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>

                                        <View className="flex-1 mr-3">
                                            <Text className="text-slate-900 font-black text-lg mb-0.5" numberOfLines={1}>{customerName}</Text>
                                            <View className="flex-row items-center">
                                                <View className={`px-2 py-0.5 rounded-md mr-2 ${isPaid ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                                                    <Text className={`text-[8px] font-black tracking-tighter ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                        {isPaid ? 'PAYÉ' : 'ATTENTE'}
                                                    </Text>
                                                </View>
                                                <Text className="text-slate-400 text-[10px] font-bold">#{inv.invoice_number}</Text>
                                            </View>
                                        </View>

                                        <View className="items-end">
                                            <Text className="text-slate-900 font-black text-base">{inv.total_amount.toLocaleString()}</Text>
                                            <Text className="text-slate-400 text-[10px] font-bold">{currency}</Text>
                                        </View>
                                        <View className="ml-3 bg-slate-50 p-2 rounded-xl">
                                            <ChevronRight size={16} color="#CBD5E1" strokeWidth={3} />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}

                            <TouchableOpacity
                                onPress={() => router.push('/invoice/new')}
                                className="bg-blue-50 border border-dashed border-blue-200 p-6 rounded-[32px] items-center justify-center mt-2 active:bg-blue-100"
                            >
                                <View className="bg-blue-600/10 p-2 rounded-lg mb-2">
                                    <Plus size={20} color="#1E40AF" strokeWidth={3} />
                                </View>
                                <Text className="text-blue-700 font-black text-sm uppercase tracking-widest">Créer une facture</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => router.push('/invoice/new')}
                            className="items-center py-16 bg-white rounded-[40px] border border-dashed border-slate-200 shadow-inner"
                        >
                            <View className="bg-blue-50 p-5 rounded-full mb-4">
                                <CreditCard size={40} color="#1E40AF" opacity={0.3} />
                            </View>
                            <Text className="text-slate-900 font-black text-lg mb-1">Aucune facture</Text>
                            <Text className="text-slate-400 text-sm font-medium">Commencez à facturer vos clients dès maintenant.</Text>
                            <View className="mt-6 bg-blue-600 px-6 py-3 rounded-2xl flex-row items-center">
                                <Plus size={18} color="white" strokeWidth={3} className="mr-2" />
                                <Text className="text-white font-black">PREMIÈRE FACTURE</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                </View>
            </ScrollView>

            {/* AI Assistant FAB Upgrade */}
            <TouchableOpacity
                onPress={() => setAiVisible(true)}
                activeOpacity={0.9}
                className="absolute bottom-10 right-8 w-20 h-20 items-center justify-center z-50 overflow-hidden rounded-[30px]"
            >
                <LinearGradient
                    colors={['#7C3AED', '#4F46E5']}
                    className="w-full h-full items-center justify-center shadow-2xl shadow-violet-500"
                >
                    <Sparkles size={32} color="white" fill="white" />
                    <View className="absolute bottom-2">
                        <Text className="text-white text-[8px] font-black uppercase tracking-tighter opacity-80">Quick AI</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>

            <AiVoiceAssistant visible={aiVisible} onClose={() => setAiVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    cardShadow: {
        ...Platform.select({
            ios: {
                shadowColor: '#1E40AF',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
            },
            android: {
                elevation: 10,
            },
        }),
    },
});

export default Dashboard;
