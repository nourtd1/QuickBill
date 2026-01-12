import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Trash2, Package, Info, CreditCard, Box } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { showSuccess, showError } from '../../lib/error-handler';

export default function ItemForm() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { user, profile } = useAuth();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (id) {
            fetchItem();
        }
    }, [id]);

    const fetchItem = async () => {
        setFetching(true);
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setName(data.name);
                setDescription(data.description || '');
                setUnitPrice(data.unit_price.toString());
            }
        } catch (error) {
            console.error('Error fetching item:', error);
            showError(error, "Erreur de chargement");
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Erreur', 'Le nom de l\'article est requis.');
            return;
        }

        setLoading(true);
        try {
            const itemData = {
                user_id: user?.id,
                name: name.trim(),
                description: description.trim() || null,
                unit_price: parseFloat(unitPrice) || 0,
                currency: profile?.currency || 'RWF'
            };

            if (id) {
                const { error } = await supabase
                    .from('items')
                    .update(itemData)
                    .eq('id', id);
                if (error) throw error;
                showSuccess("Article mis à jour");
            } else {
                const { error } = await supabase
                    .from('items')
                    .insert(itemData);
                if (error) throw error;
                showSuccess("Article créé avec succès");
            }
            router.back();
        } catch (error) {
            showError(error, "Erreur de sauvegarde");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Supprimer',
            'Êtes-vous sûr de vouloir supprimer cet article ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const { error } = await supabase.from('items').delete().eq('id', id);
                            if (error) throw error;
                            showSuccess("Article supprimé");
                            router.back();
                        } catch (error) {
                            showError(error, "Erreur de suppression");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (fetching) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50">
                <ActivityIndicator size="large" color="#1E40AF" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    {/* Modern Header */}
                    <View className="bg-primary pt-16 pb-24 px-6 rounded-b-[40px] shadow-lg">
                        <View className="flex-row justify-between items-center">
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="bg-white/10 p-3 rounded-2xl border border-white/10"
                            >
                                <ArrowLeft size={24} color="white" />
                            </TouchableOpacity>
                            <Text className="text-white text-xl font-black tracking-tight">
                                {id ? 'Modifier Article' : 'Nouvel Article'}
                            </Text>
                            {id ? (
                                <TouchableOpacity onPress={handleDelete} className="bg-red-500/20 p-3 rounded-2xl border border-red-500/30">
                                    <Trash2 size={24} color="#FECACA" />
                                </TouchableOpacity>
                            ) : (
                                <View className="w-12" />
                            )}
                        </View>
                        <Text className="text-blue-200 text-center mt-4 text-sm font-medium">
                            {id ? 'Mettez à jour les détails de votre produit.' : 'Ajoutez un produit ou service au catalogue.'}
                        </Text>
                    </View>

                    {/* Overlapping Content */}
                    <View className="px-6 -mt-10 pb-20">
                        <View className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8">
                            <View className="space-y-6">
                                {/* Name Input */}
                                <View>
                                    <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Désignation</Text>
                                    <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-16 focus:border-primary focus:bg-blue-50/30">
                                        <View className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm mr-3">
                                            <Package size={20} color="#1E40AF" />
                                        </View>
                                        <TextInput
                                            className="flex-1 text-base text-slate-900 font-bold"
                                            placeholder="Ex: Conception Site Web"
                                            placeholderTextColor="#94A3B8"
                                            value={name}
                                            onChangeText={setName}
                                        />
                                    </View>
                                </View>

                                {/* Description Input */}
                                <View>
                                    <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Description (Optionnel)</Text>
                                    <View className="flex-row items-start bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 min-h-[120]">
                                        <View className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm mr-3 mt-1">
                                            <Info size={20} color="#64748B" />
                                        </View>
                                        <TextInput
                                            className="flex-1 text-base text-slate-900 font-medium pt-3"
                                            placeholder="Décrivez les caractéristiques..."
                                            placeholderTextColor="#94A3B8"
                                            value={description}
                                            onChangeText={setDescription}
                                            multiline
                                            numberOfLines={4}
                                            textAlignVertical="top"
                                        />
                                    </View>
                                </View>

                                {/* Price Input */}
                                <View>
                                    <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Prix Unitaire</Text>
                                    <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-20">
                                        <View className="w-12 h-12 bg-emerald-50 rounded-xl items-center justify-center shadow-sm mr-3 border border-emerald-100">
                                            <CreditCard size={24} color="#10B981" />
                                        </View>
                                        <TextInput
                                            className="flex-1 text-2xl text-slate-900 font-black h-full"
                                            placeholder="0"
                                            placeholderTextColor="#94A3B8"
                                            value={unitPrice}
                                            onChangeText={setUnitPrice}
                                            keyboardType="numeric"
                                        />
                                        <Text className="text-slate-400 font-bold text-lg">{profile?.currency || 'RWF'}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={loading}
                            className={`w-full h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200 mb-6 ${loading ? 'bg-primary/70' : 'bg-primary'}`}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text className="text-white text-lg font-bold mr-3">
                                        {id ? 'Mettre à jour' : 'Ajouter au catalogue'}
                                    </Text>
                                    <View className="bg-white/20 p-1.5 rounded-full">
                                        <Check size={20} color="white" strokeWidth={3} />
                                    </View>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
