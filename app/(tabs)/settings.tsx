import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { LogOut, Check, Building2, Phone, Coins, Camera, PenTool, ChevronRight, Package } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../lib/upload';
import { validateBusinessName, validatePhone, validateCurrency } from '../../lib/validation';
import { showError, showSuccess } from '../../lib/error-handler';

export default function SettingsScreen() {
    const router = useRouter();
    const { signOut } = useAuth();
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
        // Validate inputs
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
                logo_url: logoUrl
            });

            if (error) {
                showError(error, "Erreur de mise à jour");
            } else {
                showSuccess("Profil mis à jour !");
            }
        } catch (error) {
            showError(error, "Erreur de mise à jour");
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            "Déconnexion",
            "Êtes-vous sûr de vouloir vous déconnecter ?",
            [
                { text: "Annuler", style: "cancel" },
                { text: "Se déconnecter", style: "destructive", onPress: signOut }
            ]
        );
    };

    if (profileLoading && !profile) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-4 pt-4">
                    <Text className="text-3xl font-bold text-gray-900 mb-8">Paramètres</Text>

                    {/* Section: Business Info */}
                    <View className="mb-6">
                        <Text className="text-gray-500 text-sm font-semibold mb-3 uppercase">Mon Business</Text>

                        {/* Logo Upload Area */}
                        <View className="items-center mb-6">
                            <TouchableOpacity onPress={handlePickImage} className="relative">
                                <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                    {logoUrl ? (
                                        <Image source={{ uri: logoUrl }} className="w-full h-full" />
                                    ) : (
                                        <Building2 size={40} color="#9CA3AF" />
                                    )}
                                    {uploading && (
                                        <View className="absolute inset-0 bg-black/30 items-center justify-center">
                                            <ActivityIndicator color="white" />
                                        </View>
                                    )}
                                </View>
                                <View className="absolute bottom-0 right-0 bg-primary p-2 rounded-full border-2 border-white">
                                    <Camera size={16} color="white" />
                                </View>
                            </TouchableOpacity>
                            <Text className="text-primary text-sm font-medium mt-2">Changer le logo</Text>
                        </View>

                        <View className="bg-white rounded-xl overflow-hidden shadow-sm">
                            {/* Business Name */}
                            <View className="flex-row items-center p-4 border-b border-gray-100">
                                <Building2 size={20} color="#9CA3AF" className="mr-3" />
                                <View className="flex-1">
                                    <Text className="text-xs text-gray-400">Nom du Business</Text>
                                    <TextInput
                                        className="text-base text-gray-900 font-medium pt-1"
                                        value={businessName}
                                        onChangeText={setBusinessName}
                                        placeholder="Ex: Super Boutique"
                                    />
                                </View>
                            </View>

                            {/* Phone */}
                            <View className="flex-row items-center p-4 border-b border-gray-100">
                                <Phone size={20} color="#9CA3AF" className="mr-3" />
                                <View className="flex-1">
                                    <Text className="text-xs text-gray-400">Téléphone (sur factures)</Text>
                                    <TextInput
                                        className="text-base text-gray-900 font-medium pt-1"
                                        value={phone}
                                        onChangeText={setPhone}
                                        placeholder="Ex: +250 788 000 000"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            {/* Currency */}
                            <View className="flex-row items-center p-4">
                                <Coins size={20} color="#9CA3AF" className="mr-3" />
                                <View className="flex-1">
                                    <Text className="text-xs text-gray-400">Devise</Text>
                                    <TextInput
                                        className="text-base text-gray-900 font-medium pt-1"
                                        value={currency}
                                        onChangeText={setCurrency}
                                        placeholder="Ex: RWF, USD, EUR"
                                        autoCapitalize="characters"
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        className={`w-full py-4 rounded-xl flex-row items-center justify-center mb-8 ${saving ? 'bg-gray-400' : 'bg-primary'}`}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text className="text-white font-bold text-lg mr-2">Enregistrer les infos</Text>
                                <Check size={20} color="white" strokeWidth={3} />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Section: Signature */}
                    <View className="mb-8">
                        <Text className="text-gray-500 text-sm font-semibold mb-3 uppercase">Signature & Branding</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/settings/signature')}
                            className="bg-white rounded-xl p-5 flex-row items-center justify-between shadow-sm border border-slate-50"
                        >
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-4">
                                    <PenTool size={20} color="#2563EB" />
                                </View>
                                <View>
                                    <Text className="text-slate-900 font-bold text-base">Ma Signature</Text>
                                    <Text className="text-slate-500 text-xs">Ajouter ou modifier votre signature</Text>
                                </View>
                            </View>
                            <ChevronRight size={20} color="#CBD5E1" />
                        </TouchableOpacity>

                        {profile?.signature_url && (
                            <View className="mt-3 bg-emerald-50 p-3 rounded-lg border border-emerald-100 flex-row items-center">
                                <Check size={14} color="#10B981" />
                                <Text className="text-emerald-700 text-[10px] font-bold uppercase ml-2">Signature active sur les factures</Text>
                            </View>
                        )}
                    </View>

                    {/* Section: Inventory */}
                    <View className="mb-8">
                        <Text className="text-gray-500 text-sm font-semibold mb-3 uppercase">Inventaire</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/items')}
                            className="bg-white rounded-xl p-5 flex-row items-center justify-between shadow-sm border border-slate-50"
                        >
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-orange-50 rounded-full items-center justify-center mr-4">
                                    <Package size={20} color="#F59E0B" />
                                </View>
                                <View>
                                    <Text className="text-slate-900 font-bold text-base">Produits & Services</Text>
                                    <Text className="text-slate-500 text-xs">Gérez vos articles préenregistrés</Text>
                                </View>
                            </View>
                            <ChevronRight size={20} color="#CBD5E1" />
                        </TouchableOpacity>
                    </View>

                    {/* Account Section */}
                    <View className="mb-6">
                        <Text className="text-gray-500 text-sm font-semibold mb-3 uppercase">Compte</Text>
                        <TouchableOpacity
                            onPress={handleSignOut}
                            className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm"
                        >
                            <View className="flex-row items-center leading-5">
                                <LogOut size={20} color="#FF3B30" className="mr-3" />
                                <Text className="text-red-500 font-medium text-base">Se déconnecter</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <Text className="text-center text-gray-400 text-xs mb-8">
                        QuickBill v1.0.0
                    </Text>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
