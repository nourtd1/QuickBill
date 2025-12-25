import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2, CheckCircle, Clock } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { useInvoiceDetails } from '../../hooks/useInvoiceDetails';
import { useProfile } from '../../hooks/useProfile';
import { generateInvoiceHTML } from '../../lib/generate-html';
import { showError } from '../../lib/error-handler';
import { InvoiceWithRelations } from '../../types';

export default function InvoiceDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { invoice, loading, updating, toggleStatus } = useInvoiceDetails(id as string);
    const { profile } = useProfile();
    const [sharing, setSharing] = useState(false);

    const handleShare = async () => {
        if (!invoice || !profile) return;
        setSharing(true);

        try {
            // Type guard to ensure we have the proper structure
            const customer = Array.isArray(invoice.customer) 
                ? invoice.customer[0] 
                : invoice.customer;
            
            const items = invoice.items || [];

            // 1. Prepare Data using loaded invoice & profile
            const invoiceData = {
                invoiceNumber: invoice.invoice_number,
                date: new Date(invoice.created_at).toLocaleDateString(),
                customerName: customer?.name || "Client",
                businessName: profile.business_name,
                businessPhone: profile.phone_contact || undefined,
                currency: profile.currency || "RWF",
                logoUrl: profile?.logo_url || undefined,
                items: items.map((i) => ({
                    description: i.description,
                    quantity: i.quantity,
                    unitPrice: i.unit_price,
                    total: i.quantity * i.unit_price
                })),
                totalAmount: invoice.total_amount
            };

            // 2. Generate
            const html = generateInvoiceHTML(invoiceData);
            const { uri } = await Print.printToFileAsync({ html, base64: false });

            // 3. Share
            await Sharing.shareAsync(uri, {
                UTI: '.pdf',
                mimeType: 'application/pdf',
                dialogTitle: `Facture ${invoice.invoice_number}`
            });

        } catch (error: any) {
            showError(error, "Erreur de partage");
        } finally {
            setSharing(false);
        }
    };

    if (loading || !invoice) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    const isPaid = invoice.status === 'PAID';
    const currency = profile?.currency || 'RWF';

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <SafeAreaView edges={['top']} className="flex-1">

                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-200 rounded-full">
                        <ArrowLeft size={24} color="#333" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-gray-800">{invoice.invoice_number}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView className="flex-1 px-4 pt-2">

                    {/* Status Card */}
                    <View className={`p-4 rounded-xl mb-6 flex-row items-center justify-between shadow-sm ${isPaid ? 'bg-green-100 border border-green-200' : 'bg-orange-50 border border-orange-100'}`}>
                        <View className="flex-row items-center">
                            {isPaid ? <CheckCircle size={28} color="#15803d" className="mr-3" /> : <Clock size={28} color="#c2410c" className="mr-3" />}
                            <View>
                                <Text className={`text-sm font-bold uppercase ${isPaid ? 'text-green-800' : 'text-orange-800'}`}>
                                    {isPaid ? 'Payée' : 'En attente'}
                                </Text>
                                <Text className={`text-xs ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                                    {isPaid ? 'Le paiement a été reçu.' : 'Le client doit encore payer.'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isPaid}
                            onValueChange={toggleStatus}
                            trackColor={{ false: "#fed7aa", true: "#bbf7d0" }}
                            thumbColor={isPaid ? "#16a34a" : "#ea580c"}
                        />
                    </View>

                    {/* Client & Date */}
                    <View className="bg-white p-5 rounded-2xl shadow-sm mb-4">
                        <View className="flex-row justify-between mb-4 border-b border-gray-100 pb-4">
                            <View>
                                <Text className="text-gray-400 text-xs uppercase mb-1">Client</Text>
                                <Text className="text-lg font-bold text-gray-900">
                                    {Array.isArray(invoice.customer) 
                                        ? invoice.customer[0]?.name || 'Inconnu'
                                        : invoice.customer?.name || 'Inconnu'}
                                </Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-gray-400 text-xs uppercase mb-1">Date</Text>
                                <Text className="text-base font-medium text-gray-900">{new Date(invoice.created_at).toLocaleDateString()}</Text>
                            </View>
                        </View>

                        <View>
                            <Text className="text-gray-400 text-xs uppercase mb-3">Détails</Text>
                            {(invoice.items || []).map((item, idx) => (
                                <View key={item.id || idx} className="flex-row justify-between mb-2">
                                    <Text className="text-gray-600 flex-1 mr-2">
                                        {item.quantity}x {item.description}
                                    </Text>
                                    <Text className="text-gray-900 font-medium">
                                        {(item.quantity * item.unit_price).toLocaleString()}
                                    </Text>
                                </View>
                            ))}

                            <View className="border-t border-dashed border-gray-200 mt-3 pt-3 flex-row justify-between items-center">
                                <Text className="text-lg font-bold text-gray-900">Total</Text>
                                <Text className="text-2xl font-bold text-primary">
                                    {invoice.total_amount.toLocaleString()} <Text className="text-sm font-normal text-gray-500">{currency}</Text>
                                </Text>
                            </View>
                        </View>
                    </View>

                </ScrollView>

                {/* Bottom Actions */}
                <View className="p-4 bg-white border-t border-gray-100">
                    <TouchableOpacity
                        onPress={handleShare}
                        disabled={sharing}
                        className="w-full bg-slate-900 py-4 rounded-xl flex-row items-center justify-center shadow-lg"
                    >
                        {sharing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Share2 size={20} color="white" className="mr-2" />
                                <Text className="text-white font-bold text-lg">Partager le PDF</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
