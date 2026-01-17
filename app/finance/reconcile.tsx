import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
    Dimensions
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    ArrowLeft,
    CheckCircle,
    Smartphone,
    Search,
    ScanLine,
    FileText,
    Check,
    Sparkles,
    Zap,
    MessageSquare,
    ArrowUpRight,
    ArrowRight,
    Info
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
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
        <View className="flex-1 bg-slate-50">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <LinearGradient
                colors={['#1E40AF', '#1e3a8a']}
                className="pt-14 pb-10 px-6 rounded-b-[42px] shadow-2xl z-10"
            >
                <View className="flex-row justify-between items-center mb-6">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white/10 rounded-[14px] items-center justify-center border border-white/20"
                    >
                        <ArrowLeft size={20} color="white" strokeWidth={3} />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-xl font-black text-white tracking-tight">Vérification</Text>
                        <Text className="text-blue-200/60 text-[9px] font-black uppercase tracking-[2px] mt-0.5">Mobile Money IA</Text>
                    </View>
                    <TouchableOpacity className="w-10 h-10 bg-white/10 rounded-[14px] items-center justify-center border border-white/20">
                        <Zap size={20} color="white" strokeWidth={2.5} />
                    </TouchableOpacity>
                </View>

                {/* AI Assistant Banner */}
                <View className="bg-white/10 p-4 rounded-[24px] border border-white/15 backdrop-blur-md flex-row items-center">
                    <View className="w-10 h-10 bg-indigo-500 rounded-xl items-center justify-center shadow-lg">
                        <Sparkles size={20} color="white" strokeWidth={2.5} />
                    </View>
                    <View className="ml-4 flex-1">
                        <Text className="text-white font-black text-sm">Assistant Intelligent</Text>
                        <Text className="text-blue-200/60 text-[8px] font-bold uppercase tracking-widest">Réconciliez vos factures par SMS</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
            >
                {/* SMS Input Section */}
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-2">Preuve de paiement</Text>
                <View className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-6">
                    <View className="flex-row items-center mb-4">
                        <Smartphone size={20} color="#1E40AF" strokeWidth={2.5} className="mr-3" />
                        <Text className="text-slate-900 font-black text-base">Message Mobile Money</Text>
                    </View>
                    <TextInput
                        className="text-slate-800 text-base min-h-[120px] bg-slate-50 p-4 rounded-2xl border border-slate-100"
                        multiline
                        placeholder="Collez le SMS de confirmation reçu ici..."
                        value={smsText}
                        onChangeText={setSmsText}
                        placeholderTextColor="#CBD5E1"
                        textAlignVertical="top"
                    />
                    <TouchableOpacity onPress={runDemoMatch} className="mt-4 flex-row items-center self-end">
                        <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest mr-2">Essayer avec une démo</Text>
                        <ArrowRight size={12} color="#2563EB" strokeWidth={3} />
                    </TouchableOpacity>
                </View>

                {/* Analyze Button */}
                <TouchableOpacity
                    onPress={handleAnalyze}
                    className="bg-slate-900 rounded-[28px] py-5 items-center justify-center shadow-xl shadow-slate-300 mb-10 overflow-hidden"
                    disabled={analyzing}
                >
                    {analyzing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <View className="flex-row items-center">
                            <Zap size={20} color="white" strokeWidth={2.5} className="mr-3" />
                            <Text className="text-white font-black text-lg uppercase tracking-wider">Trouver la Facture</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Analysis Results */}
                {result && (
                    <View className="mt-4">
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-2">Rapport d'analyse IA</Text>

                        <LinearGradient
                            colors={['#3B82F6', '#1E40AF']}
                            className="p-6 rounded-[32px] shadow-xl shadow-blue-200 mb-8 flex-row justify-between items-center"
                        >
                            <View>
                                <Text className="text-blue-100/60 text-[8px] font-black uppercase tracking-widest mb-1">Montant Détecté</Text>
                                <Text className="text-white font-black text-3xl">{result.amount?.toLocaleString()} <Text className="text-base text-blue-200/60 font-medium">{profile?.currency || 'RWF'}</Text></Text>
                                <View className="flex-row items-center mt-2">
                                    <View className="bg-white/20 px-2 py-0.5 rounded-lg mr-2">
                                        <Text className="text-white text-[8px] font-black">{result.provider}</Text>
                                    </View>
                                    <Text className="text-blue-100 text-[10px] font-bold">Réf: {result.ref}</Text>
                                </View>
                            </View>
                            <View className="bg-white/20 p-4 rounded-3xl">
                                <CheckCircle size={32} color="white" strokeWidth={2.5} />
                            </View>
                        </LinearGradient>

                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-2">Correspondances ({matchedInvoices.length})</Text>

                        {matchedInvoices.length > 0 ? (
                            matchedInvoices.map((inv) => (
                                <View key={inv.id} className="bg-white p-6 rounded-[32px] border border-indigo-100 shadow-xl shadow-indigo-100/20 mb-6">
                                    <View className="flex-row items-center mb-6">
                                        <View className="w-12 h-12 bg-indigo-50 rounded-2xl items-center justify-center mr-4">
                                            <Sparkles size={24} color="#4F46E5" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-slate-900 font-black text-lg leading-tight">
                                                Trouvé !
                                            </Text>
                                            <Text className="text-slate-400 text-xs font-bold">Facture #{inv.invoice_number}</Text>
                                        </View>
                                    </View>

                                    <View className="bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-100">
                                        <View className="flex-row justify-between items-center mb-2">
                                            <Text className="text-slate-400 text-[8px] font-black uppercase tracking-widest">Client</Text>
                                            <Text className="text-slate-400 text-[8px] font-black uppercase tracking-widest">Montant</Text>
                                        </View>
                                        <View className="flex-row justify-between items-end">
                                            <Text className="text-slate-900 font-black text-base flex-1 mr-4">{inv.customer?.name}</Text>
                                            <Text className="text-slate-900 font-black text-xl">{inv.total_amount?.toLocaleString()}</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row gap-3">
                                        <TouchableOpacity
                                            onPress={() => confirmReconciliation(inv)}
                                            className="flex-1 bg-emerald-500 py-4 rounded-2xl items-center shadow-lg shadow-emerald-200 active:scale-95 transition-all"
                                        >
                                            <Text className="text-white font-black text-xs uppercase tracking-widest">Valider le paiement</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            className="p-4 bg-slate-100 rounded-2xl active:bg-slate-200"
                                            onPress={() => {
                                                Alert.alert("Ignoré", "Cette facture ne sera pas marquée comme payée.");
                                                setMatchedInvoices([]);
                                            }}
                                        >
                                            <ArrowLeft size={20} color="#64748B" strokeWidth={3} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View className="bg-white p-10 rounded-[32px] items-center justify-center border border-dashed border-slate-200">
                                <Info size={40} color="#CBD5E1" strokeWidth={1.5} className="mb-4" />
                                <Text className="text-slate-400 font-bold text-center">Aucune facture en attente ne correspond à ce montant.</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
