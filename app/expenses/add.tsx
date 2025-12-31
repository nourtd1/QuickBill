import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    ArrowLeft,
    Camera,
    Check,
    X,
    Wallet,
    Tag,
    Calendar as CalendarIcon,
    FileText
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { uploadImage } from '../../lib/upload';
import { showError, showSuccess } from '../../lib/error-handler';

const { width } = Dimensions.get('window');

const CATEGORIES = [
    { label: 'Loyer', icon: '🏠', color: 'bg-blue-100 text-blue-700' },
    { label: 'Matériel', icon: '📦', color: 'bg-purple-100 text-purple-700' },
    { label: 'Transport', icon: '🚗', color: 'bg-orange-100 text-orange-700' },
    { label: 'Salaire', icon: '👥', color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Marketing', icon: '📢', color: 'bg-pink-100 text-pink-700' },
    { label: 'Autre', icon: '✨', color: 'bg-slate-100 text-slate-700' },
];

export default function AddExpenseScreen() {
    const router = useRouter();
    const { user, profile } = useAuth();

    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Autre');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [receiptUri, setReceiptUri] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

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
                // Utilisation du bucket 'images' (assumé existant et public)
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

    const currency = profile?.currency || 'RWF';

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                {/* Header Section */}
                <LinearGradient
                    colors={['#EF4444', '#B91C1C']}
                    className="pt-16 pb-20 px-6 rounded-b-[40px] shadow-lg"
                >
                    <View className="flex-row justify-between items-center mb-8">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-white/10 p-3 rounded-2xl border border-white/10"
                        >
                            <ArrowLeft size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white text-xl font-black">Nouvelle Dépense</Text>
                        <View className="w-12" />
                    </View>

                    <View className="items-center">
                        <Text className="text-white/60 font-bold mb-2 uppercase tracking-widest text-xs">Montant de la dépense</Text>
                        <View className="flex-row items-center">
                            <TextInput
                                className="text-white text-5xl font-black mr-2"
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="0"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                keyboardType="numeric"
                                autoFocus
                            />
                            <Text className="text-white/60 text-2xl font-bold">{currency}</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View className="px-6 -mt-8 pb-32">

                    {/* Category Selection */}
                    <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 mb-6">
                        <View className="flex-row items-center mb-4">
                            <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center mr-3">
                                <Tag size={20} color="#2563EB" />
                            </View>
                            <Text className="text-slate-900 font-black text-lg">Catégorie</Text>
                        </View>

                        <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat.label}
                                    onPress={() => setCategory(cat.label)}
                                    className={`px-4 py-3 rounded-2xl border ${category === cat.label
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-slate-50 border-slate-100'
                                        }`}
                                >
                                    <Text className="text-lg mb-1">{cat.icon}</Text>
                                    <Text className={`font-bold text-xs ${category === cat.label ? 'text-red-700' : 'text-slate-500'
                                        }`}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Details section */}
                    <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 mb-6">
                        <View className="flex-row items-center mb-6">
                            <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-3">
                                <FileText size={20} color="#64748B" />
                            </View>
                            <Text className="text-slate-900 font-black text-lg">Détails</Text>
                        </View>

                        <View className="space-y-4">
                            <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-row items-center">
                                <CalendarIcon size={20} color="#64748B" className="mr-3" />
                                <View className="flex-1">
                                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date</Text>
                                    <TextInput
                                        className="text-slate-900 font-bold py-1 text-base"
                                        value={date}
                                        onChangeText={setDate}
                                        placeholder="YYYY-MM-DD"
                                    />
                                </View>
                            </View>

                            <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-row items-start mt-4">
                                <Wallet size={20} color="#64748B" className="mr-3 mt-1" />
                                <View className="flex-1">
                                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Note / Description</Text>
                                    <TextInput
                                        className="text-slate-900 font-bold py-2 text-base"
                                        value={description}
                                        onChangeText={setDescription}
                                        placeholder="Ex: Facture d'électricité"
                                        multiline
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Receipt section */}
                    <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 mb-8">
                        <View className="flex-row items-center justify-between mb-6">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-orange-50 rounded-xl items-center justify-center mr-3">
                                    <Camera size={20} color="#F59E0B" />
                                </View>
                                <Text className="text-slate-900 font-black text-lg">Reçu / Ticket</Text>
                            </View>
                            {receiptUri && (
                                <TouchableOpacity onPress={() => setReceiptUri(null)}>
                                    <X size={20} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {receiptUri ? (
                            <View className="relative">
                                <Image
                                    source={{ uri: receiptUri }}
                                    className="w-full h-48 rounded-2xl border border-slate-100"
                                    resizeMode="cover"
                                />
                                {uploading && (
                                    <View className="absolute inset-0 bg-black/30 rounded-2xl items-center justify-center">
                                        <ActivityIndicator color="white" />
                                        <Text className="text-white font-bold mt-2">Upload en cours...</Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View className="flex-row" style={{ gap: 12 }}>
                                <TouchableOpacity
                                    onPress={handleCamera}
                                    className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-2xl items-center justify-center"
                                >
                                    <Camera size={24} color="#94A3B8" />
                                    <Text className="text-slate-400 font-bold text-xs mt-2">Prendre Photo</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-2xl items-center justify-center"
                                >
                                    <FileText size={24} color="#94A3B8" />
                                    <Text className="text-slate-400 font-bold text-xs mt-2">Galerie</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        className={`w-full py-5 rounded-[24px] flex-row items-center justify-center shadow-lg ${saving ? 'bg-slate-400' : 'bg-red-600 shadow-red-200'
                            }`}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text className="text-white font-black text-lg mr-2">Enregistrer la dépense</Text>
                                <Check size={24} color="white" strokeWidth={3} />
                            </>
                        )}
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </View>
    );
}
