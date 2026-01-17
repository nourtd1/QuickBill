import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';
import {
    ArrowLeft,
    QrCode,
    CreditCard,
    Info,
    Check,
    Building,
    Home,
    Hash,
    ShieldCheck,
    Zap
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { showError, showSuccess } from '../../lib/error-handler';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function PaymentSettingsScreen() {
    const router = useRouter();
    const { profile, loading: profileLoading, fetchProfile, updateProfile } = useProfile();

    // Bank Details
    const [bankName, setBankName] = useState('');
    const [bankIban, setBankIban] = useState('');
    const [bankSwift, setBankSwift] = useState('');

    // Quick Payment (QR)
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentDetails, setPaymentDetails] = useState('');

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile) {
            setBankName(profile.bank_name || '');
            setBankIban(profile.bank_iban || '');
            setBankSwift(profile.bank_swift || '');
            setPaymentMethod(profile.payment_method || '');
            setPaymentDetails(profile.payment_details || '');
        }
    }, [profile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await updateProfile({
                bank_name: bankName.trim() || null,
                bank_iban: bankIban.trim() || null,
                bank_swift: bankSwift.trim() || null,
                payment_method: paymentMethod.trim() || null,
                payment_details: paymentDetails.trim() || null
            });

            if (error) {
                showError(error, "Erreur de mise à jour");
            } else {
                showSuccess("Données bancaires mises à jour !");
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

            <LinearGradient
                colors={['#1E40AF', '#1e3a8a']}
                className="pt-14 pb-12 px-6 rounded-b-[42px] shadow-2xl z-10"
            >
                <View className="flex-row justify-between items-center mb-6">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white/10 rounded-[14px] items-center justify-center border border-white/20"
                    >
                        <ArrowLeft size={20} color="white" strokeWidth={3} />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-xl font-black text-white tracking-tight">Paiements & RIB</Text>
                        <Text className="text-blue-200/60 text-[9px] font-black uppercase tracking-[2px] mt-0.5">Configuration Bancaire</Text>
                    </View>
                    <View className="w-10 h-10 bg-white/10 rounded-[14px] items-center justify-center border border-white/20">
                        <ShieldCheck size={20} color="white" strokeWidth={2.5} />
                    </View>
                </View>

                {/* Info Card */}
                <View className="bg-white/10 p-5 rounded-[28px] border border-white/15 backdrop-blur-md flex-row items-center">
                    <View className="w-12 h-12 bg-blue-500 rounded-2xl items-center justify-center shadow-lg">
                        <Building size={24} color="white" />
                    </View>
                    <View className="ml-4 flex-1">
                        <Text className="text-white font-black text-sm">Sécurité des données</Text>
                        <Text className="text-blue-100/60 text-[8px] font-bold uppercase tracking-widest mt-0.5">Vos coordonnées sont chiffrées sur nos serveurs.</Text>
                    </View>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 24, paddingBottom: 150 }}
                >
                    {/* Section: Bank Details */}
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-2">Coordonnées Bancaires (RIB)</Text>
                    <View className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-8">
                        <View className="mb-6">
                            <View className="flex-row items-center mb-2.5 ml-1">
                                <Home size={16} color="#1E40AF" strokeWidth={2.5} className="mr-2" />
                                <Text className="text-slate-900 font-black text-xs uppercase tracking-tight">Nom de la Banque</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 p-4 rounded-2xl border border-slate-50 text-slate-900 font-bold text-base"
                                value={bankName}
                                onChangeText={setBankName}
                                placeholder="ex: Société Générale, Ecobank..."
                                placeholderTextColor="#CBD5E1"
                            />
                        </View>

                        <View className="mb-6">
                            <View className="flex-row items-center mb-2.5 ml-1">
                                <CreditCard size={16} color="#1E40AF" strokeWidth={2.5} className="mr-2" />
                                <Text className="text-slate-900 font-black text-xs uppercase tracking-tight">IBAN / Numéro de compte</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 p-4 rounded-2xl border border-slate-50 text-slate-900 font-bold text-base"
                                value={bankIban}
                                onChangeText={setBankIban}
                                placeholder="FR76 0000 0000 0000..."
                                placeholderTextColor="#CBD5E1"
                                autoCapitalize="characters"
                            />
                        </View>

                        <View>
                            <View className="flex-row items-center mb-2.5 ml-1">
                                <Zap size={16} color="#1E40AF" strokeWidth={2.5} className="mr-2" />
                                <Text className="text-slate-900 font-black text-xs uppercase tracking-tight">Code SWIFT / BIC</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 p-4 rounded-2xl border border-slate-50 text-slate-900 font-bold text-base"
                                value={bankSwift}
                                onChangeText={setBankSwift}
                                placeholder="ex: SGCOFRPP"
                                placeholderTextColor="#CBD5E1"
                                autoCapitalize="characters"
                            />
                        </View>
                    </View>

                    {/* Section: Quick Payment */}
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-2">Paiement Rapide (QR Code)</Text>
                    <View className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-8">
                        <View className="mb-6">
                            <View className="flex-row items-center mb-2.5 ml-1">
                                <Hash size={16} color="#1E40AF" strokeWidth={2.5} className="mr-2" />
                                <Text className="text-slate-900 font-black text-xs uppercase tracking-tight">Méthode (ex: Mobile Money)</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 p-4 rounded-2xl border border-slate-50 text-slate-900 font-bold text-base"
                                value={paymentMethod}
                                onChangeText={setPaymentMethod}
                                placeholder="Airtel Money, Wave, Orange..."
                                placeholderTextColor="#CBD5E1"
                            />
                        </View>

                        <View>
                            <View className="flex-row items-center mb-2.5 ml-1">
                                <QrCode size={16} color="#1E40AF" strokeWidth={2.5} className="mr-2" />
                                <Text className="text-slate-900 font-black text-xs uppercase tracking-tight">Numéro ou Lien de paiement</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 p-4 rounded-2xl border border-slate-50 text-slate-900 font-bold text-base"
                                value={paymentDetails}
                                onChangeText={setPaymentDetails}
                                placeholder="Saisissez votre numéro ou lien"
                                placeholderTextColor="#CBD5E1"
                            />
                        </View>

                        <View className="mt-6 p-5 bg-blue-50 rounded-2xl border border-blue-100 flex-row items-start">
                            <Info size={16} color="#1E40AF" className="mr-3 mt-0.5" />
                            <Text className="text-blue-800 text-[10px] font-bold leading-5 flex-1">
                                Ces informations apparaîtront sur vos factures pour faciliter le règlement par vos clients.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Save Button */}
            <View className="absolute bottom-10 left-6 right-6 z-50">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.9}
                    className="shadow-2xl shadow-blue-900/40"
                >
                    <LinearGradient
                        colors={['#1E40AF', '#1e3a8a']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="h-16 rounded-[24px] items-center justify-center flex-row px-8"
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text className="text-white font-black text-xs uppercase tracking-[3px] mr-3">
                                    Enregistrer le RIB
                                </Text>
                                <Check size={20} color="white" strokeWidth={3} />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}
