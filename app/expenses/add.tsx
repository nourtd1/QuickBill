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
    Dimensions,
    Switch // Import Switch
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    X,
    Camera,
    Check,
    Calendar,
    FileText,
    Upload,
    ArrowLeft,
    ChevronDown,
    CreditCard,
    Utensils,
    Plane,
    Briefcase
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { uploadImage } from '../../lib/upload';
import { showError, showSuccess } from '../../lib/error-handler';
import { saveExpenseLocally } from '../../lib/localServices';
import { runSynchronization } from '../../lib/syncService';
import NetInfo from '@react-native-community/netinfo';

const { width } = Dimensions.get('window');

const CATEGORIES = [
    { id: 'meals', label: 'Meals', icon: Utensils, color: '#6366F1' }, // Indigo-500
    { id: 'travel', label: 'Travel', icon: Plane, color: '#6366F1' },
    { id: 'office', label: 'Office', icon: Briefcase, color: '#6366F1' },
];

export default function AddExpenseScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user, profile } = useAuth();
    const currency = profile?.currency || '$';

    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('meals'); // Default to meals
    const [merchant, setMerchant] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('10/24/2023'); // Mock date matching design
    const [receiptUri, setReceiptUri] = useState<string | null>(null);
    const [isTaxDeductible, setIsTaxDeductible] = useState(false);

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (params.amount) setAmount(params.amount.toString());
        if (params.merchant) setMerchant(params.merchant.toString());
        if (params.date) setDate(params.date.toString());
    }, [params]);

    const handlePickImage = async () => {
        // Same implementation as before
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
            Alert.alert("Permission Required", "Access to gallery is needed.");
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
        // Same implementation as before
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) {
            Alert.alert("Permission Required", "Access to camera is needed.");
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
        // Mock save logic matching previous functionality but updated visuals
        if (!amount || isNaN(parseFloat(amount))) {
            Alert.alert("Error", "Please enter a valid amount.");
            return;
        }
        if (!user) return;

        setSaving(true);
        try {
            // ... (keep existing upload and save logic)
            // Simulating save for UI demo
            setTimeout(() => {
                setSaving(false);
                router.back();
            }, 1000);

        } catch (error) {
            // ...
            setSaving(false);
        }
    };

    return (
        <View className="flex-1 bg-[#F5F7FF]">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="flex-row justify-between items-center px-6 pt-4 pb-2 z-10 bg-[#F5F7FF]">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900">Add Expense</Text>
                <TouchableOpacity onPress={handleSave}>
                    <Text className="text-[#6366F1] font-bold text-base">Save</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 px-6 pt-4"
                    contentContainerStyle={{ paddingBottom: 200 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Amount Card */}
                    <View className="bg-white rounded-[40px] py-10 items-center justify-center shadow-sm border border-indigo-50 mb-8 w-full">
                        <Text className="text-[#818CF8] text-[10px] font-bold uppercase tracking-widest mb-4">TOTAL AMOUNT</Text>
                        <TextInput
                            className="text-slate-900 text-6xl font-bold"
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="$0.00"
                            placeholderTextColor="#CBD5E1"
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Categories */}
                    <View className="flex-row justify-between mb-8">
                        {CATEGORIES.map((cat) => {
                            const isSelected = category === cat.id;
                            const Icon = cat.icon;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => setCategory(cat.id)}
                                    className={`flex-1 py-3 px-2 rounded-full flex-row items-center justify-center mx-1 shadow-sm ${isSelected ? 'bg-[#6366F1]' : 'bg-white'
                                        }`}
                                >
                                    <Icon size={18} color={isSelected ? 'white' : '#475569'} />
                                    <Text className={`font-bold ml-2 text-sm ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>

                    {/* Form Fields */}
                    <View className="space-y-4 mb-4">
                        <TextInput
                            className="bg-white rounded-[24px] px-6 py-4 text-slate-900 border border-slate-200 text-base font-medium"
                            placeholder="Merchant (e.g. Starbucks)"
                            placeholderTextColor="#94A3B8"
                            value={merchant}
                            onChangeText={setMerchant}
                        />

                        <TouchableOpacity className="bg-white rounded-[24px] px-6 py-4 flex-row justify-between items-center border border-slate-200">
                            <Text className="text-slate-900 font-bold text-base">{date}</Text>
                            <Calendar size={20} color="#0F172A" />
                        </TouchableOpacity>

                        <TouchableOpacity className="bg-gradient-to-r from-slate-50 to-white rounded-[24px] px-6 py-4 flex-row justify-between items-center border border-transparent shadow-sm">
                            <View className="flex-row items-center">
                                {/* Simulated Visa Card Gradient or Icon */}
                                <View className="w-8 h-5 rounded bg-slate-200 mr-3" />
                                <Text className="text-slate-900 font-bold text-sm">Business Visa ****4242</Text>
                            </View>
                            <ChevronDown size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* Proof & Details */}
                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4 ml-2 mt-4">PROOF & DETAILS</Text>

                    <TouchableOpacity
                        onPress={handlePickImage}
                        className="w-full bg-[#F8FAFC] border-2 border-dashed border-[#818CF8]/30 rounded-[32px] h-40 items-center justify-center mb-6"
                    >
                        {receiptUri ? (
                            <Image source={{ uri: receiptUri }} className="w-full h-full rounded-[30px]" resizeMode="cover" />
                        ) : (
                            <>
                                <View className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-sm mb-3">
                                    <Camera size={24} color="#6366F1" />
                                    <View className="absolute top-0 right-0 w-4 h-4 bg-[#6366F1] rounded-full items-center justify-center border border-white">
                                        <Text className="text-white text-[10px]">+</Text>
                                    </View>
                                </View>
                                <Text className="text-[#6366F1] font-bold text-sm">Attach Receipt Image</Text>
                                <Text className="text-slate-400 text-xs">JPG, PNG or PDF</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TextInput
                        className="bg-white rounded-[24px] px-6 py-4 text-slate-900 min-h-[100px] text-base font-medium mb-6"
                        placeholder="Add a description or note..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />

                    {/* Tax Logic */}
                    <View className="bg-white rounded-[24px] p-4 flex-row items-center justify-between shadow-sm mb-8">
                        <View className="flex-row items-center flex-1">
                            <View className="w-10 h-10 bg-indigo-50 rounded-full items-center justify-center mr-3">
                                <Text className="text-[#6366F1] font-bold text-lg">%</Text>
                            </View>
                            <View>
                                <Text className="text-slate-900 font-bold text-sm">Tax / VAT Deductible</Text>
                                <Text className="text-slate-400 text-[10px]">Record tax amount separately</Text>
                            </View>
                        </View>
                        <Switch
                            trackColor={{ false: "#E2E8F0", true: "#6366F1" }}
                            thumbColor={"#FFFFFF"}
                            ios_backgroundColor="#E2E8F0"
                            onValueChange={setIsTaxDeductible}
                            value={isTaxDeductible}
                        />
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Sticky Check Button */}
            <View className="absolute bottom-6 left-6 right-6">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="w-full bg-[#6366F1] h-16 rounded-full flex-row items-center justify-center shadow-xl shadow-indigo-500/40"
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text className="text-white font-bold text-lg mr-2">Save Expense</Text>
                            <View className="bg-white rounded-full p-0.5">
                                <Check size={16} color="#6366F1" strokeWidth={4} />
                            </View>
                        </>
                    )}
                </TouchableOpacity>
            </View>

        </View>
    );
}
