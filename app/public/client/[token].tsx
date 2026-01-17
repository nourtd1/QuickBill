import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, SafeAreaView, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { Stack } from 'expo-router';
import { FileText, Clock, CheckCircle, AlertCircle, ChevronRight, LayoutDashboard, Calendar, DollarSign } from 'lucide-react-native';

export default function ClientPortalPage() {
    const { token } = useLocalSearchParams<{ token: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [clientData, setClientData] = useState<any>(null);

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            // Fetch Client, Invoices, and Estimates in one go if possible
            // Since we don't have a specific RPC yet, we'll do separate calls or hope for a view
            // But for security, we search by token.

            // 1. Get Client by token
            const { data: client, error: clientErr } = await supabase
                .from('clients')
                .select('id, name, business_name:user_id(business_name)')
                .eq('portal_token', token)
                .single();

            if (clientErr || !client) throw new Error('Portail introuvable.');

            // 2. Get Invoices for this client
            const { data: invoices, error: invErr } = await supabase
                .from('invoices')
                .select('*')
                .eq('customer_id', client.id)
                .order('created_at', { ascending: false });

            // 3. Get Estimates for this client
            const { data: estimates, error: estErr } = await supabase
                .from('estimates')
                .select('*')
                .eq('customer_id', client.id)
                .order('created_at', { ascending: false });

            setClientData({
                client,
                invoices: invoices || [],
                estimates: estimates || []
            });

        } catch (err: any) {
            console.error('Error fetching client portal:', err);
            setError(err.message || 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const getStatusStyle = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PAID': return 'bg-emerald-100 text-emerald-700';
            case 'UNPAID': return 'bg-amber-100 text-amber-700';
            case 'OVERDUE': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-50">
                <ActivityIndicator size="large" color="#1E40AF" />
                <Text className="mt-4 text-slate-500 font-medium">Chargement de votre espace...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center p-8 bg-slate-50">
                <AlertCircle size={64} color="#EF4444" />
                <Text className="text-xl font-bold text-slate-900 mt-4 text-center">Oups !</Text>
                <Text className="text-slate-500 text-center mt-2">{error}</Text>
            </View>
        );
    }

    const { client, invoices, estimates } = clientData;
    const pendingInvoices = invoices.filter((i: any) => i.status !== 'PAID');
    const totalPending = pendingInvoices.reduce((acc: number, cur: any) => acc + cur.total_amount, 0);

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <Stack.Screen options={{ title: 'Espace Client', headerShown: false }} />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="bg-primary pt-12 pb-24 px-6 rounded-b-[40px] shadow-lg">
                    <Text className="text-blue-100 font-medium mb-1">Bienvenue dans votre espace,</Text>
                    <Text className="text-white text-3xl font-black">{client.name}</Text>
                    <Text className="text-blue-200 text-sm mt-2">
                        Gérez vos factures et devis de {client.business_name?.business_name || 'votre prestataire'}
                    </Text>
                </View>

                {/* Dashboard Cards */}
                <View className="px-6 -mt-12 flex-row gap-4">
                    <View className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <View className="bg-amber-50 w-10 h-10 rounded-xl items-center justify-center mb-3">
                            <Clock size={20} color="#D97706" />
                        </View>
                        <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">À régler</Text>
                        <Text className="text-2xl font-black text-slate-900">{totalPending.toLocaleString()} <Text className="text-sm font-bold text-slate-400">RWF</Text></Text>
                    </View>
                    <View className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <View className="bg-blue-50 w-10 h-10 rounded-xl items-center justify-center mb-3">
                            <FileText size={20} color="#1E40AF" />
                        </View>
                        <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Documents</Text>
                        <Text className="text-2xl font-black text-slate-900">{invoices.length + estimates.length}</Text>
                    </View>
                </View>

                {/* Section Invoices */}
                <View className="px-6 mt-8">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-slate-900 font-black text-xl">Mes Factures</Text>
                        <View className="bg-blue-100 px-3 py-1 rounded-full">
                            <Text className="text-blue-700 text-xs font-bold">{invoices.length}</Text>
                        </View>
                    </View>

                    {invoices.length === 0 ? (
                        <View className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 items-center">
                            <Text className="text-slate-400">Aucune facture disponible.</Text>
                        </View>
                    ) : (
                        invoices.map((item: any) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => router.push(`/public/invoice/${item.share_token}`)}
                                className="bg-white p-4 rounded-2xl mb-3 flex-row items-center border border-slate-100 shadow-sm"
                            >
                                <View className={`w-12 h-12 rounded-xl items-center justify-center ${item.status === 'PAID' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                                    <FileText size={20} color={item.status === 'PAID' ? '#059669' : '#64748B'} />
                                </View>
                                <View className="flex-1 ml-4">
                                    <Text className="text-slate-900 font-bold">{item.invoice_number}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <Calendar size={12} color="#94A3B8" />
                                        <Text className="text-slate-400 text-xs ml-1">{new Date(item.created_at).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                                <View className="items-end mr-3">
                                    <Text className="text-slate-900 font-black">{item.total_amount.toLocaleString()}</Text>
                                    <View className={`mt-1 px-2 py-0.5 rounded-md ${getStatusStyle(item.status)}`}>
                                        <Text className="text-[10px] font-bold uppercase">{item.status}</Text>
                                    </View>
                                </View>
                                <ChevronRight size={18} color="#CBD5E1" />
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Section Estimates */}
                <View className="px-6 mt-8 pb-12">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-slate-900 font-black text-xl">Mes Devis</Text>
                        <View className="bg-slate-200 px-3 py-1 rounded-full">
                            <Text className="text-slate-700 text-xs font-bold">{estimates.length}</Text>
                        </View>
                    </View>

                    {estimates.length === 0 ? (
                        <View className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 items-center">
                            <Text className="text-slate-400">Aucun devis disponible.</Text>
                        </View>
                    ) : (
                        estimates.map((item: any) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => router.push(`/public/estimate/${item.share_token}`)}
                                className="bg-white p-4 rounded-2xl mb-3 flex-row items-center border border-slate-100 shadow-sm"
                            >
                                <View className="w-12 h-12 rounded-xl bg-slate-50 items-center justify-center">
                                    <FileText size={20} color="#64748B" />
                                </View>
                                <View className="flex-1 ml-4">
                                    <Text className="text-slate-900 font-bold">{item.estimate_number}</Text>
                                    <Text className="text-slate-400 text-xs mt-1">{new Date(item.created_at).toLocaleDateString()}</Text>
                                </View>
                                <View className="items-end mr-3">
                                    <Text className="text-slate-900 font-black">{item.total_amount.toLocaleString()}</Text>
                                    <View className="mt-1 bg-slate-100 px-2 py-0.5 rounded-md">
                                        <Text className="text-[10px] font-bold text-slate-600 uppercase">{item.status}</Text>
                                    </View>
                                </View>
                                <ChevronRight size={18} color="#CBD5E1" />
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
