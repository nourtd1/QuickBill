import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, Dimensions } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Camera as CameraIcon,
    Image as ImageIcon,
    CheckCircle,
    RefreshCw,
    Sparkles,
    Zap,
    X,
    FileText,
    ChevronRight,
    ShoppingBag
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { scanReceipt, ExtractedReceiptData } from '../../lib/ocr';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ScanReceiptScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ExtractedReceiptData | null>(null);
    const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
    const [isMounted, setIsMounted] = useState(true);

    useEffect(() => {
        setIsMounted(true);
        if (!permission?.granted) {
            requestPermission();
        }
        return () => setIsMounted(false);
    }, [permission]);

    const takePicture = async () => {
        if (cameraRef) {
            try {
                const photo = await cameraRef.takePictureAsync({ quality: 0.7, skipProcessing: true });
                if (isMounted && photo) {
                    await processImage(photo.uri);
                }
            } catch (e) {
                console.log("Camera error:", e);
            }
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });

        if (!result.canceled) {
            await processImage(result.assets[0].uri);
        }
    };

    const processImage = async (uri: string) => {
        setImageUri(uri);
        setScanning(true);
        setResult(null);

        try {
            const data = await scanReceipt(uri);
            setResult(data);
        } catch (e: any) {
            Alert.alert("Erreur", e.message || "Impossible d'analyser l'image.");
        } finally {
            setScanning(false);
        }
    };

    const handleConfirm = () => {
        if (!result) return;
        router.push({
            pathname: '/expenses/add',
            params: {
                merchant: result.merchant,
                amount: result.amount?.toString(),
                date: result.date,
                scanData: JSON.stringify(result)
            }
        });
    };

    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-900 px-8">
                <View className="bg-white/10 p-6 rounded-full mb-6">
                    <CameraIcon size={48} color="white" />
                </View>
                <Text className="text-white text-xl font-black text-center mb-2">Accès Caméra Requis</Text>
                <Text className="text-slate-400 text-center mb-8 font-medium">Nous avons besoin de votre caméra pour numériser vos tickets de caisse avec l'IA.</Text>
                <TouchableOpacity onPress={requestPermission} className="bg-blue-600 px-10 py-5 rounded-[24px] shadow-xl shadow-blue-500/30">
                    <Text className="text-white font-black uppercase tracking-widest">Autoriser l'accès</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <StatusBar style="light" />

            {/* Float Header */}
            <View className="absolute top-14 left-6 right-6 z-50 flex-row justify-between items-center">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 bg-black/40 rounded-[14px] items-center justify-center backdrop-blur-md border border-white/10"
                >
                    <ArrowLeft size={20} color="white" strokeWidth={3} />
                </TouchableOpacity>
                <View className="bg-black/40 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                    <Text className="text-white font-black text-[10px] uppercase tracking-widest">Scanner de Reçus IA</Text>
                </View>
                <View className="w-10" />
            </View>

            {!imageUri ? (
                <View className="flex-1">
                    <CameraView style={{ flex: 1 }} ref={(ref) => setCameraRef(ref)} />

                    {/* Camera Interface Overlay */}
                    <View className="absolute inset-x-10 top-[25%] bottom-[35%] border-2 border-white/30 rounded-[40px] border-dashed items-center justify-center">
                        <View className="bg-white/10 p-6 rounded-full">
                            <Zap size={32} color="white" opacity={0.5} />
                        </View>
                    </View>

                    <SafeAreaView className="absolute inset-0 justify-end pb-12 px-10" pointerEvents="box-none">
                        <View className="flex-row justify-between items-center">
                            <TouchableOpacity onPress={pickImage} className="w-14 h-14 bg-white/10 rounded-[20px] items-center justify-center backdrop-blur-md border border-white/20">
                                <ImageIcon size={24} color="white" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={takePicture}
                                className="w-24 h-24 bg-white/20 rounded-full items-center justify-center border-4 border-white/30"
                                activeOpacity={0.8}
                            >
                                <View className="w-18 h-18 bg-white rounded-full p-2">
                                    <View className="w-full h-full rounded-full border-4 border-slate-900 bg-white" />
                                </View>
                            </TouchableOpacity>

                            <View className="w-14 h-14 items-center justify-center">
                                <Sparkles size={24} color="white" opacity={0.6} strokeWidth={2.5} />
                            </View>
                        </View>
                        <Text className="text-white/60 text-center mt-8 font-black text-[9px] uppercase tracking-[3px]">Placez le ticket au centre</Text>
                    </SafeAreaView>
                </View>
            ) : (
                <View className="flex-1 bg-slate-950">
                    <Image source={{ uri: imageUri }} className="flex-1 opacity-60" resizeMode="cover" />

                    <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[48px] shadow-2xl overflow-hidden" style={{ maxHeight: SCREEN_HEIGHT * 0.85 }}>
                        <SafeAreaView edges={['bottom']} className="py-2">
                            {/* Drag Indicator */}
                            <View className="items-center py-3">
                                <View className="w-12 h-1.5 bg-slate-100 rounded-full" />
                            </View>

                            <ScrollView className="px-8" showsVerticalScrollIndicator={false}>
                                {scanning ? (
                                    <View className="items-center py-16">
                                        <LinearGradient
                                            colors={['#3B82F6', '#1E40AF']}
                                            className="w-20 h-20 rounded-[28px] items-center justify-center shadow-xl shadow-blue-500/30 mb-8"
                                        >
                                            <ActivityIndicator color="white" size="large" />
                                        </LinearGradient>
                                        <Text className="text-slate-900 font-black text-2xl tracking-tight text-center">IA en action...</Text>
                                        <Text className="text-slate-400 font-bold text-center mt-3 leading-6 px-4">
                                            Nous analysons chaque détail de votre ticket pour automatiser la saisie.
                                        </Text>
                                    </View>
                                ) : result ? (
                                    <View className="pb-10 pt-2">
                                        {/* Status Chip */}
                                        <View className="bg-emerald-50 self-center px-4 py-1.5 rounded-full border border-emerald-100 flex-row items-center mb-8">
                                            <CheckCircle size={14} color="#10B981" strokeWidth={3} />
                                            <Text className="text-emerald-600 font-black text-[10px] uppercase tracking-widest ml-2">Données Extraites</Text>
                                        </View>

                                        {/* Main Result Card */}
                                        <View className="items-center mb-10">
                                            <View className="bg-slate-50 w-20 h-20 rounded-[24px] items-center justify-center mb-4 border border-slate-100">
                                                <ShoppingBag size={32} color="#1E40AF" />
                                            </View>
                                            <Text className="text-slate-900 font-black text-3xl text-center px-4" numberOfLines={2}>
                                                {result.merchant || 'Marchand Identifié'}
                                            </Text>
                                            <Text className="text-slate-400 font-extrabold text-[10px] uppercase tracking-[2px] mt-2">
                                                {result.date || 'Date non détectée'}
                                            </Text>
                                        </View>

                                        {/* Amount Display */}
                                        <LinearGradient
                                            colors={['#1E40AF', '#1e3a8a']}
                                            className="p-6 rounded-[32px] flex-row items-center justify-between mb-8 shadow-xl shadow-blue-500/20"
                                        >
                                            <View>
                                                <Text className="text-blue-200/60 text-[8px] font-black uppercase tracking-widest mb-1">Total TTC</Text>
                                                <Text className="text-white font-black text-3xl">
                                                    {result.amount?.toLocaleString()} <Text className="text-base text-blue-200/40">{result.currency}</Text>
                                                </Text>
                                            </View>
                                            <View className="bg-white px-4 py-2 rounded-2xl">
                                                <Text className="text-blue-900 font-black text-[10px] uppercase tracking-widest">OK</Text>
                                            </View>
                                        </LinearGradient>

                                        {/* Items Section */}
                                        {result.items && result.items.length > 0 && (
                                            <View className="mb-10">
                                                <Text className="text-slate-900 font-black text-xs uppercase tracking-widest mb-4 ml-1">Lignes du ticket</Text>
                                                <View className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                                                    {result.items.map((item, idx) => (
                                                        <View key={idx} className={`flex-row justify-between items-center py-3 ${idx !== result.items!.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                                            <Text className="text-slate-600 font-black text-sm flex-1 mr-4" numberOfLines={1}>{item.description}</Text>
                                                            <Text className="text-slate-900 font-black text-sm">{item.amount.toLocaleString()}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}

                                        {/* Action Buttons */}
                                        <View className="gap-4">
                                            <TouchableOpacity
                                                onPress={handleConfirm}
                                                activeOpacity={0.9}
                                                className="shadow-2xl shadow-blue-500/20"
                                            >
                                                <LinearGradient
                                                    colors={['#1E40AF', '#1e3a8a']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    className="h-16 rounded-[24px] items-center justify-center flex-row"
                                                >
                                                    <Text className="text-white font-black text-base uppercase tracking-wider mr-3">Enregistrer</Text>
                                                    <ChevronRight size={20} color="white" strokeWidth={3} />
                                                </LinearGradient>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => setImageUri(null)}
                                                className="py-5 items-center bg-slate-100 rounded-[22px]"
                                            >
                                                <Text className="text-slate-500 font-black text-[10px] uppercase tracking-[2px]">Reprendre la photo</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <View className="items-center py-16">
                                        <View className="bg-red-50 p-8 rounded-full mb-8">
                                            <RefreshCw size={48} color="#EF4444" strokeWidth={1.5} />
                                        </View>
                                        <Text className="text-slate-900 font-black text-2xl tracking-tight">Analyse Impossible</Text>
                                        <Text className="text-slate-400 font-bold text-center mt-3 leading-6 px-10">
                                            Nous n'avons pas pu lire ce ticket. Assurez-vous d'avoir un bon éclairage et que le texte soit net.
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setImageUri(null)}
                                            className="mt-10 bg-slate-900 w-full py-5 rounded-[24px] items-center shadow-xl shadow-slate-300"
                                        >
                                            <Text className="text-white font-black uppercase tracking-widest text-xs">Réessayer</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </ScrollView>
                        </SafeAreaView>
                    </View>
                </View>
            )}
        </View>
    );
}
