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
    Alert,
    Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, User, Phone, Mail, MapPin, Trash2 } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import * as ExpoCrypto from 'expo-crypto';
import * as Clipboard from 'expo-clipboard';

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
    const [portalToken, setPortalToken] = useState<string | null>(null);

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
                setPortalToken(data.portal_token || null);
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
                        user_id: user?.id,
                        portal_token: ExpoCrypto.randomUUID()
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
                                {isEditing ? 'Modifier Client' : 'Nouveau Client'}
                            </Text>
                            {isEditing ? (
                                <TouchableOpacity onPress={handleDelete} className="bg-red-500/20 p-3 rounded-2xl border border-red-500/30">
                                    <Trash2 size={24} color="#FECACA" />
                                </TouchableOpacity>
                            ) : (
                                <View className="w-12" />
                            )}
                        </View>
                    </View>

                    {/* Overlapping Content */}
                    <View className="px-6 -mt-16">
                        <View className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/50 mb-8 border border-slate-100">
                            <View className="space-y-5">
                                {/* Name Input */}
                                <View>
                                    <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Identité</Text>
                                    <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-16 transition-all focus:border-primary focus:bg-blue-50/30">
                                        <View className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm mr-3">
                                            <User size={20} color="#1E40AF" />
                                        </View>
                                        <TextInput
                                            className="flex-1 text-base text-slate-900 font-semibold"
                                            placeholder="Nom complet ou société"
                                            placeholderTextColor="#94A3B8"
                                            value={name}
                                            onChangeText={setName}
                                            autoCapitalize="words"
                                        />
                                    </View>
                                </View>

                                {/* Phone Input */}
                                <View>
                                    <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Contact</Text>
                                    <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-16 mb-3">
                                        <View className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm mr-3">
                                            <Phone size={20} color="#64748B" />
                                        </View>
                                        <TextInput
                                            className="flex-1 text-base text-slate-900 font-medium"
                                            placeholder="+33 6 00 00 00 00"
                                            placeholderTextColor="#94A3B8"
                                            value={phone}
                                            onChangeText={setPhone}
                                            keyboardType="phone-pad"
                                        />
                                    </View>

                                    <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-16">
                                        <View className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm mr-3">
                                            <Mail size={20} color="#64748B" />
                                        </View>
                                        <TextInput
                                            className="flex-1 text-base text-slate-900 font-medium"
                                            placeholder="email@exemple.com"
                                            placeholderTextColor="#94A3B8"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                {/* Portal Link (If exists) */}
                                {isEditing && (
                                    <View>
                                        <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Lien du Portail Client</Text>
                                        <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex-row items-center border-dashed">
                                            <View className="flex-1">
                                                <Text className="text-blue-800 font-bold text-xs" numberOfLines={1}>
                                                    {`https://quickbill.app/public/client/${portalToken || 'Généré au prochain enregistrement'}`}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={async () => {
                                                    if (portalToken) {
                                                        const url = `https://quickbill.app/public/client/${portalToken}`;
                                                        await Clipboard.setStringAsync(url);
                                                        Alert.alert('Copié', 'Lien du portail copié !');
                                                    } else {
                                                        Alert.alert('Infos', 'Le lien sera disponible après le premier enregistrement.');
                                                    }
                                                }}
                                                className="bg-primary px-3 py-1.5 rounded-lg ml-2"
                                            >
                                                <Text className="text-white text-[10px] font-bold uppercase">Copier</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <Text className="text-slate-400 text-[10px] mt-2 ml-1 italic">
                                            Ce lien permet au client de voir tout son historique (factures et devis).
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={loading}
                            className={`w-full h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200 mb-10 ${loading ? 'bg-primary/70' : 'bg-primary'}`}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text className="text-white text-lg font-bold mr-3">
                                        {isEditing ? 'Mettre à jour' : 'Enregistrer'}
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
