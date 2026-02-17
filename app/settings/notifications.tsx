import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    CheckCheck,
    Banknote, // Or DollarSign if available
    AlertTriangle,
    MessageSquare,
    Mail,
    Megaphone,
    MessageCircle
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const SettingsNotificationRow = ({ icon: Icon, iconColor, iconBg, title, subtitle, value, onToggle }: any) => (
    <View className="flex-row items-center justify-between py-4 px-4 bg-white">
        <View className="flex-row items-center flex-1 mr-4">
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${iconBg}`}>
                <Icon size={20} color={iconColor} />
            </View>
            <View className="flex-1">
                <Text className="text-base font-semibold text-slate-900 leading-5">{title}</Text>
                {subtitle && <Text className="text-sm text-slate-500 mt-1 leading-4">{subtitle}</Text>}
            </View>
        </View>

        <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: "#E2E8F0", true: "#2563EB" }}
            thumbColor={"#FFFFFF"}
            ios_backgroundColor="#E2E8F0"
        />
    </View>
);

const SectionHeader = ({ title, extra }: { title: string, extra?: React.ReactNode }) => (
    <View className="flex-row items-center justify-between mb-2 mt-6 px-4">
        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            {title}
        </Text>
        {extra}
    </View>
);

export default function NotificationsSettingsScreen() {
    const router = useRouter();

    const [invoicePaid, setInvoicePaid] = useState(true);
    const [overdueReminders, setOverdueReminders] = useState(true);
    const [newMessages, setNewMessages] = useState(true);
    const [weeklySummary, setWeeklySummary] = useState(false);
    const [productUpdates, setProductUpdates] = useState(true);
    const [urgentSecurityAlerts, setUrgentSecurityAlerts] = useState(true);

    return (
        <View className="flex-1 bg-[#F8FAFC]">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-2 mb-6">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="p-2 -ml-2 mr-2"
                        >
                            <ArrowLeft size={24} color="#0F172A" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-slate-900">Notifications</Text>
                    </View>

                    <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-slate-100"
                        onPress={() => Alert.alert("Mark all read", "All notifications marked as read.")}
                    >
                        <CheckCheck size={20} color="#2563EB" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">

                    {/* PUSH NOTIFICATIONS */}
                    <SectionHeader
                        title="PUSH NOTIFICATIONS"
                        extra={
                            <View className="bg-blue-100 px-2.5 py-1 rounded-full">
                                <Text className="text-[10px] font-bold text-blue-700 uppercase">Recommended</Text>
                            </View>
                        }
                    />
                    <View className="bg-white rounded-3xl mx-4 overflow-hidden mb-2 shadow-sm border border-slate-50">
                        <SettingsNotificationRow
                            icon={Banknote}
                            iconColor="#2563EB"
                            iconBg="bg-blue-50"
                            title="Invoice Paid"
                            subtitle="Get notified when you receive payments"
                            value={invoicePaid}
                            onToggle={setInvoicePaid}
                        />
                        <View className="h-[1px] bg-slate-50 ml-16" />
                        <SettingsNotificationRow
                            icon={AlertTriangle}
                            iconColor="#EA580C"
                            iconBg="bg-orange-50"
                            title="Overdue Reminders"
                            subtitle="Alerts for unpaid client invoices"
                            value={overdueReminders}
                            onToggle={setOverdueReminders}
                        />
                        <View className="h-[1px] bg-slate-50 ml-16" />
                        <SettingsNotificationRow
                            icon={MessageSquare}
                            iconColor="#9333EA"
                            iconBg="bg-purple-50"
                            title="New Messages"
                            subtitle="Direct messages from clients"
                            value={newMessages}
                            onToggle={setNewMessages}
                        />
                    </View>

                    {/* EMAIL UPDATES */}
                    <SectionHeader title="EMAIL UPDATES" />
                    <View className="bg-white rounded-3xl mx-4 overflow-hidden mb-2 shadow-sm border border-slate-50">
                        <SettingsNotificationRow
                            icon={Mail}
                            iconColor="#4F46E5"
                            iconBg="bg-indigo-50"
                            title="Weekly Summary"
                            subtitle="Performance report every Monday"
                            value={weeklySummary}
                            onToggle={setWeeklySummary}
                        />
                        <View className="h-[1px] bg-slate-50 ml-16" />
                        <SettingsNotificationRow
                            icon={Megaphone}
                            iconColor="#06B6D4" // Cyan
                            iconBg="bg-cyan-50"
                            title="Product Updates"
                            subtitle="News about QuickBill features"
                            value={productUpdates}
                            onToggle={setProductUpdates}
                        />
                    </View>

                    {/* SMS ALERTS */}
                    <SectionHeader title="SMS ALERTS" />
                    <View className="bg-white rounded-3xl mx-4 overflow-hidden mb-4 shadow-sm border border-slate-50">
                        <SettingsNotificationRow
                            icon={MessageCircle}
                            iconColor="#10B981" // Emerald
                            iconBg="bg-emerald-50"
                            title="Urgent Security Alerts"
                            subtitle="Login attempts from new devices"
                            value={urgentSecurityAlerts}
                            onToggle={setUrgentSecurityAlerts}
                        />
                    </View>

                    <View className="px-6 mb-10">
                        <Text className="text-slate-400 text-xs leading-5 text-center">
                            SMS notifications may incur charges from your carrier. We only send critical security alerts via SMS by default.
                        </Text>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
