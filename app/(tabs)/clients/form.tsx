import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Image,
    Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Camera,
    ChevronDown,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Globe,
    FileText,
    Pencil,
    Check,
    Trash2,
    Building2,
    User,
    Hash,
    Briefcase
} from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import * as ExpoCrypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../../lib/upload';
import { showSuccess, showError } from '../../../lib/error-handler';
import { COLORS } from '../../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FormSkeleton } from '../../../components/FormSkeleton';
import { useLanguage } from '../../../context/LanguageContext';

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

const CURRENCIES = [
    // Francs Africains (Priority)
    { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', region: '🌍 West Africa' },
    { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', region: '🌍 Central Africa' },
    { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc', region: '🇷🇼 Rwanda' },
    { code: 'BIF', symbol: 'FBu', name: 'Burundian Franc', region: '🇧🇮 Burundi' },
    { code: 'CDF', symbol: 'FC', name: 'Congolese Franc', region: '🇨🇩 DR Congo' },
    { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Franc', region: '🇩🇯 Djibouti' },
    { code: 'GNF', symbol: 'FG', name: 'Guinean Franc', region: '🇬🇳 Guinea' },
    { code: 'KMF', symbol: 'CF', name: 'Comorian Franc', region: '🇰🇲 Comoros' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', region: '🇨🇭 Switzerland' },

    // Autres Devises Africaines
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', region: '🇰🇪 Kenya' },
    { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', region: '🇺🇬 Uganda' },
    { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', region: '🇹🇿 Tanzania' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand', region: '🇿🇦 South Africa' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', region: '🇳🇬 Nigeria' },
    { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', region: '🇬🇭 Ghana' },
    { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', region: '🇪🇬 Egypt' },
    { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham', region: '🇲🇦 Morocco' },
    { code: 'TND', symbol: 'DT', name: 'Tunisian Dinar', region: '🇹🇳 Tunisia' },
    { code: 'DZD', symbol: 'DA', name: 'Algerian Dinar', region: '🇩🇿 Algeria' },
    { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', region: '🇪🇹 Ethiopia' },
    { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee', region: '🇲🇺 Mauritius' },
    { code: 'SCR', symbol: '₨', name: 'Seychellois Rupee', region: '🇸🇨 Seychelles' },
    { code: 'MGA', symbol: 'Ar', name: 'Malagasy Ariary', region: '🇲🇬 Madagascar' },
    { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical', region: '🇲🇿 Mozambique' },
    { code: 'AOA', symbol: 'Kz', name: 'Angolan Kwanza', region: '🇦🇴 Angola' },
    { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha', region: '🇿🇲 Zambia' },
    { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha', region: '🇲🇼 Malawi' },
    { code: 'BWP', symbol: 'P', name: 'Botswana Pula', region: '🇧🇼 Botswana' },
    { code: 'NAD', symbol: 'N$', name: 'Namibian Dollar', region: '🇳🇦 Namibia' },
    { code: 'SZL', symbol: 'L', name: 'Swazi Lilangeni', region: '🇸🇿 Eswatini' },
    { code: 'LSL', symbol: 'L', name: 'Lesotho Loti', region: '🇱🇸 Lesotho' },
    { code: 'SOS', symbol: 'Sh', name: 'Somali Shilling', region: '🇸🇴 Somalia' },
    { code: 'SSP', symbol: '£', name: 'South Sudanese Pound', region: '🇸🇸 South Sudan' },
    { code: 'SDG', symbol: 'SDG', name: 'Sudanese Pound', region: '🇸🇩 Sudan' },
    { code: 'ERN', symbol: 'Nfk', name: 'Eritrean Nakfa', region: '🇪🇷 Eritrea' },
    { code: 'LYD', symbol: 'LD', name: 'Libyan Dinar', region: '🇱🇾 Libya' },
    { code: 'MRU', symbol: 'UM', name: 'Mauritanian Ouguiya', region: '🇲🇷 Mauritania' },
    { code: 'GMD', symbol: 'D', name: 'Gambian Dalasi', region: '🇬🇲 Gambia' },
    { code: 'SLL', symbol: 'Le', name: 'Sierra Leonean Leone', region: '🇸🇱 Sierra Leone' },
    { code: 'LRD', symbol: 'L$', name: 'Liberian Dollar', region: '🇱🇷 Liberia' },
    { code: 'CVE', symbol: '$', name: 'Cape Verdean Escudo', region: '🇨🇻 Cape Verde' },
    { code: 'STN', symbol: 'Db', name: 'São Tomé and Príncipe Dobra', region: '🇸🇹 São Tomé' },

    // Devises Internationales Majeures
    { code: 'USD', symbol: '$', name: 'US Dollar', region: '🇺🇸 USA' },
    { code: 'EUR', symbol: '€', name: 'Euro', region: '🇪🇺 Europe' },
    { code: 'GBP', symbol: '£', name: 'British Pound', region: '🇬🇧 UK' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', region: '🇯🇵 Japan' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', region: '🇨🇳 China' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', region: '🇮🇳 India' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', region: '🇦🇺 Australia' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', region: '🇨🇦 Canada' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', region: '🇦🇪 UAE' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', region: '🇸🇦 Saudi Arabia' },
];

const INDUSTRIES = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Retail',
    'Manufacturing',
    'Construction',
    'Real Estate',
    'Hospitality',
    'Transportation',
    'Agriculture',
    'Media & Entertainment',
    'Professional Services',
    'Other'
];

export default function ClientFormScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const isEditing = !!id;
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditing);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // Form State
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [businessName, setBusinessName] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [industry, setIndustry] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+250'); // Default to Rwanda
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [taxId, setTaxId] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [notes, setNotes] = useState('');

    // Modal states
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [showIndustryModal, setShowIndustryModal] = useState(false);
    const [showCountryCodeModal, setShowCountryCodeModal] = useState(false);
    const [countrySearchQuery, setCountrySearchQuery] = useState('');

    useEffect(() => {
        if (isEditing) {
            fetchClientDetails();
        }
    }, [id]);

    const fetchClientDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setBusinessName(data.name || '');
                setEmail(data.email || '');

                // Parse phone number to extract country code
                const phoneStr = data.phone || '';
                if (phoneStr) {
                    // Try to find matching country code
                    const matchedCode = COUNTRY_CODES.find(cc => phoneStr.startsWith(cc.code));
                    if (matchedCode) {
                        setCountryCode(matchedCode.code);
                        setPhone(phoneStr.substring(matchedCode.code.length).trim());
                    } else {
                        setPhone(phoneStr);
                    }
                }

                setAddress(data.address || '');
                setNotes(data.notes || '');
                setRegistrationNumber(data.registration_number || '');
                setIndustry(data.industry || '');
                setContactPerson(data.contact_person || '');
                setTaxId(data.tax_id || '');
                setCurrency(data.currency || 'USD');
                setLogoUrl(data.logo_url || null);
            }
        } catch (error) {
            console.error('Error loading client:', error);
            showError(error, 'Could not load client details');
            router.back();
        } finally {
            setFetching(false);
        }
    };

    const handlePickLogo = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please grant access to your photo library.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0].uri) {
                setUploadingLogo(true);
                const publicUrl = await uploadImage(result.assets[0].uri, 'client-logos');
                setLogoUrl(publicUrl);
                setUploadingLogo(false);
                showSuccess('Logo uploaded successfully');
            }
        } catch (error) {
            setUploadingLogo(false);
            showError(error, 'Failed to upload logo');
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Client',
            'Are you sure you want to delete this client? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const { error } = await supabase
                                .from('clients')
                                .delete()
                                .eq('id', id);
                            if (error) throw error;
                            showSuccess('Client deleted successfully');
                            router.back();
                        } catch (error) {
                            showError(error, 'Failed to delete client');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        if (!businessName.trim()) {
            Alert.alert('Missing Information', 'Business Name is required.');
            return;
        }

        setLoading(true);
        try {
            const clientData = {
                name: businessName.trim(),
                email: email.trim() || null,
                phone: phone.trim() ? `${countryCode}${phone.trim()}` : null,
                address: address.trim() || null,
                notes: notes.trim() || null,
                registration_number: registrationNumber.trim() || null,
                industry: industry.trim() || null,
                contact_person: contactPerson.trim() || null,
                tax_id: taxId.trim() || null,
                currency: currency || 'USD',
                logo_url: logoUrl || null,
            };

            if (isEditing) {
                const { error } = await supabase
                    .from('clients')
                    .update(clientData)
                    .eq('id', id);
                if (error) throw error;
                showSuccess(t('business_profile.update_success'), t('common.success'), t);
            } else {
                const { error } = await supabase
                    .from('clients')
                    .insert([{
                        ...clientData,
                        user_id: user?.id,
                        portal_token: ExpoCrypto.randomUUID()
                    }]);
                if (error) throw error;
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showSuccess(t('personal_info.update_success'), t('common.success'), t);
            }

            router.back();
        } catch (error: any) {
            console.error('Save error:', error);
            showError(error, t('business_profile.update_error'), t);
        } finally {
            setLoading(false);
        }
    };

    const getCurrencyDisplay = () => {
        const curr = CURRENCIES.find(c => c.code === currency);
        return curr ? `${curr.symbol} ${curr.code}` : currency;
    };

    const getCountryDisplay = () => {
        const country = COUNTRY_CODES.find(c => c.code === countryCode);
        return country ? `${country.flag} ${country.code}` : countryCode;
    };

    const filteredCountries = COUNTRY_CODES.filter(country =>
        country.country.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
        country.code.includes(countrySearchQuery)
    );

    if (fetching) {
        return <FormSkeleton />;
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />

            {/* Background Decorative Elements */}
            <View className="absolute top-0 left-0 right-0 h-[45%]">
                <LinearGradient
                    colors={['#DBEAFE', '#F8FAFC']}
                    className="flex-1"
                />
                <View className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400/10 rounded-full" />
                <View className="absolute top-40 -left-20 w-48 h-48 bg-indigo-400/10 rounded-full" />
            </View>

            {/* Header */}
            <View className="flex-row justify-between items-center px-6 pt-12 pb-4">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 bg-white rounded-full border border-slate-100 shadow-sm shadow-slate-200/50">
                    <ArrowLeft size={20} color="#0F172A" strokeWidth={3} />
                </TouchableOpacity>
                <Text className="text-xl font-black text-slate-900 tracking-tight">
                    {isEditing ? 'Modifier Client' : 'Nouveau Client'}
                </Text>
                {isEditing ? (
                    <TouchableOpacity onPress={handleDelete} className="p-2 bg-red-50 rounded-full border border-red-100">
                        <Trash2 size={20} color="#EF4444" strokeWidth={2.5} />
                    </TouchableOpacity>
                ) : (
                    <View className="w-10" />
                )}
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 px-6"
                    contentContainerStyle={{ paddingBottom: 150 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo/Photo Upload */}
                    <View className="items-center mb-10 mt-6">
                        <TouchableOpacity onPress={handlePickLogo} disabled={uploadingLogo} className="relative shadow-2xl shadow-blue-500/20">
                            <View className="w-24 h-24 rounded-[32px] bg-white items-center justify-center border border-blue-50 overflow-hidden shadow-sm">
                                {logoUrl ? (
                                    <Image source={{ uri: logoUrl }} className="w-full h-full" resizeMode="cover" />
                                ) : (
                                    <LinearGradient colors={['#1E40AF', '#1e3a8a']} className="w-full h-full items-center justify-center">
                                        <Building2 size={32} color="white" />
                                    </LinearGradient>
                                )}
                                {uploadingLogo && (
                                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                                        <ActivityIndicator color="white" />
                                    </View>
                                )}
                            </View>
                            <View className="absolute bottom-0 right-[-5px] bg-white p-2 rounded-full border border-blue-50 shadow-md">
                                <Pencil size={14} color="#1E40AF" strokeWidth={3} />
                            </View>
                        </TouchableOpacity>
                        <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest mt-4">
                            {logoUrl ? 'Modifier le logo' : 'Ajouter un logo'}
                        </Text>
                    </View>

                    {/* Business Details */}
                    <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4 ml-1">Company Details</Text>

                    <View className="mb-4">
                        <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-2 ml-1">Business Name <Text className="text-red-500">*</Text></Text>
                        <View className="bg-white border border-slate-100 rounded-[22px] px-5 h-16 shadow-sm shadow-slate-200/50 flex-row items-center">
                            <Building2 size={20} color="#94A3B8" strokeWidth={2.5} />
                            <TextInput
                                className="flex-1 ml-3 text-base text-slate-900 font-bold"
                                placeholder="Acme Corp, Inc."
                                placeholderTextColor="#CBD5E1"
                                value={businessName}
                                onChangeText={setBusinessName}
                                autoCapitalize="words"
                            />
                        </View>
                    </View>

                    <View className="mb-4">
                        <View className="flex-row justify-between mb-2 ml-1">
                            <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest">Registration Number</Text>
                            <Text className="text-slate-400 font-bold text-[10px]">(Optional)</Text>
                        </View>
                        <View className="bg-white border border-slate-100 rounded-[22px] px-5 h-16 shadow-sm shadow-slate-200/50 flex-row items-center">
                            <Hash size={20} color="#94A3B8" strokeWidth={2.5} />
                            <TextInput
                                className="flex-1 ml-3 text-base text-slate-900 font-bold"
                                placeholder="e.g. 12345678"
                                placeholderTextColor="#CBD5E1"
                                value={registrationNumber}
                                onChangeText={setRegistrationNumber}
                            />
                        </View>
                    </View>

                    <View className="mb-8">
                        <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-2 ml-1">Industry / Category</Text>
                        <TouchableOpacity
                            onPress={() => setShowIndustryModal(true)}
                            className="bg-white border border-slate-100 rounded-[22px] px-5 h-16 shadow-sm shadow-slate-200/50 flex-row items-center"
                        >
                            <Briefcase size={20} color="#94A3B8" strokeWidth={2.5} />
                            <Text className={`flex-1 ml-3 text-base font-bold ${industry ? 'text-slate-900' : 'text-slate-400'}`}>
                                {industry || 'Select Industry'}
                            </Text>
                            <ChevronDown size={20} color="#94A3B8" strokeWidth={2.5} />
                        </TouchableOpacity>
                    </View>

                    {/* Contact Information */}
                    <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4 ml-1">Contact Information</Text>

                    <View className="mb-4">
                        <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-2 ml-1">Contact Person</Text>
                        <View className="bg-white border border-slate-100 rounded-[22px] px-5 h-16 shadow-sm shadow-slate-200/50 flex-row items-center">
                            <User size={20} color="#94A3B8" strokeWidth={2.5} />
                            <TextInput
                                className="flex-1 ml-3 text-base text-slate-900 font-bold"
                                placeholder="Full Name"
                                placeholderTextColor="#CBD5E1"
                                value={contactPerson}
                                onChangeText={setContactPerson}
                            />
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-2 ml-1">Email Address</Text>
                        <View className="bg-white border border-slate-100 rounded-[22px] px-5 h-16 shadow-sm shadow-slate-200/50 flex-row items-center">
                            <Mail size={20} color="#94A3B8" strokeWidth={2.5} />
                            <TextInput
                                className="flex-1 ml-3 text-base text-slate-900 font-bold"
                                placeholder="client@company.com"
                                placeholderTextColor="#CBD5E1"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-2 ml-1">Phone Number</Text>
                        <View className="bg-white border border-slate-100 rounded-[22px] shadow-sm shadow-slate-200/50 flex-row items-center overflow-hidden h-16 px-2">
                            <TouchableOpacity
                                onPress={() => setShowCountryCodeModal(true)}
                                className="bg-slate-50 px-3 py-2 rounded-[16px] border border-slate-100 flex-row items-center"
                            >
                                <Text className="text-slate-900 font-black text-sm ml-1">{getCountryDisplay()}</Text>
                                <ChevronDown size={14} color="#94A3B8" strokeWidth={3} className="ml-1" />
                            </TouchableOpacity>
                            <TextInput
                                className="flex-1 ml-3 text-base text-slate-900 font-bold"
                                placeholder="712 345 678"
                                placeholderTextColor="#CBD5E1"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <View className="mb-8">
                        <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-2 ml-1">Billing Address</Text>
                        <View className="bg-white border border-slate-100 rounded-[22px] px-5 py-5 shadow-sm shadow-slate-200/50">
                            <TextInput
                                className="text-base text-slate-900 font-bold min-h-[80px]"
                                placeholder="Street address, City, State, Zip Code"
                                placeholderTextColor="#CBD5E1"
                                value={address}
                                onChangeText={setAddress}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Additional Details */}
                    <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4 ml-1">Additional Details</Text>

                    <View className="flex-row justify-between mb-4 gap-4">
                        <View className="flex-1">
                            <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-2 ml-1">Tax ID / VAT</Text>
                            <View className="bg-white border border-slate-100 rounded-[22px] px-5 h-16 shadow-sm shadow-slate-200/50 flex-row items-center">
                                <CreditCard size={20} color="#94A3B8" strokeWidth={2.5} />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-slate-900 font-bold"
                                    placeholder="Optional"
                                    placeholderTextColor="#CBD5E1"
                                    value={taxId}
                                    onChangeText={setTaxId}
                                />
                            </View>
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-2 ml-1">Currency</Text>
                            <TouchableOpacity
                                onPress={() => setShowCurrencyModal(true)}
                                className="bg-white border border-slate-100 rounded-[22px] px-5 h-16 shadow-sm shadow-slate-200/50 flex-row items-center"
                            >
                                <Globe size={20} color="#94A3B8" strokeWidth={2.5} />
                                <Text className="flex-1 ml-3 text-base text-slate-900 font-bold">{getCurrencyDisplay()}</Text>
                                <ChevronDown size={18} color="#94A3B8" strokeWidth={2.5} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-2 ml-1">Internal Notes</Text>
                        <View className="bg-white border border-slate-100 rounded-[22px] px-5 py-5 shadow-sm shadow-slate-200/50">
                            <TextInput
                                className="text-base text-slate-900 font-bold min-h-[60px]"
                                placeholder="Add any private notes about this client..."
                                placeholderTextColor="#CBD5E1"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                </ScrollView>

                {/* Footer Button */}
                <View
                    style={{ paddingBottom: Math.max(insets.bottom, 20), paddingTop: 16 }}
                    className="w-full bg-white px-8 pb-8 bg-transparent"
                >
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading}
                        activeOpacity={0.9}
                        className={`shadow-2xl shadow-blue-500/40`}
                    >
                        <LinearGradient
                            colors={['#1E40AF', '#1e3a8a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="h-16 rounded-[22px] flex-row items-center justify-center"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center mr-3 hidden">
                                        <Check size={16} color="white" strokeWidth={3} />
                                    </View>
                                    <Text className="text-white text-lg font-black uppercase tracking-widest">
                                        {isEditing ? 'Sauvegarder' : 'Créer le client'}
                                    </Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Currency Modal */}
            <Modal visible={showCurrencyModal} transparent animationType="slide">
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-[32px] p-6 max-h-[80%]" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-xl font-bold text-slate-900">Select Currency</Text>
                                <Text className="text-slate-400 text-xs mt-1">Choose your preferred currency</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowCurrencyModal(false)} className="bg-slate-100 px-4 py-2 rounded-full">
                                <Text className="font-bold text-slate-500">Close</Text>
                            </TouchableOpacity>
                        </View>

                        {/* African Francs Section */}
                        <View className="mb-4">
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1 mb-3">
                                💰 African Francs
                            </Text>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {CURRENCIES.map((curr, index) => {
                                const isSelected = currency === curr.code;
                                const isAfricanFranc = index < 9; // First 9 are African Francs
                                const isAfricanCurrency = index < 42; // First 42 are African currencies
                                const showDivider = index === 8 || index === 41; // After Francs and African currencies

                                return (
                                    <View key={curr.code}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setCurrency(curr.code);
                                                setShowCurrencyModal(false);
                                            }}
                                            className={`p-4 rounded-2xl mb-2 flex-row justify-between items-center ${isSelected ? 'bg-blue-50 border-2 border-blue-200' : 'bg-slate-50 border border-slate-100'
                                                }`}
                                        >
                                            <View className="flex-1">
                                                <View className="flex-row items-center mb-1">
                                                    <Text className={`font-bold text-base ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                                                        {curr.name}
                                                    </Text>
                                                </View>
                                                <View className="flex-row items-center">
                                                    <Text className="text-slate-500 text-sm font-medium mr-2">
                                                        {curr.code} ({curr.symbol})
                                                    </Text>
                                                    <Text className="text-slate-400 text-xs">
                                                        {curr.region}
                                                    </Text>
                                                </View>
                                            </View>
                                            {isSelected && (
                                                <View className="w-6 h-6 bg-blue-600 rounded-full items-center justify-center ml-2">
                                                    <Check size={14} color="white" strokeWidth={3} />
                                                </View>
                                            )}
                                        </TouchableOpacity>

                                        {showDivider && (
                                            <View className="my-4">
                                                <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1 mb-3">
                                                    {index === 8 ? '🌍 Other African Currencies' : '🌎 International Currencies'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Industry Modal */}
            <Modal visible={showIndustryModal} transparent animationType="slide">
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-[32px] p-6 max-h-[70%]" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-slate-900">Select Industry</Text>
                            <TouchableOpacity onPress={() => setShowIndustryModal(false)} className="bg-slate-100 px-4 py-2 rounded-full">
                                <Text className="font-bold text-slate-500">Close</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {INDUSTRIES.map((ind) => (
                                <TouchableOpacity
                                    key={ind}
                                    onPress={() => {
                                        setIndustry(ind);
                                        setShowIndustryModal(false);
                                    }}
                                    className={`p-4 rounded-2xl mb-3 flex-row justify-between items-center ${industry === ind ? 'bg-blue-50 border-2 border-blue-200' : 'bg-slate-50 border border-slate-100'
                                        }`}
                                >
                                    <Text className={`font-bold text-base ${industry === ind ? 'text-blue-900' : 'text-slate-800'}`}>
                                        {ind}
                                    </Text>
                                    {industry === ind && (
                                        <View className="w-6 h-6 bg-blue-600 rounded-full items-center justify-center">
                                            <Check size={14} color="white" strokeWidth={3} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Country Code Modal */}
            <Modal visible={showCountryCodeModal} transparent animationType="slide">
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-[32px] p-6 max-h-[80%]" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-xl font-bold text-slate-900">Select Country Code</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowCountryCodeModal(false);
                                    setCountrySearchQuery('');
                                }}
                                className="bg-slate-100 px-4 py-2 rounded-full"
                            >
                                <Text className="font-bold text-slate-500">Close</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View className="bg-slate-50 rounded-2xl px-4 py-3 flex-row items-center mb-4 border border-slate-200">
                            <Globe size={18} color="#94A3B8" />
                            <TextInput
                                className="flex-1 ml-3 text-slate-900 font-semibold"
                                placeholder="Search country or code..."
                                placeholderTextColor="#94A3B8"
                                value={countrySearchQuery}
                                onChangeText={setCountrySearchQuery}
                            />
                        </View>

                        {/* African Countries Label */}
                        {!countrySearchQuery && (
                            <View className="mb-3">
                                <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">
                                    🌍 African Countries
                                </Text>
                            </View>
                        )}

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {filteredCountries.map((country) => {
                                const isSelected = countryCode === country.code;
                                const isAfrican = COUNTRY_CODES.indexOf(country) < 47; // First 47 are African

                                return (
                                    <TouchableOpacity
                                        key={country.code}
                                        onPress={() => {
                                            setCountryCode(country.code);
                                            setShowCountryCodeModal(false);
                                            setCountrySearchQuery('');
                                        }}
                                        className={`p-4 rounded-2xl mb-2 flex-row justify-between items-center ${isSelected
                                            ? 'bg-blue-50 border-2 border-blue-200'
                                            : 'bg-slate-50 border border-slate-100'
                                            }`}
                                    >
                                        <View className="flex-row items-center flex-1">
                                            <Text className="text-2xl mr-3">{country.flag}</Text>
                                            <View className="flex-1">
                                                <Text className={`font-bold text-base ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                                                    {country.country}
                                                </Text>
                                                <Text className="text-slate-500 text-sm font-medium mt-0.5">
                                                    {country.code}
                                                </Text>
                                            </View>
                                        </View>
                                        {isSelected && (
                                            <View className="w-6 h-6 bg-blue-600 rounded-full items-center justify-center">
                                                <Check size={14} color="white" strokeWidth={3} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}

                            {filteredCountries.length === 0 && (
                                <View className="items-center py-10">
                                    <Globe size={48} color="#CBD5E1" />
                                    <Text className="text-slate-400 font-semibold mt-4">No countries found</Text>
                                    <Text className="text-slate-300 text-sm mt-1">Try a different search term</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
