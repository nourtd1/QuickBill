import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';
import {
    ArrowLeft,
    Building2,
    Phone,
    Coins,
    Camera,
    Check
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { uploadImage } from '../../lib/upload';
import { validateBusinessName, validatePhone, validateCurrency } from '../../lib/validation';
import { showError, showSuccess } from '../../lib/error-handler';
import { StatusBar } from 'expo-status-bar';

export default function BusinessSettingsScreen() {
    const router = useRouter();
    const { profile, loading: profileLoading, fetchProfile, updateProfile } = useProfile();

    const [businessName, setBusinessName] = useState('');
    const [phone, setPhone] = useState('');
    const [currency, setCurrency] = useState('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile) {
            setBusinessName(profile.business_name || '');
            setPhone(profile.phone_contact || '');
            setCurrency(profile.currency || 'RWF');
            setLogoUrl(profile.logo_url || null);
        }
    }, [profile]);

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission requise", "Vous devez autoriser l'accès à la galerie pour changer le logo.");
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
            Alert.alert("Erreur Upload", error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        const businessNameValidation = validateBusinessName(businessName);
        if (!businessNameValidation.isValid) {
            Alert.alert('Erreur', businessNameValidation.error);
            return;
        }

        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.isValid) {
            Alert.alert('Erreur', phoneValidation.error);
            return;
        }

        const currencyValidation = validateCurrency(currency);
        if (!currencyValidation.isValid) {
            Alert.alert('Erreur', currencyValidation.error);
            return;
        }

        setSaving(true);
        try {
            const { error } = await updateProfile({
                business_name: businessName.trim(),
                phone_contact: phone.trim() || null,
                currency: currency.trim().toUpperCase(),
                logo_url: logoUrl,
            });

            if (error) {
                showError(error, "Erreur de mise à jour");
            } else {
                showSuccess("Profil mis à jour !");
                router.back();
            }
        } catch (error) {
            showError(error, "Erreur de mise à jour");
        } finally {
            setSaving(false);
        }
    };

    if (profileLoading && !profile) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={['#1E293B', '#0F172A']}
                    className="pt-16 pb-20 px-6 rounded-b-[40px] shadow-lg"
                >
                    <View className="flex-row justify-between items-center mb-8">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-white/10 p-3 rounded-2xl border border-white/10"
                        >
                            <ArrowLeft size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white text-xl font-black">Identité Business</Text>
                        <View className="w-12" />
                    </View>

                    <View className="items-center">
                        <TouchableOpacity onPress={handlePickImage} className="relative">
                            <View className="w-24 h-24 rounded-[32px] bg-white items-center justify-center overflow-hidden border-4 border-white/10 shadow-2xl">
                                {logoUrl ? (
                                    <Image source={{ uri: logoUrl }} className="w-full h-full" />
                                ) : (
                                    <Building2 size={40} color="#94A3B8" />
                                )}
                                {uploading && (
                                    <View className="absolute inset-0 bg-black/30 items-center justify-center">
                                        <ActivityIndicator color="white" size="small" />
                                    </View>
                                )}
                            </View>
                            <View className="absolute -bottom-1 -right-1 bg-blue-600 p-2.5 rounded-full border-4 border-[#1E293B] shadow-sm">
                                <Camera size={14} color="white" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <View className="px-6 -mt-8 pb-32">
                    <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 mb-8">
                        <View className="space-y-4">
                            <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-row items-center">
                                <Building2 size={20} color="#64748B" className="mr-3" />
                                <View className="flex-1">
                                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nom commercial</Text>
                                    <TextInput
                                        className="text-slate-900 font-bold py-1 text-base"
                                        value={businessName}
                                        onChangeText={setBusinessName}
                                        placeholder="Super Boutique"
                                    />
                                </View>
                            </View>

                            <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-row items-center mt-4">
                                <Phone size={20} color="#64748B" className="mr-3" />
                                <View className="flex-1">
                                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Téléphone professionnel</Text>
                                    <TextInput
                                        className="text-slate-900 font-bold py-1 text-base"
                                        value={phone}
                                        onChangeText={setPhone}
                                        placeholder="+250 788 000 000"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-row items-center mt-4">
                                <Coins size={20} color="#64748B" className="mr-3" />
                                <View className="flex-1">
                                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Devise par défaut</Text>
                                    <TextInput
                                        className="text-slate-900 font-bold py-1 text-base"
                                        value={currency}
                                        onChangeText={setCurrency}
                                        placeholder="RWF"
                                        autoCapitalize="characters"
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        className={`w-full py-5 rounded-[24px] flex-row items-center justify-center shadow-lg ${saving ? 'bg-slate-400' : 'bg-slate-900 shadow-slate-200'
                            }`}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text className="text-white font-black text-lg mr-2">Enregistrer les infos</Text>
                                <Check size={24} color="white" strokeWidth={3} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
