import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, Image, ActivityIndicator,
    Alert, ScrollView, TextInput, StyleSheet
} from 'react-native';
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
    ScanLine,
    ChevronRight,
    Calendar,
    Store,
    Edit3,
    QrCode
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { scanReceipt, scanQRCode, ExtractedReceiptData } from '../../lib/ocr';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function ScanReceiptScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [qrData, setQrData] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ExtractedReceiptData | null>(null);
    const cameraRef = useRef<CameraView>(null);
    const isMounted = useRef(true);
    const qrScanned = useRef(false);

    const [editedAmount, setEditedAmount] = useState('');
    const [editedMerchant, setEditedMerchant] = useState('');
    const [editedDate, setEditedDate] = useState('');
    const [editedCategory, setEditedCategory] = useState('');

    useEffect(() => {
        isMounted.current = true;
        qrScanned.current = false;
        if (!permission?.granted) {
            requestPermission();
        }
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (result) {
            setEditedAmount(result.amount?.toString() ?? '');
            setEditedMerchant(result.merchant ?? '');
            setEditedDate(result.date ?? '');
            setEditedCategory(result.category ?? '');
        }
    }, [result]);

    const resetScan = () => {
        setImageUri(null);
        setQrData(null);
        setResult(null);
        setScanning(false);
        qrScanned.current = false;
    };

    const takePicture = async () => {
        if (!cameraRef.current || scanning) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
            if (isMounted.current && photo) {
                await processImage(photo.uri);
            }
        } catch (e) {
            console.error('Camera takePicture error:', e);
            Alert.alert('Erreur', 'Impossible de prendre une photo.');
        }
    };

    const pickImage = async () => {
        Haptics.selectionAsync();
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });
        if (!res.canceled) {
            await processImage(res.assets[0].uri);
        }
    };

    const processImage = async (uri: string) => {
        setImageUri(uri);
        setQrData(null);
        setScanning(true);
        setResult(null);

        try {
            console.log('[SCAN] Processing image:', uri);
            const data = await scanReceipt(uri);
            console.log('[SCAN] Gemini result:', JSON.stringify(data));
            if (isMounted.current) setResult(data);
        } catch (e: any) {
            console.error('[SCAN] Error:', e?.message ?? e);
            Alert.alert('Erreur IA', e?.message ?? 'Impossible d\'analyser ce reçu.');
            if (isMounted.current) resetScan();
        } finally {
            if (isMounted.current) setScanning(false);
        }
    };

    const processQRCode = async (dataStr: string) => {
        if (scanning || qrScanned.current) return;
        qrScanned.current = true;
        setQrData(dataStr);
        setImageUri(null);
        setScanning(true);
        setResult(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            console.log('[QR] Processing QR data:', dataStr);
            const data = await scanQRCode(dataStr);
            console.log('[QR] Gemini result:', JSON.stringify(data));
            if (isMounted.current) setResult(data);
        } catch (e: any) {
            console.error('[QR] Error:', e?.message ?? e);
            Alert.alert('Erreur QR', e?.message ?? 'Impossible d\'analyser ce code QR.');
            if (isMounted.current) resetScan();
        } finally {
            if (isMounted.current) setScanning(false);
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
                category: editedCategory,
                scanData: JSON.stringify(result),
                imageUri: imageUri ?? undefined
            }
        });
    };

    if (!permission) return <View style={styles.blackFill} />;

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <View style={styles.permissionIcon}>
                    <CameraIcon size={48} color="white" />
                    <View style={styles.permissionBadge}>
                        <ScanLine size={16} color="white" />
                    </View>
                </View>
                <Text style={styles.permissionTitle}>Camera Access Required</Text>
                <Text style={styles.permissionSubtitle}>
                    We need access to your camera to scan receipts using our AI engine.
                </Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
                    <Text style={styles.permissionButtonText}>Allow Access</Text>
                </TouchableOpacity>
            </View>
        );
    }

    /* ────── RESULTS VIEW ────── */
    if (imageUri || qrData) {
        return (
            <View style={styles.blackFill}>
                <StatusBar style="light" />
                {imageUri && (
                    <Image
                        source={{ uri: imageUri }}
                        style={StyleSheet.absoluteFillObject}
                        blurRadius={10}
                        resizeMode="cover"
                        // subtle opacity handled inline
                    />
                )}
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15,23,42,0.82)' }]} />

                <SafeAreaView style={styles.fillFlex} edges={['top']}>
                    {/* Header */}
                    <View style={styles.resultsHeader}>
                        <TouchableOpacity onPress={resetScan} style={styles.iconBtn}>
                            <ArrowLeft size={20} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.resultsTitle}>Résultats du scan</Text>
                        <TouchableOpacity onPress={resetScan} style={styles.iconBtn}>
                            <RefreshCw size={18} color="white" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.fillFlex} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                        {scanning ? (
                            <View style={styles.scanningContainer}>
                                <View style={styles.scanningIconBox}>
                                    <Sparkles size={40} color="#6366F1" />
                                </View>
                                <ActivityIndicator size="large" color="#6366F1" style={{ marginBottom: 16 }} />
                                <Text style={styles.analyzingTitle}>Analyse en cours...</Text>
                                <Text style={styles.analyzingSubtitle}>
                                    {qrData ? 'Traitement du code QR avec l\'IA.' : 'Extraction des données de votre reçu.'}
                                </Text>
                            </View>
                        ) : (
                            <View style={{ marginTop: 16 }}>
                                {/* Badge succès */}
                                <View style={styles.successBadge}>
                                    <CheckCircle size={14} color="#34D399" />
                                    <Text style={styles.successBadgeText}>Extraction Complète</Text>
                                </View>

                                {/* Carte résultat */}
                                <View style={styles.resultCard}>
                                    {/* Preview header */}
                                    <View style={styles.previewHeader}>
                                        {imageUri ? (
                                            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                                        ) : (
                                            <View style={styles.qrPreviewPlaceholder}>
                                                <QrCode size={48} color="#94A3B8" />
                                                <Text style={styles.qrPreviewText}>Code QR Scanné</Text>
                                            </View>
                                        )}
                                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={StyleSheet.absoluteFillObject} />
                                        <View style={styles.previewBadge}>
                                            <Text style={styles.previewBadgeText}>
                                                {imageUri ? 'Photo originale' : 'QR Scanner'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Fields */}
                                    <View style={styles.fieldsContainer}>
                                        {/* Amount */}
                                        <View style={styles.amountContainer}>
                                            <Text style={styles.fieldLabel}>Montant Total</Text>
                                            <TextInput
                                                value={editedAmount}
                                                onChangeText={setEditedAmount}
                                                style={styles.amountInput}
                                                keyboardType="numeric"
                                                placeholder="0.00"
                                                placeholderTextColor="#CBD5E1"
                                            />
                                        </View>

                                        {/* Merchant */}
                                        <View style={styles.fieldRow}>
                                            <View style={styles.fieldIcon}>
                                                <Store size={20} color="#6366F1" />
                                            </View>
                                            <View style={styles.fieldContent}>
                                                <Text style={styles.fieldLabel}>Marchand / Source</Text>
                                                <TextInput
                                                    value={editedMerchant}
                                                    onChangeText={setEditedMerchant}
                                                    style={styles.fieldInput}
                                                    placeholder="Nom du marchand"
                                                    placeholderTextColor="#CBD5E1"
                                                    multiline
                                                />
                                            </View>
                                            <Edit3 size={16} color="#CBD5E1" />
                                        </View>

                                        {/* Date */}
                                        <View style={styles.fieldRow}>
                                            <View style={styles.fieldIcon}>
                                                <Calendar size={20} color="#6366F1" />
                                            </View>
                                            <View style={styles.fieldContent}>
                                                <Text style={styles.fieldLabel}>Date</Text>
                                                <TextInput
                                                    value={editedDate}
                                                    onChangeText={setEditedDate}
                                                    style={styles.fieldInput}
                                                    placeholder="AAAA-MM-JJ"
                                                    placeholderTextColor="#CBD5E1"
                                                />
                                            </View>
                                            <Edit3 size={16} color="#CBD5E1" />
                                        </View>

                                        {/* Category */}
                                        <View style={styles.fieldRow}>
                                            <View style={styles.fieldIcon}>
                                                <Sparkles size={18} color="#6366F1" />
                                            </View>
                                            <View style={styles.fieldContent}>
                                                <Text style={styles.fieldLabel}>Catégorie suggérée</Text>
                                                <TextInput
                                                    value={editedCategory}
                                                    onChangeText={setEditedCategory}
                                                    style={styles.fieldInput}
                                                    placeholder="Catégorie"
                                                    placeholderTextColor="#CBD5E1"
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Actions */}
                                <View style={{ gap: 12, marginTop: 24 }}>
                                    <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
                                        <Text style={styles.confirmBtnText}>Confirmer les données</Text>
                                        <ChevronRight size={20} color="white" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={resetScan} style={styles.retakeBtn}>
                                        <Text style={styles.retakeBtnText}>
                                            {imageUri ? 'Reprendre une photo' : 'Nouveau scan'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </View>
        );
    }

    /* ────── CAMERA VIEW (no children inside CameraView) ────── */
    return (
        <View style={styles.blackFill}>
            <StatusBar style="light" />
            <CameraView
                style={StyleSheet.absoluteFillObject}
                ref={cameraRef}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={({ data }) => {
                    if (!scanning && !qrScanned.current && isMounted.current) {
                        processQRCode(data);
                    }
                }}
            />
            {/* Overlay UI par-dessus la caméra — en dehors de CameraView */}
            <SafeAreaView style={styles.fillFlex} edges={['top', 'bottom']} pointerEvents="box-none">
                {/* Top bar */}
                <View style={styles.cameraTopBar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.cameraIconBtn}>
                        <ArrowLeft size={20} color="white" />
                    </TouchableOpacity>
                    <View style={styles.cameraLabelPill}>
                        <Text style={styles.cameraLabelText}>AI Scanner</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* Center viewfinder */}
                <View style={styles.viewfinderContainer} pointerEvents="none">
                    <View style={styles.viewfinder}>
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />
                        <View style={styles.scanLine} />
                    </View>
                    <View style={styles.viewfinderHint}>
                        <Text style={styles.viewfinderHintText}>
                            Centrez votre reçu ou code QR
                        </Text>
                    </View>
                </View>

                {/* Bottom bar */}
                <View style={styles.cameraBottomBar}>
                    <TouchableOpacity onPress={pickImage} style={styles.cameraIconBtn}>
                        <ImageIcon size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={takePicture}
                        style={styles.shutterOuter}
                        activeOpacity={0.8}
                        disabled={scanning}
                    >
                        <View style={styles.shutterInner} />
                    </TouchableOpacity>
                    <View style={{ width: 48 }} />
                </View>
            </SafeAreaView>
        </View>
    );
}

const INDIGO = '#6366F1';

const styles = StyleSheet.create({
    blackFill: { flex: 1, backgroundColor: '#000' },
    fillFlex: { flex: 1 },

    // Permission
    permissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', paddingHorizontal: 32 },
    permissionIcon: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 24, borderRadius: 999, marginBottom: 24, position: 'relative' },
    permissionBadge: { position: 'absolute', bottom: -8, right: -8, backgroundColor: INDIGO, padding: 8, borderRadius: 999 },
    permissionTitle: { color: 'white', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
    permissionSubtitle: { color: '#94A3B8', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
    permissionButton: { backgroundColor: INDIGO, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 999 },
    permissionButtonText: { color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, fontSize: 12 },

    // Results
    resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, marginBottom: 16 },
    iconBtn: { width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    resultsTitle: { color: 'white', fontWeight: 'bold', fontSize: 18 },

    scanningContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
    scanningIconBox: { width: 96, height: 96, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 24 },
    analyzingTitle: { color: 'white', fontWeight: '900', fontSize: 22, marginBottom: 8 },
    analyzingSubtitle: { color: '#94A3B8', textAlign: 'center', fontWeight: '500' },

    successBadge: { alignSelf: 'center', backgroundColor: 'rgba(52,211,153,0.15)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)', flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    successBadgeText: { color: '#34D399', fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginLeft: 8 },

    resultCard: { backgroundColor: 'white', borderRadius: 32, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    previewHeader: { height: 160, backgroundColor: '#F1F5F9', position: 'relative' },
    previewImage: { width: '100%', height: '100%' },
    qrPreviewPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E2E8F0' },
    qrPreviewText: { marginTop: 8, color: '#94A3B8', fontWeight: 'bold' },
    previewBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    previewBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },

    fieldsContainer: { padding: 20, gap: 12 },
    amountContainer: { alignItems: 'center', marginBottom: 8 },
    amountInput: { fontSize: 48, fontWeight: '900', color: '#0F172A', textAlign: 'center' },

    fieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 14, borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9' },
    fieldIcon: { width: 40, height: 40, backgroundColor: 'white', borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, marginRight: 12 },
    fieldContent: { flex: 1 },
    fieldLabel: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
    fieldInput: { color: '#0F172A', fontWeight: 'bold', fontSize: 15, padding: 0 },

    confirmBtn: { width: '100%', backgroundColor: INDIGO, height: 56, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: INDIGO, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
    confirmBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    retakeBtn: { width: '100%', height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)' },
    retakeBtnText: { color: '#CBD5E1', fontWeight: 'bold', fontSize: 14 },

    // Camera overlay
    cameraTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8 },
    cameraIconBtn: { width: 48, height: 48, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    cameraLabelPill: { backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    cameraLabelText: { color: 'white', fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 3 },

    viewfinderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    viewfinder: { width: 260, height: 320, position: 'relative' },
    corner: { position: 'absolute', width: 32, height: 32, borderColor: INDIGO },
    cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
    cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
    cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
    scanLine: { position: 'absolute', top: '50%', left: 12, right: 12, height: 1, backgroundColor: 'rgba(99,102,241,0.5)' },
    viewfinderHint: { marginTop: 24, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
    viewfinderHintText: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 },

    cameraBottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingBottom: 24, paddingTop: 16 },
    shutterOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
    shutterInner: { width: 64, height: 64, backgroundColor: 'white', borderRadius: 32, borderWidth: 3, borderColor: 'rgba(0,0,0,0.08)' },
});
