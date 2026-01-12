import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera as CameraIcon, Image as ImageIcon, CheckCircle, RefreshCw } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { scanReceipt, ExtractedReceiptData } from '../../lib/ocr';
import { SafeAreaView } from 'react-native-safe-area-context';

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
                // Ensure we don't crash if unmounted
                const photo = await cameraRef.takePictureAsync({ quality: 0.7, skipProcessing: true });
                if (isMounted && photo) {
                    await processImage(photo.uri);
                }
            } catch (e) {
                console.log("Camera error (possibly unmounted):", e);
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
            Alert.alert("Erreur", e.message || "Ne peut pas analyser l'image.");
        } finally {
            setScanning(false);
        }
    };

    const handleConfirm = () => {
        if (!result) return;
        // Navigate to Expense Form with pre-filled data
        router.push({
            pathname: '/expenses/add',
            params: {
                merchant: result.merchant,
                amount: result.amount?.toString(),
                date: result.date,
                scanData: JSON.stringify(result) // Pass full object just in case
            }
        });
    };

    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-900">
                <Text className="text-white text-center mb-4">Permission caméra requise</Text>
                <TouchableOpacity onPress={requestPermission} className="bg-blue-600 px-6 py-3 rounded-xl">
                    <Text className="text-white font-bold">Autoriser</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <StatusBar style="light" />

            {/* Header */}
            <View className="absolute top-12 left-6 z-50">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center backdrop-blur-md">
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
            </View>

            {!imageUri ? (
                <CameraView style={{ flex: 1 }} ref={(ref) => setCameraRef(ref)}>
                    <View className="flex-1 justify-end pb-12 px-6">
                        <View className="flex-row justify-between items-center">
                            <TouchableOpacity onPress={pickImage} className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center backdrop-blur-md">
                                <ImageIcon size={24} color="white" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={takePicture} className="w-20 h-20 bg-white rounded-full items-center justify-center border-4 border-slate-200">
                                <View className="w-16 h-16 bg-white rounded-full border-2 border-slate-900" />
                            </TouchableOpacity>

                            <View className="w-14" />
                        </View>
                        <Text className="text-white text-center mt-6 font-medium tracking-wide">Scanner un reçu</Text>
                    </View>
                </CameraView>
            ) : (
                <View className="flex-1 bg-slate-900">
                    <Image source={{ uri: imageUri }} className="flex-1 opacity-40" resizeMode="cover" />

                    {/* Modern Bottom Sheet Result */}
                    <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-2xl max-h-[85%] flex-1">
                        <SafeAreaView edges={['bottom']} className="flex-1">
                            {/* Sheet Handle */}
                            <View className="items-center pt-4 pb-2">
                                <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
                            </View>

                            <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false}>
                                {scanning ? (
                                    <View className="items-center py-12">
                                        <ActivityIndicator size="large" color="#2563EB" />
                                        <Text className="mt-6 text-slate-800 font-extrabold text-2xl tracking-tight">Analyse IA...</Text>
                                        <Text className="text-slate-500 font-medium text-center mt-2 px-8">
                                            Nous identifions le marchand, la date et les articles.
                                        </Text>
                                    </View>
                                ) : result ? (
                                    <View className="pb-8">
                                        {/* Success Header */}
                                        <View className="flex-row items-center justify-center mb-6 bg-green-50 self-center px-4 py-2 rounded-full border border-green-100">
                                            <CheckCircle size={16} color="#16A34A" strokeWidth={3} />
                                            <Text className="text-green-700 font-bold ml-2 text-xs uppercase tracking-wide">Scan Réussi</Text>
                                        </View>

                                        {/* Merchant & Price */}
                                        <View className="items-center mb-8">
                                            <Text className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-2">Total à payer</Text>
                                            <Text className="text-slate-900 font-black text-5xl tracking-tighter mb-4">
                                                {result.amount?.toLocaleString()} <Text className="text-2xl text-slate-400">{result.currency}</Text>
                                            </Text>
                                            <Text className="text-slate-800 font-bold text-xl text-center px-4">
                                                {result.merchant || 'Marchand Inconnu'}
                                            </Text>
                                            <Text className="text-slate-400 font-medium text-sm mt-1">
                                                {result.date}
                                            </Text>
                                        </View>

                                        {/* Divider */}
                                        <View className="h-[1px] bg-slate-100 my-4 mx-4" />

                                        {/* Items List (if any) */}
                                        {result.items && result.items.length > 0 && (
                                            <View className="mb-8">
                                                <Text className="text-slate-900 font-bold text-sm mb-4">Détails du ticket</Text>
                                                {result.items.map((item, idx) => (
                                                    <View key={idx} className="flex-row justify-between items-center py-2.5 border-b border-slate-50">
                                                        <Text className="text-slate-600 font-medium flex-1 mr-4" numberOfLines={1}>{item.description}</Text>
                                                        <Text className="text-slate-900 font-bold">{item.amount.toLocaleString()}</Text>
                                                    </View>
                                                ))}
                                                {result.tax && (
                                                    <View className="flex-row justify-between items-center py-3 mt-2">
                                                        <Text className="text-slate-400 font-bold text-xs uppercase">TVA (Est.)</Text>
                                                        <Text className="text-slate-600 font-bold text-xs">{result.tax.toLocaleString()}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}

                                        {/* Actions */}
                                        <View className="gap-3">
                                            <TouchableOpacity
                                                onPress={handleConfirm}
                                                className="bg-slate-900 py-4 rounded-[20px] flex-row justify-center items-center shadow-lg shadow-slate-300"
                                            >
                                                <Text className="text-white font-black text-lg">Confirmer la Dépense</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => setImageUri(null)}
                                                className="py-4 items-center bg-slate-50 rounded-[20px] border border-slate-100"
                                            >
                                                <Text className="text-slate-600 font-bold">Scanner un autre ticket</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <View className="items-center py-10">
                                        <View className="bg-red-50 p-6 rounded-full mb-6">
                                            <RefreshCw size={40} color="#EF4444" />
                                        </View>
                                        <Text className="text-slate-900 font-bold text-xl mb-2 text-center">Échec de l'analyse</Text>
                                        <Text className="text-slate-500 text-center px-6 mb-8">
                                            Nous n'avons pas pu extraire les données. Essayez de reprendre la photo avec un meilleur éclairage.
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setImageUri(null)}
                                            className="bg-slate-900 px-8 py-4 rounded-xl w-full"
                                        >
                                            <Text className="text-white font-bold text-center">Réessayer</Text>
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
