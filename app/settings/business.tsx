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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../hooks/useProfile';
import {
    ArrowLeft,
    Building2,
    Phone,
    Coins,
    Camera,
    Check,
    MapPin
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
    const [address, setAddress] = useState('');
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
            setAddress(profile.address || '');
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
                address: address.trim() || null,
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
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <StatusBar style="dark" />

            {/* Header */}
            <View className="px-6 py-4 bg-white border-b border-slate-100 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 bg-slate-50 rounded-full mr-4">
                        <ArrowLeft size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="text-xl font-black text-text-main">Identité Business</Text>
                </View>
                {saving && <ActivityIndicator color="#1E40AF" />}
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                {/* Logo Section */}
                <View className="items-center py-8">
                    <TouchableOpacity onPress={handlePickImage} className="relative">
                        <View className="w-32 h-32 rounded-full bg-white items-center justify-center overflow-hidden border-4 border-slate-100 shadow-sm">
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
                        <View className="absolute bottom-0 right-0 bg-primary p-2.5 rounded-full border-4 border-white shadow-sm">
                            <Camera size={16} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text className="text-text-muted text-sm mt-3 font-medium">Appuyez pour modifier le logo</Text>
                </View>

                <View className="px-6 pb-32">
                    <View className="bg-card rounded-[24px] p-6 shadow-sm mb-6 space-y-6">

                        {/* Business Name */}
                        <View>
                            <View className="flex-row items-center mb-2">
                                <Building2 size={18} color="#6B7280" className="mr-2" />
                                <Text className="text-text-muted text-xs font-bold uppercase tracking-wider">Nom commercial</Text>
                            </View>
                            <TextInput
                                className="bg-background border border-slate-100 p-4 rounded-xl text-text-main font-bold text-base"
                                value={businessName}
                                onChangeText={setBusinessName}
                                placeholder="ex: Ma Super Entreprise"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Phone */}
                        <View>
                            <View className="flex-row items-center mb-2">
                                <Phone size={18} color="#6B7280" className="mr-2" />
                                <Text className="text-text-muted text-xs font-bold uppercase tracking-wider">Téléphone</Text>
                            </View>
                            <TextInput
                                className="bg-background border border-slate-100 p-4 rounded-xl text-text-main font-bold text-base"
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+123 456 789"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Address */}
                        <View>
                            <View className="flex-row items-center mb-2">
                                <MapPin size={18} color="#6B7280" className="mr-2" />
                                <Text className="text-text-muted text-xs font-bold uppercase tracking-wider">Adresse</Text>
                            </View>
                            <TextInput
                                className="bg-background border border-slate-100 p-4 rounded-xl text-text-main font-bold text-base"
                                value={address}
                                onChangeText={setAddress}
                                placeholder="ex: 12 Avenue des Champs, Paris"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Currency */}
                        <View>
                            <View className="flex-row items-center mb-2">
                                <Coins size={18} color="#6B7280" className="mr-2" />
                                <Text className="text-text-muted text-xs font-bold uppercase tracking-wider">Devise</Text>
                            </View>
                            <TextInput
                                className="bg-background border border-slate-100 p-4 rounded-xl text-text-main font-bold text-base"
                                value={currency}
                                onChangeText={setCurrency}
                                placeholder="EUR, USD, XOF..."
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="characters"
                            />
                        </View>
                    </View>


                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        className={`w-full py-5 rounded-2xl flex-row items-center justify-center shadow-lg ${saving ? 'bg-primary/70' : 'bg-primary shadow-blue-200'
                            }`}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text className="text-white font-bold text-lg mr-2">Sauvegarder les modifications</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
