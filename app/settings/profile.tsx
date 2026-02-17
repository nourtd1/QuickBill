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
    ArrowLeft,
    User,
    Mail,
    Phone,
    Save,
    Camera,
    Shield,
    Calendar
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../lib/upload';
import { validatePhone } from '../../lib/validation';
import { showSuccess, showError } from '../../lib/error-handler';

export default function ProfileScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { profile, loading: profileLoading, fetchProfile, updateProfile } = useProfile();

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile) {
            // Mapping business_name to user name for now as it's the main display name
            setFullName(profile.business_name || '');
            setPhone(profile.phone_contact || '');
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
            // Update profile
            // Note: We are using business_name as the display name. 
            // Ideally we should have a separate full_name field in DB.
            const { error } = await updateProfile({
                business_name: fullName.trim(),
                phone_contact: phone.trim() || null,
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
            <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F8FAFC]">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white items-center justify-center rounded-full border border-slate-200 shadow-sm"
                    >
                        <ArrowLeft size={20} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-slate-900">Personal Info</Text>
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
                                <View className="w-28 h-28 rounded-full bg-slate-200 items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                                    {avatarUrl ? (
                                        <Image source={{ uri: avatarUrl }} className="w-full h-full" />
                                    ) : (
                                        <User size={48} color="#94A3B8" />
                                    )}
                                    {uploading && (
                                        <View className="absolute inset-0 bg-black/30 items-center justify-center">
                                            <ActivityIndicator color="white" />
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    className="absolute bottom-0 right-0 bg-blue-600 p-2.5 rounded-full border-[3px] border-white shadow-md active:scale-95 transition-transform"
                                >
                                    <Camera size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                            <Text className="mt-4 text-slate-900 font-bold text-lg">{fullName || 'User'}</Text>
                            <Text className="text-slate-500 font-medium">{user?.email}</Text>
                        </View>

                        {/* Form Fields */}
                        <View className="space-y-6">
                            {/* Full Name */}
                            <View>
                                <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Full Name</Text>
                                <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-3.5 shadow-sm">
                                    <User size={20} color="#64748B" style={{ marginRight: 12 }} />
                                    <TextInput
                                        className="flex-1 text-slate-800 font-semibold text-base"
                                        value={fullName}
                                        onChangeText={setFullName}
                                        placeholder="Alex Sterling"
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>
                            </View>

                            {/* Email - Read Only */}
                            <View>
                                <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Email Address</Text>
                                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 opacity-80">
                                    <Mail size={20} color="#64748B" style={{ marginRight: 12 }} />
                                    <TextInput
                                        className="flex-1 text-slate-600 font-medium text-base"
                                        value={user?.email}
                                        editable={false}
                                        placeholder="user@example.com"
                                    />
                                    <Shield size={16} color="#64748B" />
                                </View>
                                <Text className="text-slate-400 text-[10px] mt-1.5 ml-1">Email cannot be changed directly for security reasons.</Text>
                            </View>

                            {/* Phone Number */}
                            <View>
                                <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Phone Number</Text>
                                <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-3.5 shadow-sm">
                                    <Phone size={20} color="#64748B" style={{ marginRight: 12 }} />
                                    <TextInput
                                        className="flex-1 text-slate-800 font-semibold text-base"
                                        value={phone}
                                        onChangeText={setPhone}
                                        placeholder="+1 234 567 890"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            {/* Account Created - Info Only */}
                            <View>
                                <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Joined Date</Text>
                                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 opacity-80">
                                    <Calendar size={20} color="#64748B" style={{ marginRight: 12 }} />
                                    <Text className="flex-1 text-slate-600 font-medium text-base">
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
                <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 pb-8">
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        className="w-full bg-blue-600 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
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
        </View>
    );
}
