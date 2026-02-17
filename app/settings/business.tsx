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
    ArrowLeft,
    Store, // Using Store as Business Icon
    Globe,
    Briefcase,
    Upload,
    ChevronDown
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../lib/upload';
import { validateBusinessName } from '../../lib/validation';
import { showSuccess, showError } from '../../lib/error-handler';

export default function BusinessProfileScreen() {
    const router = useRouter();
    const { profile, loading: profileLoading, fetchProfile, updateProfile } = useProfile();

    const [businessName, setBusinessName] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
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
            setRegistrationNumber(profile.tax_id || ''); // Mapping tax_id to Reg No as example
            setWebsite(profile.website || '');
            // setBusinessCategory(profile.category || ''); // Assuming category exists or just local state
            setLogoUrl(profile.logo_url || null);
        }
    }, [profile]);

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "Gallery access is needed to change logo.");
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
            const publicUrl = await uploadImage(uri, 'logos');
            setLogoUrl(publicUrl);
        } catch (error: any) {
            Alert.alert("Upload Error", error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        const businessNameValidation = validateBusinessName(businessName);
        if (!businessNameValidation.isValid) {
            Alert.alert('Error', businessNameValidation.error);
            return;
        }

        setSaving(true);
        try {
            const { error } = await updateProfile({
                business_name: businessName.trim(),
                tax_id: registrationNumber.trim() || null,
                website: website.trim() || null,
                logo_url: logoUrl,
                // category: businessCategory
            } as any);

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

    const InputField = ({ label, value, onChangeText, placeholder, icon: Icon, keyboardType = 'default' }: any) => (
        <View className="mb-5">
            <Text className="text-slate-500 text-xs font-bold text-gray-500 mb-2 ml-1">{label}</Text>
            <View className="flex-row items-center bg-white rounded-2xl px-4 py-3.5 border border-gray-200">
                <Icon size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                <TextInput
                    className="flex-1 text-slate-900 font-medium text-base"
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    keyboardType={keyboardType}
                />
            </View>
        </View>
    );

    if (profileLoading && !profile) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F9FAFB]">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-2 mb-2">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900">Business Profile</Text>
                    <TouchableOpacity onPress={handleSave} disabled={saving} className="p-2 -mr-2">
                        {saving ? (
                            <ActivityIndicator size="small" color="#2563EB" />
                        ) : (
                            <Text className="text-[#2563EB] text-lg font-bold">Save</Text>
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
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >
                        {/* Logo Upload */}
                        <View className="items-center mt-6 mb-10">
                            <TouchableOpacity
                                onPress={handlePickImage}
                                className="w-32 h-32 bg-white rounded-[32px] items-center justify-center border-[3px] border-blue-100 shadow-sm relative"
                                style={{ shadowColor: '#3B82F6', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } }}
                            >
                                {logoUrl ? (
                                    <Image source={{ uri: logoUrl }} className="w-full h-full rounded-[28px]" resizeMode="cover" />
                                ) : (
                                    <Image
                                        source={{ uri: 'https://via.placeholder.com/150' }}
                                        className="w-full h-full rounded-[28px] opacity-0"
                                    />
                                    // Placeholder invisible just to keep layout, actually using icon if no image
                                )}
                                {!logoUrl && <Upload size={32} color="#CBD5E1" />}

                                <View className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md border border-gray-50">
                                    <Upload size={16} color="#2563EB" />
                                </View>
                            </TouchableOpacity>
                            <Text className="text-slate-500 font-medium mt-4">Upload Company Logo</Text>
                        </View>

                        {/* BASIC DETAILS */}
                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 ml-1">BASIC DETAILS</Text>
                        <View className="bg-white rounded-3xl p-2 mb-8">
                            {/* Note: In the design, inputs are separate cards. My InputField component creates a card. So I actually don't need a container if I follow the design exactly which shows distinct input cards.
                                 However, looking at the image, "BASIC DETAILS" is a section title, and below it there are TWO SEPARATE input fields "Business Name" and "Registration Number".
                                 So I should NOT wrap them in a white container. I should just render InputFields. 
                             */}
                        </View>
                        {/* Correcting structure based on image: The inputs themselves are the white cards. */}

                        <View className="-mt-10">
                            <InputField
                                label="Business Name"
                                value={businessName}
                                onChangeText={setBusinessName}
                                placeholder="Sterling FinTech"
                                icon={Store}
                            />
                            <InputField
                                label="Registration Number"
                                value={registrationNumber}
                                onChangeText={setRegistrationNumber}
                                placeholder="Tax ID or Reg No."
                                icon={Briefcase}
                            />
                        </View>

                        {/* ONLINE PRESENCE */}
                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 ml-1 mt-4">ONLINE PRESENCE</Text>

                        <InputField
                            label="Website"
                            value={website}
                            onChangeText={setWebsite}
                            placeholder="https://example.com"
                            icon={Globe}
                            keyboardType="url"
                        />

                        <View className="mb-5">
                            <Text className="text-slate-500 text-xs font-bold text-gray-500 mb-2 ml-1">Business Category</Text>
                            <TouchableOpacity className="flex-row items-center bg-white rounded-2xl px-4 py-3.5 border border-gray-200 justify-between">
                                <View className="flex-row items-center">
                                    <View className="mr-3">
                                        {/* Category Icon - generic shapes */}
                                        <View className="flex-row items-end">
                                            <View className="w-2 h-2 bg-gray-400 rounded-sm mr-0.5" />
                                            <View className="w-2 h-3 bg-gray-400 rounded-sm mr-0.5" />
                                            <View className="w-2 h-4 bg-gray-400 rounded-sm" />
                                        </View>
                                    </View>
                                    <Text className={businessCategory ? "text-slate-900 font-medium text-base" : "text-slate-400 font-medium text-base"}>
                                        {businessCategory || "Select a category"}
                                    </Text>
                                </View>
                                <ChevronDown size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        {/* BRANDING PREVIEW */}
                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 ml-1 mt-4">BRANDING PREVIEW</Text>
                        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-50 mb-4">
                            <View className="flex-row items-start justify-between">
                                <View className="flex-row">
                                    <View className="w-12 h-12 bg-white border border-slate-100 rounded-xl items-center justify-center mr-4 shadow-sm">
                                        {logoUrl ? (
                                            <Image source={{ uri: logoUrl }} className="w-8 h-8 rounded-lg" resizeMode="cover" />
                                        ) : (
                                            <Text className="text-blue-600 font-bold text-xl">{businessName ? businessName.charAt(0).toUpperCase() : 'B'}</Text>
                                        )}
                                    </View>
                                    <View className="justify-center space-y-2">
                                        <View className="w-24 h-2.5 bg-slate-200 rounded-full" />
                                        <View className="w-16 h-2.5 bg-slate-100 rounded-full" />
                                    </View>
                                </View>
                                <View className="bg-blue-100 px-3 py-1.5 rounded-lg">
                                    <Text className="text-blue-700 font-bold text-xs">Invoice #001</Text>
                                </View>
                            </View>
                        </View>
                        <Text className="text-slate-400 text-[10px] ml-1 mb-8">
                            This logo will appear on your invoices and client portals.
                        </Text>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
