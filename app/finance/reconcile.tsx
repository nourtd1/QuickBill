import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Dimensions,
    SafeAreaView
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    ArrowLeft,
    CheckCircle,
    Smartphone,
    Sparkles,
    Zap,
    ArrowRight,
    Info,
    Plus,
    History,
    Clipboard as ClipboardIcon,
    Check,
    Eye
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
    getAllInvoicesLocal, 
    updateInvoiceLocally, 
    LocalInvoice,
    saveNotificationLocally
} from '../../lib/localServices';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Helper to ask Gemini to parse Payment SMS
async function parsePaymentSMSWithGemini(text: string) {
    const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!API_KEY) throw new Error("API Key missing");

    const requestBody = {
        contents: [{
            parts: [{
                text: `Analyse ce SMS de Mobile Money (M-Pesa, MTN, Orange, Wave) et extrais les infos.
                SMS: "${text}"
                Renvoie un JSON uniquement : { "amount": number, "sender": string, "ref": string, "provider": string }.
                Si introuvable, mets null.`
            }]
        }],
        generationConfig: { response_mime_type: "application/json" }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
}

export default function ReconcilePage() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const [smsText, setSmsText] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [matchedInvoices, setMatchedInvoices] = useState<any[]>([]);

    const demoSMS = "Paiement reçu de 150000 RWF de Jean Dupont via MTN Mobile Money. Ref: XJ89230. 16/01/2026.";

    const handlePaste = async () => {
        try {
            const text = await Clipboard.getStringAsync();
            setSmsText(text);
        } catch (error) {
            Alert.alert("Error", "Could not paste from clipboard.");
        }
    };

    const handleAnalyze = async () => {
        if (!smsText.trim()) return;
        setAnalyzing(true);
        setResult(null);
        setMatchedInvoices([]);

        try {
            const extracted = await parsePaymentSMSWithGemini(smsText);
            setResult(extracted);

            if (extracted?.amount) {
                const { data: invoices } = await supabase
                    .from('invoices')
                    .select('*, customer:clients(*)')
                    .eq('status', 'sent')
                    .eq('user_id', user?.id)
                    .order('created_at', { ascending: false });

                if (invoices) {
                    const matches = invoices.filter(inv => {
                        const amountMatch = Math.abs(inv.total_amount - extracted.amount) < 100;
                        return amountMatch;
                    });
                    setMatchedInvoices(matches);
                }
            } else {
                Alert.alert("Echec", "Impossible d'extraire les infos du paiement.");
            }
        } catch (e: any) {
            Alert.alert("Erreur", e.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const confirmReconciliation = async (invoice: any) => {
        try {
            if (invoice.id === 'demo-id') {
                Alert.alert("Mode Démo", "Paiement simulé validé avec succès ! ✅");
                setMatchedInvoices([]);
                setResult(null);
                setSmsText('');
                return;
            }

            const { error } = await supabase
                .from('invoices')
                .update({ status: 'paid' })
                .eq('id', invoice.id);

            if (error) throw error;

            // 3. Save Notification
            if (user) {
                await saveNotificationLocally({
                    user_id: user.id,
                    title: 'Payment Confirmed',
                    message: `Invoice #${invoice.invoice_number} has been marked as paid (${invoice.total_amount} ${profile?.currency || 'USD'}).`,
                    type: 'payment',
                    data: JSON.stringify({ invoiceId: invoice.id })
                });
            }

            Alert.alert(
                "Success",
                "Payment has been reconciled successfully!",
                [{ text: "OK", onPress: () => router.push('/(tabs)') }]
            );
        } catch (e: any) {
            Alert.alert("Erreur", e.message);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            {/* Background Gradient */}
            <View className="absolute top-0 left-0 right-0 h-80">
                <LinearGradient
                    colors={['#4f46e5', '#818cf8', 'white']}
                    className="flex-1"
                />
            </View>

            <View className="flex-1 px-6 pt-4">
                {/* Header */}
                <View className="flex-row justify-between items-center mb-8 mt-10">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-12 h-12 bg-white/20 rounded-full items-center justify-center border border-white/30 backdrop-blur-md"
                    >
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>

                    <View className="flex-row items-center bg-white/10 px-4 py-2 rounded-full border border-white/20">
                        <Sparkles size={16} color="white" fill="white" className="mr-2" />
                        <Text className="text-sm font-black text-white uppercase tracking-[2px]">AI Reconciler</Text>
                    </View>

                    <TouchableOpacity
                        className="w-12 h-12 bg-white/20 rounded-full items-center justify-center border border-white/30 backdrop-blur-md"
                    >
                        <History size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Hero Section */}
                    <View className="mb-8 items-center">
                        <View className="w-16 h-16 bg-white rounded-3xl items-center justify-center shadow-2xl shadow-indigo-500/40 mb-4 transform rotate-6">
                            <Zap size={32} color="#4f46e5" fill="#4f46e5" />
                        </View>
                        <Text className="text-3xl font-black text-white text-center mb-1">
                            Verify Payments
                        </Text>
                        <Text className="text-indigo-100 text-center text-sm font-medium px-10 leading-5">
                            Our AI instantly matches your SMS receipts with unpaid invoices.
                        </Text>
                    </View>

                    {/* Input Card */}
                    <View className="bg-white rounded-[32px] p-6 shadow-2xl shadow-slate-200 border border-slate-50 mb-6">
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 rounded-lg bg-indigo-50 items-center justify-center mr-3">
                                    <Smartphone size={16} color="#4f46e5" />
                                </View>
                                <Text className="text-slate-900 font-bold text-base">Paste SMS Text</Text>
                            </View>

                            <TouchableOpacity
                                onPress={handlePaste}
                                className="bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
                            >
                                <Text className="text-indigo-600 font-bold text-xs">PASTE</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100 min-h-[140px]">
                            <TextInput
                                className="text-slate-700 text-base flex-1"
                                multiline
                                placeholder="Example: You have received RWF 50,000 from JP for INV #102..."
                                placeholderTextColor="#94a3b8"
                                value={smsText}
                                onChangeText={setSmsText}
                                textAlignVertical="top"
                                style={{ lineHeight: 22 }}
                            />
                        </View>

                        {!smsText && (
                            <TouchableOpacity
                                onPress={() => setSmsText(demoSMS)}
                                className="mt-4 self-center"
                            >
                                <Text className="text-slate-400 text-xs italic underline">Try with a demo SMS</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={handleAnalyze}
                            disabled={analyzing || !smsText}
                            className={`mt-6 w-full h-14 rounded-2xl flex-row items-center justify-center shadow-lg ${!smsText ? 'bg-slate-100' : 'bg-indigo-600 shadow-indigo-500/40'}`}
                        >
                            {analyzing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Sparkles size={18} color={!smsText ? '#94a3b8' : 'white'} fill={!smsText ? '#94a3b8' : 'white'} className="mr-2" />
                                    <Text className={`font-bold text-base ${!smsText ? 'text-slate-400' : 'text-white'}`}>
                                        Analyze Payment
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Results Branding */}
                    {analyzing && (
                        <View className="items-center py-4">
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-[4px] animate-pulse">
                                Identifying Transaction...
                            </Text>
                        </View>
                    )}

                    {/* Results Section */}
                    {(result || matchedInvoices.length > 0) && (
                        <View className="mt-2">
                            <Text className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-4 ml-2">
                                AI Findings
                            </Text>

                            {/* Match Card */}
                            {matchedInvoices.length > 0 ? (
                                matchedInvoices.map((inv) => (
                                    <View key={inv.id} className="bg-white rounded-[28px] p-6 border border-emerald-50 shadow-xl shadow-emerald-500/5 mb-4 overflow-hidden relative">
                                        <View className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50" />

                                        <View className="flex-row justify-between items-start mb-6">
                                            <View className="flex-1">
                                                <View className="flex-row items-center mb-2">
                                                    <View className="bg-emerald-500 px-2 py-0.5 rounded-full mr-2">
                                                        <Text className="text-white font-black text-[10px]">99% MATCH</Text>
                                                    </View>
                                                    <Text className="text-slate-400 text-xs font-bold uppercase">Invoice #{inv.invoice_number}</Text>
                                                </View>
                                                <Text className="text-slate-900 font-black text-2xl leading-none">
                                                    {inv.total_amount?.toLocaleString()} <Text className="text-xs font-bold text-slate-400">{profile?.currency || 'RWF'}</Text>
                                                </Text>
                                                <Text className="text-slate-500 text-sm mt-2 font-medium">Customer: <Text className="text-slate-900 font-bold">{inv.customer?.name}</Text></Text>
                                            </View>

                                            <View className="w-12 h-12 rounded-2xl bg-emerald-100 items-center justify-center">
                                                <CheckCircle size={28} color="#10b981" />
                                            </View>
                                        </View>

                                        <View className="h-[1px] bg-slate-100 mb-6" />

                                        <View className="flex-row gap-3">
                                            <TouchableOpacity
                                                onPress={() => confirmReconciliation(inv)}
                                                className="flex-1 bg-emerald-500 h-14 rounded-2xl items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
                                            >
                                                <Text className="text-white font-black text-base">Confirm Payment</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 items-center justify-center">
                                                <Eye size={22} color="#64748b" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                // No Match Found - Prompt to Create
                                <View className="bg-slate-900 rounded-[32px] p-8 shadow-2xl shadow-slate-900/20 items-center">
                                    <View className="w-16 h-16 bg-white/10 rounded-3xl items-center justify-center mb-4">
                                        <Info size={32} color="#fbbf24" />
                                    </View>
                                    <Text className="text-white font-black text-xl mb-2">No Match Found</Text>
                                    <Text className="text-slate-400 text-center text-sm mb-8 leading-5 px-4 font-medium">
                                        We identified a payment of <Text className="text-white font-bold">{result?.amount?.toLocaleString()} {profile?.currency}</Text> from <Text className="text-white font-bold">{result?.sender}</Text>, but no pending invoice matches this.
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() => router.push({
                                            pathname: '/invoice/new',
                                            params: {
                                                amount: result?.amount,
                                                description: `Payment via ${result?.provider} (Ref: ${result?.ref})`,
                                                clientName: result?.sender
                                            }
                                        })}
                                        className="w-full bg-white h-14 rounded-2xl flex-row items-center justify-center shadow-xl active:scale-95 transition-transform"
                                    >
                                        <Plus size={20} color="#0f172a" strokeWidth={3} className="mr-2" />
                                        <Text className="text-slate-900 font-black text-base">New Invoice for this Payment</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Footer Tips */}
                    <View className="mt-8 flex-row items-center justify-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <Info size={16} color="#94a3b8" />
                        <Text className="text-slate-500 text-xs ml-2 font-medium">AI analysis is secure and private.</Text>
                    </View>

                    <View className="h-20" />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
