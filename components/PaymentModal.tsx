import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { X, Smartphone, CheckCircle, Lock, AlertTriangle } from 'lucide-react-native';
import { initiateMobileMoneyPayment, simulateUserValidation, PaymentProvider } from '../lib/paymentService';

interface Props {
    visible: boolean;
    onClose: () => void;
    invoiceId: string;
    amount: number;
    currency: string;
    onSuccess: () => void;
}

export default function PaymentModal({ visible, onClose, invoiceId, amount, currency, onSuccess }: Props) {
    const [step, setStep] = useState<'SELECT' | 'PHONE' | 'PROCESSING' | 'SUCCESS'>('SELECT');
    const [provider, setProvider] = useState<PaymentProvider>('MTN');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInitiate = async () => {
        if (!phone || phone.length < 8) {
            Alert.alert("Numéro invalide", "Veuillez entrer un numéro valide.");
            return;
        }

        setLoading(true);
        try {
            const result = await initiateMobileMoneyPayment(invoiceId, amount, phone, provider);

            if (result.success) {
                setStep('PROCESSING');

                // --- DEMO SIMULATION ---
                // In real life, we wait for Webhook via Realtime Subscription.
                // Here, we simulate the user pressing "Yes" on their phone after 5 seconds.
                setTimeout(async () => {
                    await simulateUserValidation(invoiceId, provider);
                    setStep('SUCCESS');
                    setLoading(false);
                }, 5000);
                // -----------------------
            }
        } catch (e: any) {
            Alert.alert("Échec", e.message || "Le paiement a échoué.");
            setLoading(false);
        }
    };

    const renderProviderButton = (name: PaymentProvider, color: string, label: string) => (
        <TouchableOpacity
            onPress={() => { setProvider(name); setStep('PHONE'); }}
            className={`flex-row items-center p-4 rounded-2xl border mb-3 ${provider === name ? 'bg-slate-50 border-blue-500' : 'bg-white border-slate-200'}`}
        >
            <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4`} style={{ backgroundColor: color }}>
                <Text className="text-white font-bold text-lg">{name[0]}</Text>
            </View>
            <View className="flex-1">
                <Text className="font-bold text-slate-900 text-lg">{label}</Text>
                <Text className="text-slate-400 text-xs">Paiement Mobile</Text>
            </View>
            <Smartphone size={20} color="#CBD5E1" />
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View className="flex-1 bg-slate-900/60 justify-end">
                <View className="bg-white rounded-t-[32px] overflow-hidden h-[85%]">

                    {/* Header */}
                    <View className="flex-row justify-between items-center p-6 border-b border-slate-50">
                        <View>
                            <Text className="text-2xl font-black text-slate-900">Paiement Sécurisé</Text>
                            <Text className="text-slate-500 text-sm">Montant à payer : <Text className="font-bold text-blue-600">{amount.toLocaleString()} {currency}</Text></Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-slate-50 rounded-full">
                            <X size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <View className="p-6 flex-1">
                        {step === 'SELECT' && (
                            <>
                                <Text className="font-bold text-slate-900 mb-4 text-base">Choisissez votre opérateur :</Text>
                                {renderProviderButton('MTN', '#FFCC00', 'MTN MoMo')}
                                {renderProviderButton('ORANGE', '#FF7900', 'Orange Money')}
                                {renderProviderButton('AIRTEL', '#FF0000', 'Airtel Money')}

                                <View className="mt-6 p-4 bg-blue-50 rounded-xl flex-row items-center">
                                    <Lock size={20} color="#2563EB" />
                                    <Text className="ml-3 text-blue-700 text-xs flex-1">
                                        Vos transactions sont chiffrées et sécurisées de bout en bout.
                                    </Text>
                                </View>
                            </>
                        )}

                        {step === 'PHONE' && (
                            <View>
                                <TouchableOpacity onPress={() => setStep('SELECT')} className="mb-4">
                                    <Text className="text-blue-600 font-bold">← Changer d'opérateur</Text>
                                </TouchableOpacity>

                                <Text className="font-bold text-slate-900 mb-2 text-xl">Numéro {provider}</Text>
                                <Text className="text-slate-500 mb-6">Un message de confirmation s'affichera sur ce téléphone.</Text>

                                <TextInput
                                    className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-2xl font-bold tracking-widest text-center mb-6 text-slate-900"
                                    placeholder="078 XXX XXX"
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={setPhone}
                                    autoFocus
                                />

                                <TouchableOpacity
                                    onPress={handleInitiate}
                                    disabled={loading}
                                    className={`w-full py-4 rounded-2xl items-center shadow-lg ${loading ? 'bg-slate-400' : 'bg-primary shadow-blue-300'}`}
                                >
                                    {loading ? <ActivityIndicator color="white" /> : (
                                        <Text className="text-white font-black text-lg">PAYER {amount.toLocaleString()} {currency}</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        {step === 'PROCESSING' && (
                            <View className="items-center justify-center flex-1">
                                <View className="w-24 h-24 bg-blue-50 rounded-full items-center justify-center mb-6 animate-pulse">
                                    <Smartphone size={48} color="#2563EB" />
                                </View>
                                <Text className="text-2xl font-black text-slate-900 text-center mb-2">Vérifiez votre téléphone</Text>
                                <Text className="text-slate-500 text-center text-lg px-8 mb-8">
                                    Veuillez saisir votre code secret PIN pour valider le paiement de <Text className="font-bold text-slate-900">{amount.toLocaleString()} {currency}</Text>.
                                </Text>
                                <ActivityIndicator size="large" color="#2563EB" />
                                <Text className="text-slate-400 text-xs mt-4">En attente de confirmation...</Text>
                            </View>
                        )}

                        {step === 'SUCCESS' && (
                            <View className="items-center justify-center flex-1">
                                <View className="w-24 h-24 bg-emerald-100 rounded-full items-center justify-center mb-6">
                                    <CheckCircle size={48} color="#059669" />
                                </View>
                                <Text className="text-3xl font-black text-slate-900 text-center mb-2">Paiement Réussi !</Text>
                                <Text className="text-emerald-700 text-center font-medium text-lg px-8 mb-8">
                                    Votre facture a été réglée avec succès. Merci.
                                </Text>
                                <TouchableOpacity
                                    onPress={() => { onClose(); onSuccess(); }}
                                    className="w-full bg-emerald-600 py-4 rounded-2xl shadow-lg shadow-emerald-200"
                                >
                                    <Text className="text-white text-center font-bold text-lg">Terminer</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}
