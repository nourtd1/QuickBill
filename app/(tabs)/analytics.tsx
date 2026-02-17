import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Image,
    SafeAreaView
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import {
    Bell,
    TrendingUp,
    TrendingDown,
    PieChart as PieChartIcon,
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownRight,
    Filter
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const screenWidth = Dimensions.get('window').width;

// Constants
const PRIMARY_BLUE = '#2563EB'; // Blue-600
const SECONDARY_INDIGO = '#6366f1';
const LIGHT_INDIGO = '#a5b4fc';
const SUCCESS_GREEN = '#10b981';
const DANGER_RED = '#f43f5e';
const BG_COLOR = '#F9FAFC';

// Mock Data
const lineData1 = [
    { value: 20, label: 'May 01' },
    { value: 22, label: 'May 05' },
    { value: 38, label: 'May 10' },
    { value: 45, label: 'May 15' },
    { value: 42, label: 'May 20' },
    { value: 35, label: 'May 25' },
    { value: 42, label: 'May 30' }
];

const lineData2 = [ // Expenses
    { value: 10, label: 'May 01' },
    { value: 12, label: 'May 05' },
    { value: 15, label: 'May 10' },
    { value: 25, label: 'May 15' },
    { value: 22, label: 'May 20' },
    { value: 18, label: 'May 25' },
    { value: 20, label: 'May 30' }
];

const pieData = [
    { value: 65, color: PRIMARY_BLUE, text: '65%' },
    { value: 20, color: SECONDARY_INDIGO, text: '20%' },
    { value: 15, color: LIGHT_INDIGO, text: '15%' }
];

const topClients = [
    { id: 1, name: 'VentureStream Inc.', service: 'Professional Services', income: '$12,450', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
    { id: 2, name: 'Loom Agency', service: 'Digital Marketing', income: '$8,200', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
    { id: 3, name: 'EcoTech Solutions', service: 'SaaS Platform', income: '$4,200', status: 'Inactive', avatar: 'https://i.pravatar.cc/150?u=a04258114e29026302d' },
];

export default function AnalyticsScreen() {
    const router = useRouter();
    const [selectedPeriod, setSelectedPeriod] = useState('Month');

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
                    <TrendingUp size={20} color={PRIMARY_BLUE} />
                </View>
                <Text className="text-2xl font-bold text-slate-900">Revenue</Text>
            </View>
            <TouchableOpacity
                onPress={() => router.push('/notifications')}
                className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100 relative"
            >
                <Bell size={20} color="#1e293b" />
                <View className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#F9FAFC]">
            <StatusBar style="dark" />

            {/* Custom Header since we use Stack.Screen header config usually but here custom is better for layout */}
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {renderHeader()}

                {renderPeriodSelector()}

                {/* Summary Grid */}
                <View className="flex-row px-4 gap-4 mb-6">
                    {/* Income Card */}
                    <View className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-50">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Income</Text>
                            <View className="bg-emerald-50 p-1.5 rounded-full">
                                <ArrowUpRight size={14} color={SUCCESS_GREEN} />
                            </View>
                        </View>
                        <Text className="text-2xl font-black text-slate-900 mb-1">$24,850</Text>
                        <View className="flex-row items-center">
                            <TrendingUp size={12} color={SUCCESS_GREEN} className="mr-1" />
                            <Text className="text-emerald-500 text-xs font-bold">+12.4%</Text>
                            <Text className="text-slate-400 text-[10px] ml-1">vs last {selectedPeriod.toLowerCase()}</Text>
                        </View>
                    </View>

                    {/* Expenses Card */}
                    <View className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-50">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expenses</Text>
                            <View className="bg-rose-50 p-1.5 rounded-full">
                                <ArrowDownRight size={14} color={DANGER_RED} />
                            </View>
                        </View>
                        <Text className="text-2xl font-black text-slate-900 mb-1">$8,210</Text>
                        <View className="flex-row items-center">
                            <TrendingUp size={12} color={DANGER_RED} className="mr-1" />
                            <Text className="text-rose-500 text-xs font-bold">+4.1%</Text>
                            <Text className="text-slate-400 text-[10px] ml-1">vs last {selectedPeriod.toLowerCase()}</Text>
                        </View>
                    </View>
                </View>

                {/* Line Chart Section */}
                <View className="mx-4 bg-white rounded-3xl p-5 shadow-sm border border-slate-50 mb-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <Text className="text-lg font-bold text-slate-900">Income vs Expenses</Text>
                            <Text className="text-xs text-slate-400">Last 30 days performance</Text>
                        </View>
                        <View className="flex-row gap-3">
                            <View className="flex-row items-center">
                                <View className="w-2.5 h-2.5 rounded-full bg-[#1337ec] mr-1.5" />
                                <Text className="text-[10px] font-bold text-slate-400 uppercase">In</Text>
                            </View>
                            <View className="flex-row items-center">
                                <View className="w-2.5 h-2.5 rounded-full bg-slate-300 mr-1.5" />
                                <Text className="text-[10px] font-bold text-slate-400 uppercase">Out</Text>
                            </View>
                        </View>
                    </View>

                    <View className="overflow-hidden -ml-4">
                        <LineChart
                            data={lineData1}
                            data2={lineData2}
                            height={220}
                            width={screenWidth - 80} // Adjusting for padding
                            spacing={50}
                            initialSpacing={20}
                            color1={PRIMARY_BLUE}
                            color2="#cbd5e1"
                            textColor1={PRIMARY_BLUE}
                            startFillColor1={PRIMARY_BLUE}
                            endFillColor1={PRIMARY_BLUE}
                            startOpacity1={0.2}
                            endOpacity1={0.01}
                            areaChart
                            curved
                            hideDataPoints
                            hideRules
                            hideYAxisText
                            hideAxesAndRules
                            xAxisLabelTextStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}
                            pointerConfig={{
                                pointerStripUptoDataPoint: true,
                                pointerStripColor: 'lightgray',
                                pointerStripWidth: 2,
                                strokeDashArray: [2, 5],
                                pointerColor: 'lightgray',
                                radius: 4,
                                pointerLabelWidth: 100,
                                pointerLabelHeight: 120,
                                activatePointersOnLongPress: true,
                                autoAdjustPointerLabelPosition: false,
                                pointerLabelComponent: (items: any) => {
                                    return (
                                        <View
                                            style={{
                                                height: 40,
                                                width: 100, // Reduced width
                                                backgroundColor: '#1e293b',
                                                borderRadius: 8,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginLeft: -40, // Centering trick
                                            }}>
                                            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                                                ${items[0].value}.00
                                            </Text>
                                            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', opacity: 0.7 }}>
                                                ${items[1].value}.00
                                            </Text>
                                        </View>
                                    );
                                },
                            }}
                        />
                    </View>
                </View>

                {/* Donut Chart Section */}
                <View className="mx-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-50 mb-6">
                    <Text className="text-lg font-bold text-slate-900 mb-6">Revenue Breakdown</Text>

                    <View className="flex-row items-center justify-between">
                        <View className="items-center justify-center relative">
                            {/* Inner Absolute Text */}
                            <View className="absolute z-10 items-center justify-center">
                                <Text className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total</Text>
                                <Text className="text-xl font-black text-slate-900">$24k</Text>
                            </View>

                            <PieChart
                                data={pieData}
                                donut
                                radius={70} // Smaller for compact design
                                innerRadius={55}
                                innerCircleColor={'white'}
                                focusOnPress
                                sectionAutoFocus
                            />
                        </View>

                        {/* Legend */}
                        <View className="flex-1 ml-8 space-y-4">
                            {[
                                { label: 'Consulting', color: PRIMARY_BLUE, percent: '65%' },
                                { label: 'Products', color: SECONDARY_INDIGO, percent: '20%' },
                                { label: 'Services', color: LIGHT_INDIGO, percent: '15%' },
                            ].map((item, index) => (
                                <View key={index} className="flex-row items-center justify-between">
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

                {/* Top Clients Section */}
                <View className="mx-4 mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-slate-900">Top Clients</Text>
                        <TouchableOpacity>
                            <Text className="text-blue-600 font-bold text-sm">View All</Text>
                        </TouchableOpacity>
                    </View>

                    {topClients.map((client) => (
                        <View key={client.id} className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-slate-50 flex-row items-center">
                            <Image
                                source={{ uri: client.avatar }}
                                className="w-12 h-12 rounded-xl mr-4 bg-slate-100"
                            />
                            <View className="flex-1">
                                <Text className="text-slate-900 font-bold text-base">{client.name}</Text>
                                <Text className="text-slate-400 text-xs font-medium">{client.service}</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-slate-900 font-black text-base">{client.income}</Text>
                                <Text className={`text-[10px] font-bold uppercase mt-0.5 ${client.status === 'Active' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    {client.status}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
