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
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../hooks/useProfile';
import {
    ChevronLeft,
    Store,
    Globe,
    Briefcase,
    Camera,
    ChevronRight,
    FileText,
    ShieldCheck,
    CheckCircle2,
    LayoutDashboard
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../lib/upload';
import { validateBusinessName } from '../../lib/validation';
import { showSuccess, showError } from '../../lib/error-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../context/LanguageContext';

export default function BusinessProfileScreen() {
    const router = useRouter();
    const { profile, loading: profileLoading, fetchProfile, updateProfile } = useProfile();
    const { t } = useLanguage();

    const [businessName, setBusinessName] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState(''); 
    const [taxId, setTaxId] = useState('');
    const [website, setWebsite] = useState('');
    const [businessCategory, setBusinessCategory] = useState('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile) {
            setBusinessName(profile.business_name || '');
            setRegistrationNumber(profile.rccm || ''); 
            setTaxId(profile.tax_id || '');
            setWebsite(profile.website || '');
            setLogoUrl(profile.logo_url || null);
        }
    }, [profile]);

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert(t('business_profile.permission_required'), t('business_profile.permission_msg'));
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
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
            const publicUrl = await uploadImage(uri, 'logos');
            setLogoUrl(publicUrl);
            showSuccess(t('business_profile.upload_success'));
        } catch (error: any) {
            showError(error, t('business_profile.upload_error'));
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        const businessNameValidation = validateBusinessName(businessName);
        if (!businessNameValidation.isValid) {
            Alert.alert(t('common.error'), businessNameValidation.error);
            return;
        }

        setSaving(true);
        try {
            const { error } = await updateProfile({
                business_name: businessName.trim(),
                rccm: registrationNumber.trim() || null,
                tax_id: taxId.trim() || null,
                website: website.trim() || null,
                logo_url: logoUrl,
            } as any);

            if (error) {
                showError(error, t('business_profile.update_error'));
            } else {
                showSuccess(t('business_profile.update_success'));
                router.back();
            }
        } catch (error) {
            showError(error, t('business_profile.system_error'));
        } finally {
            setSaving(false);
        }
    };

    const InputField = ({ label, value, onChangeText, placeholder, icon: Icon, keyboardType = 'default' }: any) => (
        <View className="mb-4">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[1.5px] mb-2 ml-1">{label}</Text>
            <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm shadow-slate-200/50">
                <View className="w-8 h-8 rounded-xl bg-slate-50 items-center justify-center mr-3">
                    <Icon size={16} color="#475569" strokeWidth={2.5} />
                </View>
                <TextInput
                    className="flex-1 text-slate-900 font-bold text-[14px]"
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#CBD5E1"
                    keyboardType={keyboardType}
                />
            </View>
        </View>
    );

    if (profileLoading && !profile) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#1337ec" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F9FAFC]">
            <StatusBar style="dark" />
            
            {/* Background Gradient */}
            <View className="absolute top-0 left-0 right-0 h-[30%]">
                <LinearGradient
                    colors={['#F0F4FF', '#F8FAFC', '#ffffff']}
                    className="flex-1"
                />
            </View>

            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
                    <TouchableOpacity 
                        onPress={() => router.back()} 
                        className="bg-white w-10 h-10 rounded-[16px] items-center justify-center shadow-lg shadow-indigo-100/50 border border-white"
                    >
                        <ChevronLeft size={20} color="#1337ec" strokeWidth={3} className="-ml-0.5" />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-[16px] font-black text-slate-900 tracking-tight">{t('business_profile.title')}</Text>
                        <View className="h-0.5 w-6 bg-blue-600 rounded-full mt-1" />
                    </View>
                    <TouchableOpacity 
                        onPress={handleSave}
                        disabled={saving}
                        className="bg-white w-10 h-10 rounded-[16px] items-center justify-center shadow-lg shadow-indigo-100/50 border border-white"
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#1337ec" />
                        ) : (
                            <CheckCircle2 size={20} color="#059669" strokeWidth={3} />
                        )}
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1"
                >
                    <ScrollView
                        className="flex-1 px-6"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 120 }}
                    >
                        {/* Premium Badge */}
                        <View className="flex-row items-center justify-center bg-amber-50/50 border border-amber-100/50 rounded-2xl py-2 px-4 mt-2 mb-6">
                            <ShieldCheck size={14} color="#D97706" strokeWidth={2.5} />
                            <Text className="text-amber-700 text-[9px] font-black ml-2 uppercase tracking-widest">{t('business_profile.identity_verified')}</Text>
                        </View>

                        {/* Logo Upload - Premium View */}
                        <View className="items-center mb-8">
                            <TouchableOpacity
                                onPress={handlePickImage}
                                activeOpacity={0.9}
                                className="relative"
                            >
                                <LinearGradient
                                    colors={['#1337ec', '#3b82f6']}
                                    className="w-32 h-32 rounded-[40px] p-[3px] shadow-2xl shadow-blue-500/30"
                                >
                                    <View className="flex-1 bg-white rounded-[38px] overflow-hidden items-center justify-center">
                                        {logoUrl ? (
                                            <Image source={{ uri: logoUrl }} className="w-full h-full" resizeMode="cover" />
                                        ) : (
                                            <View className="bg-slate-50 w-full h-full items-center justify-center">
                                                <Store size={40} color="#CBD5E1" strokeWidth={1.5} />
                                            </View>
                                        )}
                                        {uploading && (
                                            <View className="absolute inset-0 bg-white/80 items-center justify-center">
                                                <ActivityIndicator size="small" color="#1337ec" />
                                            </View>
                                        )}
                                    </View>
                                </LinearGradient>
                                <View className="absolute -bottom-1 -right-1 bg-[#1337ec] w-10 h-10 rounded-[14px] items-center justify-center border-4 border-[#F9FAFC] shadow-lg">
                                    <Camera size={18} color="white" strokeWidth={2.5} />
                                </View>
                            </TouchableOpacity>
                            <Text className="text-slate-900 font-black text-sm mt-4">{t('business_profile.logo_title')}</Text>
                            <Text className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-tighter">{t('business_profile.logo_desc')}</Text>
                        </View>

                        {/* FORM SECTIONS */}
                        <View className="mb-4 flex-row items-center">
                            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-[1.5px]">{t('business_profile.legal_info')}</Text>
                            <View className="flex-1 h-[1px] bg-slate-100 ml-3" />
                        </View>

                        <InputField
                            label={t('business_profile.business_name')}
                            value={businessName}
                            onChangeText={setBusinessName}
                            placeholder={t('business_profile.business_name_placeholder')}
                            icon={Store}
                        />
                        <InputField
                            label={t('business_profile.rccm')}
                            value={registrationNumber}
                            onChangeText={setRegistrationNumber}
                            placeholder={t('business_profile.rccm_placeholder')}
                            icon={Briefcase}
                        />
                        <InputField
                            label={t('business_profile.tax_id')}
                            value={taxId}
                            onChangeText={setTaxId}
                            placeholder={t('business_profile.tax_id_placeholder')}
                            icon={FileText}
                        />

                        <View className="mt-6 mb-4 flex-row items-center">
                            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-[1.5px]">{t('business_profile.digital_presence')}</Text>
                            <View className="flex-1 h-[1px] bg-slate-100 ml-3" />
                        </View>

                        <InputField
                            label={t('business_profile.website')}
                            value={website}
                            onChangeText={setWebsite}
                            placeholder={t('business_profile.website_placeholder')}
                            icon={Globe}
                            keyboardType="url"
                        />

                        <View className="mb-8">
                            <TouchableOpacity 
                                onPress={() => {
                                    Alert.alert(
                                        t('business_profile.industry'),
                                        t('business_profile.industry_placeholder'),
                                        [
                                            { text: t('business_profile.sectors.Technology'), onPress: () => setBusinessCategory("Technology") },
                                            { text: t('business_profile.sectors.Finance'), onPress: () => setBusinessCategory("Finance") },
                                            { text: t('business_profile.sectors.Ecommerce'), onPress: () => setBusinessCategory("E-commerce") },
                                            { text: t('business_profile.sectors.Service'), onPress: () => setBusinessCategory("Service") },
                                            { text: t('common.cancel'), style: "cancel" }
                                        ]
                                    );
                                }}
                                className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm shadow-slate-200/50 justify-between"
                            >
                                <View className="flex-row items-center">
                                    <View className="w-8 h-8 rounded-xl bg-slate-50 items-center justify-center mr-3">
                                        <LayoutDashboard size={16} color="#475569" strokeWidth={2.5} />
                                    </View>
                                    <Text className={businessCategory ? "text-slate-900 font-bold text-[14px]" : "text-slate-400 font-bold text-[14px]"}>
                                        {businessCategory ? t(`business_profile.sectors.${businessCategory === 'E-commerce' ? 'Ecommerce' : businessCategory}`) : t('business_profile.industry_placeholder')}
                                    </Text>
                                </View>
                                <ChevronRight size={18} color="#CBD5E1" strokeWidth={3} />
                            </TouchableOpacity>
                        </View>

                        {/* PREVIEW CARD */}
                        <LinearGradient
                            colors={['#1e1b4b', '#312e81']}
                            className="rounded-[28px] p-5 shadow-xl shadow-indigo-900/20 mb-10"
                        >
                            <View className="flex-row items-start justify-between">
                                <View className="flex-row">
                                    <View className="w-12 h-12 bg-white rounded-xl items-center justify-center mr-4">
                                        {logoUrl ? (
                                            <Image source={{ uri: logoUrl }} className="w-9 h-9 rounded-lg" resizeMode="cover" />
                                        ) : (
                                            <Text className="text-blue-600 font-black text-xl">{businessName ? businessName.charAt(0).toUpperCase() : 'B'}</Text>
                                        )}
                                    </View>
                                    <View className="justify-center">
                                        <Text className="text-white font-black text-sm tracking-tight">{businessName || t('business_profile.preview.your_business')}</Text>
                                        <Text className="text-indigo-300 text-[10px] font-bold mt-0.5">{website || t('business_profile.preview.invoice_preview')}</Text>
                                    </View>
                                </View>
                                <View className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                                    <Text className="text-white font-black text-[9px] uppercase">{t('business_profile.preview.pro_invoice')}</Text>
                                </View>
                            </View>
                        </LinearGradient>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Float Bottom Save Button */}
            <View className="absolute bottom-10 left-8 right-8">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.9}
                    className="shadow-2xl shadow-blue-500/40"
                >
                    <LinearGradient
                        colors={['#1337ec', '#1e40af']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="h-14 rounded-[20px] items-center justify-center flex-row px-6"
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <CheckCircle2 size={18} color="white" style={{marginRight: 10}} strokeWidth={2.5} />
                                <Text className="text-white font-black text-sm uppercase tracking-[1.5px]">{t('business_profile.save_profile')}</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

