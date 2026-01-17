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
    ScanLine,
    ArrowLeft,
    ChevronDown,
    MapPin,
    AlertCircle
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { uploadImage } from '../../lib/upload';
import { showError, showSuccess } from '../../lib/error-handler';

const { width } = Dimensions.get('window');

const CATEGORIES = [
    { label: 'Loyer', icon: '🏠', color: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-100' },
    { label: 'Matériel', icon: '📦', color: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-100' },
    { label: 'Transport', icon: '🚗', color: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-100' },
    { label: 'Salaire', icon: '👥', color: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-100' },
    { label: 'Marketing', icon: '📢', color: 'bg-pink-50', textColor: 'text-pink-700', borderColor: 'border-pink-100' },
    { label: 'Autre', icon: '✨', color: 'bg-slate-50', textColor: 'text-slate-700', borderColor: 'border-slate-100' },
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
        const current = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
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

            {/* Premium Header */}
            <LinearGradient
                colors={['#1E40AF', '#1e3a8a']}
                className="pt-14 pb-10 px-6 rounded-b-[42px] shadow-2xl z-10"
            >
                <View className="flex-row justify-between items-center mb-6">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        disabled={saving}
                        className="w-10 h-10 bg-white/10 rounded-[14px] items-center justify-center border border-white/20"
                    >
                        <ArrowLeft size={20} color="white" strokeWidth={3} />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-xl font-black text-white tracking-tight">Dépense</Text>
                        <Text className="text-blue-200/60 text-[9px] font-black uppercase tracking-[2px] mt-0.5">Nouvelle Saisie</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/expenses/scan')}
                        className="w-10 h-10 bg-white/10 rounded-[14px] items-center justify-center border border-white/20"
                    >
                        <ScanLine size={18} color="white" strokeWidth={2.5} />
                    </TouchableOpacity>
                </View>

                {/* Amount Input Stylized */}
                <View className="bg-white/10 p-6 rounded-[32px] border border-white/20 backdrop-blur-md items-center">
                    <Text className="text-blue-200/60 text-[8px] font-black uppercase tracking-[2px] mb-2">Montant de la dépense</Text>
                    <View className="flex-row items-baseline justify-center">
                        <TextInput
                            className="text-white text-5xl font-black text-center min-w-[100px]"
                            value={amount}
                            onChangeText={(val) => setAmount(val.replace(/[^0-9.]/g, ''))}
                            placeholder="0"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            keyboardType="numeric"
                        />
                        <Text className="text-blue-200 text-xl font-black ml-2 uppercase">{currency}</Text>
                    </View>

                    <View className="flex-row flex-wrap justify-center gap-2 mt-6">
                        {QUICK_AMOUNTS.map((val) => (
                            <TouchableOpacity
                                key={val}
                                onPress={() => handleAddAmount(val)}
                                className="bg-white/15 px-4 py-2 rounded-xl border border-white/10 active:bg-white/25"
                            >
                                <Text className="text-white font-black text-[10px]">+{val.toLocaleString()}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 24, paddingBottom: 150 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Category Selection */}
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-2">Type de dépense</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-8"
                        contentContainerStyle={{ paddingRight: 20 }}
                    >
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.label}
                                onPress={() => setCategory(cat.label)}
                                className={`mr-3 px-5 py-4 rounded-[24px] border items-center justify-center flex-row shadow-sm ${category === cat.label
                                        ? 'bg-slate-900 border-slate-900'
                                        : 'bg-white border-slate-100'
                                    }`}
                            >
                                <Text className="text-xl mr-2">{cat.icon}</Text>
                                <Text className={`font-black text-xs uppercase tracking-widest ${category === cat.label ? 'text-white' : 'text-slate-600'
                                    }`}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Details Form */}
                    <View className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-8">
                        <View className="mb-6">
                            <View className="flex-row items-center mb-2 ml-1">
                                <CalendarIcon size={16} color="#1E40AF" strokeWidth={2.5} className="mr-2" />
                                <Text className="text-slate-900 font-black text-xs uppercase tracking-tight">Date de l'achat</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 p-4 rounded-2xl border border-slate-50 text-slate-900 font-bold text-base"
                                value={date}
                                onChangeText={setDate}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>

                        <View>
                            <View className="flex-row items-center mb-2 ml-1">
                                <FileText size={16} color="#1E40AF" strokeWidth={2.5} className="mr-2" />
                                <Text className="text-slate-900 font-black text-xs uppercase tracking-tight">Description</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 p-4 rounded-2xl border border-slate-50 text-slate-900 font-bold text-base min-h-[100px]"
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Détaillez votre dépense (facultatif)"
                                placeholderTextColor="#CBD5E1"
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Receipt Section */}
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-2">Justificatif</Text>
                    <View className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        {receiptUri ? (
                            <View className="relative">
                                <Image
                                    source={{ uri: receiptUri }}
                                    className="w-full h-56 rounded-2xl"
                                    resizeMode="cover"
                                />
                                <LinearGradient
                                    colors={['rgba(0,0,0,0.6)', 'transparent']}
                                    className="absolute top-0 left-0 right-0 h-16 rounded-t-2xl px-4 pt-2"
                                >
                                    <TouchableOpacity
                                        onPress={() => setReceiptUri(null)}
                                        className="self-end bg-black/30 p-2 rounded-full border border-white/20"
                                    >
                                        <X size={16} color="white" strokeWidth={3} />
                                    </TouchableOpacity>
                                </LinearGradient>
                                {uploading && (
                                    <View className="absolute inset-0 bg-slate-900/40 rounded-2xl items-center justify-center">
                                        <ActivityIndicator color="white" />
                                        <Text className="text-white font-black text-[10px] mt-2 uppercase tracking-widest">Envoi en cours...</Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View className="flex-row gap-4">
                                <TouchableOpacity
                                    onPress={handleCamera}
                                    className="flex-1 bg-slate-50 border border-slate-100 p-6 rounded-3xl items-center justify-center"
                                >
                                    <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm mb-3">
                                        <Camera size={24} color="#1E40AF" strokeWidth={2.5} />
                                    </View>
                                    <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest">Photo</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    className="flex-1 bg-slate-50 border border-slate-100 p-6 rounded-3xl items-center justify-center"
                                >
                                    <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm mb-3">
                                        <Upload size={24} color="#1E40AF" strokeWidth={2.5} />
                                    </View>
                                    <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest">Galerie</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Floating Action Button for Save */}
            <View className="absolute bottom-10 left-6 right-6 z-50">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving || !amount}
                    activeOpacity={0.9}
                    className="shadow-2xl shadow-slate-900/40"
                >
                    <LinearGradient
                        colors={amount ? ['#1E40AF', '#1e3a8a'] : ['#E2E8F0', '#CBD5E1']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="h-16 rounded-[24px] items-center justify-center flex-row px-8"
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text className={`font-black text-xs uppercase tracking-[3px] mr-3 ${!amount ? 'text-slate-400' : 'text-white'}`}>
                                    Enregistrer la Dépense
                                </Text>
                                {amount && <Check size={20} color="white" strokeWidth={3} />}
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}
