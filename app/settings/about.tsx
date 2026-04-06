import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    Linking,
    Alert,
    Platform,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import Constants from 'expo-constants';
import {
    ArrowLeft,
    WifiOff,
    Sparkles,
    Shield,
    Mail,
    Users,
    ChevronRight,
} from 'lucide-react-native';
import { useLanguage } from '../../context/LanguageContext';

/** À personnaliser : email support, site, réseaux (laisser vide pour masquer une option). */
const SUPPORT_EMAIL = 'nourdevtd@gmail.com';
const WEBSITE_URL = 'https://portfolio-nour-k56s.vercel.app/en';
const WHATSAPP_URL = 'https://wa.me/250798977292';
const INSTAGRAM_URL = '';

const BRAND = { start: '#1337ec', end: '#7C3AED' };

export default function AboutScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const { t } = useLanguage();
    const isDark = colorScheme === 'dark';
    const version = Constants.expoConfig?.version ?? '1.0.0';

    const openUrl = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) await Linking.openURL(url);
        } catch {
            Alert.alert(t('common.error'), t('about_screen.link_error'));
        }
    };

    const openSupportMail = () => {
        const subject = encodeURIComponent(t('about_screen.mail_subject'));
        const body = encodeURIComponent(t('about_screen.mail_body'));
        openUrl(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
    };

    const openFollowMenu = () => {
        const buttons: {
            text: string;
            onPress?: () => void;
            style?: 'cancel' | 'default' | 'destructive';
        }[] = [
            {
                text: t('about_screen.follow_website'),
                onPress: () => openUrl(WEBSITE_URL),
            },
            {
                text: t('about_screen.follow_whatsapp'),
                onPress: () => openUrl(WHATSAPP_URL),
            },
        ];
        if (INSTAGRAM_URL) {
            buttons.push({
                text: t('about_screen.follow_instagram'),
                onPress: () => openUrl(INSTAGRAM_URL),
            });
        }
        buttons.push({ text: t('common.cancel'), style: 'cancel' });
        Alert.alert(t('about_screen.follow_alert_title'), undefined, buttons, {
            cancelable: true,
        });
    };

    const values = [
        {
            Icon: WifiOff,
            iconBg: ['#FFFBEB', '#FEF3C7'] as const,
            iconBgDark: ['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.08)'] as const,
            iconColor: '#D97706',
            title: t('about_screen.value_offline_title'),
            desc: t('about_screen.value_offline_desc'),
        },
        {
            Icon: Sparkles,
            iconBg: ['#F5F3FF', '#EDE9FE'] as const,
            iconBgDark: ['rgba(139,92,246,0.2)', 'rgba(139,92,246,0.1)'] as const,
            iconColor: '#7C3AED',
            title: t('about_screen.value_ai_title'),
            desc: t('about_screen.value_ai_desc'),
        },
        {
            Icon: Shield,
            iconBg: ['#ECFDF5', '#D1FAE5'] as const,
            iconBgDark: ['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.08)'] as const,
            iconColor: '#059669',
            title: t('about_screen.value_security_title'),
            desc: t('about_screen.value_security_desc'),
        },
    ];

    const SectionLabel = ({ children }: { children: string }) => (
        <View className="flex-row items-center mb-3 px-0.5">
            <LinearGradient
                colors={[BRAND.start, BRAND.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ width: 3, height: 14, borderRadius: 2, marginRight: 10 }}
            />
            <Text
                className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400"
                style={{ letterSpacing: 1.8 }}
            >
                {children}
            </Text>
        </View>
    );

    const ProseCard = ({ title, body }: { title: string; body: string }) => (
        <View
            style={[isDark ? styles.cardShellDark : styles.cardShellLight]}
            className="rounded-[22px] overflow-hidden mb-4"
        >
            <LinearGradient
                colors={['rgba(19,55,236,0.35)', 'rgba(124,58,237,0.2)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 3, width: '100%' }}
            />
            <View className="px-5 pt-5 pb-5 bg-white dark:bg-[#12182a]">
                <Text className="text-[17px] font-semibold text-slate-900 dark:text-white tracking-tight mb-3">
                    {title}
                </Text>
                <Text className="text-[15px] leading-[24px] text-slate-600 dark:text-slate-400 font-normal">
                    {body}
                </Text>
            </View>
        </View>
    );

    return (
        <View className="flex-1">
            <LinearGradient
                colors={isDark ? ['#080c18', '#0a1020', '#0d1528'] : ['#EEF2FF', '#F5F7FA', '#FAFBFC']}
                locations={[0, 0.45, 1]}
                className="absolute inset-0"
            />
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                {/* Header */}
                <View className="flex-row items-center px-4 pt-1 pb-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        hitSlop={14}
                        activeOpacity={0.7}
                        className="w-11 h-11 rounded-2xl bg-white/90 dark:bg-slate-800/90 items-center justify-center border border-slate-200/80 dark:border-slate-700/60"
                        style={styles.headerBtnShadow}
                    >
                        <ArrowLeft size={22} color={isDark ? '#F1F5F9' : '#0F172A'} />
                    </TouchableOpacity>
                    <View className="flex-1 items-center -ml-11">
                        <Text className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 mb-0.5">
                            QuickBill
                        </Text>
                        <Text className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                            {t('about_screen.header_title')}
                        </Text>
                    </View>
                    <View className="w-11" />
                </View>

                <ScrollView
                    className="flex-1 px-5"
                    contentContainerStyle={{ paddingBottom: 48 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero */}
                    <View className="items-center pt-2 pb-8">
                        <LinearGradient
                            colors={[BRAND.start, BRAND.end, '#60A5FA']}
                            start={{ x: 0, y: 1 }}
                            end={{ x: 1, y: 0 }}
                            style={{ padding: 3, borderRadius: 22 }}
                        >
                            <View className="bg-white dark:bg-[#0f1419] rounded-[19px] p-1.5">
                                <View
                                    className="w-[84px] h-[84px] rounded-2xl overflow-hidden"
                                    style={isDark ? undefined : styles.iconInnerShadow}
                                >
                                    <Image
                                        source={require('../../assets/icon.png')}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                </View>
                            </View>
                        </LinearGradient>
                        <Text className="text-slate-900 dark:text-white text-[26px] font-bold tracking-tight mt-5">
                            QuickBill
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-[13px] font-medium mt-1.5 text-center px-6 leading-5">
                            {t('about_screen.hero_tagline')}
                        </Text>
                        <View className="mt-5 flex-row items-center">
                            <View className="px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80">
                                <Text className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold tracking-wide">
                                    {t('about_screen.version_label', { version })}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <ProseCard title={t('about_screen.mission_title')} body={t('about_screen.mission_body')} />
                    <ProseCard title={t('about_screen.story_title')} body={t('about_screen.story_body')} />

                    <View className="h-px bg-slate-200/70 dark:bg-slate-700/50 my-1 mb-5" />

                    <SectionLabel>{t('about_screen.values_title')}</SectionLabel>
                    <View
                        style={[isDark ? styles.cardShellDark : styles.cardShellLight]}
                        className="rounded-[22px] overflow-hidden mb-5"
                    >
                        <LinearGradient
                            colors={['rgba(19,55,236,0.25)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ height: 2, width: '100%' }}
                        />
                        {values.map((row, idx) => (
                            <View key={idx}>
                                <View className="flex-row items-start px-5 py-4 bg-white dark:bg-[#12182a]">
                                    <LinearGradient
                                        colors={isDark ? row.iconBgDark : row.iconBg}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 14,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 14,
                                        }}
                                    >
                                        <row.Icon size={22} color={row.iconColor} strokeWidth={2.2} />
                                    </LinearGradient>
                                    <View className="flex-1 pt-0.5">
                                        <Text className="text-[16px] font-semibold text-slate-900 dark:text-white mb-1.5">
                                            {row.title}
                                        </Text>
                                        <Text className="text-[14px] leading-[21px] text-slate-600 dark:text-slate-400">
                                            {row.desc}
                                        </Text>
                                    </View>
                                </View>
                                {idx < values.length - 1 ? (
                                    <View className="h-px bg-slate-100 dark:bg-slate-700/80 mx-5" />
                                ) : null}
                            </View>
                        ))}
                    </View>

                    <SectionLabel>{t('about_screen.connect_title')}</SectionLabel>
                    <View
                        style={[isDark ? styles.cardShellDark : styles.cardShellLight]}
                        className="rounded-[22px] overflow-hidden mb-6"
                    >
                        <View className="bg-white dark:bg-[#12182a] px-5 pt-5 pb-5">
                            <View className="flex-row items-start mb-4">
                                <LinearGradient
                                    colors={[BRAND.start, BRAND.end]}
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 14,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 14,
                                    }}
                                >
                                    <Users size={22} color="#FFFFFF" strokeWidth={2} />
                                </LinearGradient>
                                <Text className="flex-1 text-[14px] leading-[22px] text-slate-600 dark:text-slate-400 pt-0.5">
                                    {t('about_screen.connect_intro')}
                                </Text>
                            </View>

                            <TouchableOpacity onPress={openSupportMail} activeOpacity={0.92} className="mb-3">
                                <LinearGradient
                                    colors={[BRAND.start, '#4F46E5', BRAND.end]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{
                                        borderRadius: 16,
                                        paddingVertical: 16,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        ...Platform.select({
                                            ios: {
                                                shadowColor: '#1337ec',
                                                shadowOpacity: 0.35,
                                                shadowRadius: 16,
                                                shadowOffset: { width: 0, height: 8 },
                                            },
                                            android: { elevation: 6 },
                                        }),
                                    }}
                                >
                                    <Mail size={20} color="#fff" style={{ marginRight: 10 }} strokeWidth={2} />
                                    <Text className="text-white font-semibold text-[15px] tracking-wide">
                                        {t('about_screen.contact_support')}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={openFollowMenu}
                                activeOpacity={0.88}
                                className="flex-row items-center justify-between py-4 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-600/60"
                            >
                                <Text className="text-slate-800 dark:text-slate-100 font-semibold text-[15px] flex-1 text-center">
                                    {t('about_screen.follow_us')}
                                </Text>
                                <ChevronRight size={20} color={isDark ? '#64748B' : '#94A3B8'} strokeWidth={2} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="items-center pt-2 border-t border-slate-200/60 dark:border-slate-700/40 mx-2">
                        <Text className="text-center text-slate-400 dark:text-slate-600 text-[12px] font-medium leading-5 px-2 mt-4">
                            {t('about_screen.footer_note')}
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    cardShellLight: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.06,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.9)',
    },
    cardShellDark: {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(51, 65, 85, 0.5)',
    },
    headerBtnShadow: {
        ...Platform.select({
            ios: {
                shadowColor: '#0f172a',
                shadowOpacity: 0.08,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
            },
            android: { elevation: 2 },
        }),
    },
    iconInnerShadow: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
});
