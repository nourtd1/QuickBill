import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2, CheckCircle, Clock, MessageCircle, Globe, Wallet, Copy } from 'lucide-react-native';
import { Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../../context/AuthContext';
import { useInvoiceDetails } from '../../hooks/useInvoiceDetails';
import { generateInvoiceHTML } from '../../lib/generate-html';
import { showError } from '../../lib/error-handler';
import QRCode from 'qrcode';

export default function InvoiceDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { invoice, loading, updating, toggleStatus } = useInvoiceDetails(id as string);
    const { profile, refreshProfile } = useAuth();
    const [sharing, setSharing] = useState(false);

    const handleShare = async () => {
        if (!invoice) return;

        if (!profile || !profile.business_name) {
            await refreshProfile();
            Alert.alert(
                "Profil requis",
                "Vous devez configurer le nom de votre business avant de partager une facture."
            );
            return;
        }

        setSharing(true);
        try {
            const customer = invoice.customer;
            const items = invoice.items || [];

            const invoiceData = {
                title: 'FACTURE',
                invoiceNumber: invoice.invoice_number,
                date: new Date(invoice.created_at).toLocaleDateString(),
                customerName: customer?.name || "Client",
                businessName: profile.business_name || "Business",
                businessPhone: profile.phone_contact || "",
                currency: profile.currency || "RWF",
                logoUrl: profile?.logo_url || undefined,
                signatureUrl: profile?.signature_url || undefined,
                items: items.map((i) => ({
                    description: i.description,
                    quantity: i.quantity,
                    unitPrice: i.unit_price,
                    total: i.quantity * i.unit_price
                })),
                totalAmount: invoice.total_amount,
                qrCodeUrl: profile.payment_details ? `data:image/svg+xml;utf8,${encodeURIComponent(await QRCode.toString(profile.payment_details, { type: 'svg' }))}` : undefined,
                paymentMethod: profile.payment_method || undefined
            };

            const html = generateInvoiceHTML(invoiceData);
            const { uri } = await Print.printToFileAsync({ html, base64: false });

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    UTI: '.pdf',
                    mimeType: 'application/pdf',
                    dialogTitle: `Facture ${invoice.invoice_number}`
                });
            } else {
                Alert.alert("Succès", `PDF généré : ${uri}`);
            }
        } catch (error) {
            showError(error);
        } finally {
            setSharing(false);
        }
    };

    const handleWhatsApp = async () => {
        if (!invoice || !profile) return;
        const customer = invoice.customer;

        if (!customer?.phone) {
            Alert.alert("Info manquante", "Ajoutez un numéro de téléphone à ce client.");
            return;
        }

        const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
        let message = profile.whatsapp_template || "Bonjour {client}, voici votre facture {numero} de {montant} {devise}.";
        message = message
            .replace('{client}', customer.name)
            .replace('{numero}', invoice.invoice_number)
            .replace('{montant}', invoice.total_amount.toLocaleString())
            .replace('{devise}', profile.currency || 'RWF');

        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

        try {
            await Linking.openURL(url);
        } catch (error) {
            Alert.alert("Erreur", "Impossible d'ouvrir WhatsApp.");
        }
    };

    const handleCopyWebLink = async () => {
        if (!invoice?.share_token) {
            Alert.alert("Erreur", "Lien indisponible.");
            return;
        }
        const publicUrl = `https://quickbill.app/public/invoice/${invoice.share_token}`;
        await Clipboard.setStringAsync(publicUrl);
        Alert.alert("Lien copié !", "Vous pouvez l'envoyer à votre client.");
    };

    if (loading || !invoice) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50">
                <ActivityIndicator size="large" color="#1E40AF" />
            </View>
        );
    }

    const isPaid = invoice.status === 'PAID';
    const currency = profile?.currency || 'RWF';

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
                    <Text className="text-xl font-black text-white tracking-tight">Détails</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    className="flex-1 px-6"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Invoice Number & Status */}
                    <View className="items-center mb-6">
                        <Text className="text-white/80 text-sm font-medium uppercase tracking-widest mb-1">Facture N°</Text>
                        <Text className="text-white text-2xl font-black tracking-tight">{invoice.invoice_number}</Text>
                    </View>

                    {/* Status Card */}
                    <View className="bg-white p-5 rounded-3xl shadow-lg shadow-blue-900/10 mb-6 border border-slate-100">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                                <View className={`w-12 h-12 rounded-2xl items-center justify-center ${isPaid ? 'bg-emerald-100' : 'bg-amber-100'} mr-4`}>
                                    {isPaid ? (
                                        <CheckCircle size={24} color="#059669" />
                                    ) : (
                                        <Clock size={24} color="#d97706" />
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                                        État du paiement
                                    </Text>
                                    <Text className={`text-lg font-bold ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {isPaid ? 'Payée' : 'En attente'}
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={isPaid}
                                onValueChange={toggleStatus}
                                trackColor={{ false: "#fed7aa", true: "#bbf7d0" }}
                                thumbColor={isPaid ? "#16a34a" : "#ea580c"}
                                style={{ transform: [{ scale: 0.9 }] }}
                            />
                        </View>
                    </View>

                    {/* Main Details Card */}
                    <View className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden mb-6">
                        {/* Client Section */}
                        <View className="p-6 bg-slate-50 border-b border-slate-100">
                            <View className="flex-row justify-between items-start">
                                <View>
                                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Client</Text>
                                    <Text className="text-xl font-bold text-slate-900">{invoice.customer?.name || 'Client Inconnu'}</Text>
                                    {invoice.customer?.phone && (
                                        <Text className="text-slate-500 text-sm mt-1">{invoice.customer.phone}</Text>
                                    )}
                                </View>
                                <View className="items-end">
                                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Date</Text>
                                    <Text className="text-base font-semibold text-slate-700">
                                        {new Date(invoice.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Items List */}
                        <View className="p-6">
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Articles</Text>
                            {(invoice.items || []).map((item, idx) => (
                                <View key={idx} className="flex-row justify-between items-center mb-4 last:mb-0">
                                    <View className="flex-1 mr-4">
                                        <Text className="text-slate-800 font-semibold text-base mb-0.5">{item.description}</Text>
                                        <Text className="text-slate-400 text-xs">Qté: {item.quantity} × {item.unit_price.toLocaleString()}</Text>
                                    </View>
                                    <Text className="text-slate-900 font-bold text-base">
                                        {(item.quantity * item.unit_price).toLocaleString()}
                                    </Text>
                                </View>
                            ))}

                            {/* Divider */}
                            <View className="h-px bg-slate-100 my-6" />

                            {/* Total Section */}
                            <View className="flex-row justify-between items-center">
                                <Text className="text-slate-500 font-medium text-lg">Total à payer</Text>
                                <View className="items-end">
                                    <Text className="text-3xl font-black text-primary">
                                        {invoice.total_amount.toLocaleString()}
                                    </Text>
                                    <Text className="text-slate-400 text-sm font-semibold">{currency}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>

            {/* Bottom Action Bar */}
            <View className="absolute bottom-0 left-0 right-0 bg-white p-5 pt-4 pb-8 border-t border-slate-100 rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={handleWhatsApp}
                        className="flex-1 bg-emerald-500 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
                    >
                        <MessageCircle size={22} color="white" strokeWidth={2.5} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleCopyWebLink}
                        className="flex-1 bg-blue-500 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                    >
                        <Globe size={22} color="white" strokeWidth={2.5} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleShare}
                        disabled={sharing}
                        className="flex-[2] bg-slate-900 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-slate-300 active:scale-95 transition-transform"
                    >
                        {sharing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Share2 size={22} color="white" strokeWidth={2.5} className="mr-3" />
                                <Text className="text-white font-bold text-lg tracking-wide">PDF</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
