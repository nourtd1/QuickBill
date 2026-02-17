import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar as RNStatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Search,
    Check,
    FileText,
    AlertTriangle,
    UserPlus,
    Star,
    Filter
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

// Mock Data matching the screenshot
const ACTIVITY_DATA = [
    {
        title: 'TODAY',
        data: [
            {
                id: '1',
                type: 'invoice_paid',
                title: 'Invoice Paid',
                subtitle: 'Acme Corp paid $1,200',
                time: '2:45 PM',
                icon: Check,
                iconColor: '#10B981', // Green
                bg: 'bg-emerald-100',
            },
            {
                id: '2',
                type: 'invoice_created',
                title: 'New Invoice Created',
                subtitle: 'Sent to Global Tech for $3,450',
                time: '11:30 AM',
                icon: FileText,
                iconColor: '#2563EB', // Blue
                bg: 'bg-blue-100',
            },
            {
                id: '3',
                type: 'payment_overdue',
                title: 'Payment Overdue',
                subtitle: 'Invoice #1023 is 5 days late',
                time: '09:15 AM',
                icon: AlertTriangle,
                iconColor: '#DC2626', // Red
                bg: 'bg-red-100',
            },
        ]
    },
    {
        title: 'YESTERDAY',
        data: [
            {
                id: '4',
                type: 'client_added',
                title: 'Client Added',
                subtitle: 'Design Studio Ltd joined',
                time: '4:20 PM',
                icon: UserPlus,
                iconColor: '#9333EA', // Purple
                bg: 'bg-purple-100',
            },
            {
                id: '5',
                type: 'subscription',
                title: 'Subscription Renewed',
                subtitle: 'Pro Plan yearly renewal',
                time: '10:00 AM',
                icon: Star,
                iconColor: '#D97706', // Amber/Gold
                bg: 'bg-amber-100',
                fill: '#D97706'
            },
        ]
    },
    {
        title: 'LAST WEEK',
        data: [
            {
                id: '6',
                type: 'invoice_paid',
                title: 'Invoice Paid',
                subtitle: 'WebFlow Project paid $850',
                time: 'Mon 2:00 PM',
                icon: Check,
                iconColor: '#10B981',
                bg: 'bg-emerald-100',
            },
            {
                id: '7',
                type: 'invoice_created',
                title: 'New Invoice Created',
                subtitle: 'Consulting for Stark Ind',
                time: 'Sun 9:15 AM',
                icon: FileText,
                iconColor: '#2563EB',
                bg: 'bg-blue-100',
            },
        ]
    }
];

export default function ActivityScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <View className="flex-1 bg-[#F8F9FE]">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1">
                <View className="flex-1 px-6 pt-2">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6 mt-2">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100"
                        >
                            <ArrowLeft size={24} color="#1e293b" />
                        </TouchableOpacity>

                        <Text className="text-xl font-bold text-slate-900">Activity</Text>

                        <TouchableOpacity
                            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100"
                        >
                            <Filter size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View className="bg-white rounded-full px-5 py-3.5 flex-row items-center border border-slate-200 shadow-sm mb-8">
                        {/* <Search size={20} color="#94a3b8" className="mr-3" /> */}
                        <TextInput
                            className="flex-1 text-base text-slate-700 font-medium h-6 p-0"
                            placeholder="Search events, clients, or amounts..."
                            placeholderTextColor="#94a3b8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {ACTIVITY_DATA.map((section, index) => (
                            <View key={section.title} className="mb-6">
                                <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">
                                    {section.title}
                                </Text>

                                {section.data.map((item, itemIndex) => {
                                    const Icon = item.icon;
                                    return (
                                        <View
                                            key={item.id}
                                            className="bg-white rounded-[24px] p-5 mb-4 flex-row items-center shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-slate-50"
                                        >
                                            <View className={`w-12 h-12 rounded-full ${item.bg} items-center justify-center mr-4`}>
                                                <Icon
                                                    size={22}
                                                    color={item.iconColor}
                                                    fill={item.fill || 'none'}
                                                    strokeWidth={2.5}
                                                />
                                            </View>

                                            <View className="flex-1 mr-2">
                                                <Text className="text-slate-900 font-bold text-base mb-0.5">
                                                    {item.title}
                                                </Text>
                                                <Text className="text-slate-500 text-sm font-medium" numberOfLines={1}>
                                                    {item.subtitle}
                                                </Text>
                                            </View>

                                            <View>
                                                <Text className="text-slate-400 text-xs font-bold">
                                                    {item.time}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        ))}
                        <View className="h-20" />
                    </ScrollView>
                </View>
            </SafeAreaView>
        </View>
    );
}
