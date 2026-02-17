import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    X,
    Trash2,
    Check,
    PenTool,
    RotateCcw,
    Save,
    ArrowLeft
} from 'lucide-react-native';
import { decode } from 'base64-arraybuffer';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignatureSettingScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const signatureRef = useRef<SignatureViewRef>(null);
    const [loading, setLoading] = useState(false);
    const [signatureEmpty, setSignatureEmpty] = useState(true);

    const handleEmpty = () => {
        setSignatureEmpty(true);
    };

    const handleBegin = () => {
        setSignatureEmpty(false);
    };

    const handleClear = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        signatureRef.current?.clearSignature();
        setSignatureEmpty(true);
    };

    const handleConfirm = (signature: string) => {
        saveSignature(signature);
    };

    const saveSignature = async (base64Signature: string) => {
        if (!user) return;
        setLoading(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            const base64Data = base64Signature.replace('data:image/png;base64,', '');
            const filePath = `signatures/${user.id}_${Date.now()}.png`;

            // Note: Ensure you have a 'logos' or 'signatures' bucket created in Supabase
            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, decode(base64Data), {
                    contentType: 'image/png',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ signature_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            Alert.alert('Succès', 'Votre signature a été enregistrée.');
            router.back();
        } catch (error: any) {
            console.error('Erreur signature:', error);
            Alert.alert('Erreur', "Impossible de sauvegarder : " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // CSS for the WebView canvas
    const webStyle = `
        .m-signature-pad--footer { display: none; margin: 0px; }
        body,html { 
            width: 100%; 
            height: 100%; 
            margin: 0; 
            padding: 0; 
            background-color: transparent; 
        }
        .m-signature-pad { 
            border: none; 
            box-shadow: none; 
            margin: 0; 
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: transparent; 
        }
    `;

    return (
        <View className="flex-1 bg-[#F9FAFB]">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center px-4 py-2 mb-2">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
                        <ArrowLeft size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900">Ma Signature</Text>
                </View>

                {/* Content */}
                <View className="flex-1 px-6 pt-4">

                    {/* Info Card */}
                    <View className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex-row items-center mb-6">
                        <PenTool size={20} color="#2563EB" style={{ marginRight: 10 }} />
                        <Text className="text-blue-900 text-xs font-medium flex-1 leading-5">
                            Cette signature apparaîtra officiellement au bas de toutes vos factures et devis.
                        </Text>
                    </View>

                    {/* Canvas Container */}
                    <View className="flex-1 bg-white rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-200 mb-8 relative">
                        <SignatureScreen
                            ref={signatureRef}
                            onOK={handleConfirm}
                            onEmpty={handleEmpty}
                            onBegin={handleBegin}
                            webStyle={webStyle}
                            autoClear={false}
                            descriptionText=""
                            imageType="image/png"
                            minWidth={2}
                            maxWidth={4}
                        />

                        {signatureEmpty && (
                            <View className="absolute inset-0 items-center justify-center pointer-events-none">
                                <Text className="text-slate-200 text-3xl font-black uppercase tracking-widest opacity-40 select-none">
                                    Signez ici
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row gap-4 h-16 mb-4">
                        <TouchableOpacity
                            onPress={handleClear}
                            disabled={loading}
                            className="flex-1 bg-white rounded-2xl flex-row items-center justify-center border border-slate-200 shadow-sm active:bg-slate-50"
                        >
                            <RotateCcw size={20} color="#64748B" className="mr-2" />
                            <Text className="text-slate-600 font-bold text-sm uppercase tracking-wide">Effacer</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => signatureRef.current?.readSignature()}
                            disabled={loading}
                            className="flex-[1.5] bg-blue-600 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-300 active:scale-95 transition-transform"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text className="text-white font-black text-sm uppercase tracking-wide mr-2">Enregistrer</Text>
                                    <Check size={20} color="white" strokeWidth={3} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                </View>
            </SafeAreaView>
        </View>
    );
}
