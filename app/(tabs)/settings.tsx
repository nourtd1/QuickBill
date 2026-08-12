import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Switch, Platform, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { useLanguage } from '../../context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { uploadImage as uploadHelper } from '../../lib/upload';
import { useColorScheme } from 'nativewind';
import { saveImageLocally } from '../../lib/localServices';
import { getInitials } from '../../lib/profile';
import Constants from 'expo-constants';
import { COLORS, GRADIENTS } from '../../constants/colors';
import {
    HelpCircle,
    Pencil,
    BadgeCheck,
    User,
    Lock,
    Bell,
    Briefcase,
    Receipt,
    CreditCard,
    Moon,
    Globe,
    MessageCircleQuestion,
    LogOut,
    ChevronRight,
    Crown,
    MessageSquare,
    TrendingUp,
    Info
} from 'lucide-react-native';

const ICON_SIZE = 20;

export default function SettingsScreen() {
    const router = useRouter();
    const { signOut, user } = useAuth();
    const { profile, updateProfile, fetchProfile } = useProfile();
    const { t } = useLanguage();
    const { colorScheme } = useColorScheme();
    const insets = useSafeAreaInsets();
    const [uploadingAvatar, setUploadingAvatar] = React.useState(false);

    useFocusEffect(
        React.useCallback(() => {
            fetchProfile();
        }, [fetchProfile])
    );

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0].uri) {
                await uploadImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error starting image picker:', error);
            Alert.alert(t('settings.alert_error'), t('settings.gallery_error'));
        }
    };

    const uploadImage = async (uri: string) => {
        if (!user) return;
        setUploadingAvatar(true);
        try {
            const localUri = await saveImageLocally(uri);
            const { error: localUpdateError } = await updateProfile({ logo_url: localUri });
            if (localUpdateError) throw localUpdateError;

            // Best effort cloud upload, then update with public URL when available.
            try {
                const publicUrl = await uploadHelper(uri, 'logos');
                if (publicUrl) {
                    await updateProfile({ logo_url: publicUrl });
                }
            } catch {
                // Keep local URI persisted; sync can retry later.
            }

            Alert.alert(t('common.success'), t('settings.avatar_success'));
        } catch (error: any) {
            console.error('Error uploading image:', error);
            Alert.alert(t('settings.alert_error'), t('settings.upload_failed'));
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            t('settings.log_out'),
            t('settings.logout_confirm', { defaultValue: 'Are you sure you want to log out?' }),
            [
                { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
                { text: t('settings.log_out'), style: 'destructive', onPress: () => signOut() },
            ]
        );
    };

    const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (
        <View className="mb-6">
            {title && (
                <Text className="text-slate-500 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3 ml-1">
                    {title}
                </Text>
            )}
            <View className="bg-white/70 dark:bg-slate-800/80 rounded-2xl overflow-hidden border border-white/50 dark:border-slate-700/50 shadow-sm">
                {children}
            </View>
        </View>
    );

    const ICON_COLORS: Record<string, string> = {
        'blue': COLORS.primary,
        'purple': '#9333EA',
        'orange': '#EA580C',
        'indigo': COLORS.accent,
        'emerald': COLORS.success,
        'cyan': '#0891B2',
        'slate': COLORS.slate600,
        'sky': '#0284C7',
        'teal': '#0D9488',
        'red': COLORS.danger,
        'amber': COLORS.warning,
    };

    const getColor = (twClass: string): string => {
        const match = twClass.match(/text-(\w+)-\d+/);
        return match ? (ICON_COLORS[match[1]] ?? COLORS.slate600) : COLORS.slate600;
    };

    // Re-implement SettingItem to use the color helper
    const SettingItemWithColor = ({
        icon: Icon,
        bgClass,
        textTwColor,
        label,
        onPress,
        isLast,
        rightElement
    }: {
        icon: any;
        bgClass: string;
        textTwColor: string;
        label: string;
        onPress?: () => void;
        isLast?: boolean;
        rightElement?: React.ReactNode;
    }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={label}
            className={`flex-row items-center p-4 ${!isLast ? 'border-b border-slate-100 dark:border-slate-700/50' : ''}`}
        >
            <View className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${bgClass}`}>
                <Icon size={ICON_SIZE} color={getColor(textTwColor)} />
            </View>
            <Text className="flex-1 text-slate-800 dark:text-white font-semibold text-[15px]">{label}</Text>
            {rightElement || <ChevronRight size={20} color={colorScheme === 'dark' ? '#475569' : '#CBD5E1'} />}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-[#f6f6f8] dark:bg-[#0a0f1e]" style={{ paddingTop: insets.top }}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <View className="flex-1">
                {/* Header */}
                <View className="flex-row justify-between items-center px-6 pt-2 pb-4">
                    <Text className="text-3xl font-extrabold text-slate-900 dark:text-white">{t('settings.title')}</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/settings/help')}
                        accessibilityLabel={t('settings.help_support')}
                        accessibilityRole="button"
                        className="w-11 h-11 bg-white dark:bg-slate-800 rounded-full items-center justify-center shadow-sm"
                    >
                        <HelpCircle size={20} color={colorScheme === 'dark' ? '#F8FAFC' : '#1E293B'} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    className="flex-1 px-5"
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profile Header */}
                    <View className="items-center mt-4 mb-8">
                        <View className="relative">
                            <LinearGradient
                                colors={GRADIENTS.settingsAvatar}
                                start={{ x: 0, y: 1 }}
                                end={{ x: 1, y: 0 }}
                                className="p-[3px] rounded-full"
                            >
                                <View className="bg-white dark:bg-slate-900 p-[2px] rounded-full">
                                    {profile?.logo_url ? (
                                        <Image
                                            source={{ uri: profile.logo_url }}
                                            className="w-24 h-24 rounded-full"
                                        />
                                    ) : (
                                        <LinearGradient
                                            colors={colorScheme === 'dark' ? GRADIENTS.settingsAvatarFallbackDark : GRADIENTS.settingsAvatarFallbackLight}
                                            className="w-24 h-24 rounded-full items-center justify-center"
                                        >
                                            <Text className="text-3xl font-extrabold text-slate-400 dark:text-slate-500 tracking-wider">
                                                {getInitials(profile?.business_name || profile?.full_name || user?.email || null)}
                                            </Text>
                                        </LinearGradient>
                                    )}
                                </View>
                            </LinearGradient>

                            <TouchableOpacity
                                className="absolute bottom-0 right-0 bg-[#1E40AF] p-2 rounded-full border-[3px] border-white"
                                onPress={pickImage}
                                disabled={uploadingAvatar}
                            >
                                {uploadingAvatar ? (
                                    <ActivityIndicator size="small" color="white" style={{ width: 12, height: 12 }} />
                                ) : (
                                    <Pencil size={12} color="white" />
                                )}
                            </TouchableOpacity>
                        </View>

                        <Text className="text-xl font-bold text-slate-900 dark:text-white mt-4">
                            {profile?.business_name || profile?.full_name || 'User'}
                        </Text>

                        {profile?.is_premium && (
                            <View className="flex-row items-center bg-[#1E40AF]/10 dark:bg-[#1E40AF]/20 px-3 py-1 rounded-full mt-2">
                                <BadgeCheck size={12} color={colorScheme === 'dark' ? '#93C5FD' : '#1E40AF'} style={{ marginRight: 4 }} />
                                <Text className="text-[#1E40AF] dark:text-blue-300 text-xs font-bold uppercase tracking-wide">
                                    {t('settings.pro_badge')}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Group: Account */}
                    <Section title={t('settings.account')}>
                        <SettingItemWithColor
                            icon={Crown}
                            bgClass="bg-amber-100" // using amber/gold for premium feel
                            textTwColor="text-amber-600" // needs helper support or use hex in helper
                            label={t('settings.pro_access')}
                            onPress={() => {
                                Alert.alert(
                                    "Bientôt disponible 🚀",
                                    "Les fonctionnalités Pro et les paiements seront activés dans la version 2.0 de QuickBill. Merci de votre patience !",
                                    [{ text: "Compris", style: "default" }]
                                );
                            }}
                            rightElement={
                                <View className="bg-[#1E40AF]/10 px-2 py-0.5 rounded-md ml-auto mr-2">
                                    <Text className="text-[10px] font-bold text-[#1E40AF] uppercase tracking-wider">
                                        Bientôt
                                    </Text>
                                </View>
                            }
                        />
                        <SettingItemWithColor
                            icon={User}
                            bgClass="bg-blue-50"
                            textTwColor="text-blue-600"
                            label={t('settings.personal_info')}
                            onPress={() => router.push('/settings/personal-info')}
                        />
                        <SettingItemWithColor
                            icon={Lock}
                            bgClass="bg-purple-50"
                            textTwColor="text-purple-600"
                            label={t('settings.security')}
                            onPress={() => router.push('/settings/security')}
                        />
                        <SettingItemWithColor
                            icon={Bell}
                            bgClass="bg-orange-50"
                            textTwColor="text-orange-600"
                            label={t('settings.notifications')}
                            isLast
                            onPress={() => router.push('/settings/notifications')}
                        />
                    </Section>

                    {/* Group: Business */}
                    <Section title={t('settings.business')}>
                        <SettingItemWithColor
                            icon={Briefcase}
                            bgClass="bg-indigo-50"
                            textTwColor="text-indigo-600"
                            label={t('settings.business_profile')}
                            onPress={() => router.push('/settings/business')}
                        />
                        <SettingItemWithColor
                            icon={Receipt}
                            bgClass="bg-emerald-50"
                            textTwColor="text-emerald-600"
                            label={t('settings.tax_settings')}
                            onPress={() => router.push('/settings/tax')}
                        />
                        <SettingItemWithColor
                            icon={CreditCard}
                            bgClass="bg-cyan-50"
                            textTwColor="text-cyan-600"
                            label={t('settings.payment_methods')}
                            onPress={() => router.push('/settings/payment')}
                        />
                        <SettingItemWithColor
                            icon={MessageSquare}
                            bgClass="bg-emerald-50"
                            textTwColor="text-emerald-600"
                            label={t('whatsapp_settings.title')}
                            onPress={() => router.push('/settings/whatsapp')}
                        />
                        <SettingItemWithColor
                            icon={TrendingUp}
                            bgClass="bg-emerald-50"
                            textTwColor="text-emerald-600"
                            label={t('whatsapp_settings.stats_title', { defaultValue: 'WhatsApp Analytics' })}
                            onPress={() => router.push('/stats/whatsapp')}
                        />
                        <SettingItemWithColor
                            icon={Bell}
                            bgClass="bg-blue-50"
                            textTwColor="text-blue-600"
                            label={t('reminders.title')}
                            isLast
                            onPress={() => router.push('/settings/reminders')}
                        />
                    </Section>

                    {/* Group: App */}
                    <Section title={t('settings.app')}>
                        <SettingItemWithColor
                            icon={Moon}
                            bgClass="bg-slate-100"
                            textTwColor="text-slate-600"
                            label={t('settings.theme')}
                            onPress={() => router.push('/settings/theme')}
                        />
                        <SettingItemWithColor
                            icon={Globe}
                            bgClass="bg-sky-50"
                            textTwColor="text-sky-600"
                            label={t('settings.language')}
                            onPress={() => router.push('/settings/language')}
                        />
                        <SettingItemWithColor
                            icon={Info}
                            bgClass="bg-indigo-50"
                            textTwColor="text-indigo-600"
                            label={t('settings.about')}
                            onPress={() => router.push('/settings/about')}
                        />
                        <SettingItemWithColor
                            icon={MessageCircleQuestion}
                            bgClass="bg-teal-50"
                            textTwColor="text-teal-600"
                            label={t('settings.help_support')}
                            isLast
                            onPress={() => router.push('/settings/help')}
                        />
                    </Section>

                    {/* Log Out */}
                    <TouchableOpacity
                        onPress={handleSignOut}
                        accessibilityRole="button"
                        accessibilityLabel={t('settings.log_out')}
                        className="bg-red-50 dark:bg-red-900/20 flex-row items-center justify-center p-4 rounded-2xl mb-8"
                    >
                        <LogOut size={20} color={COLORS.danger} style={{ marginRight: 8 }} />
                        <Text className="text-red-600 dark:text-red-400 font-bold text-base">{t('settings.log_out')}</Text>
                    </TouchableOpacity>

                    <Text className="text-center text-slate-300 dark:text-slate-600 text-xs font-medium pb-8">
                        QuickBill v{Constants.expoConfig?.version || '1.0.0'} (Build {Constants.expoConfig?.extra?.eas?.buildNumber || '1'})
                    </Text>

                </ScrollView>
            </View>
        </View>
    );
}

