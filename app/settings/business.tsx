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
    MapPin,
    Save,
    Globe,
    FileText,
    Briefcase,
    CreditCard,
    ChevronRight,
    CheckCircle
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

    // New fields
    const [website, setWebsite] = useState('');
    const [taxId, setTaxId] = useState(''); // NINEA
    const [rccm, setRccm] = useState('');

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

            // New fields
            setWebsite((profile as any).website || '');
            setTaxId((profile as any).tax_id || '');
            setRccm((profile as any).rccm || '');
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
                // New fields (Using as any to bypass TS for now)
                website: website.trim() || null,
                tax_id: taxId.trim() || null,
                rccm: rccm.trim() || null,
            } as any);

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
                <ActivityIndicator size="large" color="#1E40AF" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            {/* Header Curve */}
            <LinearGradient
                colors={['#1E40AF', '#1e3a8a']}
                className="absolute top-0 left-0 right-0 h-[180px] rounded-b-[40px]"
            />

            <SafeAreaView className="flex-1">
                {/* Header Content */}
                <View className="flex-row items-center justify-between px-6 py-4 mb-2">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white/20 items-center justify-center rounded-full backdrop-blur-md"
                    >
                        <ArrowLeft size={20} color="white" />
                    </TouchableOpacity>
                    <Text className="text-xl font-black text-white tracking-tight">Identité Business</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    className="flex-1 px-6"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                >

                    {/* Logo Section */}
                    <View className="items-center mt-4 mb-8">
                        <TouchableOpacity onPress={handlePickImage} className="relative active:scale-95 transition-transform" activeOpacity={0.8}>
                            <View className="w-32 h-32 rounded-[24px] bg-white items-center justify-center overflow-hidden shadow-xl shadow-blue-900/20 border-4 border-white">
                                {logoUrl ? (
                                    <Image source={{ uri: logoUrl }} className="w-full h-full" resizeMode="cover" />
                                ) : (
                                    <Building2 size={40} color="#94A3B8" />
                                )}
                                {uploading && (
                                    <View className="absolute inset-0 bg-black/40 items-center justify-center backdrop-blur-sm">
                                        <ActivityIndicator color="white" size="small" />
                                    </View>
                                )}
                            </View>
                            <View className="absolute -bottom-2 -right-2 bg-slate-900 p-2.5 rounded-xl border-[3px] border-slate-50 shadow-sm">
                                <Camera size={16} color="white" />
                            </View>
                        </TouchableOpacity>
                        <Text className="text-slate-500 text-xs font-semibold mt-4 bg-white/50 px-3 py-1 rounded-full overflow-hidden">
                            Appuyez pour modifier le logo
                        </Text>
                    </View>

                    {/* Form Card */}
                    <View className="bg-white rounded-[24px] p-6 shadow-xl shadow-slate-200/50 space-y-6">

                        {/* Business Name */}
                        <View>
                            <View className="flex-row items-center mb-2.5 ml-1">
                                <Building2 size={16} color="#475569" className="mr-2" />
                                <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest">Nom commercial</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 font-bold text-base"
                                value={businessName}
                                onChangeText={setBusinessName}
                                placeholder="ex: Ma Super Entreprise"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        {/* Contact Info Section */}
                        <Text className="text-slate-900 font-extrabold text-lg mt-2 mb-4">Coordonnées</Text>

                        {/* Phone */}
                        <View>
                            <View className="flex-row items-center mb-2.5 ml-1">
                                <Phone size={16} color="#475569" className="mr-2" />
                                <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest">Téléphone</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 font-bold text-base"
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+221 77 000 00 00"
                                placeholderTextColor="#94A3B8"
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Address */}
                        <View>
                            <View className="flex-row items-center mb-2.5 ml-1">
                                <MapPin size={16} color="#475569" className="mr-2" />
                                <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest">Adresse Physique</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 font-bold text-base"
                                value={address}
                                onChangeText={setAddress}
                                placeholder="ex: 12 Avenue des Champs, Dakar"
                                placeholderTextColor="#94A3B8"
                                multiline
                            />
                        </View>

                        {/* Website (New) */}
                        <View>
                            <View className="flex-row items-center mb-2.5 ml-1">
                                <Globe size={16} color="#475569" className="mr-2" />
                                <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest">Site Web</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 font-bold text-base"
                                value={website}
                                onChangeText={setWebsite}
                                placeholder="www.monactivite.com"
                                placeholderTextColor="#94A3B8"
                                autoCapitalize="none"
                            />
                        </View>

                        <View className="h-[1px] bg-slate-100 my-2" />

                        {/* Legal Info Section */}
                        <Text className="text-slate-900 font-extrabold text-lg mb-4">Informations Légales</Text>

                        {/* Tax ID (NINEA) */}
                        <View>
                            <View className="flex-row items-center mb-2.5 ml-1">
                                <FileText size={16} color="#475569" className="mr-2" />
                                <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest">NINEA / NIF</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 font-bold text-base"
                                value={taxId}
                                onChangeText={setTaxId}
                                placeholder="Identifiant Fiscal"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        {/* RCCM */}
                        <View>
                            <View className="flex-row items-center mb-2.5 ml-1">
                                <Briefcase size={16} color="#475569" className="mr-2" />
                                <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest">RCCM</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 font-bold text-base"
                                value={rccm}
                                onChangeText={setRccm}
                                placeholder="Registre de Commerce"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <View className="h-[1px] bg-slate-100 my-2" />

                        {/* Currency */}
                        <Text className="text-slate-900 font-extrabold text-lg mb-4">Préférences</Text>
                        <View>
                            <View className="flex-row items-center mb-2.5 ml-1">
                                <Coins size={16} color="#475569" className="mr-2" />
                                <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest">Devise Principale</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 font-bold text-base"
                                value={currency}
                                onChangeText={setCurrency}
                                placeholder="EUR, USD, XOF..."
                                placeholderTextColor="#94A3B8"
                                autoCapitalize="characters"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={() => router.push('/settings/payment')}
                            className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex-row items-center justify-between"
                        >
                            <View className="flex-row items-center">
                                <View className="bg-white p-3 rounded-2xl mr-4 shadow-sm">
                                    <CreditCard size={20} color="#1E40AF" />
                                </View>
                                <View>
                                    <Text className="text-slate-900 font-black text-sm">Coordonnées Bancaires</Text>
                                    <Text className="text-blue-600/60 text-[10px] font-bold uppercase tracking-widest">Configurer mon RIB</Text>
                                </View>
                            </View>
                            <ChevronRight size={16} color="#1E40AF" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Bottom Save Button */}
            <View className="absolute bottom-0 left-0 right-0 bg-white p-5 pt-4 pb-8 border-t border-slate-100 rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="w-full h-16 bg-primary rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-300 active:scale-[0.98] transition-transform"
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Save size={20} color="white" className="mr-2" />
                            <Text className="text-white font-bold text-lg tracking-wide uppercase">Enregistrer les infos</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
