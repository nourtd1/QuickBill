import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Dimensions,
    Image,
    Platform,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../context/AuthContext';
import AiVoiceAssistant from '../../components/AiVoiceAssistant';
import { formatCurrency } from '../../lib/currencyEngine';

const { width } = Dimensions.get('window');

// --- Glass Card Component ---
const GlassCard = ({ children, className, style, intensity = 'light' }: { children: React.ReactNode, className?: string, style?: any, intensity?: 'light' | 'heavy' }) => {
    // Custom glass effect based on design
    // Heavy: Main Hero card (more opaque/white)
    // Light: Stat cards (whiter)
    return (
        <View
            className={`bg-white rounded-[32px] overflow-hidden ${className || ''}`}
            style={[
                {
                    shadowColor: '#2563EB',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.08,
                    shadowRadius: 20,
                    elevation: 5,
                },
                style
            ]}
        >
            {/* Optional gradient overlay if needed, but design looks like clean white with subtle blue tint or shadow */}
            {intensity === 'heavy' && (
                <LinearGradient
                    colors={['#ffffff', '#f0f4ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                />
            )}
            {children}
        </View>
    );
};

// --- Activity Item Component ---
const ActivityItem = ({ icon: Icon, iconBg, iconColor, title, date, amount, status, statusColor, statusBg, isPositive = true }: any) => (
    <TouchableOpacity className="flex-row items-center p-4 bg-white rounded-[24px] mb-3 shadow-sm border border-slate-50 active:bg-slate-50">
        <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${iconBg}`}>
            <Icon size={20} color={iconColor} />
        </View>
        <View className="flex-1">
            <Text className="text-slate-900 font-bold text-base">{title}</Text>
            <Text className="text-slate-400 text-xs font-medium mt-0.5">{date}</Text>
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
    const { netProfit, loading, refresh, pendingAmount, growth } = useDashboard(); // Connected to Real Data
    const [aiVisible, setAiVisible] = useState(false);

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

    return (
        <View className="flex-1 bg-[#F9FAFC] relative">
            {/* ... (Header and Background remain same) ... */}

            <SafeAreaView className="flex-1">
                <ScrollView
                    className="flex-1 px-6 pt-2"
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#2563EB" />}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Header - Pro Design */}
                    <View className="flex-row justify-between items-center mb-8 mt-4 z-20">
                        <View className="flex-row items-center">
                            <View className="relative mr-4">
                                <View className="w-14 h-14 rounded-full border-[3px] border-white shadow-lg shadow-blue-200/50 overflow-hidden">
                                    <Image
                                        source={{ uri: profile?.logo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop' }}
                                        className="w-full h-full"
                                    />
                                </View>
                                {/* Online Status Dot */}
                                <View className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                            </View>

                            <View>
                                <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">
                                    {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'},
                                </Text>
                                <View className="flex-row items-center">
                                    <Text className="text-slate-900 text-2xl font-black tracking-tight mr-2">{userName}</Text>
                                    <View className="bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                                        <Text className="text-[10px] font-black text-blue-700 uppercase">PRO</Text>
                                    </View>
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
                                    <Text className="text-lg font-bold text-slate-900">Notifications</Text>
                                    <TouchableOpacity>
                                        <Text className="text-blue-600 font-bold text-xs">Mark all read</Text>
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
                                                <Text className="text-slate-900 font-bold text-sm mb-0.5">Invoice Paid</Text>
                                                <View className="w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
                                            </View>
                                            <Text className="text-slate-500 text-xs leading-4 mb-1">Acme Corp paid invoice #1024 of $1,200.00</Text>
                                            <Text className="text-slate-400 text-[10px] font-bold">2 min ago</Text>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Item 2 */}
                                    <TouchableOpacity className="flex-row mb-6 bg-transparent">
                                        <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center mr-4">
                                            <AlertTriangle size={20} color="#F59E0B" />
                                        </View>
                                        <View className="flex-1 pr-4">
                                            <View className="flex-row justify-between items-start">
                                                <Text className="text-slate-900 font-bold text-sm mb-0.5">Subscription Ending</Text>
                                                <View className="w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
                                            </View>
                                            <Text className="text-slate-500 text-xs leading-4 mb-1">Your premium plan expires in 3 days.</Text>
                                            <Text className="text-slate-400 text-[10px] font-bold">1 hour ago</Text>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Item 3 */}
                                    <TouchableOpacity className="flex-row mb-4 bg-transparent">
                                        <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
                                            <UserPlus size={20} color="#2563EB" />
                                        </View>
                                        <View className="flex-1 pr-4">
                                            <Text className="text-slate-900 font-bold text-sm mb-0.5">New Client Added</Text>
                                            <Text className="text-slate-500 text-xs leading-4 mb-1">Design Studio Ltd was added to your list.</Text>
                                            <Text className="text-slate-400 text-[10px] font-bold">5 hours ago</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <View className="h-[1px] bg-slate-100 mb-4" />

                                <TouchableOpacity className="items-center py-2" onPress={() => router.push('/notifications')}>
                                    <Text className="text-slate-500 font-bold text-xs">View all activity</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Hero Card */}
                    <GlassCard className="mb-8" intensity="heavy">
                        <View className="p-6 relative min-h-[180px] justify-between">
                            <View className="flex-row justify-between items-start">
                                <Text className="text-slate-500 text-base font-medium">Total Net Profit</Text>
                                <TrendingUp size={24} color="#2563EB" />
                            </View>

                            <Text className="text-slate-900 text-[40px] font-extrabold tracking-tight my-2">
                                {formatCurrency(netProfit, profile?.currency || 'USD')}
                            </Text>

                            <View className="flex-row gap-3 mt-2">
                                <View className="bg-white px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border border-slate-100 shadow-sm">
                                    <View className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <Text className="text-slate-700 text-xs font-bold">Income +{growth.toFixed(0)}%</Text>
                                </View>
                                {/* Active Status is okay as mock or need logic? Let's keep it static "Active" for now as it's a status */}
                                <View className="bg-white px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border border-slate-100 shadow-sm">
                                    <View className="w-2 h-2 rounded-full bg-[#2563EB]" />
                                    <Text className="text-slate-700 text-xs font-bold">Active</Text>
                                </View>
                            </View>
                        </View>
                    </GlassCard>

                    {/* Stats Row */}
                    <View className="flex-row justify-between mb-8">
                        {/* Upcoming Invoices */}
                        <View className="bg-white rounded-[24px] p-5 w-[48%] shadow-sm border border-slate-50">
                            <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center mb-3">
                                <Clock size={20} color="#F97316" />
                            </View>
                            <Text className="text-slate-500 text-xs font-medium mb-1">Upcoming Invoices</Text>
                            <Text className="text-slate-900 text-lg font-bold mb-0.5" numberOfLines={1}>
                                {upcomingInvoicesAmount}
                            </Text>
                            <Text className="text-slate-400 text-xs font-medium">pending</Text>
                        </View>

                        {/* Monthly Growth */}
                        <View className="bg-white rounded-[24px] p-5 w-[48%] shadow-sm border border-slate-50">
                            <View className={`w-10 h-10 rounded-full items-center justify-center mb-3 ${growth >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                <TrendingUp size={20} color={growthColor} />
                            </View>
                            <Text className="text-slate-500 text-xs font-medium mb-1">Monthly Growth</Text>
                            <View className="flex-row items-center">
                                <Text className="text-slate-900 text-lg font-bold mr-1">{monthlyGrowth}</Text>
                                <ArrowUpRight size={16} color={growthColor} style={{ transform: [{ rotate: growth >= 0 ? '0deg' : '90deg' }] }} />
                            </View>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <Text className="text-slate-900 font-bold text-lg mb-5">Quick Actions</Text>
                    <View className="flex-row justify-between mb-8 px-2">
                        {/* Invoice */}
                        <TouchableOpacity
                            onPress={() => router.push('/invoice/new')}
                            className="items-center"
                        >
                            <View className="w-16 h-16 bg-[#2563EB] rounded-full items-center justify-center shadow-lg shadow-blue-200 mb-2">
                                <Plus size={28} color="white" />
                            </View>
                            <Text className="text-slate-600 font-medium text-xs">Invoice</Text>
                        </TouchableOpacity>

                        {/* Scan */}
                        <TouchableOpacity
                            onPress={() => router.push('/expenses/scan')}
                            className="items-center"
                        >
                            <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-sm border border-slate-50 mb-2">
                                <ScanLine size={24} color="#2563EB" />
                            </View>
                            <Text className="text-slate-600 font-medium text-xs">Scan</Text>
                        </TouchableOpacity>

                        {/* Clients */}
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/clients')}
                            className="items-center"
                        >
                            <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-sm border border-slate-50 mb-2">
                                <Users size={24} color="#2563EB" />
                            </View>
                            <Text className="text-slate-600 font-medium text-xs">Clients</Text>
                        </TouchableOpacity>

                        {/* Verify */}
                        <TouchableOpacity
                            onPress={() => router.push('/finance/reconcile')}
                            className="items-center"
                        >
                            <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-sm border border-slate-50 mb-2">
                                <ShieldCheck size={24} color="#2563EB" />
                            </View>
                            <Text className="text-slate-600 font-medium text-xs">Verify</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Recent Activity */}
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-slate-900 font-bold text-lg">Recent Activity</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/invoices')}>
                            <Text className="text-[#2563EB] font-bold text-sm">See All</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Activity List - MOCKED to match design exactly first */}
                    <ActivityItem
                        icon={PenTool}
                        iconBg="bg-indigo-100"
                        iconColor="#4F46E5"
                        title="Acme Corp Design"
                        date="Oct 24, 2023"
                        amount="+$1,200.00"
                        status="Paid"
                        statusBg="bg-emerald-100"
                        statusColor="text-emerald-700"
                        isPositive={true}
                    />
                    <ActivityItem
                        icon={Palette}
                        iconBg="bg-purple-100"
                        iconColor="#9333EA"
                        title="Studio Branding"
                        date="Oct 22, 2023"
                        amount="$450.00"
                        status="Pending"
                        statusBg="bg-orange-100"
                        statusColor="text-orange-700"
                        isPositive={true}
                    />
                    <ActivityItem
                        icon={Server}
                        iconBg="bg-pink-100"
                        iconColor="#DB2777"
                        title="Server Costs"
                        date="Oct 20, 2023"
                        amount="-$20.00"
                        status="Expensed"
                        statusBg="bg-slate-100"
                        statusColor="text-slate-600"
                        isPositive={false}
                    />

                </ScrollView>
            </SafeAreaView>

            <AiVoiceAssistant visible={aiVisible} onClose={() => setAiVisible(false)} />
        </View>
    );
}
