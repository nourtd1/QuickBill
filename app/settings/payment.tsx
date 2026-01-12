import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';
import {
    ArrowLeft,
    QrCode,
    CreditCard,
    Info,
    Check
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { showError, showSuccess } from '../../lib/error-handler';
import { StatusBar } from 'expo-status-bar';

export default function PaymentSettingsScreen() {
    const router = useRouter();
    const { profile, loading: profileLoading, fetchProfile, updateProfile } = useProfile();

    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentDetails, setPaymentDetails] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile) {
            setPaymentMethod(profile.payment_method || '');
            setPaymentDetails(profile.payment_details || '');
        }
    }, [profile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await updateProfile({
                payment_method: paymentMethod.trim(),
                payment_details: paymentDetails.trim()
            });

            if (error) {
                showError(error, "Erreur de mise à jour");
            } else {
                showSuccess("Paramètres de paiement mis à jour !");
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
        <View className="flex-1 bg-background">
            <StatusBar style="light" />
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="bg-primary pt-16 pb-20 px-6 rounded-b-[40px] shadow-lg">
                    <View className="flex-row justify-between items-center mb-8">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-white/10 p-3 rounded-2xl border border-white/10"
                        >
                            <ArrowLeft size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white text-xl font-black">Réglages Paiement</Text>
                        <View className="w-12" />
                    </View>

                    <View className="items-center">
                        <View className="w-20 h-20 bg-white/20 rounded-[28px] items-center justify-center border border-white/20 shadow-xl">
                            <QrCode size={40} color="white" />
                        </View>
                        <Text className="text-white font-bold mt-4 text-center px-10">
                            Configurez vos coordonnées de paiement pour le QR Code.
                        </Text>
                    </View>
                </View>

                <View className="px-6 -mt-8 pb-32">
                    <View className="bg-card rounded-[24px] p-6 shadow-sm mb-8">
                        <View className="space-y-4">
                            <View className="bg-background p-4 rounded-xl border border-slate-100 flex-row items-center">
                                <CreditCard size={20} color="#64748B" className="mr-3" />
                                <View className="flex-1">
                                    <Text className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Méthode (ex: Mobile Money)</Text>
                                    <TextInput
                                        className="text-text-main font-bold py-1 text-base"
                                        value={paymentMethod}
                                        onChangeText={setPaymentMethod}
                                        placeholder="Airtel Money, Bank, etc."
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            <View className="bg-background p-4 rounded-xl border border-slate-100 flex-row items-center mt-4">
                                <Info size={20} color="#64748B" className="mr-3" />
                                <View className="flex-1">
                                    <Text className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Détails (Numéro ou Lien)</Text>
                                    <TextInput
                                        className="text-text-main font-bold py-1 text-base"
                                        value={paymentDetails}
                                        onChangeText={setPaymentDetails}
                                        placeholder="Numéro ou lien de paiement"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>
                        </View>

                        <View className="mt-8 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <Text className="text-blue-800 text-xs font-bold leading-5">
                                💡 Ces informations seront encodées dans un QR Code sur vos factures PDF pour permettre un paiement instantané à vos clients.
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        className={`w-full py-5 rounded-2xl flex-row items-center justify-center shadow-lg ${saving ? 'bg-primary/70' : 'bg-primary shadow-blue-100'
                            }`}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text className="text-white font-bold text-lg mr-2">Valider le QR Code</Text>
                                <Check size={24} color="white" strokeWidth={3} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
