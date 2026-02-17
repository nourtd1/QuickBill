import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    ChevronRight,
    Key,
    Shield,
    Smile,
    History,
    Smartphone,
    EyeOff,
    BarChart2,
    Info
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const SettingsRow = ({ icon: Icon, iconColor, iconBg, title, subtitle, onPress, showToggle, toggleValue, onToggle, showChevron = true }: any) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={showToggle ? 1 : 0.7}
        className="flex-row items-center justify-between py-4 px-4 bg-white"
    >
        <View className="flex-row items-center flex-1">
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${iconBg}`}>
                <Icon size={20} color={iconColor} />
            </View>
            <View className="flex-1">
                <Text className="text-base font-semibold text-slate-900">{title}</Text>
                {subtitle && <Text className="text-sm text-slate-500 mt-0.5">{subtitle}</Text>}
            </View>
        </View>

        {showToggle ? (
            <Switch
                value={toggleValue}
                onValueChange={onToggle}
                trackColor={{ false: "#E2E8F0", true: "#2563EB" }}
                thumbColor={"#FFFFFF"}
                ios_backgroundColor="#E2E8F0"
            />
        ) : showChevron ? (
            <ChevronRight size={20} color="#94A3B8" />
        ) : null}
    </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
    <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 mt-6 px-4">
        {title}
    </Text>
);

export default function SecuritySettingsScreen() {
    const router = useRouter();

    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [faceIdEnabled, setFaceIdEnabled] = useState(true);
    const [usageAnalyticsEnabled, setUsageAnalyticsEnabled] = useState(true);

    return (
        <View className="flex-1 bg-[#F8FAFC]">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center px-4 py-2 mb-2 relative justify-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute left-4 p-2"
                    >
                        <ChevronLeft size={28} color="#2563EB" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900">Security & Privacy</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">

                    {/* LOGIN & RECOVERY */}
                    <SectionHeader title="LOGIN & RECOVERY" />
                    <View className="bg-white rounded-3xl mx-4 overflow-hidden mb-2 shadow-sm border border-slate-50">
                        <SettingsRow
                            icon={Key}
                            iconColor="#3B82F6"
                            iconBg="bg-blue-50"
                            title="Change Password"
                            subtitle="Last changed 3 months ago"
                            onPress={() => Alert.alert("Change Password", "Navigating to password change...")}
                        />
                        <View className="h-[1px] bg-slate-50 ml-16" />
                        <SettingsRow
                            icon={Shield}
                            iconColor="#8B5CF6"
                            iconBg="bg-purple-50"
                            title="Two-Factor Auth"
                            subtitle="Secure your account"
                            showToggle
                            toggleValue={twoFactorEnabled}
                            onToggle={setTwoFactorEnabled}
                        />
                        <View className="h-[1px] bg-slate-50 ml-16" />
                        <SettingsRow
                            icon={Smile}
                            iconColor="#EF4444"
                            iconBg="bg-red-50"
                            title="Face ID"
                            subtitle="Log in biometrically"
                            showToggle
                            toggleValue={faceIdEnabled}
                            onToggle={setFaceIdEnabled}
                        />
                    </View>

                    {/* ACTIVITY */}
                    <SectionHeader title="ACTIVITY" />
                    <View className="bg-white rounded-3xl mx-4 overflow-hidden mb-2 shadow-sm border border-slate-50">
                        <SettingsRow
                            icon={History}
                            iconColor="#6366F1"
                            iconBg="bg-indigo-50"
                            title="Login History"
                            subtitle="View recent sessions"
                            onPress={() => Alert.alert("Login History", "Viewing history...")}
                        />
                        <View className="h-[1px] bg-slate-50 ml-16" />
                        <SettingsRow
                            icon={Smartphone}
                            iconColor="#0D9488"
                            iconBg="bg-teal-50"
                            title="Active Devices"
                            subtitle="iPhone 14 Pro, MacBook Air"
                            onPress={() => Alert.alert("Active Devices", "Manage devices...")}
                        />
                    </View>

                    {/* PRIVACY */}
                    <SectionHeader title="PRIVACY" />
                    <View className="bg-white rounded-3xl mx-4 overflow-hidden mb-6 shadow-sm border border-slate-50">
                        <SettingsRow
                            icon={EyeOff} // Using EyeOff as icon for Privacy/Data Sharing
                            iconColor="#64748B"
                            iconBg="bg-slate-100" // Or a darker gray if preferred
                            title="Data Sharing"
                            subtitle="Manage permissions"
                            onPress={() => Alert.alert("Data Sharing", "Manage permissions...")}
                        />
                        <View className="h-[1px] bg-slate-50 ml-16" />
                        <SettingsRow
                            icon={BarChart2}
                            iconColor="#374151"
                            iconBg="bg-gray-100"
                            title="Usage Analytics"
                            subtitle="Help improve the app"
                            showToggle
                            toggleValue={usageAnalyticsEnabled}
                            onToggle={setUsageAnalyticsEnabled}
                        />
                    </View>

                    {/* Info Box */}
                    <View className="mx-4 bg-yellow-50 rounded-2xl p-4 flex-row border border-yellow-100 mb-8">
                        <Info size={20} color="#D97706" style={{ marginTop: 2, marginRight: 12 }} />
                        <Text className="flex-1 text-yellow-800 text-sm leading-5">
                            For your security, changes to Two-Factor Authentication will require re-verification of your identity.
                        </Text>
                    </View>

                    {/* Delete Account */}
                    <TouchableOpacity
                        className="items-center mb-12"
                        onPress={() => Alert.alert("Delete Account", "Are you sure?")}
                    >
                        <Text className="text-red-500 font-bold text-lg">Delete Account</Text>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
