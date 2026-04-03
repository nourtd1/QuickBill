import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform, Image, Keyboard
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Camera, Check, Calendar, Store, ArrowLeft, Utensils, Plane, Briefcase, ShoppingBag, Truck } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { uploadImage } from '../../lib/upload';
import { showError, showSuccess } from '../../lib/error-handler';
import { saveExpenseLocally } from '../../lib/localServices';
import NetInfo from '@react-native-community/netinfo';

const CATEGORIES = [
    { id: 'meals', label: 'Repas', icon: Utensils },
    { id: 'travel', label: 'Voyage', icon: Plane },
    { id: 'office', label: 'Bureau', icon: Briefcase },
    { id: 'supplies', label: 'Matériel', icon: ShoppingBag },
    { id: 'transport', label: 'Transport', icon: Truck },
];

export default function AddExpenseScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuth();

    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('meals');
    const [merchant, setMerchant] = useState('');
    const [description, setDescription] = useState('');
    // YYYY-MM-DD format as returned by the AI
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [receiptUri, setReceiptUri] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (params.amount) setAmount(params.amount.toString());
        if (params.merchant) setMerchant(params.merchant.toString());
        if (params.date) setDate(params.date.toString());
        if (params.imageUri) setReceiptUri(params.imageUri.toString());
        
        // Map AI suggested category if present
        if (params.category) {
            const aiCat = params.category.toString();
            // Simple mapping logic
            if (aiCat.includes('Alimentation') || aiCat.includes('Repas')) setCategory('meals');
            else if (aiCat.includes('Transport') || aiCat.includes('Voyage')) setCategory('transport');
            else if (aiCat.includes('Bureau') || aiCat.includes('Matériel')) setCategory('office');
            else if (aiCat.includes('Loisirs') || aiCat.includes('Voyage')) setCategory('travel');
            else if (aiCat.includes('Santé') || aiCat.includes('Soins')) setCategory('supplies');
        }

        if (params.scanData) {
            try {
                const data = JSON.parse(params.scanData as string);
                // Pre-fill description if items exist
                if (data.items && data.items.length > 0) {
                    const desc = data.items.map((i: any) => `${i.description} (${i.amount})`).join(', ');
                    setDescription(desc);
                }
            } catch (e) {
                console.log("Could not parse scanData");
            }
        }
    }, [params]);

    const handlePickImage = async () => {
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
            Alert.alert("Permission", "L'accès à la galerie est nécessaire.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
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
            if (receiptUri && !receiptUri.startsWith('http')) {
                receiptUrl = await uploadImage(receiptUri, 'receipts');
            }

            const expenseData = {
                user_id: user.id,
                amount: parseFloat(amount),
                category,
                merchant: merchant.trim() || undefined,
                description: description.trim() || undefined,
                date: date || new Date().toISOString().split('T')[0],
                receipt_url: receiptUrl || (receiptUri && receiptUri.startsWith('http') ? receiptUri : undefined), 
            };

            const netState = await NetInfo.fetch();
            
            if (netState.isConnected) {
                const { error } = await supabase.from('expenses').insert(expenseData);
                if (error) throw error;
                showSuccess("Dépense enregistrée avec succès !");
            } else {
                await saveExpenseLocally(expenseData);
                showSuccess("Dépense sauvegardée localement.");
            }

            // Go back to the dashboard/expenses list
            router.replace('/(tabs)/');
        } catch (error) {
            showError(error, "Échec de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="flex-row justify-between items-center px-6 pt-14 pb-4 bg-white shadow-sm z-10">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full bg-slate-100">
                    <ArrowLeft size={20} color="#0F172A" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-slate-900">Nouvelle Dépense</Text>
                <View className="w-10" />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                <ScrollView 
                    className="flex-1 px-6" 
                    contentContainerStyle={{ paddingTop: 24, paddingBottom: 150 }} 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Amount Input */}
                    <View className="bg-white rounded-[32px] p-8 items-center justify-center shadow-lg shadow-indigo-100 mb-8 border border-slate-100">
                        <Text className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">Montant Total</Text>
                        <TextInput
                            className="text-slate-900 text-5xl font-black text-center w-full"
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            placeholderTextColor="#CBD5E1"
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Category Selector */}
                    <Text className="text-slate-500 font-bold mb-3 ml-2 text-sm">Catégorie</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8" contentContainerStyle={{ paddingRight: 20 }}>
                        {CATEGORIES.map((cat) => {
                            const isSelected = category === cat.id;
                            const Icon = cat.icon;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => setCategory(cat.id)}
                                    className={`py-3 px-5 rounded-full flex-row items-center justify-center mr-3 border ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200 shadow-sm'}`}
                                >
                                    <Icon size={16} color={isSelected ? 'white' : '#64748B'} />
                                    <Text className={`font-bold ml-2 text-sm ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Details Form */}
                    <Text className="text-slate-500 font-bold mb-3 ml-2 text-sm">Détails</Text>
                    <View className="space-y-4 mb-8">
                        <View className="flex-row items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3">
                                <Store size={20} color="#6366F1" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Marchand / Émetteur</Text>
                                <TextInput
                                    value={merchant}
                                    onChangeText={setMerchant}
                                    className="text-slate-900 font-bold text-base p-0"
                                    placeholder="Ex: Starbucks, Taxify..."
                                />
                            </View>
                        </View>

                        <View className="flex-row items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3">
                                <Calendar size={20} color="#6366F1" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Date de la dépense</Text>
                                <TextInput
                                    value={date}
                                    onChangeText={setDate}
                                    className="text-slate-900 font-bold text-base p-0"
                                    placeholder="YYYY-MM-DD"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Notes */}
                    <Text className="text-slate-500 font-bold mb-3 ml-2 text-sm">Notes & Reçu</Text>
                    <TextInput
                        className="bg-white rounded-2xl px-5 py-4 text-slate-900 min-h-[100px] text-base font-medium mb-4 border border-slate-200 shadow-sm"
                        placeholder="Description supplémentaire, taxes..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />

                    {/* Receipt Image */}
                    <TouchableOpacity
                        onPress={handlePickImage}
                        className="w-full bg-slate-100 border-2 border-dashed border-indigo-200 rounded-3xl h-48 items-center justify-center mb-6 overflow-hidden"
                    >
                        {receiptUri ? (
                            <>
                                <Image source={{ uri: receiptUri }} className="w-full h-full opacity-80" resizeMode="cover" />
                                <View className="absolute bg-black/60 px-4 py-2 rounded-full flex-row items-center">
                                    <Camera size={14} color="white" />
                                    <Text className="text-white font-bold text-xs ml-2">Changer la photo</Text>
                                </View>
                            </>
                        ) : (
                            <View className="items-center">
                                <View className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-sm mb-3">
                                    <Camera size={24} color="#6366F1" />
                                </View>
                                <Text className="text-indigo-600 font-bold text-sm mb-1">Joindre un reçu</Text>
                                <Text className="text-slate-400 text-xs">Prendre une photo ou choisir</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Sticky Button */}
            <View className="absolute bottom-0 left-0 right-0 bg-white/95 px-6 py-6 border-t border-slate-100">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="w-full bg-indigo-600 h-14 rounded-full flex-row items-center justify-center shadow-xl shadow-indigo-500/30"
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text className="text-white font-bold text-base mr-2">Enregistrer la Dépense</Text>
                            <Check size={18} color="white" strokeWidth={3} />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
