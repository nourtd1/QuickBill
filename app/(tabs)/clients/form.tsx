import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, User, Phone, Mail, MapPin, Trash2 } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

export default function ClientFormScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditing);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        if (isEditing) {
            fetchClientDetails();
        }
    }, [id]);

    const fetchClientDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setName(data.name);
                setEmail(data.email || '');
                setPhone(data.phone || '');
                setAddress(data.address || '');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des détails:', error);
            Alert.alert('Erreur', 'Impossible de charger les informations du client.');
            router.back();
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Champs requis', 'Le nom du client est obligatoire.');
            return;
        }

        setLoading(true);
        try {
            const clientData = {
                name: name.trim(),
                email: email.trim() || null,
                phone: phone.trim() || null,
                address: address.trim() || null,
            };

            if (isEditing) {
                const { error } = await supabase
                    .from('clients')
                    .update(clientData)
                    .eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('clients')
                    .insert([{
                        ...clientData,
                        user_id: user?.id
                    }]);
                if (error) throw error;
            }

            router.back();
        } catch (error: any) {
            console.error('Erreur lors de la sauvegarde:', error);
            Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la sauvegarde.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Supprimer le client',
            'Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const { error } = await supabase
                                .from('clients')
                                .delete()
                                .eq('id', id);
                            if (error) throw error;
                            router.back();
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de supprimer le client.');
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
                <ActivityIndicator color="#007AFF" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-4 py-4 flex-row items-center justify-between border-b border-slate-100">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <ArrowLeft size={24} color="#334155" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900">
                        {isEditing ? 'Modifier le client' : 'Nouveau client'}
                    </Text>
                </View>

                {isEditing && (
                    <TouchableOpacity onPress={handleDelete} className="p-2">
                        <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-6 pt-6">
                    <View className="space-y-6 pb-20">

                        {/* Champ : Nom */}
                        <View>
                            <Text className="text-slate-700 font-semibold mb-2 ml-1">Nom du client *</Text>
                            <View className="flex-row items-center bg-white border border-slate-100 rounded-2xl px-4 h-14">
                                <User size={20} color="#94A3B8" />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-slate-900"
                                    placeholder="Ex: Jean Dupont"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        {/* Champ : Téléphone */}
                        <View>
                            <Text className="text-slate-700 font-semibold mb-2 ml-1">Téléphone</Text>
                            <View className="flex-row items-center bg-white border border-slate-100 rounded-2xl px-4 h-14">
                                <Phone size={20} color="#94A3B8" />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-slate-900"
                                    placeholder="Ex: +33 6 12 34 56 78"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        {/* Champ : Email */}
                        <View>
                            <Text className="text-slate-700 font-semibold mb-2 ml-1">Email</Text>
                            <View className="flex-row items-center bg-white border border-slate-100 rounded-2xl px-4 h-14">
                                <Mail size={20} color="#94A3B8" />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-slate-900"
                                    placeholder="Ex: jean.dupont@email.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* Champ : Adresse */}
                        <View>
                            <Text className="text-slate-700 font-semibold mb-2 ml-1">Adresse</Text>
                            <View className="flex-row items-start bg-white border border-slate-100 rounded-2xl px-4 py-3 min-h-[100]">
                                <MapPin size={20} color="#94A3B8" className="mt-1" />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-slate-900"
                                    placeholder="Adresse complète du client..."
                                    value={address}
                                    onChangeText={setAddress}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Button */}
            <View className="px-6 pb-8 pt-4 bg-white border-t border-slate-50">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    className={`bg-blue-600 h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200 ${loading ? 'opacity-70' : ''}`}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text className="text-white text-lg font-bold mr-2">
                                {isEditing ? 'Mettre à jour' : 'Enregistrer le client'}
                            </Text>
                            <Check size={20} color="white" strokeWidth={3} />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
