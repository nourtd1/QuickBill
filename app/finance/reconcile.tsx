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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
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
            Alert.alert("Succès", "Facture marquée comme payée !");
            router.back();
        } catch (e: any) {
            Alert.alert("Erreur", e.message);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />

            <View className="flex-1 px-6 pt-2">
                {/* Header */}
                <View className="flex-row justify-between items-center mb-8 mt-2">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-12 h-12 bg-white rounded-full items-center justify-center border border-slate-100 shadow-sm"
                    >
                        <ArrowLeft size={24} color="#1e293b" />
                    </TouchableOpacity>

                    <View className="flex-row items-center">
                        <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center mr-2">
                            <Sparkles size={16} color="#7c3aed" fill="#7c3aed" />
                        </View>
                        <Text className="text-lg font-bold text-slate-900">AI Reconciler</Text>
                    </View>

                    <TouchableOpacity
                        className="w-12 h-12 bg-white rounded-full items-center justify-center border border-slate-100 shadow-sm"
                    >
                        <History size={24} color="#64748b" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Title Section */}
                    <Text className="text-3xl font-bold text-[#4f46e5] text-center mb-2">
                        Reconcile Payments
                    </Text>
                    <Text className="text-slate-400 text-center text-sm px-6 mb-10 leading-5">
                        Paste your SMS confirmation below to instantly match it with an open invoice.
                    </Text>

                    {/* Input Section */}
                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3 ml-1">
                        PASTE PAYMENT SMS
                    </Text>

                    <View className="bg-white rounded-[24px] p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-50 mb-8 relative">
                        <TextInput
                            className="text-slate-700 text-base min-h-[160px] pb-10"
                            multiline
                            placeholder="e.g. You have received $50.00 from Sarah L. for Invoice #INV-2024 via Mobile Money..."
                            placeholderTextColor="#cbd5e1"
                            value={smsText}
                            onChangeText={setSmsText}
                            textAlignVertical="top"
                            style={{ lineHeight: 24 }}
                        />

                        <TouchableOpacity
                            onPress={handlePaste}
                            className="absolute bottom-4 right-4 bg-purple-50 px-4 py-2 rounded-xl flex-row items-center border border-purple-100"
                        >
                            <ClipboardIcon size={16} color="#7c3aed" className="mr-2" />
                            <Text className="text-purple-600 font-bold text-xs">Paste</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Analyze Button */}
                    <TouchableOpacity
                        onPress={handleAnalyze}
                        disabled={analyzing}
                        className="w-full h-16 rounded-[20px] overflow-hidden shadow-xl shadow-indigo-500/20 mb-10 active:opacity-90"
                    >
                        <LinearGradient
                            colors={['#4f46e5', '#7c3aed']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="w-full h-full items-center justify-center flex-row"
                        >
                            {analyzing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Sparkles size={20} color="white" fill="white" className="mr-3" />
                                    <Text className="text-white font-bold text-lg">Analyze with AI</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Results Section */}
                    {(result || matchedInvoices.length > 0) && (
                        <View>
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="h-[1px] bg-slate-100 flex-1" />
                                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mx-4">
                                    ANALYSIS RESULTS
                                </Text>
                                <View className="h-[1px] bg-slate-100 flex-1" />
                            </View>

                            {/* Match Card */}
                            {matchedInvoices.length > 0 ? (
                                matchedInvoices.map((inv) => (
                                    <View key={inv.id} className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] mb-4 overflow-hidden relative">
                                        {/* Green Indicator Line */}
                                        <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#10b981]" />

                                        <View className="flex-row justify-between items-start mb-4 pl-3">
                                            <View>
                                                <View className="flex-row items-center mb-1">
                                                    <View className="w-5 h-5 rounded-full bg-emerald-100 items-center justify-center mr-2">
                                                        <Check size={12} color="#10b981" strokeWidth={3} />
                                                    </View>
                                                    <Text className="text-[#10b981] font-bold text-xs tracking-wide">MATCH FOUND!</Text>
                                                </View>
                                                <Text className="text-slate-900 font-bold text-xl mb-0.5">Invoice #{inv.invoice_number}</Text>
                                                <Text className="text-slate-400 text-xs font-medium">Client: {inv.customer?.name}</Text>
                                            </View>

                                            <View className="items-end">
                                                <Text className="text-slate-900 font-black text-2xl">
                                                    {inv.total_amount?.toLocaleString()} <Text className="text-sm font-bold text-slate-400">{profile?.currency || 'USD'}</Text>
                                                </Text>
                                                <View className="bg-slate-100 px-2 py-1 rounded-md mt-1">
                                                    <Text className="text-slate-500 text-[10px] font-bold">{result?.provider || 'Mobile Money'}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View className="flex-row gap-3 pl-3">
                                            <TouchableOpacity
                                                onPress={() => confirmReconciliation(inv)}
                                                className="flex-1 bg-[#10b981] h-12 rounded-xl items-center justify-center shadow-lg shadow-emerald-500/20 active:bg-emerald-600"
                                            >
                                                <Text className="text-white font-bold text-sm">Valider le paiement</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity className="w-12 h-12 rounded-xl border border-slate-200 items-center justify-center active:bg-slate-50">
                                                <Eye size={20} color="#64748b" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                // No Match Found - Prompt to Create
                                <View className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] items-center text-center">
                                    <View className="w-12 h-12 bg-amber-50 rounded-full items-center justify-center mb-3">
                                        <Info size={24} color="#f59e0b" />
                                    </View>
                                    <Text className="text-slate-900 font-bold text-lg mb-2">No exact match found</Text>
                                    <Text className="text-slate-500 text-center text-sm mb-6 leading-5">
                                        We found a payment of <Text className="font-bold text-slate-700">{result?.amount?.toLocaleString()} {profile?.currency}</Text> but no pending invoice matches this amount.
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() => router.push({
                                            pathname: '/invoice/new',
                                            params: {
                                                amount: result?.amount,
                                                description: `Paiement reçu via ${result?.provider} (Ref: ${result?.ref})`,
                                                clientName: result?.sender
                                            }
                                        })}
                                        className="w-full bg-slate-900 h-12 rounded-xl flex-row items-center justify-center shadow-lg active:scale-[0.99]"
                                    >
                                        <Plus size={18} color="white" className="mr-2" />
                                        <Text className="text-white font-bold text-sm">Create Invoice for this Payment</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Add some bottom padding for scroll */}
                    <View className="h-10" />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
