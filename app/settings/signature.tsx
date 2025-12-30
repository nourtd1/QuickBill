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
import { ArrowLeft, Trash2, Check, Info } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

function SignatureSettingScreen() {
    const router = useRouter();
    const { user, profile, refreshProfile } = useAuth();
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
            // 1. Préparer l'image (le canvas renvoie du base64 avec header data:image/png;base64,...)
            const base64Data = signature.replace('data:image/png;base64,', '');
            const filePath = `signatures/${user.id}.png`;

            // 2. Upload vers Supabase Storage (Bucket 'logos')
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, decode(base64Data), {
                    contentType: 'image/png',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // 3. Récupérer l'URL publique
            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath);

            // 4. Mettre à jour le profil
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
        body,html { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; }
        .m-signature-pad { border: none; box-shadow: none; margin: 0; }
    `;

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-100">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <ArrowLeft size={24} color="#334155" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900">Ma Signature</Text>
                </View>
                {loading && <ActivityIndicator color="#2563EB" />}
            </View>

            <View className="flex-1 p-6">
                <View className="bg-slate-50 p-4 rounded-2xl mb-6 flex-row items-center">
                    <Info size={18} color="#64748B" />
                    <Text className="text-slate-500 text-xs ml-2 flex-1">
                        Signez à l'intérieur de la zone ci-dessous. Cette signature sera ajoutée automatiquement au bas de vos factures.
                    </Text>
                </View>

                {/* Zone de Signature */}
                <View className="flex-1 border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden bg-white">
                    <SignatureScreen
                        ref={signatureRef}
                        onOK={handleOK}
                        onEmpty={handleEmpty}
                        webStyle={style}
                        autoClear={false}
                        descriptionText=""
                        bgWidth={Dimensions.get('window').width - 48}
                        bgHeight={Dimensions.get('window').height - 300}
                    />
                </View>

                {/* Boutons d'Action */}
                <View className="flex-row items-center space-x-4 mt-8">
                    <TouchableOpacity
                        onPress={handleClear}
                        disabled={loading}
                        className="flex-1 bg-slate-100 h-16 rounded-2xl flex-row items-center justify-center"
                    >
                        <Trash2 size={20} color="#64748B" className="mr-2" />
                        <Text className="text-slate-600 font-bold text-lg">Effacer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => signatureRef.current?.readSignature()}
                        disabled={loading}
                        className="flex-1 bg-blue-600 h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200"
                    >
                        <Check size={20} color="white" strokeWidth={3} className="mr-2" />
                        <Text className="text-white font-bold text-lg">Valider</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

export default SignatureSettingScreen;
