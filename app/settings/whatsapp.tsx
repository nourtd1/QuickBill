import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';
import {
    ArrowLeft,
    MessageSquare,
    Info,
    Check
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { showError, showSuccess } from '../../lib/error-handler';
import { StatusBar } from 'expo-status-bar';

export default function WhatsappSettingsScreen() {
    const router = useRouter();
    const { profile, loading: profileLoading, fetchProfile, updateProfile } = useProfile();

    const [whatsappTemplate, setWhatsappTemplate] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile) {
            setWhatsappTemplate(profile.whatsapp_template || 'Bonjour {client}, voici votre facture {numero} de {montant} {devise}. Merci de votre confiance !');
        }
    }, [profile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await updateProfile({
                whatsapp_template: whatsappTemplate.trim(),
            });

            if (error) {
                showError(error, "Erreur de mise à jour");
            } else {
                showSuccess("Template WhatsApp mis à jour !");
                router.back();
            }
        } catch (error) {
            showError(error, "Erreur de mise à jour");
        } finally {
            setSaving(false);
        }
    };

    if (profileLoading && !profile) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={['#10B981', '#059669']}
                    className="pt-16 pb-20 px-6 rounded-b-[40px] shadow-lg"
                >
                    <View className="flex-row justify-between items-center mb-8">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-white/10 p-3 rounded-2xl border border-white/10"
                        >
                            <ArrowLeft size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white text-xl font-black">WhatsApp Express</Text>
                        <View className="w-12" />
                    </View>

                    <View className="items-center">
                        <View className="w-20 h-20 bg-white/20 rounded-[28px] items-center justify-center border border-white/20 shadow-xl">
                            <MessageSquare size={40} color="white" />
                        </View>
                        <Text className="text-white font-bold mt-4 text-center px-10">
                            Personnalisez le message envoyé à vos clients sur WhatsApp.
                        </Text>
                    </View>
                </LinearGradient>

                <View className="px-6 -mt-8 pb-32">
                    <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 mb-8">
                        <View className="relative mb-5">
                            <View className="absolute -left-1 top-4 w-4 h-4 bg-emerald-50/80 transform rotate-45 z-0" />
                            <TextInput
                                className="bg-emerald-50/80 p-5 rounded-2xl text-slate-700 font-medium text-sm border border-emerald-100 z-10 min-h-[150px]"
                                multiline
                                textAlignVertical="top"
                                value={whatsappTemplate}
                                onChangeText={setWhatsappTemplate}
                                placeholder="Rédigez votre message ici..."
                            />
                        </View>

                        <Text className="text-slate-400 text-[10px] font-black uppercase mb-3 tracking-widest">Insérer une variable</Text>
                        <View className="flex-row flex-wrap mb-6" style={{ gap: 8 }}>
                            {[
                                { tag: '{client}', label: '🤝 Client', color: 'bg-blue-100/80 text-blue-700' },
                                { tag: '{numero}', label: '🆔 Numéro', color: 'bg-purple-100/80 text-purple-700' },
                                { tag: '{montant}', label: '💰 Montant', color: 'bg-orange-100/80 text-orange-700' },
                                { tag: '{devise}', label: '🌍 Devise', color: 'bg-slate-200/80 text-slate-700' }
                            ].map(item => (
                                <TouchableOpacity
                                    key={item.tag}
                                    onPress={() => setWhatsappTemplate(prev => prev + (prev.length > 0 ? ' ' : '') + item.tag)}
                                    className={`${item.color.split(' ')[0]} px-3 py-2 rounded-xl border border-white/50 shadow-sm`}
                                >
                                    <Text className={`${item.color.split(' ')[1]} text-[11px] font-black`}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View className="p-4 bg-slate-50 rounded-2xl flex-row items-center border border-slate-100">
                            <Info size={18} color="#64748B" />
                            <Text className="text-slate-500 text-xs ml-3 font-medium flex-1">
                                Touchez une variable pour l'insérer. Elles seront remplacées par les vraies infos lors de l'envoi.
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        className={`w-full py-5 rounded-[24px] flex-row items-center justify-center shadow-lg ${saving ? 'bg-slate-400' : 'bg-emerald-600 shadow-emerald-100'
                            }`}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text className="text-white font-black text-lg mr-2">Enregistrer le Template</Text>
                                <Check size={24} color="white" strokeWidth={3} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
