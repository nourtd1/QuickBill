import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Share as RNShare } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Trash2, Printer, Share, CheckCircle2, AlertCircle, Clock, Sparkles, Building2, User, Phone, FileText, Globe } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { EstimateWithRelations } from '../../types';
import { useInvoice } from '../../hooks/useInvoice';
import { showSuccess, showError } from '../../lib/error-handler';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateInvoiceHTML } from '../../lib/generate-html';
import QRCode from 'qrcode';

export default function EstimateDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user, profile } = useAuth();
    const { createInvoice, saving: isConverting } = useInvoice();

    const [estimate, setEstimate] = useState<EstimateWithRelations | null>(null);
    const [loading, setLoading] = useState(true);
    const [sharing, setSharing] = useState(false);

    const handleShareEstimate = async () => {
        if (!estimate || !profile) return;
        setSharing(true);

        try {
            console.log("Préparation du PDF Devis...");
            const estimateData = {
                title: 'DEVIS',
                invoiceNumber: estimate.estimate_number,
                date: new Date(estimate.created_at).toLocaleDateString(),
                customerName: estimate.customer.name,
                businessName: profile.business_name,
                businessPhone: profile.phone_contact || undefined,
                currency: profile.currency || "RWF",
                logoUrl: profile?.logo_url || undefined,
                signatureUrl: profile?.signature_url || undefined,
                items: estimate.items.map((i) => ({
                    description: i.description,
                    quantity: i.quantity,
                    unitPrice: i.unit_price,
                    total: i.quantity * i.unit_price
                })),
                totalAmount: estimate.total_amount,
                qrCodeUrl: profile.payment_details ? `data:image/svg+xml;utf8,${encodeURIComponent(await QRCode.toString(profile.payment_details, { type: 'svg' }))}` : undefined,
                paymentMethod: profile.payment_method || undefined
            };

            const html = generateInvoiceHTML(estimateData);
            const { uri } = await Print.printToFileAsync({ html, base64: false });

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    UTI: '.pdf',
                    mimeType: 'application/pdf',
                    dialogTitle: `Devis ${estimate.estimate_number}`
                });
            } else {
                Alert.alert("Erreur", "Le partage n'est pas disponible.");
            }
        } catch (error) {
            console.error("Erreur partage devis:", error);
            showError(error);
        } finally {
            setSharing(false);
        }
    };

    const fetchEstimate = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('estimates')
                .select(`
                    *,
                    customer:clients (*),
                    items:estimate_items (*)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setEstimate(data);
        } catch (error) {
            console.error('Error fetching estimate:', error);
            showError(error, "Impossible de charger le devis");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchEstimate();
    }, [fetchEstimate]);

    const handleConvertToInvoice = async () => {
        if (!estimate) return;

        Alert.alert(
            "Convertir en Facture",
            "Voulez-vous transformer ce devis en facture finale ? Cela marquera le devis comme 'Converti'.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Convertir",
                    onPress: async () => {
                        try {
                            const itemsForInvoice = estimate.items.map(item => ({
                                description: item.description,
                                quantity: item.quantity,
                                unitPrice: item.unit_price
                            }));

                            // 1. Create Invoice
                            const newInvoice = await createInvoice(
                                estimate.customer.name,
                                itemsForInvoice,
                                estimate.total_amount,
                                estimate.customer.id
                            );

                            // 2. Update Estimate Status
                            await supabase
                                .from('estimates')
                                .update({ status: 'CONVERTED' })
                                .eq('id', estimate.id);

                            showSuccess("Devis converti avec succès !");

                            // 3. Redirect to new invoice
                            router.replace(`/invoice/${newInvoice.id}`);
                        } catch (error) {
                            showError(error, "Erreur lors de la conversion");
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = () => {
        Alert.alert("Supprimer", "Voulez-vous supprimer ce devis ?", [
            { text: "Non", style: "cancel" },
            {
                text: "Oui, supprimer",
                style: "destructive",
                onPress: async () => {
                    try {
                        const { error } = await supabase.from('estimates').delete().eq('id', id);
                        if (error) throw error;
                        router.replace('/estimates');
                        showSuccess("Devis supprimé");
                    } catch (error) {
                        showError(error);
                    }
                }
            }
        ]);
    };

    const handleCopyWebLink = async () => {
        if (!estimate?.share_token) {
            Alert.alert("Erreur", "Le lien de partage n'est pas encore prêt.");
            return;
        }

        const baseUrl = "https://quickbill.app";
        const publicUrl = `${baseUrl}/public/estimate/${estimate.share_token}`;

        await Clipboard.setStringAsync(publicUrl);
        Alert.alert("Lien copié !", "Le lien public du devis a été copié.");
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#F59E0B" />
            </View>
        );
    }

    if (!estimate) {
        return (
            <View className="flex-1 items-center justify-center bg-white p-10">
                <AlertCircle size={48} color="#EF4444" />
                <Text className="text-slate-900 font-bold text-lg mt-4 text-center">Devis introuvable</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-slate-100 px-6 py-3 rounded-xl">
                    <Text className="text-slate-600 font-bold uppercase">Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currency = profile?.currency || estimate.currency;

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
            <StatusBar style="dark" />

            {/* Header */}
            <View className="flex-row justify-between items-center px-6 py-4 bg-white border-b border-slate-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 bg-slate-50 rounded-full">
                    <ArrowLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text className="text-lg font-black text-slate-900">Détails Devis</Text>
                <TouchableOpacity onPress={handleDelete} className="p-2 bg-red-50 rounded-full">
                    <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>

                {/* Status Badge */}
                <View className="flex-row justify-center mb-6">
                    <View className={`px-4 py-2 rounded-full flex-row items-center ${estimate.status === 'CONVERTED' ? 'bg-orange-100 border border-orange-200' : 'bg-blue-100 border border-blue-200'}`}>
                        {estimate.status === 'CONVERTED' ? <Sparkles size={16} color="#F59E0B" /> : <Clock size={16} color="#2563EB" />}
                        <Text className={`ml-2 font-black text-xs tracking-widest ${estimate.status === 'CONVERTED' ? 'text-orange-700' : 'text-blue-700'}`}>
                            {estimate.status === 'CONVERTED' ? 'DÉJÀ CONVERTI EN FACTURE' : `STATUT : ${estimate.status}`}
                        </Text>
                    </View>
                </View>

                {/* Estimate Header Card */}
                <View className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-50 mb-6">
                    <View className="flex-row justify-between items-start mb-6">
                        <View>
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Numéro de devis</Text>
                            <Text className="text-2xl font-black text-slate-900">{estimate.estimate_number}</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Date</Text>
                            <Text className="text-slate-600 font-bold">{new Date(estimate.created_at).toLocaleDateString()}</Text>
                        </View>
                    </View>

                    <View className="h-[1px] bg-slate-50 w-full mb-6" />

                    <View className="flex-row">
                        <View className="flex-1">
                            <View className="flex-row items-center mb-2">
                                <User size={14} color="#64748B" className="mr-2" />
                                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Client</Text>
                            </View>
                            <Text className="text-slate-900 font-black text-lg">{estimate.customer?.name}</Text>
                            <Text className="text-slate-500 text-sm mt-1">{estimate.customer?.email || 'Pas d\'email'}</Text>
                        </View>
                    </View>
                </View>

                {/* Items Section */}
                <Text className="text-slate-500 text-xs font-bold mb-4 uppercase tracking-widest ml-1">Lignes du devis</Text>
                {estimate.items.map((item, index) => (
                    <View key={index} className="bg-white p-5 rounded-3xl mb-4 border border-slate-50 shadow-sm">
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="text-slate-900 font-bold text-base flex-1 mr-4">{item.description}</Text>
                            <Text className="text-slate-900 font-black">{(item.quantity * item.unit_price).toLocaleString()} {currency}</Text>
                        </View>
                        <Text className="text-slate-400 text-xs">
                            {item.quantity} x {item.unit_price.toLocaleString()} {currency}
                        </Text>
                    </View>
                ))}

                <View className="bg-slate-900 p-8 rounded-[40px] mt-4 mb-24">
                    <Text className="text-slate-400 text-xs font-bold uppercase mb-2">Total Estimé</Text>
                    <Text className="text-white text-4xl font-black">{estimate.total_amount.toLocaleString()} {currency}</Text>
                </View>

            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 p-6 pb-10 flex-row bg-white border-t border-slate-100 shadow-xl gap-2">
                <TouchableOpacity
                    className="flex-1 bg-slate-900 h-16 rounded-2xl flex-row items-center justify-center mr-0"
                    onPress={handleShareEstimate}
                    disabled={sharing}
                >
                    {sharing ? <ActivityIndicator color="white" size="small" /> : (
                        <>
                            <Share size={18} color="white" />
                            <Text className="text-white font-bold ml-1 text-xs">PDF</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-1 bg-blue-600 h-16 rounded-2xl flex-row items-center justify-center"
                    onPress={handleCopyWebLink}
                >
                    <Globe size={18} color="white" />
                    <Text className="text-white font-bold ml-1 text-xs">WEB</Text>
                </TouchableOpacity>

                {estimate.status !== 'CONVERTED' ? (
                    <TouchableOpacity
                        className="flex-[1.5] bg-orange-500 h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-orange-200"
                        onPress={handleConvertToInvoice}
                        disabled={isConverting}
                    >
                        {isConverting ? <ActivityIndicator color="white" size="small" /> : (
                            <>
                                <Sparkles size={18} color="white" />
                                <Text className="text-white font-black ml-1 uppercase text-xs">Facturer</Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <View className="flex-[1.5] bg-slate-100 h-16 rounded-2xl items-center justify-center">
                        <Text className="text-slate-400 font-bold text-xs uppercase text-center">Facturé</Text>
                    </View>
                )}
            </View>

        </SafeAreaView>
    );
}
