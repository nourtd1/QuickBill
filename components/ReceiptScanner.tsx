import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { scanReceipt, ReceiptData } from '../lib/ocrService';

interface Props {
    isVisible: boolean;
    onClose: () => void;
    onDataScanned: (data: ReceiptData, imageUri: string) => void;
}

export default function ReceiptScanner({ isVisible, onClose, onDataScanned }: Props) {
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraType, setCameraType] = useState<CameraType>('back');
    const [scannedImage, setScannedImage] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const cameraRef = useRef<CameraView>(null);

    useEffect(() => {
        if (isVisible && !permission?.granted) {
            requestPermission();
        }
    }, [isVisible]);

    const takePicture = async () => {
        if (!cameraRef.current) return;
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                skipProcessing: true // Faster
            });
            if (photo?.uri) {
                processImage(photo.uri);
            }
        } catch (e) {
            Alert.alert('Erreur', 'Impossible de prendre la photo');
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0].uri) {
            processImage(result.assets[0].uri);
        }
    };

    const processImage = async (uri: string) => {
        setScannedImage(uri);
        setProcessing(true);

        try {
            // 1. Resize/Crop (Optimization for OCR)
            // Resize to width 1000px to speed up Tesseract
            const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 1000 } }],
                { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );

            // 2. Run OCR
            const data = await scanReceipt(manipResult.uri);

            // 3. Callback
            onDataScanned(data, manipResult.uri);
            setScannedImage(null); // Reset
            onClose(); // Close Modal

        } catch (error: any) {
            Alert.alert('Échec OCR', "Nous n'avons pas pu lire le ticket. " + error.message);
            setScannedImage(null);
        } finally {
            setProcessing(false);
        }
    };

    if (!isVisible) return null;

    if (!permission?.granted) {
        return (
            <Modal visible={isVisible} animationType="slide">
                <View className="flex-1 justify-center items-center bg-black">
                    <Text className="text-white mb-4">Permission caméra requise</Text>
                    <TouchableOpacity onPress={requestPermission} className="bg-indigo-600 px-6 py-3 rounded-full">
                        <Text className="text-white">Autoriser</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} className="mt-8">
                        <Text className="text-gray-400">Annuler</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={isVisible} animationType="slide" presentationStyle="fullScreen">
            <View className="flex-1 bg-black">
                {/* Header */}
                <View className="absolute top-12 left-4 right-4 z-10 flex-row justify-between items-center">
                    <TouchableOpacity onPress={onClose} className="p-2 bg-black/50 rounded-full">
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white font-bold text-lg">Scanner Reçu</Text>
                    <TouchableOpacity onPress={() => setCameraType(current => (current === 'back' ? 'front' : 'back'))} className="p-2 bg-black/50 rounded-full">
                        <Ionicons name="camera-reverse" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Camera Preview */}
                {scannedImage ? (
                    <View className="flex-1 justify-center items-center bg-black">
                        <Image source={{ uri: scannedImage }} className="w-full h-full opacity-50" resizeMode="contain" />
                        <View className="absolute z-20 items-center">
                            <ActivityIndicator size="large" color="#ffffff" />
                            <Text className="text-white mt-4 font-bold text-xl">Analyse intelligente...</Text>
                            <Text className="text-gray-300 mt-1">Extraction du montant et de la date</Text>
                        </View>
                    </View>
                ) : (
                    <CameraView
                        ref={cameraRef}
                        className="flex-1"
                        facing={cameraType}
                        flash="auto"
                    >
                        {/* Visual Guide Overlay */}
                        <View className="flex-1 justify-center items-center">
                            <View className="w-[80%] h-[60%] border-2 border-white/50 rounded-3xl bg-transparent relative">
                                <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1 rounded-tl-xl" />
                                <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1 rounded-tr-xl" />
                                <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1 rounded-bl-xl" />
                                <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1 rounded-br-xl" />
                            </View>
                            <Text className="text-white/80 mt-8 bg-black/50 px-4 py-2 rounded-full overflow-hidden">
                                Placez le ticket dans le cadre
                            </Text>
                        </View>
                    </CameraView>
                )}

                {/* Controls */}
                {!scannedImage && (
                    <View className="absolute bottom-12 left-0 right-0 flex-row justify-around items-center px-8">
                        <TouchableOpacity onPress={pickImage}>
                            <Ionicons name="images" size={32} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={takePicture}
                            className="w-20 h-20 bg-white rounded-full border-4 border-indigo-500 justify-center items-center shadow-lg"
                        >
                            <View className="w-16 h-16 bg-white rounded-full" />
                        </TouchableOpacity>

                        <View className="w-8" />
                    </View>
                )}
            </View>
        </Modal>
    );
}
