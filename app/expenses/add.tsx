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
    Tag,
    Calendar as CalendarIcon,
    FileText,
    Banknote,
    Upload,
    Plus
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
    const { user, profile } = useAuth();
    const currency = profile?.currency || 'RWF';

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
        <View className="flex-1 bg-background">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" style={{ backgroundColor: '#EFF6FF' }}>

                {/* Header */}
                <View className="flex-row justify-between items-center px-6 py-4 bg-white border-b border-slate-100">
                    <TouchableOpacity onPress={() => router.back()} disabled={saving} className="p-2 -ml-2 bg-slate-50 rounded-full">
                        <X size={24} color="#64748B" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900">Nouvelle Dépense</Text>
                    <View style={{ width: 32 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    className="flex-1"
                >
                    <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>

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
                                        className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex-row items-center"
                                    >
                                        <Plus size={12} color="#64748B" className="mr-1" />
                                        <Text className="text-slate-600 font-bold text-xs">{val}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Form Fields */}
                        <View className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6">

                            {/* Category */}
                            <Text className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-3 ml-1">Catégorie</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-2 px-2">
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.label}
                                        onPress={() => setCategory(cat.label)}
                                        className={`mr-3 px-4 py-3 rounded-2xl border items-center justify-center flex-row ${category === cat.label
                                                ? 'bg-slate-900 border-slate-900'
                                                : 'bg-white border-slate-100'
                                            }`}
                                    >
                                        <Text className="text-lg mr-2">{cat.icon}</Text>
                                        <Text className={`font-bold text-xs ${category === cat.label ? 'text-white' : 'text-slate-600'
                                            }`}>
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Date & Description */}
                            <View className="space-y-4">
                                <View>
                                    <Text className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-2 ml-1">Date</Text>
                                    <View className="flex-row items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <CalendarIcon size={20} color="#64748B" className="mr-3" />
                                        <TextInput
                                            className="text-slate-900 font-bold text-base flex-1"
                                            value={date}
                                            onChangeText={setDate}
                                            placeholder="YYYY-MM-DD"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-2 ml-1">Description</Text>
                                    <View className="flex-row items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <FileText size={20} color="#64748B" className="mr-3 mt-1" />
                                        <TextInput
                                            className="text-slate-900 font-bold text-base flex-1"
                                            value={description}
                                            onChangeText={setDescription}
                                            placeholder="Ex: Facture électricité..."
                                            placeholderTextColor="#94A3B8"
                                            multiline
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Receipt Section */}
                        <View className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-8">
                            <Text className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-4 ml-1">Justificatif</Text>

                            {receiptUri ? (
                                <View className="relative">
                                    <Image
                                        source={{ uri: receiptUri }}
                                        className="w-full h-48 rounded-2xl border border-slate-100"
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setReceiptUri(null)}
                                        className="absolute top-2 right-2 bg-white/90 p-2 rounded-full"
                                    >
                                        <X size={16} color="#EF4444" />
                                    </TouchableOpacity>
                                    {uploading && (
                                        <View className="absolute inset-0 bg-black/30 rounded-2xl items-center justify-center">
                                            <ActivityIndicator color="white" />
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View className="flex-row gap-4">
                                    <TouchableOpacity
                                        onPress={handleCamera}
                                        className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-3xl items-center justify-center active:scale-95 transition-all"
                                    >
                                        <Camera size={28} color="#94A3B8" />
                                        <Text className="text-slate-500 font-bold text-xs mt-2">Appareil</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={handlePickImage}
                                        className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-3xl items-center justify-center active:scale-95 transition-all"
                                    >
                                        <Upload size={28} color="#94A3B8" />
                                        <Text className="text-slate-500 font-bold text-xs mt-2">Galerie</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Spacing for bottom button */}
                        <View className="h-24" />

                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Fixed Bottom Button */}
                <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 shadow-lg">
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        className={`w-full h-16 rounded-2xl flex-row items-center justify-center shadow-lg ${saving || !amount ? 'bg-slate-200' : 'bg-slate-900 shadow-slate-200'
                            }`}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Banknote size={24} color={!amount ? "#94A3B8" : "white"} className="mr-2" />
                                <Text className={`font-black text-lg uppercase ${!amount ? 'text-slate-400' : 'text-white'}`}>
                                    Confirmer la Dépense
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}
