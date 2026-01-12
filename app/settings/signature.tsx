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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { X, Trash2, Check, PenTool } from 'lucide-react-native';
import { decode } from 'base64-arraybuffer';
import { StatusBar } from 'expo-status-bar';

function SignatureSettingScreen() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();
    const signatureRef = useRef<SignatureViewRef>(null);
    const [loading, setLoading] = useState(false);

    const handleEmpty = () => {
        Alert.alert('Signature vide', 'Veuillez dessiner votre signature avant de sauvegarder.');
    };

    const handleClear = () => {
        signatureRef.current?.clearSignature();
    };

    const handleOK = async (signature: string) => {
        if (!user) return;
        setLoading(true);

        try {
            const base64Data = signature.replace('data:image/png;base64,', '');
            const filePath = `signatures/${user.id}.png`;

            const { data: uploadData, error: uploadError } = await supabase.storage
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

            await refreshProfile();
            Alert.alert('Succès', 'Votre signature a été enregistrée avec succès.');
            router.back();
        } catch (error: any) {
            console.error('Erreur signature:', error);
            Alert.alert('Erreur', 'Impossible de sauvegarder la signature : ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const style = `
        .m-signature-pad--footer { display: none; margin: 0px; }
        body,html { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; background-color: transparent; }
        .m-signature-pad { border: none; box-shadow: none; margin: 0; background-color: transparent; }
    `;

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            {/* Header Modern Banker */}
            <View className="bg-primary pt-16 pb-8 px-6 rounded-b-[40px] shadow-lg z-10">
                <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()} disabled={loading} className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                        <X size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-black tracking-tight">Ma Signature</Text>
                    <View style={{ width: 40 }} />
                </View>
                <Text className="text-blue-100 text-center font-medium">Authentifiez vos documents officiels.</Text>
            </View>

            <View className="flex-1 px-4 pt-6 pb-8">

                {/* Information Card */}
                <View className="bg-white p-4 rounded-2xl mb-6 flex-row items-center justify-center border border-slate-100 shadow-sm">
                    <View className="bg-blue-50 p-2 rounded-lg mr-3">
                        <PenTool size={18} color="#1E40AF" />
                    </View>
                    <Text className="text-slate-500 text-xs font-bold text-center">
                        Dessinez votre signature dans la zone ci-dessous
                    </Text>
                </View>

                {/* Signature Pad */}
                <View className="flex-1 bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-200 relative mb-6">
                    {/* Background Pattern or Grid can be simulated here if needed, but keeping it clean white is better for signature */}
                    <SignatureScreen
                        ref={signatureRef}
                        onOK={handleOK}
                        onEmpty={handleEmpty}
                        webStyle={style}
                        autoClear={false}
                        descriptionText=""
                        bgWidth={Dimensions.get('window').width - 34} // Adjust for padding/borders
                        bgHeight={Dimensions.get('window').height - 400} // Approximate height
                        imageType="image/png"
                    />
                    <Text className="absolute bottom-4 self-center text-slate-200 text-xs font-bold uppercase pointer-events-none">Espace de Signature</Text>
                </View>

                {/* Action Buttons */}
                <View className="flex-row items-center space-x-4 mb-4" style={{ gap: 16 }}>
                    <TouchableOpacity
                        onPress={handleClear}
                        disabled={loading}
                        className="flex-1 bg-white h-16 rounded-2xl flex-row items-center justify-center border border-slate-200 shadow-sm active:bg-slate-50"
                    >
                        <Trash2 size={20} color="#64748B" className="mr-2" />
                        <Text className="text-slate-600 font-bold text-lg uppercase">Effacer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => signatureRef.current?.readSignature()}
                        disabled={loading}
                        className="flex-1 bg-primary h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200 active:bg-blue-700"
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Check size={20} color="white" strokeWidth={3} className="mr-2" />
                                <Text className="text-white font-black text-lg uppercase">Valider</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

export default SignatureSettingScreen;
