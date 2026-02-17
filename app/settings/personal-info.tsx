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
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import {
    ChevronLeft,
    User,
    Mail,
    Phone,
    MapPin,
    Camera,
    CheckCircle
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../lib/upload';
import { validatePhone } from '../../lib/validation';
import { showSuccess, showError } from '../../lib/error-handler';

// Moved InputField outside to prevent focus loss issues
const InputField = ({ label, value, onChangeText, placeholder, icon: Icon, checkmark = false, editable = true, keyboardType = 'default' }: any) => (
    <View className="mb-5">
        <Text className="text-gray-500 text-xs font-bold uppercase mb-2 ml-3">{label}</Text>
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-slate-100">
            <Icon size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
            <TextInput
                className="flex-1 text-slate-800 font-semibold text-base"
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#CBD5E1"
                editable={editable}
                keyboardType={keyboardType}
            />
            {checkmark && (
                <CheckCircle size={20} color="#22C55E" />
            )}
        </View>
    </View>
);

export default function PersonalInfoScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { profile, loading: profileLoading, fetchProfile, updateProfile } = useProfile();

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile) {
            setFullName(profile.business_name || '');
            setPhone(profile.phone_contact || '');
            setAddress(profile.address || '');
            setAvatarUrl(profile.logo_url || null);
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
        } catch (error: any) {
            Alert.alert("Upload Error", error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.isValid) {
            Alert.alert('Error', phoneValidation.error);
            return;
        }

        setSaving(true);
        try {
            const { error } = await updateProfile({
                business_name: fullName.trim(),
                phone_contact: phone.trim() || null,
                address: address.trim() || null,
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

    if (profileLoading && !profile) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F9FAFB]">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F9FAFB]">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-2 mb-4 bg-[#F9FAFB] border-b border-transparent">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="flex-row items-center p-2"
                    >
                        <ChevronLeft size={24} color="#2563EB" />
                        <Text className="text-[#2563EB] text-lg font-medium ml-[-4px]">Settings</Text>
                    </TouchableOpacity>

                    <Text className="text-black text-lg font-bold">Personal Info</Text>

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        className="p-2"
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#2563EB" />
                        ) : (
                            <Text className="text-[#2563EB] text-lg font-semibold">Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1"
                >
                    <ScrollView
                        className="flex-1 px-6"
                        contentContainerStyle={{ paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Avatar Section */}
                        <View className="items-center mb-10 mt-2">
                            <View className="relative">
                                <View className="w-32 h-32 rounded-full bg-gray-100 items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                                    {avatarUrl ? (
                                        <Image source={{ uri: avatarUrl }} className="w-full h-full" />
                                    ) : (
                                        <User size={64} color="#9CA3AF" />
                                    )}
                                    {uploading && (
                                        <View className="absolute inset-0 bg-black/30 items-center justify-center">
                                            <ActivityIndicator color="white" />
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    className="absolute bottom-0 right-0 bg-white p-2.5 rounded-full shadow-md border border-gray-100"
                                >
                                    <Camera size={16} color="#2563EB" />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={handlePickImage} className="mt-4 active:opacity-70">
                                <Text className="text-[#2563EB] font-medium text-base">Change Profile Photo</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Form Fields */}
                        <View>
                            <InputField
                                label="Full Name"
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter your full name"
                                icon={User}
                            />

                            <InputField
                                label="Email Address"
                                value={user?.email}
                                placeholder="email@example.com"
                                icon={Mail}
                                checkmark={true}
                                editable={false}
                            />

                            <InputField
                                label="Phone Number"
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+1 (555) 000-0000"
                                icon={Phone}
                                keyboardType="phone-pad"
                            />

                            <InputField
                                label="Address"
                                value={address}
                                onChangeText={setAddress}
                                placeholder="123 Innovation Drive, Tech Valley, CA"
                                icon={MapPin}
                            />
                        </View>

                        {/* Footer Text */}
                        <View className="mt-8 px-4 mb-8">
                            <Text className="text-gray-400 text-center text-sm leading-5">
                                Your personal information is securely stored and never shared without your permission.
                                <Text className="text-[#2563EB] font-medium"> Privacy Policy</Text>
                            </Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
