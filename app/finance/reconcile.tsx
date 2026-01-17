import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, CheckCircle, Smartphone, Search, ScanLine, FileText, Check, Sparkles } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { processAudioWithGemini } from '../../lib/gemini'; // Re-use gemini logic if we want, or create text helper
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

// Helper to ask Gemini to parse Payment SMS
async function parsePaymentSMSWithGemini(text: string) {
    // We can reuse the same gemini endpoint but for text
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
    const { user } = useAuth();
    const [smsText, setSmsText] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [matchedInvoices, setMatchedInvoices] = useState<any[]>([]);

    // Quick Presets for Demo
    const demoSMS = "Paiement reçu de 150000 RWF de Jean Dupont via MTN Mobile Money. Ref: XJ89230. 16/01/2026.";

    const runDemoMatch = () => {
        setSmsText(demoSMS);
        setResult({
            amount: 150000,
            sender: "DEMO Jean Dupont",
            provider: "MTN Mobile Money",
            ref: "DEMO123"
        });
        setMatchedInvoices([{
            id: 'demo-id',
            customer: { name: 'Jean Dupont' },
            total_amount: 150000,
            invoice_number: 'DEMO-001'
        }]);
    };

    const handleAnalyze = async () => {
        if (!smsText.trim()) return;
        setAnalyzing(true);
        setResult(null);
        setMatchedInvoices([]);

        try {
            // 1. AI Analysis
            const extracted = await parsePaymentSMSWithGemini(smsText);
            setResult(extracted);

            if (extracted?.amount) {
                // 2. Find matching pending invoices
                const { data: invoices } = await supabase
                    .from('invoices')
                    .select('*, customer:customers(*)')
                    .eq('status', 'PENDING') // Only pending
                    .eq('user_id', user?.id)
                    .order('created_at', { ascending: false });

                // Simple matching logic
                if (invoices) {
                    const matches = invoices.filter(inv => {
                        // Check exact amount match
                        const amountMatch = Math.abs(inv.total_amount - extracted.amount) < 100; // Tolerance
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
            // Handle Demo Mode
            if (invoice.id === 'demo-id') {
                Alert.alert("Mode Démo", "Paiement simulé validé avec succès ! ✅");
                setMatchedInvoices([]);
                setResult(null);
                setSmsText('');
                return;
            }

            const { error } = await supabase
                .from('invoices')
                .update({
                    status: 'PAID',
                    // payment_method: result?.provider || 'MOBILE_MONEY', // Add this column to Supabase to enable
                    // notes: `Réconcilié via SMS Ref: ${result?.ref}`      // Add this column to Supabase to enable
                })
                .eq('id', invoice.id);

            if (error) throw error;
            Alert.alert("Succès", "Facture marquée comme payée !");
            router.back();
        } catch (e: any) {
            Alert.alert("Erreur", e.message);
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />

            {/* Header */}
            <View className="pt-14 pb-4 px-6 bg-white border-b border-slate-100 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full bg-slate-50">
                    <ArrowLeft size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-slate-900">Réconciliation Mobile Money</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6 pt-6">

                <Text className="text-slate-500 mb-2 font-medium">Message de confirmation de paiement (SMS)</Text>
                <View className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4">
                    <TextInput
                        className="text-slate-800 text-base min-h-[100px]"
                        multiline
                        placeholder="Collez le SMS ici (ex: Vous avez reçu 50.000 F...)"
                        value={smsText}
                        onChangeText={setSmsText}
                        textAlignVertical="top"
                    />
                    {/* Demo Button */}
                    <TouchableOpacity onPress={runDemoMatch} className="mt-2 self-end">
                        <Text className="text-blue-600 text-xs font-bold">Voir le résultat</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Action Button */}
                <TouchableOpacity
                    onPress={handleAnalyze}
                    className="bg-slate-900 rounded-2xl py-4 items-center justify-center shadow-lg shadow-slate-300 mb-8"
                    disabled={analyzing}
                >
                    {analyzing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <View className="flex-row items-center">
                            <ContextSearch size={20} color="white" className="mr-2" />
                            <Text className="text-white font-bold text-lg">Analyser & Trouver la Facture</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Results Area */}
                {result && (
                    <View className="mb-8">
                        <Text className="text-slate-900 font-bold text-lg mb-4">Résultat Analyse</Text>

                        {/* Extracted Data Card */}
                        <View className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6 flex-row justify-between items-center">
                            <View>
                                <Text className="text-blue-500 text-xs font-bold uppercase mb-1">Montant Reçu</Text>
                                <Text className="text-slate-900 font-black text-2xl">{result.amount?.toLocaleString()} <Text className="text-sm text-slate-500">RWF</Text></Text>
                                <Text className="text-slate-500 text-xs mt-1">De: {result.sender} • {result.provider}</Text>
                            </View>
                            <View className="bg-white p-3 rounded-full shadow-sm">
                                <CheckCircle size={24} color="#3B82F6" />
                            </View>
                        </View>

                        {/* Matches */}
                        <Text className="text-slate-900 font-bold text-lg mb-4">Factures Correspondantes ({matchedInvoices.length})</Text>


                        {matchedInvoices.length > 0 ? (
                            matchedInvoices.map((inv) => (
                                <View key={inv.id} className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-100 mb-6">

                                    {/* AI Message Bubble */}
                                    <View className="flex-row items-start mb-6">
                                        <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center mr-3">
                                            <Sparkles size={20} color="#4F46E5" />
                                        </View>
                                        <View className="flex-1 bg-slate-50 p-4 rounded-xl rounded-tl-none border border-slate-100">
                                            <Text className="text-slate-800 text-base leading-6">
                                                J'ai trouvé une facture qui correspond ! C'est celle de <Text className="font-bold">{inv.customer?.name}</Text> ({inv.total_amount?.toLocaleString()}).
                                                {"\n\n"}Veux-tu la marquer comme payée ?
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Action Buttons */}
                                    <View className="flex-row gap-4">
                                        <TouchableOpacity
                                            onPress={() => confirmReconciliation(inv)}
                                            className="flex-1 bg-green-500 py-4 rounded-xl items-center shadow-lg shadow-green-200 active:scale-95 transform transition-all"
                                        >
                                            <Text className="text-white font-black text-lg">OUI</Text>
                                            <Text className="text-green-100 text-xs font-bold">Confirmer</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            className="flex-1 bg-white border-2 border-slate-200 py-4 rounded-xl items-center active:bg-slate-50"
                                            onPress={() => {
                                                // Just visual feedback for now, or clear match
                                                Alert.alert("D'accord", "Je continue de chercher...");
                                                setMatchedInvoices([]);
                                            }}
                                        >
                                            <Text className="text-slate-400 font-bold text-lg">NON</Text>
                                            <Text className="text-slate-300 text-xs font-bold">Ignorer</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View className="bg-slate-100 p-6 rounded-2xl items-center justify-center border-2 border-dashed border-slate-200">
                                <Text className="text-slate-500 font-medium text-center">Aucune facture ne correspond à ce montant...</Text>
                            </View>
                        )}

                    </View>
                )}
            </ScrollView>
        </View>
    );
}

// Icon helper
function ContextSearch(props: any) {
    return <Search {...props} />
}
