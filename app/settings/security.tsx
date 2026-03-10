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
    Info,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { send2FACode, sendResetPasswordEmail } from '../../lib/email';

const SettingsRow = ({ icon: Icon, iconColor, iconBg, title, subtitle, onPress, showToggle, toggleValue, onToggle, showChevron = true, isDark }: any) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={showToggle ? 1 : 0.7}
        className="flex-row items-center justify-between py-4 px-4 bg-white dark:bg-slate-800"
    >
        <View className="flex-row items-center flex-1">
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${iconBg}`}>
                <Icon size={20} color={iconColor} />
            </View>
            <View className="flex-1">
                <Text className="text-base font-semibold text-slate-900 dark:text-white">{title}</Text>
                {subtitle && <Text className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</Text>}
            </View>
        </View>

        {showToggle ? (
            <Switch
                value={toggleValue}
                onValueChange={onToggle}
                trackColor={{ false: isDark ? "#334155" : "#E2E8F0", true: "#2563EB" }}
                thumbColor={"#FFFFFF"}
                ios_backgroundColor={isDark ? "#334155" : "#E2E8F0"}
            />
        ) : showChevron ? (
            <ChevronRight size={20} color={isDark ? "#64748B" : "#94A3B8"} />
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
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { user } = useAuth();

    const handleChangePassword = async () => {
        if (!user?.email) return;

        Alert.alert("Mot de passe", "Nous allons vous envoyer un email pour réinitialiser votre mot de passe.", [
            { text: "Annuler", style: "cancel" },
            {
                text: "Envoyer", onPress: async () => {
                    try {
                        const { error } = await supabase.auth.resetPasswordForEmail(user.email!);
                        if (error) throw error;
                        await sendResetPasswordEmail(user.email!, "Consultez l'email de Supabase pour le lien.");
                        Alert.alert("Succès", "Email de modification envoyé.");
                    } catch (err: any) {
                        Alert.alert("Erreur", err.message);
                    }
                }
            }
        ]);
    };

    const handleToggle2FA = async (newValue: boolean) => {
        if (newValue && user?.email) {
            // User wants to enable 2FA -> send a code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            await send2FACode(user.email, code);

            Alert.alert("Activation 2FA", `Un code (\${code}) a été envoyé par email via EmailJS (simulation).`, [
                { text: "Confirmer", onPress: () => setTwoFactorEnabled(true) },
                { text: "Annuler", style: "cancel" }
            ]);
        } else {
            setTwoFactorEnabled(false);
        }
    };

    return (
        <View className="flex-1 bg-[#F8FAFC] dark:bg-slate-900">
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center px-4 py-2 mb-2 relative justify-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute left-4 p-2"
                    >
                        <ChevronLeft size={28} color={isDark ? '#F8FAFC' : '#2563EB'} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900 dark:text-white">Security & Privacy</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">

                    {/* LOGIN & RECOVERY */}
                    <SectionHeader title="LOGIN & RECOVERY" />
                    <View className="bg-white dark:bg-slate-800 rounded-3xl mx-4 overflow-hidden mb-2 shadow-sm border border-slate-50 dark:border-slate-700/50">
                        <SettingsRow
                            icon={Key}
                            iconColor={isDark ? "#60A5FA" : "#3B82F6"}
                            iconBg="bg-blue-50 dark:bg-blue-900/40"
                            title="Change Password"
                            subtitle="Last changed 3 months ago"
                            onPress={handleChangePassword}
                            isDark={isDark}
                        />
                        <View className="h-[1px] bg-slate-50 dark:bg-slate-700/50 ml-16" />
                        <SettingsRow
                            icon={Shield}
                            iconColor={isDark ? "#A78BFA" : "#8B5CF6"}
                            iconBg="bg-purple-50 dark:bg-purple-900/40"
                            title="Two-Factor Auth"
                            subtitle="Secure your account"
                            showToggle
                            toggleValue={twoFactorEnabled}
                            onToggle={handleToggle2FA}
                            isDark={isDark}
                        />
                        <View className="h-[1px] bg-slate-50 dark:bg-slate-700/50 ml-16" />
                        <SettingsRow
                            icon={Smile}
                            iconColor={isDark ? "#F87171" : "#EF4444"}
                            iconBg="bg-red-50 dark:bg-red-900/40"
                            title="Face ID"
                            subtitle="Log in biometrically"
                            showToggle
                            toggleValue={faceIdEnabled}
                            onToggle={setFaceIdEnabled}
                            isDark={isDark}
                        />
                    </View>

                    {/* ACTIVITY */}
                    <SectionHeader title="ACTIVITY" />
                    <View className="bg-white dark:bg-slate-800 rounded-3xl mx-4 overflow-hidden mb-2 shadow-sm border border-slate-50 dark:border-slate-700/50">
                        <SettingsRow
                            icon={History}
                            iconColor={isDark ? "#818CF8" : "#6366F1"}
                            iconBg="bg-indigo-50 dark:bg-indigo-900/40"
                            title="Login History"
                            subtitle="View recent sessions"
                            onPress={() => Alert.alert("Login History", "Viewing history...")}
                            isDark={isDark}
                        />
                        <View className="h-[1px] bg-slate-50 dark:bg-slate-700/50 ml-16" />
                        <SettingsRow
                            icon={Smartphone}
                            iconColor={isDark ? "#2DD4BF" : "#0D9488"}
                            iconBg="bg-teal-50 dark:bg-teal-900/40"
                            title="Active Devices"
                            subtitle="iPhone 14 Pro, MacBook Air"
                            onPress={() => Alert.alert("Active Devices", "Manage devices...")}
                            isDark={isDark}
                        />
                    </View>

                    {/* PRIVACY */}
                    <SectionHeader title="PRIVACY" />
                    <View className="bg-white dark:bg-slate-800 rounded-3xl mx-4 overflow-hidden mb-6 shadow-sm border border-slate-50 dark:border-slate-700/50">
                        <SettingsRow
                            icon={EyeOff}
                            iconColor={isDark ? "#94A3B8" : "#64748B"}
                            iconBg="bg-slate-100 dark:bg-slate-700/50"
                            title="Data Sharing"
                            subtitle="Manage permissions"
                            onPress={() => Alert.alert("Data Sharing", "Manage permissions...")}
                            isDark={isDark}
                        />
                        <View className="h-[1px] bg-slate-50 dark:bg-slate-700/50 ml-16" />
                        <SettingsRow
                            icon={BarChart2}
                            iconColor={isDark ? "#CBD5E1" : "#374151"}
                            iconBg="bg-gray-100 dark:bg-slate-700/50"
                            title="Usage Analytics"
                            subtitle="Help improve the app"
                            showToggle
                            toggleValue={usageAnalyticsEnabled}
                            onToggle={setUsageAnalyticsEnabled}
                            isDark={isDark}
                        />
                    </View>

                    {/* Info Box */}
                    <View className="mx-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 flex-row border border-yellow-100 dark:border-yellow-900/30 mb-8 mt-2">
                        <Info size={20} color={isDark ? "#FBBF24" : "#D97706"} style={{ marginTop: 2, marginRight: 12 }} />
                        <Text className="flex-1 text-yellow-800 dark:text-yellow-200/90 text-sm leading-5">
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
