import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Save,
    Camera,
    Shield,
    Calendar,
    ChevronDown,
    X,
    Search,
    Check,
    BadgeCheck
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { uploadImage } from '../../lib/upload';
import { validatePhone } from '../../lib/validation';
import { showSuccess, showError } from '../../lib/error-handler';
import { COLORS } from '../../constants/colors';
import { useColorScheme } from 'nativewind';
import { sendEmailChangeVerification } from '../../lib/email';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

// Country Codes - African countries first, then rest of the world
const COUNTRY_CODES = [
    // African Countries (Priority)
    { code: '+27', country: 'South Africa', flag: '🇿🇦' },
    { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
    { code: '+254', country: 'Kenya', flag: '🇰🇪' },
    { code: '+256', country: 'Uganda', flag: '🇺🇬' },
    { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
    { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
    { code: '+233', country: 'Ghana', flag: '🇬🇭' },
    { code: '+225', country: 'Ivory Coast', flag: '🇨🇮' },
    { code: '+221', country: 'Senegal', flag: '🇸🇳' },
    { code: '+237', country: 'Cameroon', flag: '🇨🇲' },
    { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
    { code: '+20', country: 'Egypt', flag: '🇪🇬' },
    { code: '+212', country: 'Morocco', flag: '🇲🇦' },
    { code: '+213', country: 'Algeria', flag: '🇩🇿' },
    { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
    { code: '+218', country: 'Libya', flag: '🇱🇾' },
    { code: '+257', country: 'Burundi', flag: '🇧🇮' },
    { code: '+260', country: 'Zambia', flag: '🇿🇲' },
    { code: '+263', country: 'Zimbabwe', flag: '🇿🇼' },
    { code: '+265', country: 'Malawi', flag: '🇲🇼' },
    { code: '+267', country: 'Botswana', flag: '🇧🇼' },
    { code: '+268', country: 'Eswatini', flag: '🇸🇿' },
    { code: '+269', country: 'Comoros', flag: '🇰🇲' },
    { code: '+230', country: 'Mauritius', flag: '🇲🇺' },
    { code: '+248', country: 'Seychelles', flag: '🇸🇨' },
    { code: '+261', country: 'Madagascar', flag: '🇲🇬' },
    { code: '+258', country: 'Mozambique', flag: '🇲🇿' },
    { code: '+264', country: 'Namibia', flag: '🇳🇦' },
    { code: '+266', country: 'Lesotho', flag: '🇱🇸' },
    { code: '+231', country: 'Liberia', flag: '🇱🇷' },
    { code: '+232', country: 'Sierra Leone', flag: '🇸🇱' },
    { code: '+224', country: 'Guinea', flag: '🇬🇳' },
    { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
    { code: '+227', country: 'Niger', flag: '🇳🇪' },
    { code: '+228', country: 'Togo', flag: '🇹🇬' },
    { code: '+229', country: 'Benin', flag: '🇧🇯' },
    { code: '+235', country: 'Chad', flag: '🇹🇩' },
    { code: '+236', country: 'Central African Republic', flag: '🇨🇫' },
    { code: '+240', country: 'Equatorial Guinea', flag: '🇬🇶' },
    { code: '+241', country: 'Gabon', flag: '🇬🇦' },
    { code: '+242', country: 'Congo', flag: '🇨🇬' },
    { code: '+243', country: 'DR Congo', flag: '🇨🇩' },
    { code: '+244', country: 'Angola', flag: '🇦🇴' },
    { code: '+245', country: 'Guinea-Bissau', flag: '🇬🇼' },
    { code: '+252', country: 'Somalia', flag: '🇸🇴' },
    { code: '+253', country: 'Djibouti', flag: '🇩🇯' },
    { code: '+211', country: 'South Sudan', flag: '🇸🇸' },
    { code: '+291', country: 'Eritrea', flag: '🇪🇷' },

    // Rest of the World
    { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+351', country: 'Portugal', flag: '🇵🇹' },
    { code: '+32', country: 'Belgium', flag: '🇧🇪' },
    { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
    { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
    { code: '+43', country: 'Austria', flag: '🇦🇹' },
    { code: '+45', country: 'Denmark', flag: '🇩🇰' },
    { code: '+46', country: 'Sweden', flag: '🇸🇪' },
    { code: '+47', country: 'Norway', flag: '🇳🇴' },
    { code: '+358', country: 'Finland', flag: '🇫🇮' },
    { code: '+48', country: 'Poland', flag: '🇵🇱' },
    { code: '+7', country: 'Russia', flag: '🇷🇺' },
    { code: '+380', country: 'Ukraine', flag: '🇺🇦' },
    { code: '+90', country: 'Turkey', flag: '🇹🇷' },
    { code: '+30', country: 'Greece', flag: '🇬🇷' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
    { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
    { code: '+95', country: 'Myanmar', flag: '🇲🇲' },
    { code: '+66', country: 'Thailand', flag: '🇹🇭' },
    { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+63', country: 'Philippines', flag: '🇵🇭' },
    { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
    { code: '+52', country: 'Mexico', flag: '🇲🇽' },
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
    { code: '+54', country: 'Argentina', flag: '🇦🇷' },
    { code: '+56', country: 'Chile', flag: '🇨🇱' },
    { code: '+57', country: 'Colombia', flag: '🇨🇴' },
    { code: '+51', country: 'Peru', flag: '🇵🇪' },
    { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+974', country: 'Qatar', flag: '🇶🇦' },
    { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
    { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
    { code: '+968', country: 'Oman', flag: '🇴🇲' },
    { code: '+962', country: 'Jordan', flag: '🇯🇴' },
    { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
    { code: '+972', country: 'Israel', flag: '🇮🇱' },
];

export default function ProfileScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { profile, loading: profileLoading, fetchProfile, updateProfile } = useProfile();
    const { colorScheme } = useColorScheme();
    const { t, language } = useLanguage();

    const [fullName, setFullName] = useState('');
    const [countryCode, setCountryCode] = useState('+250'); // Default to Rwanda
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showCountryCodeModal, setShowCountryCodeModal] = useState(false);
    const [countrySearchQuery, setCountrySearchQuery] = useState('');

    const getInitials = (name: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile) {
            // Use full_name if available, fallback to business_name for backward compatibility
            setFullName(profile.full_name || profile.business_name || '');
            setAvatarUrl(profile.logo_url || null);

            // Parse phone number to extract country code (safely matching longest code first)
            const phoneStr = profile.phone_contact || '';
            if (phoneStr) {
                const longestFirstCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
                const matchedCode = longestFirstCodes.find(cc => phoneStr.startsWith(cc.code));
                if (matchedCode) {
                    setCountryCode(matchedCode.code);
                    setPhone(phoneStr.substring(matchedCode.code.length).trim());
                } else {
                    setPhone(phoneStr);
                }
            }
        } else if (user?.user_metadata?.full_name) {
            setFullName(user.user_metadata.full_name);
        }
    }, [profile, user]);

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert(t('personal_info.permission_required'), t('personal_info.permission_msg'));
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!pickerResult.canceled) {
            handleUpload(pickerResult.assets[0].uri);
        }
    };

    const handleUpload = async (uri: string) => {
        setUploading(true);
        try {
            const publicUrl = await uploadImage(uri, 'avatars');
            setAvatarUrl(publicUrl);
            showSuccess(t('personal_info.upload_success'));
        } catch (error: any) {
            showError(error, t('personal_info.upload_error'));
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert(t('personal_info.error_title'), t('personal_info.empty_name'));
            return;
        }

        // Combine country code and phone number
        const fullPhoneNumber = phone.trim() ? `${countryCode}${phone.trim()}` : '';

        if (fullPhoneNumber) {
            const phoneValidation = validatePhone(fullPhoneNumber);
            if (!phoneValidation.isValid) {
                Alert.alert(t('personal_info.error_title'), phoneValidation.error);
                return;
            }
        }

        setSaving(true);
        try {
            const { error } = await updateProfile({
                full_name: fullName.trim(),
                phone_contact: fullPhoneNumber || null,
                logo_url: avatarUrl
            });

            if (error) {
                showError(error, t('personal_info.update_error'));
            } else {
                showSuccess(t('personal_info.update_success'));
                router.back();
            }
        } catch (error) {
            showError(error, t('personal_info.update_error'));
        } finally {
            setSaving(false);
        }
    };

    const handleEmailChange = () => {
        Alert.prompt(
            t('personal_info.change_email.title'),
            t('personal_info.change_email.desc'),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('personal_info.change_email.send'),
                    onPress: async (newEmail?: string) => {
                        if (newEmail && newEmail.includes('@')) {
                            const code = Math.floor(100000 + Math.random() * 900000).toString();
                            await sendEmailChangeVerification(newEmail, code);

                            Alert.alert(
                                t('personal_info.change_email.verification_sent'),
                                t('personal_info.change_email.simulation_msg', { code, email: newEmail })
                            );
                        } else {
                            Alert.alert(t('personal_info.error_title'), t('personal_info.change_email.invalid_email'));
                        }
                    }
                }
            ],
            'plain-text'
        );
    };

    // Filter country codes based on search
    const filteredCountryCodes = COUNTRY_CODES.filter(item =>
        item.country.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
        item.code.includes(countrySearchQuery)
    );

    if (profileLoading && !profile) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F9FAFB] dark:bg-slate-900">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F9FAFB] dark:bg-slate-900">
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white dark:bg-slate-800 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F8FAFC' : '#1E293B'} />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-slate-900 dark:text-white">{t('personal_info.title')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1"
                >
                    <ScrollView
                        className="flex-1 px-6"
                        contentContainerStyle={{ paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Avatar Section */}
                        <View className="items-center mt-6 mb-8">
                            <View className="relative">
                                {/* The outer premium glow/border effect */}
                                <LinearGradient
                                    colors={['#1337ec', '#a855f7', '#60a5fa']}
                                    start={{ x: 0, y: 1 }}
                                    end={{ x: 1, y: 0 }}
                                    className="p-[3px] rounded-full shadow-lg"
                                >
                                    <View className="w-28 h-28 rounded-full bg-white dark:bg-slate-900 items-center justify-center overflow-hidden border-[3px] border-white dark:border-slate-900 relative">
                                        {avatarUrl ? (
                                            <Image source={{ uri: avatarUrl }} className="w-full h-full" />
                                        ) : (
                                            <LinearGradient
                                                colors={colorScheme === 'dark' ? ['#1e293b', '#0f172a'] : ['#f1f5f9', '#e2e8f0']}
                                                className="w-full h-full items-center justify-center"
                                            >
                                                <Text className="text-4xl font-extrabold text-slate-400 dark:text-slate-500 tracking-wider">
                                                    {getInitials(fullName)}
                                                </Text>
                                            </LinearGradient>
                                        )}
                                        {uploading && (
                                            <View className="absolute inset-0 bg-black/40 items-center justify-center">
                                                <ActivityIndicator color="white" size="small" />
                                            </View>
                                        )}
                                    </View>
                                </LinearGradient>

                                {/* Redesigned Camera Button */}
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    className="absolute bottom-1 right-[-4px] p-2.5 rounded-full border-[3px] border-white dark:border-slate-900 shadow-xl active:scale-95 bg-white dark:bg-slate-800"
                                >
                                    <Camera size={18} color="#1337ec" />
                                </TouchableOpacity>
                            </View>

                            <Text className="mt-5 font-extrabold text-2xl text-slate-900 dark:text-white">
                                {fullName || 'User'}
                            </Text>

                            <View className="flex-row items-center mt-1 mb-2 opacity-80">
                                <Mail size={14} color={colorScheme === 'dark' ? '#94A3B8' : '#64748B'} style={{ marginRight: 6 }} />
                                <Text className="font-medium text-[15px] text-slate-500 dark:text-slate-400">
                                    {user?.email}
                                </Text>
                            </View>

                            {/* Premium Badge */}
                            <View className="flex-row items-center bg-blue-50 dark:bg-blue-900/40 px-3 py-1.5 rounded-full mt-1 border border-blue-100 dark:border-blue-800/30">
                                <BadgeCheck size={14} color="#2563EB" style={{ marginRight: 6 }} />
                                <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                                    {t('personal_info.business_profile')}
                                </Text>
                            </View>
                        </View>

                        {/* Form Fields */}
                        <View className="space-y-6">
                            {/* Full Name */}
                            <View>
                                <Text className="text-xs font-bold uppercase tracking-wider mb-2 ml-1 text-slate-500 dark:text-slate-400">
                                    {t('personal_info.full_name')}
                                </Text>
                                <View className="flex-row items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 shadow-sm">
                                    <User size={20} color={colorScheme === 'dark' ? '#64748B' : '#64748B'} style={{ marginRight: 12 }} />
                                    <TextInput
                                        className="flex-1 font-semibold text-base text-slate-800 dark:text-white"
                                        value={fullName}
                                        onChangeText={setFullName}
                                        placeholder="Alex Sterling"
                                        placeholderTextColor={colorScheme === 'dark' ? '#94A3B8' : '#94A3B8'}
                                    />
                                </View>
                            </View>

                            {/* Email - Read Only by default (with edit button) */}
                            <View className="mt-6">
                                <View className="flex-row items-center justify-between mb-2 ml-1">
                                    <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {t('personal_info.email_address')}
                                    </Text>
                                    <TouchableOpacity onPress={handleEmailChange}>
                                        <Text className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                            {t('personal_info.modify_btn')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 opacity-80">
                                    <Mail size={20} color={colorScheme === 'dark' ? '#64748B' : '#64748B'} style={{ marginRight: 12 }} />
                                    <TextInput
                                        className="flex-1 font-medium text-base text-slate-600 dark:text-slate-400"
                                        value={user?.email}
                                        editable={false}
                                        placeholder="user@example.com"
                                        placeholderTextColor={colorScheme === 'dark' ? '#94A3B8' : '#94A3B8'}
                                    />
                                    <Shield size={16} color={colorScheme === 'dark' ? '#64748B' : '#64748B'} />
                                </View>
                                <Text className="text-[10px] mt-1.5 ml-1 text-slate-400 dark:text-slate-500">
                                    {t('personal_info.security_note')}
                                </Text>
                            </View>

                            {/* Phone Number with Country Code Selector */}
                            <View className="mt-6">
                                <Text className="text-xs font-bold uppercase tracking-wider mb-2 ml-1 text-slate-500 dark:text-slate-400">
                                    {t('personal_info.phone_number')}
                                </Text>
                                <View className="flex-row items-center space-x-2">
                                    {/* Country Code Selector */}
                                    <TouchableOpacity
                                        onPress={() => setShowCountryCodeModal(true)}
                                        className="flex-row items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3.5 shadow-sm mr-2"
                                        style={{ width: 100 }}
                                    >
                                        <Text className="font-bold text-base mr-1">
                                            {COUNTRY_CODES.find(c => c.code === countryCode)?.flag || '🌍'}
                                        </Text>
                                        <Text className="font-semibold text-sm flex-1 text-slate-700 dark:text-slate-300">
                                            {countryCode}
                                        </Text>
                                        <ChevronDown size={16} color={colorScheme === 'dark' ? '#64748B' : '#64748B'} />
                                    </TouchableOpacity>

                                    {/* Phone Input */}
                                    <View className="flex-1 flex-row items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 shadow-sm">
                                        <Phone size={20} color={colorScheme === 'dark' ? '#64748B' : '#64748B'} style={{ marginRight: 12 }} />
                                        <TextInput
                                            className="flex-1 font-semibold text-base text-slate-800 dark:text-white"
                                            value={phone}
                                            onChangeText={setPhone}
                                            placeholder="712345678"
                                            placeholderTextColor={colorScheme === 'dark' ? '#94A3B8' : '#94A3B8'}
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Account Created - Info Only */}
                            <View className="mt-6 mb-8">
                                <Text className="text-xs font-bold uppercase tracking-wider mb-2 ml-1 text-slate-500 dark:text-slate-400">
                                    {t('personal_info.joined_date')}
                                </Text>
                                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 opacity-80">
                                    <Calendar size={20} color={colorScheme === 'dark' ? '#64748B' : '#64748B'} style={{ marginRight: 12 }} />
                                    <Text className="flex-1 font-medium text-base text-slate-600 dark:text-slate-400">
                                        {new Date(user?.created_at || Date.now()).toLocaleDateString(language === 'fr-FR' ? 'fr-FR' : 'en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Save Button */}
                <View className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-8">
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        className="w-full h-14 rounded-2xl flex-row items-center justify-center shadow-lg active:scale-[0.98]"
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Save size={20} color="white" style={{ marginRight: 8 }} />
                                <Text className="text-white font-bold text-lg">{t('personal_info.save_btn')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Country Code Modal */}
            <Modal
                visible={showCountryCodeModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCountryCodeModal(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '80%' }}>
                        {/* Modal Header */}
                        <View className="flex-row items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <Text className="text-xl font-bold text-slate-900 dark:text-white">
                                {t('personal_info.country_modal.title')}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowCountryCodeModal(false);
                                    setCountrySearchQuery('');
                                }}
                                className="w-8 h-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
                            >
                                <X size={18} color={colorScheme === 'dark' ? '#94A3B8' : '#475569'} />
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View className="px-6 py-3">
                            <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700">
                                <Search size={18} color={colorScheme === 'dark' ? '#94A3B8' : '#94A3B8'} style={{ marginRight: 8 }} />
                                <TextInput
                                    className="flex-1 text-base text-slate-800 dark:text-white"
                                    placeholder={t('personal_info.country_modal.search_placeholder')}
                                    placeholderTextColor={colorScheme === 'dark' ? '#94A3B8' : '#94A3B8'}
                                    value={countrySearchQuery}
                                    onChangeText={setCountrySearchQuery}
                                />
                            </View>
                        </View>

                        {/* Country List */}
                        <ScrollView className="px-6 pb-6">
                            {filteredCountryCodes.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => {
                                        setCountryCode(item.code);
                                        setShowCountryCodeModal(false);
                                        setCountrySearchQuery('');
                                    }}
                                    className="flex-row items-center justify-between py-3.5 border-b border-slate-100 dark:border-slate-800"
                                >
                                    <View className="flex-row items-center flex-1">
                                        <Text className="text-2xl mr-3">{item.flag}</Text>
                                        <View className="flex-1">
                                            <Text className="font-semibold text-base text-slate-800 dark:text-white">
                                                {item.country}
                                            </Text>
                                            <Text className="text-sm text-slate-500 dark:text-slate-400">
                                                {item.code}
                                            </Text>
                                        </View>
                                    </View>
                                    {countryCode === item.code && (
                                        <Check size={20} color="#2563EB" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
