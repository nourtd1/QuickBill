import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { supabase } from '../../../lib/supabase';
import InvoiceViewer from '../../../components/InvoiceViewer';
import { Stack } from 'expo-router';

export default function PublicInvoicePage() {
    const { token } = useLocalSearchParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [invoice, setInvoice] = useState<any>(null);

    useEffect(() => {
        if (!token) return;

        const fetchInvoice = async () => {
            try {
                console.log('Fetching invoice with token:', token);
                // Call the secure RPC function
                const { data, error } = await supabase.rpc('get_invoice_by_token', {
                    token_arg: token
                });

                if (error) throw error;
                if (!data) throw new Error('Cette facture est introuvable ou le lien a expiré.');

                setInvoice(data);

                // --- TRACKING ---
                // Fire and forget tracking
                const trackView = async () => {
                    // We use fetch directly to call the Edge Function (standard HTTP)
                    // or supabase.functions.invoke()
                    try {
                        // If using local dev, this might fail without --no-verify-jwt logic on function if not auth'd
                        // But typically tracking views is anonymous. 
                        // Let's assume the function is accessible anonymously.
                        await supabase.functions.invoke('track-invoice-view', {
                            body: {
                                invoice_id: data.id,
                                user_agent: navigator.userAgent
                            }
                        });
                    } catch (tErr) {
                        console.log('Tracking ignored', tErr);
                    }
                };
                trackView();
                // ----------------

            } catch (err: any) {
                console.error('Error fetching public invoice:', err);
                setError(err.message || 'Erreur inconnue');
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [token]);

    // Set page title dynamically
    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <Stack.Screen options={{ title: 'Portail Facture', headerShown: false }} />

            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, alignItems: 'center' }}>
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
                    invoice && <InvoiceViewer data={invoice} />
                )}
            </ScrollView>

            {/* Simple footer for QuickBill Branding */}
            <View className="py-6 items-center">
                <Text className="text-gray-400 text-xs text-center">
                    Propulsé par QuickBill • Plateforme de facturation
                </Text>
            </View>
        </SafeAreaView>
    );
}
