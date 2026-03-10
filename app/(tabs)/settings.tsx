import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Switch, Platform, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { uploadImage as uploadHelper } from '../../lib/upload';
import { useColorScheme } from 'nativewind';
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
    Crown
} from 'lucide-react-native';

const ICON_SIZE = 20;

export default function SettingsScreen() {
    const router = useRouter();
    const { signOut, user } = useAuth();
    const { profile, updateProfile, fetchProfile } = useProfile();
    const { colorScheme } = useColorScheme();
    const insets = useSafeAreaInsets();
    const [uploadingAvatar, setUploadingAvatar] = React.useState(false);

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
            Alert.alert('Erreur', 'Impossible de lancer la galerie d\'images.');
        }
    };

    const uploadImage = async (uri: string) => {
        if (!user) return;
        setUploadingAvatar(true);
        try {
            // Upload to Supabase Storage using helper
            const publicUrl = await uploadHelper(uri, 'logos');

            // Update Profile record
            const { error: updateError } = await updateProfile({ logo_url: publicUrl });
            if (updateError) throw updateError;

            Alert.alert("Succès", "Photo de profil mise à jour avec succès.");
        } catch (error: any) {
            console.error('Error uploading image:', error);
            Alert.alert("Erreur", "Le téléchargement a échoué. Vérifiez votre connexion et vos permissions.");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSignOut = () => {
        // Add confirmation logic if needed, for now direct action as per design
        signOut();
    };

    const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (
        <View className="mb-6">
            {title && (
                <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mb-3 ml-1">
                    {title}
                </Text>
            )}
            <View className="bg-white/70 dark:bg-slate-800/80 rounded-2xl overflow-hidden border border-white/50 dark:border-slate-700/50 shadow-sm">
                {children}
            </View>
        </View>
    );

    const SettingItem = ({
        icon: Icon,
        colorClass,
        textClass,
        label,
        onPress,
        isLast,
        rightElement
    }: {
        icon: any;
        colorClass: string;
        textClass: string;
        label: string;
        onPress?: () => void;
        isLast?: boolean;
        rightElement?: React.ReactNode;
    }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className={`flex-row items-center p-4 ${!isLast ? 'border-b border-slate-100' : ''}`}
        >
            <View className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${colorClass}`}>
                <Icon size={ICON_SIZE} style={{ color: textClass }} />
            </View>
            <Text className="flex-1 text-slate-800 font-semibold text-[15px]">{label}</Text>
            {rightElement || <ChevronRight size={20} color="#CBD5E1" />}
        </TouchableOpacity>
    );

    // Dynamic text color extraction workaround:
    // Since NativeWind handles classes, we need to pass style objects or use specific text-color classes properly.
    // However, tailwind classes like 'text-blue-600' need to be parsed by NativeWind.
    // The trick 'style={{ color: textClass }}' won't work directly with class names string like 'text-blue-600'.
    // Instead we will use a mapping or hex colors for the icon "color" prop, OR text-{color} class on the Icon? 
    // Lucide doesn't accept className. 
    // Fix: We'll pass the hex color directly or use specific classes on a wrapper Text if needed, 
    // but Lucide icons take a `color` prop.
    // Let's use a helper for colors to keep it clean and working.

    const getColor = (twClass: string) => {
        // Simple mapping for the requested design
        switch (twClass) {
            case 'text-blue-600': return '#2563EB';
            case 'text-purple-600': return '#9333EA';
            case 'text-orange-600': return '#EA580C';
            case 'text-indigo-600': return '#4F46E5';
            case 'text-emerald-600': return '#059669';
            case 'text-cyan-600': return '#0891B2';
            case 'text-slate-600': return '#475569';
            case 'text-sky-600': return '#0284C7';
            case 'text-teal-600': return '#0D9488';
            case 'text-red-600': return '#DC2626';
            case 'text-amber-600': return '#D97706';
            default: return '#475569';
        }
    };

    // Re-implement SettingItem to use the color helper
    const SettingItemWithColor = ({
        icon: Icon,
        bgClass,
        textTwColor,
        label,
        onPress,
        isLast
    }: {
        icon: any;
        bgClass: string;
        textTwColor: string;
        label: string;
        onPress?: () => void;
        isLast?: boolean;
    }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className={`flex-row items-center p-4 ${!isLast ? 'border-b border-slate-100 dark:border-slate-700/50' : ''}`}
        >
            <View className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${bgClass}`}>
                <Icon size={ICON_SIZE} color={getColor(textTwColor)} />
            </View>
            <Text className="flex-1 text-slate-800 dark:text-white font-semibold text-[15px]">{label}</Text>
            <ChevronRight size={20} color={colorScheme === 'dark' ? '#475569' : '#CBD5E1'} />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-[#f6f6f8] dark:bg-slate-900" style={{ paddingTop: insets.top }}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <View className="flex-1">
                {/* Header */}
                <View className="flex-row justify-between items-center px-6 pt-2 pb-4">
                    <Text className="text-3xl font-extrabold text-slate-900 dark:text-white">Settings</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/settings/help')}
                        className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full items-center justify-center shadow-sm"
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
                                colors={['#1337ec', '#a855f7', '#60a5fa']}
                                start={{ x: 0, y: 1 }}
                                end={{ x: 1, y: 0 }}
                                className="p-[3px] rounded-full"
                            >
                                <View className="bg-white p-[2px] rounded-full">
                                    <Image
                                        source={{ uri: profile?.logo_url || 'https://i.pravatar.cc/150?img=11' }}
                                        className="w-24 h-24 rounded-full"
                                    />
                                </View>
                            </LinearGradient>

                            <TouchableOpacity
                                className="absolute bottom-0 right-0 bg-[#1337ec] p-2 rounded-full border-[3px] border-white"
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
                            {profile?.business_name || 'Alex Sterling'}
                        </Text>

                        <View className="flex-row items-center bg-[#1337ec]/10 dark:bg-[#1337ec]/20 px-3 py-1 rounded-full mt-2">
                            <BadgeCheck size={12} color={colorScheme === 'dark' ? '#93C5FD' : '#1337ec'} style={{ marginRight: 4 }} />
                            <Text className="text-[#1337ec] dark:text-blue-300 text-xs font-bold uppercase tracking-wide">
                                Premium Member
                            </Text>
                        </View>
                    </View>

                    {/* Group: Account */}
                    <Section title="Account">
                        <SettingItemWithColor
                            icon={Crown}
                            bgClass="bg-amber-100" // using amber/gold for premium feel
                            textTwColor="text-amber-600" // needs helper support or use hex in helper
                            label="Pro Access"
                            onPress={() => router.push('/settings/subscription')}
                        />
                        <SettingItemWithColor
                            icon={User}
                            bgClass="bg-blue-50"
                            textTwColor="text-blue-600"
                            label="Personal Info"
                            onPress={() => router.push('/settings/personal-info')}
                        />
                        <SettingItemWithColor
                            icon={Lock}
                            bgClass="bg-purple-50"
                            textTwColor="text-purple-600"
                            label="Security"
                            onPress={() => router.push('/settings/security')}
                        />
                        <SettingItemWithColor
                            icon={Bell}
                            bgClass="bg-orange-50"
                            textTwColor="text-orange-600"
                            label="Notifications"
                            isLast
                            onPress={() => router.push('/settings/notifications')}
                        />
                    </Section>

                    {/* Group: Business */}
                    <Section title="Business">
                        <SettingItemWithColor
                            icon={Briefcase}
                            bgClass="bg-indigo-50"
                            textTwColor="text-indigo-600"
                            label="Business Profile"
                            onPress={() => router.push('/settings/business')}
                        />
                        <SettingItemWithColor
                            icon={Receipt}
                            bgClass="bg-emerald-50"
                            textTwColor="text-emerald-600"
                            label="Tax Settings"
                            onPress={() => router.push('/settings/tax')}
                        />
                        <SettingItemWithColor
                            icon={CreditCard}
                            bgClass="bg-cyan-50"
                            textTwColor="text-cyan-600"
                            label="Payment Methods"
                            isLast
                            onPress={() => router.push('/settings/payment')}
                        />
                    </Section>

                    {/* Group: App */}
                    <Section title="App">
                        <SettingItemWithColor
                            icon={Moon}
                            bgClass="bg-slate-100"
                            textTwColor="text-slate-600"
                            label="Theme"
                            onPress={() => router.push('/settings/theme')}
                        />
                        <SettingItemWithColor
                            icon={Globe}
                            bgClass="bg-sky-50"
                            textTwColor="text-sky-600"
                            label="Language"
                            onPress={() => router.push('/settings/language')}
                        />
                        <SettingItemWithColor
                            icon={MessageCircleQuestion}
                            bgClass="bg-teal-50"
                            textTwColor="text-teal-600"
                            label="Help & Support"
                            isLast
                            onPress={() => router.push('/settings/help')}
                        />
                    </Section>

                    {/* Log Out */}
                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="bg-red-50 dark:bg-red-900/20 flex-row items-center justify-center p-4 rounded-2xl mb-8"
                    >
                        <LogOut size={20} color="#DC2626" style={{ marginRight: 8 }} />
                        <Text className="text-red-600 dark:text-red-400 font-bold text-base">Log Out</Text>
                    </TouchableOpacity>

                    <Text className="text-center text-slate-300 dark:text-slate-600 text-xs font-medium pb-8">
                        QuickBill v2.4.0 (Build 412)
                    </Text>

                </ScrollView>
            </View>
        </View>
    );
}

