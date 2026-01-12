import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../../../lib/supabase';
import InvoiceViewer from '../../../components/InvoiceViewer';
import { Stack } from 'expo-router';
import { MessageCircle, Banknote } from 'lucide-react-native';
import ChatModal from '../../../components/ChatModal';
import PaymentModal from '../../../components/PaymentModal';

export default function PublicInvoicePage() {
    const { token } = useLocalSearchParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [invoice, setInvoice] = useState<any>(null);
    const [paymentVisible, setPaymentVisible] = useState(false);
    const [chatVisible, setChatVisible] = useState(false);

    const fetchInvoice = async () => {
        if (!token) return;
        setLoading(true);
        try {
            // Call the secure RPC function
            const { data, error } = await supabase.rpc('get_invoice_by_token', {
                token_arg: token
            });

            if (error) throw error;
            if (!data) throw new Error('Cette facture est introuvable ou le lien a expiré.');

            setInvoice(data);

            // --- TRACKING ---
            supabase.functions.invoke('track-invoice-view', {
                body: { invoice_id: data.id, user_agent: navigator.userAgent }
            }).catch(() => { });

        } catch (err: any) {
            console.error('Error fetching public invoice:', err);
            setError(err.message || 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoice();
    }, [token]);

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <Stack.Screen options={{ title: 'Portail Facture', headerShown: false }} />

            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, alignItems: 'center', paddingBottom: 100 }}>
                {loading ? (
                    <View className="flex-1 justify-center items-center h-[500px]">
                        <ActivityIndicator size="large" color="#4F46E5" />
                        <Text className="mt-4 text-gray-500">Chargement de la facture...</Text>
                    </View>
                ) : error ? (
                    <View className="flex-1 justify-center items-center mt-20 p-8 bg-white rounded-xl shadow-sm border border-red-100 max-w-md">
                        <Text className="text-4xl mb-4">😕</Text>
                        <Text className="text-xl font-bold text-gray-800 text-center mb-2">Impossible d'accéder à la facture</Text>
                        <Text className="text-center text-gray-500">{error}</Text>
                    </View>
                ) : (
                    <>
                        <InvoiceViewer data={invoice} />

                        {/* Payment Button Main Action */}
                        {invoice.status !== 'PAID' && (
                            <View className="w-full max-w-[595px] mt-6 px-4">
                                <TouchableOpacity
                                    onPress={() => setPaymentVisible(true)}
                                    className="bg-blue-600 p-5 rounded-2xl shadow-xl shadow-blue-300 flex-row items-center justify-center animate-pulse"
                                >
                                    <Banknote color="white" size={24} className="mr-3" />
                                    <View>
                                        <Text className="text-white font-black text-xl tracking-tight">PAYER MAINTENANT</Text>
                                        <Text className="text-blue-100 text-xs font-semibold text-center">Mobile Money Sécurisé</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        {invoice.status === 'PAID' && (
                            <View className="w-full max-w-[595px] mt-6 px-4">
                                <View className="bg-emerald-100 p-4 rounded-xl border border-emerald-200 flex-row items-center justify-center">
                                    <Text className="text-emerald-700 font-bold text-lg">✅ Cette facture est déjà payée.</Text>
                                </View>
                            </View>
                        )}

                        {/* Footer Branding */}
                        <View className="py-8 items-center w-full mt-4">
                            <Text className="text-gray-400 text-xs text-center">
                                Propulsé par QuickBill • La solution de facturation pour entrepreneurs
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Public Chat Button - Floating */}
            {!loading && !error && invoice && (
                <TouchableOpacity
                    onPress={() => setChatVisible(true)}
                    className="absolute bottom-8 right-8 bg-white w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-slate-300 z-50 border border-slate-100"
                >
                    <MessageCircle size={24} color="#4F46E5" />
                </TouchableOpacity>
            )}

            {/* Modals */}
            {!loading && invoice && (
                <>
                    <ChatModal
                        invoiceId={invoice.id}
                        visible={chatVisible}
                        onClose={() => setChatVisible(false)}
                        userType="client"
                    />
                    <PaymentModal
                        visible={paymentVisible}
                        onClose={() => setPaymentVisible(false)}
                        invoiceId={invoice.id}
                        amount={invoice.total_amount}
                        currency={invoice.currency || 'RWF'}
                        onSuccess={() => {
                            setPaymentVisible(false);
                            fetchInvoice(); // Reload status
                        }}
                    />
                </>
            )}
        </SafeAreaView>
    );
}
