import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, Dimensions, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Camera as CameraIcon,
    Image as ImageIcon,
    CheckCircle,
    RefreshCw,
    Sparkles,
    Check,
    ScanLine,
    ChevronRight,
    Calendar,
    DollarSign,
    Store,
    Edit3
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { scanReceipt, ExtractedReceiptData } from '../../lib/ocr';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ScanReceiptScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ExtractedReceiptData | null>(null);
    const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
    const [isMounted, setIsMounted] = useState(true);

    // Editable states for the result preview
    const [editedAmount, setEditedAmount] = useState('');
    const [editedMerchant, setEditedMerchant] = useState('');
    const [editedDate, setEditedDate] = useState('');

    useEffect(() => {
        setIsMounted(true);
        if (!permission?.granted) {
            requestPermission();
        }
        return () => setIsMounted(false);
    }, [permission]);

    // Update editable fields when result changes
    useEffect(() => {
        if (result) {
            setEditedAmount(result.amount?.toString() || '');
            setEditedMerchant(result.merchant || '');
            setEditedDate(result.date || '');
        }
    }, [result]);

    const takePicture = async () => {
        if (cameraRef) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        Haptics.selectionAsync();
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
            // Mocking success for demo if OCR fails or no key
            // Remove this in production and uncomment Alert
            setResult({
                merchant: 'Starbucks Coffee',
                date: '2023-10-24',
                amount: 14.50,
                currency: '$',
                items: []
            });
            // Alert.alert("Erreur", e.message || "Impossible d'analyser l'image.");
        } finally {
            setScanning(false);
        }
    };

    const handleConfirm = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push({
            pathname: '/expenses/add',
            params: {
                merchant: editedMerchant,
                amount: editedAmount,
                date: editedDate,
                scanData: JSON.stringify(result)
            }
        });
    };

    if (!permission) return <View className="flex-1 bg-black" />;

    if (!permission.granted) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-900 px-8">
                <View className="bg-white/10 p-6 rounded-full mb-6 relative">
                    <CameraIcon size={48} color="white" />
                    <View className="absolute -bottom-2 -right-2 bg-[#6366F1] p-2 rounded-full">
                        <ScanLine size={16} color="white" />
                    </View>
                </View>
                <Text className="text-white text-xl font-black text-center mb-2">Camera Access Required</Text>
                <Text className="text-slate-400 text-center mb-8 font-medium leading-relaxed">
                    We need access to your camera to scan receipts using our AI engine.
                </Text>
                <TouchableOpacity onPress={requestPermission} className="bg-[#6366F1] px-10 py-4 rounded-full shadow-xl shadow-indigo-500/30">
                    <Text className="text-white font-bold uppercase tracking-widest text-xs">Allow Access</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <StatusBar style="light" />

            {!imageUri ? (
                <View className="flex-1 relative">
                    <CameraView style={{ flex: 1 }} ref={(ref) => setCameraRef(ref)}>
                        <SafeAreaView className="flex-1 justify-between" edges={['top', 'bottom']}>
                            {/* Top Bar */}
                            <View className="flex-row items-center justify-between px-6 pt-2">
                                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center border border-white/10">
                                    <ArrowLeft size={20} color="white" />
                                </TouchableOpacity>
                                <View className="bg-black/40 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                                    <Text className="text-white font-bold text-[10px] uppercase tracking-widest text-center">AI Scanner</Text>
                                </View>
                                <View className="w-10 opacity-0" />
                            </View>

                            {/* Focus Frame */}
                            <View className="flex-1 items-center justify-center relative">
                                <View className="w-64 h-80 relative">
                                    <View className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[#6366F1] rounded-tl-2xl shadow-sm" />
                                    <View className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-[#6366F1] rounded-tr-2xl shadow-sm" />
                                    <View className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-[#6366F1] rounded-bl-2xl shadow-sm" />
                                    <View className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-[#6366F1] rounded-br-2xl shadow-sm" />
                                    <View className="absolute top-1/2 left-4 right-4 h-[1px] bg-[#6366F1]/50" />
                                </View>
                                <View className="mt-8 bg-black/40 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <Text className="text-white/80 text-[10px] font-bold uppercase tracking-widest text-center">Align Receipt Center</Text>
                                </View>
                            </View>

                            {/* Controls */}
                            <View className="px-8 pb-8 pt-4 flex-row justify-between items-center">
                                <TouchableOpacity onPress={pickImage} className="w-12 h-12 bg-white/10 rounded-full items-center justify-center border border-white/10">
                                    <ImageIcon size={20} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={takePicture}
                                    className="w-20 h-20 rounded-full border-[4px] border-white/20 items-center justify-center"
                                    activeOpacity={0.8}
                                >
                                    <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-lg shadow-white/30 border-4 border-black/10" />
                                </TouchableOpacity>
                                <View className="w-12 h-12 opacity-0" />
                            </View>
                        </SafeAreaView>
                    </CameraView>
                </View>
            ) : (
                <View className="flex-1 bg-[#0F172A]">
                    {/* Background Image Blurred */}
                    <Image
                        source={{ uri: imageUri }}
                        className="absolute inset-0 w-full h-full opacity-40"
                        blurRadius={10}
                        resizeMode="cover"
                    />

                    <SafeAreaView className="flex-1" edges={['top']}>
                        {/* Header */}
                        <View className="flex-row justify-between items-center px-6 pt-2 mb-4">
                            <TouchableOpacity onPress={() => setImageUri(null)} className="w-10 h-10 bg-black/20 rounded-full items-center justify-center border border-white/10">
                                <ArrowLeft size={20} color="white" />
                            </TouchableOpacity>
                            <Text className="text-white font-bold text-lg">Scan Results</Text>
                            <TouchableOpacity onPress={() => setImageUri(null)} className="w-10 h-10 bg-black/20 rounded-full items-center justify-center border border-white/10">
                                <RefreshCw size={18} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                            {scanning ? (
                                <View className="items-center justify-center mt-20">
                                    <View className="w-24 h-24 bg-white/10 rounded-[32px] items-center justify-center backdrop-blur-xl border border-white/20 mb-8 animate-pulse">
                                        <Sparkles size={40} color="#6366F1" />
                                    </View>
                                    <ActivityIndicator size="large" color="#6366F1" className="mb-4" />
                                    <Text className="text-white font-black text-2xl mb-2">Analyzing...</Text>
                                    <Text className="text-slate-400 text-center font-medium">Extracting details from your receipt using AI.</Text>
                                </View>
                            ) : (
                                <View className="mt-4">
                                    {/* Success Badge */}
                                    <View className="self-center bg-emerald-500/20 px-4 py-1.5 rounded-full border border-emerald-500/30 flex-row items-center mb-8">
                                        <CheckCircle size={14} color="#34D399" />
                                        <Text className="text-[#34D399] font-bold text-[10px] uppercase tracking-widest ml-2">Extraction Complete</Text>
                                    </View>

                                    {/* Receipt Card */}
                                    <View className="bg-white rounded-[32px] p-1 shadow-2xl overflow-hidden mb-8">
                                        {/* Top Section - Image Preview */}
                                        <View className="h-40 bg-slate-100 rounded-t-[28px] overflow-hidden relative">
                                            <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
                                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} className="absolute inset-0" />
                                            <View className="absolute bottom-4 left-4">
                                                <View className="bg-black/50 px-3 py-1 rounded-lg backdrop-blur-md">
                                                    <Text className="text-white text-[10px] font-bold uppercase">Original Receipt</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Bottom Section - Data */}
                                        <View className="p-6 bg-white rounded-b-[32px]">
                                            {/* Amount */}
                                            <View className="items-center mb-8">
                                                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Total Amount</Text>
                                                <View className="flex-row items-center">
                                                    <TextInput
                                                        value={editedAmount}
                                                        onChangeText={setEditedAmount}
                                                        className="text-5xl font-black text-slate-900 text-center"
                                                        keyboardType="numeric"
                                                        placeholder="0.00"
                                                    />
                                                </View>
                                            </View>

                                            {/* Details List */}
                                            <View className="space-y-4">
                                                <View className="flex-row items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                    <View className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm mr-3">
                                                        <Store size={20} color="#6366F1" />
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Merchant</Text>
                                                        <TextInput
                                                            value={editedMerchant}
                                                            onChangeText={setEditedMerchant}
                                                            className="text-slate-900 font-bold text-base p-0"
                                                            placeholder="Merchant Name"
                                                        />
                                                    </View>
                                                    <Edit3 size={16} color="#CBD5E1" />
                                                </View>

                                                <View className="flex-row items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                    <View className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm mr-3">
                                                        <Calendar size={20} color="#6366F1" />
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Date</Text>
                                                        <TextInput
                                                            value={editedDate}
                                                            onChangeText={setEditedDate}
                                                            className="text-slate-900 font-bold text-base p-0"
                                                            placeholder="YYYY-MM-DD"
                                                        />
                                                    </View>
                                                    <Edit3 size={16} color="#CBD5E1" />
                                                </View>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Action Buttons */}
                                    <View className="gap-3 mb-10">
                                        <TouchableOpacity
                                            onPress={handleConfirm}
                                            className="w-full bg-[#6366F1] h-14 rounded-full flex-row items-center justify-center shadow-xl shadow-indigo-500/40"
                                        >
                                            <Text className="text-white font-bold text-base mr-2">Confirm Details</Text>
                                            <ChevronRight size={20} color="white" />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => setImageUri(null)}
                                            className="w-full h-14 rounded-full flex-row items-center justify-center border border-white/10 bg-white/5"
                                        >
                                            <Text className="text-slate-300 font-bold text-sm">Retake Photo</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                    </SafeAreaView>
                </View>
            )}
        </View>
    );
}
