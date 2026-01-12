import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { EstimateWithRelations, Profile } from '../../../types';
import { FileText, Download, Clock, Building2, User, Phone, QrCode } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { generateInvoiceHTML } from '../../../lib/generate-html';
import { StatusBar } from 'expo-status-bar';

export default function PublicEstimatePortal() {
    const { token } = useLocalSearchParams();
    const [estimate, setEstimate] = useState<EstimateWithRelations | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (token) fetchPublicEstimate();
    }, [token]);

    const fetchPublicEstimate = async () => {
        setLoading(true);
        try {
            const { data: est, error: estErr } = await supabase
                .from('estimates')
                .select('*, customer:clients(*), items:estimate_items(*)')
                .eq('share_token', token)
                .single();

            if (estErr) throw estErr;
            setEstimate(est);

            const { data: prof, error: profErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', est.user_id)
                .single();

            if (profErr) throw profErr;
            setProfile(prof);
        } catch (err: any) {
            console.error('Portal Error:', err);
            setError("Devis introuvable ou lien expiré.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!estimate || !profile) return;
        setDownloading(true);
        try {
            const data = {
                title: 'DEVIS',
                invoiceNumber: estimate.estimate_number,
                date: new Date(estimate.created_at).toLocaleDateString(),
                customerName: estimate.customer.name,
                businessName: profile.business_name,
                businessPhone: profile.phone_contact || "",
                currency: profile.currency || "RWF",
                logoUrl: profile?.logo_url || undefined,
                signatureUrl: profile?.signature_url || undefined,
                items: estimate.items.map((i) => ({
                    description: i.description,
                    quantity: i.quantity,
                    unitPrice: i.unit_price,
                    total: i.quantity * i.unit_price
                })),
                totalAmount: estimate.total_amount
            };

            const html = generateInvoiceHTML(data);
            await Print.printAsync({ html });
        } catch (err) {
            console.error(err);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text className="mt-4 text-slate-500 font-medium">Chargement de votre devis...</Text>
            </View>
        );
    }

    if (error || !estimate || !profile) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50 p-6">
                <View className="bg-white p-8 rounded-[40px] items-center shadow-sm border border-slate-100">
                    <View className="w-20 h-20 bg-purple-50 rounded-full items-center justify-center mb-6">
                        <FileText size={40} color="#7C3AED" />
                    </View>
                    <Text className="text-xl font-black text-slate-900 text-center">{error || "Une erreur est survenue"}</Text>
                    <Text className="text-slate-500 text-center mt-2 leading-relaxed">
                        Veuillez contacter l'émetteur du devis pour obtenir un nouveau lien.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            <StatusBar style="dark" />
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View className="bg-white px-6 pt-16 pb-8 border-b border-slate-100">
                    <View className="flex-row justify-between items-start mb-6">
                        <View className="flex-1">
                            {profile.logo_url && (
                                <Image source={{ uri: profile.logo_url }} className="w-16 h-16 rounded-2xl mb-4" resizeMode="contain" />
                            )}
                            <Text className="text-2xl font-black text-slate-900">{profile.business_name}</Text>
                            <View className="flex-row items-center mt-1">
                                <Phone size={12} color="#64748B" />
                                <Text className="text-slate-500 text-xs ml-1 font-medium">{profile.phone_contact}</Text>
                            </View>
                        </View>
                        <View className="px-4 py-2 rounded-2xl bg-purple-50">
                            <Text className="text-xs font-black uppercase tracking-wider text-purple-600">DEVIS</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleDownload}
                        disabled={downloading}
                        className="bg-purple-600 py-4 rounded-[20px] flex-row items-center justify-center shadow-lg shadow-purple-100"
                    >
                        {downloading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                                <Download size={20} color="white" />
                                <Text className="text-white font-bold ml-2">Télécharger le Devis PDF</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Body */}
                <View className="p-6">
                    <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 mb-6">
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Devis Estimatif</Text>
                        <Text className="text-2xl font-black text-slate-900 mb-1">#{estimate.estimate_number}</Text>
                        <Text className="text-slate-500 text-sm font-medium">Validité 30 jours • {new Date(estimate.created_at).toLocaleDateString()}</Text>

                        <View className="h-[1px] bg-slate-100 my-6" />

                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Client</Text>
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-purple-50 rounded-xl items-center justify-center mr-3">
                                <User size={20} color="#7C3AED" />
                            </View>
                            <View>
                                <Text className="text-slate-900 font-bold text-base">{estimate.customer.name}</Text>
                                <Text className="text-slate-500 text-xs">{estimate.customer.email || 'Pas d\'email'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Items */}
                    <View className="bg-white rounded-[32px] overflow-hidden border border-slate-100 mb-6">
                        <View className="bg-slate-50 px-6 py-4 flex-row justify-between">
                            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Description</Text>
                            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Montant</Text>
                        </View>
                        {estimate.items.map((item, idx) => (
                            <View key={idx} className={`p-6 flex-row justify-between items-center ${idx < estimate.items.length - 1 ? 'border-b border-slate-50' : ''}`}>
                                <View className="flex-1 pr-4">
                                    <Text className="text-slate-900 font-bold text-sm" numberOfLines={2}>{item.description}</Text>
                                    <Text className="text-slate-400 text-xs mt-1">Qté: {item.quantity} × {item.unit_price.toLocaleString()} {profile.currency}</Text>
                                </View>
                                <Text className="text-slate-900 font-black text-sm">{(item.quantity * item.unit_price).toLocaleString()} {profile.currency}</Text>
                            </View>
                        ))}
                        <View className="bg-purple-600 p-8 flex-row justify-between items-center">
                            <Text className="text-white/60 font-bold text-sm">Total Estimation</Text>
                            <Text className="text-white font-black text-2xl">{estimate.total_amount.toLocaleString()} {profile.currency}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
