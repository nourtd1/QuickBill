import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    X,
    Camera,
    Check,
    Calendar as CalendarIcon,
    FileText,
    Upload,
    Plus,
    Tag,
    DollarSign,
    Wallet,
    ScanLine
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { uploadImage } from '../../lib/upload';
import { showError, showSuccess } from '../../lib/error-handler';

const { width } = Dimensions.get('window');

const CATEGORIES = [
    { label: 'Loyer', icon: '🏠', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { label: 'Matériel', icon: '📦', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    { label: 'Transport', icon: '🚗', color: 'bg-orange-50 text-orange-700 border-orange-100' },
    { label: 'Salaire', icon: '👥', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { label: 'Marketing', icon: '📢', color: 'bg-pink-50 text-pink-700 border-pink-100' },
    { label: 'Autre', icon: '✨', color: 'bg-slate-50 text-slate-700 border-slate-100' },
];

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];

export default function AddExpenseScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user, profile } = useAuth();
    const currency = profile?.currency || 'RWF';

    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Autre');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [receiptUri, setReceiptUri] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (params.amount) {
            setAmount(params.amount.toString());
        }
        if (params.merchant) {
            setDescription(`Achat chez ${params.merchant}`);
        }
        if (params.date) {
            setDate(params.date.toString());
        }
        if (params.scanData) {
            try {
                const data = JSON.parse(params.scanData as string);
                // Can process item details here if needed
            } catch (e) { console.error(e); }
        }
    }, [params]);

    const handlePickImage = async () => {
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
            Alert.alert("Permission requise", "L'accès à la galerie est nécessaire.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setReceiptUri(result.assets[0].uri);
        }
    };

    const handleCamera = async () => {
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) {
            Alert.alert("Permission requise", "L'accès à la caméra est nécessaire.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setReceiptUri(result.assets[0].uri);
        }
    };

    const handleAddAmount = (val: number) => {
        const current = parseFloat(amount) || 0;
        setAmount((current + val).toString());
    };

    const handleSave = async () => {
        if (!amount || isNaN(parseFloat(amount))) {
            Alert.alert("Erreur", "Veuillez entrer un montant valide.");
            return;
        }

        if (!user) return;

        setSaving(true);
        try {
            let receiptUrl = null;
            if (receiptUri) {
                setUploading(true);
                receiptUrl = await uploadImage(receiptUri, 'images');
                setUploading(false);
            }

            const { error } = await supabase
                .from('expenses')
                .insert({
                    user_id: user.id,
                    amount: parseFloat(amount),
                    category,
                    description: description.trim() || null,
                    date,
                    receipt_url: receiptUrl
                });

            if (error) throw error;

            showSuccess("Dépense enregistrée !");
            router.back();
        } catch (error) {
            showError(error, "Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
            setUploading(false);
        }
    };


    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-primary pt-16 pb-8 px-6 rounded-b-[40px] shadow-lg z-10">
                <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()} disabled={saving} className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                        <X size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-black tracking-tight">Nouvelle Dépense</Text>
                    <View style={{ width: 40 }} />
                </View>
                <Text className="text-blue-100 text-center font-medium">Enregistrez vos dépenses pour suivre votre trésorerie.</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

                    {/* Scan AI Button */}
                    <TouchableOpacity
                        onPress={() => router.push('/expenses/scan')}
                        className="bg-blue-600 p-4 rounded-[24px] shadow-lg shadow-blue-300 mb-6 flex-row items-center justify-between overflow-hidden relative"
                    >
                        <View className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />

                        <View className="flex-row items-center">
                            <View className="bg-white/20 p-3 rounded-2xl mr-4 backdrop-blur-sm">
                                <ScanLine size={24} color="white" />
                            </View>
                            <View>
                                <Text className="text-white font-black text-lg">Scanner un Reçu</Text>
                                <Text className="text-blue-100 text-xs font-medium">Remplissage auto avec l'IA</Text>
                            </View>
                        </View>
                        <View className="bg-white px-3 py-1 rounded-full">
                            <Text className="text-blue-600 font-bold text-xs">GO</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Amount Card */}
                    <View className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 mb-6 items-center justify-center">
                        <Text className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-4">Montant TTC</Text>
                        <View className="flex-row items-baseline justify-center mb-6">
                            <TextInput
                                className="text-slate-900 text-6xl font-black text-center min-w-[60px]"
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="0"
                                placeholderTextColor="#CBD5E1"
                                keyboardType="numeric"
                                autoFocus
                            />
                            <Text className="text-slate-400 text-3xl font-black ml-2">{currency}</Text>
                        </View>

                        {/* Quick Add Buttons */}
                        <View className="flex-row flex-wrap justify-center gap-3">
                            {QUICK_AMOUNTS.map((val) => (
                                <TouchableOpacity
                                    key={val}
                                    onPress={() => handleAddAmount(val)}
                                    className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex-row items-center active:bg-slate-100"
                                >
                                    <Plus size={12} color="#64748B" className="mr-1" />
                                    <Text className="text-slate-600 font-bold text-xs">+{val.toLocaleString()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Form Fields */}
                    <View className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6">

                        {/* Category */}
                        <View className="mb-6">
                            <View className="flex-row items-center mb-3 ml-1">
                                <Tag size={16} color="#64748B" className="mr-2" />
                                <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider">Catégorie</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2 px-2" contentContainerStyle={{ paddingRight: 20 }}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.label}
                                        onPress={() => setCategory(cat.label)}
                                        className={`mr-3 px-4 py-3 rounded-2xl border items-center justify-center flex-row shadow-sm ${category === cat.label
                                            ? 'bg-primary border-primary'
                                            : 'bg-white border-slate-100'
                                            }`}
                                    >
                                        <Text className="text-lg mr-2">{cat.icon}</Text>
                                        <Text className={`font-bold text-xs ${category === cat.label ? 'text-white' : 'text-slate-600'}`}>
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Date & Description */}
                        <View className="space-y-4">
                            <View>
                                <View className="flex-row items-center mb-2 ml-1">
                                    <CalendarIcon size={16} color="#64748B" className="mr-2" />
                                    <Text className="text-slate-400 font-bold uppercase text-xs tracking-widest">Date</Text>
                                </View>
                                <View className="flex-row items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <TextInput
                                        className="text-slate-900 font-bold text-base flex-1"
                                        value={date}
                                        onChangeText={setDate}
                                        placeholder="YYYY-MM-DD"
                                    />
                                </View>
                            </View>

                            <View>
                                <View className="flex-row items-center mb-2 ml-1">
                                    <FileText size={16} color="#64748B" className="mr-2" />
                                    <Text className="text-slate-400 font-bold uppercase text-xs tracking-widest">Description</Text>
                                </View>
                                <View className="flex-row items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <TextInput
                                        className="text-slate-900 font-bold text-base flex-1"
                                        value={description}
                                        onChangeText={setDescription}
                                        placeholder="Facultatif : notes, détails..."
                                        placeholderTextColor="#94A3B8"
                                        multiline
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Receipt Section */}
                    <View className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-8">
                        <Text className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-4 ml-1">Justificatif (Reçu / Facture)</Text>

                        {receiptUri ? (
                            <View className="relative">
                                <Image
                                    source={{ uri: receiptUri }}
                                    className="w-full h-48 rounded-2xl border border-slate-100"
                                    resizeMode="cover"
                                />
                                <TouchableOpacity
                                    onPress={() => setReceiptUri(null)}
                                    className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-sm"
                                >
                                    <X size={16} color="#EF4444" />
                                </TouchableOpacity>
                                {uploading && (
                                    <View className="absolute inset-0 bg-slate-900/50 rounded-2xl items-center justify-center">
                                        <ActivityIndicator color="white" />
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View className="flex-row gap-4">
                                <TouchableOpacity
                                    onPress={handleCamera}
                                    className="flex-1 bg-slate-50 border border-slate-200 p-6 rounded-3xl items-center justify-center active:bg-slate-100"
                                >
                                    <View className="bg-white p-3 rounded-full mb-2 shadow-sm">
                                        <Camera size={24} color="#64748B" />
                                    </View>
                                    <Text className="text-slate-600 font-bold text-xs">Appareil Photo</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    className="flex-1 bg-slate-50 border border-slate-200 p-6 rounded-3xl items-center justify-center active:bg-slate-100"
                                >
                                    <View className="bg-white p-3 rounded-full mb-2 shadow-sm">
                                        <Upload size={24} color="#64748B" />
                                    </View>
                                    <Text className="text-slate-600 font-bold text-xs">Galerie Photos</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Fixed Bottom Button */}
            <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-[32px]">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className={`w-full h-16 rounded-2xl flex-row items-center justify-center shadow-lg ${saving || !amount ? 'bg-slate-200 shadow-transparent' : 'bg-slate-900 shadow-slate-400'
                        }`}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text className={`font-black text-lg uppercase mr-2 ${!amount ? 'text-slate-400' : 'text-white'}`}>
                                Confirmer la Dépense
                            </Text>
                            {!amount ? null : <Check size={24} color="white" strokeWidth={3} />}
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
