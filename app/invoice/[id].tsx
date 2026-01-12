import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2, CheckCircle, Clock, MessageCircle, Globe, Link2 } from 'lucide-react-native';
import { Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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
        console.log("Clic sur Partager détecté");

        if (!invoice) {
            Alert.alert("Erreur", "Données de la facture non chargées.");
            return;
        }

        // Si le profil n'est pas là, on essaie de le refresh
        if (!profile || !profile.business_name) {
            console.log("Profil incomplet, tentative de rafraîchissement...");
            await refreshProfile();
            Alert.alert(
                "Profil requis",
                "Vous devez configurer le nom de votre business dans l'onglet Paramètres avant de partager une facture."
            );
            return;
        }

        setSharing(true);
        try {
            console.log("Données facture:", invoice.invoice_number);
            console.log("Données profil:", profile.business_name);

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

            console.log("Génération PDF en cours...");
            const html = generateInvoiceHTML(invoiceData);
            const { uri } = await Print.printToFileAsync({ html, base64: false });

            console.log("Fichier généré à:", uri);
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    UTI: '.pdf',
                    mimeType: 'application/pdf',
                    dialogTitle: `Facture ${invoice.invoice_number}`
                });
            } else {
                Alert.alert("Action", `Le partage n'est pas disponible. PDF créé à: ${uri}`);
            }
        } catch (error) {
            console.error("Erreur partage:", error);
            showError(error);
        } finally {
            setSharing(false);
        }
    };

    const handleWhatsApp = async () => {
        if (!invoice || !profile) return;

        const customer = invoice.customer;
        if (!customer?.phone) {
            Alert.alert("Numéro manquant", "Ce client n'a pas de numéro de téléphone enregistré.");
            return;
        }

        // 1. Nettoyage du numéro
        const cleanPhone = customer.phone.replace(/[^0-9]/g, '');

        // 2. Préparation du message
        let message = profile.whatsapp_template || "Bonjour {client}, voici votre facture {numero} de {montant} {devise}.";
        message = message
            .replace('{client}', customer.name)
            .replace('{numero}', invoice.invoice_number)
            .replace('{montant}', invoice.total_amount.toLocaleString())
            .replace('{devise}', profile.currency || 'RWF');

        // 3. Utilisation de wa.me (Universal Link)
        // C'est la méthode recommandée par Meta pour supporter Standard et Business
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

        try {
            await Linking.openURL(url);
        } catch (error) {
            console.error("Erreur WhatsApp:", error);
            // Fallback pour les cas où le lien web ne d'ouvre pas
            const fallbackUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
            try {
                await Linking.openURL(fallbackUrl);
            } catch (innerError) {
                Alert.alert("Erreur", "WhatsApp ne semble pas être installé sur cet appareil.");
            }
        }
    };

    const handleCopyWebLink = async () => {
        if (!invoice?.share_token) {
            Alert.alert("Erreur", "Le lien de partage n'est pas encore prêt.");
            return;
        }

        const baseUrl = "https://quickbill.app";
        const publicUrl = `${baseUrl}/public/invoice/${invoice.share_token}`;

        await Clipboard.setStringAsync(publicUrl);
        Alert.alert("Lien copié !", "Le lien public de la facture a été copié.");
    };

    if (loading || !invoice) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    const isPaid = invoice.status === 'PAID';
    const currency = profile?.currency || 'RWF';

    return (
        <View className="flex-1 bg-background">
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
                                    {invoice.customer?.name || 'Inconnu'}
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
                <View className="p-4 bg-white border-t border-gray-100 flex-row gap-2">
                    <TouchableOpacity
                        onPress={handleWhatsApp}
                        className="flex-1 bg-emerald-600 py-4 rounded-xl flex-row items-center justify-center shadow-sm"
                    >
                        <MessageCircle size={18} color="white" className="mr-1" />
                        <Text className="text-white font-bold text-sm">WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleCopyWebLink}
                        className="flex-1 bg-blue-600 py-4 rounded-xl flex-row items-center justify-center shadow-sm"
                    >
                        <Globe size={18} color="white" className="mr-1" />
                        <Text className="text-white font-bold text-sm">Lien Web</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleShare}
                        disabled={sharing}
                        className="flex-1 bg-slate-900 py-4 rounded-xl flex-row items-center justify-center shadow-sm"
                    >
                        {sharing ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                                <Share2 size={18} color="white" className="mr-1" />
                                <Text className="text-white font-bold text-sm">PDF</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
