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
    Check
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../lib/upload';
import { validatePhone } from '../../lib/validation';
import { showSuccess, showError } from '../../lib/error-handler';
import { COLORS } from '../../constants/colors';
import { useColorScheme } from 'nativewind';

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

    const [fullName, setFullName] = useState('');
    const [countryCode, setCountryCode] = useState('+250'); // Default to Rwanda
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showCountryCodeModal, setShowCountryCodeModal] = useState(false);
    const [countrySearchQuery, setCountrySearchQuery] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile) {
            // Use full_name if available, fallback to business_name for backward compatibility
            setFullName(profile.full_name || profile.business_name || '');
            setAvatarUrl(profile.logo_url || null);

            // Parse phone number to extract country code
            const phoneStr = profile.phone_contact || '';
            if (phoneStr) {
                const matchedCode = COUNTRY_CODES.find(cc => phoneStr.startsWith(cc.code));
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
            Alert.alert("Permission Required", "Please allow gallery access to change avatar.");
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
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
            showSuccess('Avatar uploaded successfully');
        } catch (error: any) {
            showError(error, 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        // Combine country code and phone number
        const fullPhoneNumber = phone.trim() ? `${countryCode}${phone.trim()}` : '';

        if (fullPhoneNumber) {
            const phoneValidation = validatePhone(fullPhoneNumber);
            if (!phoneValidation.isValid) {
                Alert.alert('Error', phoneValidation.error);
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
                showError(error, "Update Failed");
            } else {
                showSuccess("Profile Updated!");
                router.back();
            }
        } catch (error) {
            showError(error, "Update Failed");
        } finally {
            setSaving(false);
        }
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
                    <Text className="text-lg font-bold text-slate-900 dark:text-white">Personal Info</Text>
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
                                <View className="w-28 h-28 rounded-full bg-slate-200 dark:bg-slate-800 items-center justify-center overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg">
                                    {avatarUrl ? (
                                        <Image source={{ uri: avatarUrl }} className="w-full h-full" />
                                    ) : (
                                        <User size={48} color={colorScheme === 'dark' ? '#94A3B8' : '#94A3B8'} />
                                    )}
                                    {uploading && (
                                        <View className="absolute inset-0 bg-black/30 items-center justify-center">
                                            <ActivityIndicator color="white" />
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    className="absolute bottom-0 right-0 p-2.5 rounded-full border-[3px] border-white shadow-md active:scale-95"
                                    style={{ backgroundColor: COLORS.primary }}
                                >
                                    <Camera size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                            <Text className="mt-4 font-bold text-lg text-slate-900 dark:text-white">
                                {fullName || 'User'}
                            </Text>
                            <Text className="font-medium text-slate-500 dark:text-slate-400">
                                {user?.email}
                            </Text>
                        </View>

                        {/* Form Fields */}
                        <View className="space-y-6">
                            {/* Full Name */}
                            <View>
                                <Text className="text-xs font-bold uppercase tracking-wider mb-2 ml-1 text-slate-500 dark:text-slate-400">
                                    Full Name
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

                            {/* Email - Read Only */}
                            <View className="mt-6">
                                <Text className="text-xs font-bold uppercase tracking-wider mb-2 ml-1 text-slate-500 dark:text-slate-400">
                                    Email Address
                                </Text>
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
                                    Email cannot be changed directly for security reasons.
                                </Text>
                            </View>

                            {/* Phone Number with Country Code Selector */}
                            <View className="mt-6">
                                <Text className="text-xs font-bold uppercase tracking-wider mb-2 ml-1 text-slate-500 dark:text-slate-400">
                                    Phone Number
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
                                    Joined Date
                                </Text>
                                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 opacity-80">
                                    <Calendar size={20} color={colorScheme === 'dark' ? '#64748B' : '#64748B'} style={{ marginRight: 12 }} />
                                    <Text className="flex-1 font-medium text-base text-slate-600 dark:text-slate-400">
                                        {new Date(user?.created_at || Date.now()).toLocaleDateString(undefined, {
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
                                <Text className="text-white font-bold text-lg">Save Changes</Text>
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
                                Select Country Code
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
                                    placeholder="Search country or code..."
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
