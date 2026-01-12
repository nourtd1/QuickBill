import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, Trash2, Package, Info, CreditCard } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <StatusBar style="dark" />

            {/* Header */}
            <View className="px-6 py-4 bg-white border-b border-slate-100 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 bg-slate-50 rounded-full mr-4">
                        <ArrowLeft size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="text-xl font-black text-slate-900">{id ? 'Modifier' : 'Nouvel Article'}</Text>
                </View>
                {id && (
                    <TouchableOpacity onPress={handleDelete} className="p-2 bg-red-50 rounded-full">
                        <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-6 pt-6">
                    <View className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-50 mb-6">
                        {/* Name */}
                        <View className="mb-6">
                            <View className="flex-row items-center mb-2 ml-1">
                                <Package size={16} color="#64748B" className="mr-2" />
                                <Text className="text-slate-500 font-bold text-xs uppercase tracking-wider">Nom du produit/service</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-slate-900 font-bold text-base"
                                placeholder="ex: Site Web Vitrine"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        {/* Description */}
                        <View className="mb-6">
                            <View className="flex-row items-center mb-2 ml-1">
                                <Info size={16} color="#64748B" className="mr-2" />
                                <Text className="text-slate-500 font-bold text-xs uppercase tracking-wider">Description (Détails)</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-slate-900 font-medium text-base min-h-[100px]"
                                placeholder="Décrivez votre service..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Price */}
                        <View>
                            <View className="flex-row items-center mb-2 ml-1">
                                <CreditCard size={16} color="#64748B" className="mr-2" />
                                <Text className="text-slate-500 font-bold text-xs uppercase tracking-wider">Prix unitaire ({profile?.currency || 'RWF'})</Text>
                            </View>
                            <TextInput
                                className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-slate-900 font-black text-xl"
                                placeholder="0.00"
                                value={unitPrice}
                                onChangeText={setUnitPrice}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </ScrollView>

                {/* Bottom Action */}
                <View className="p-6 bg-white border-t border-slate-100">
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading}
                        className="w-full bg-primary h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200"
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Save size={20} color="white" className="mr-2" />
                                <Text className="text-white font-black text-lg uppercase tracking-wide">Enregistrer</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
