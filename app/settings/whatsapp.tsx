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
import { useLanguage } from '../../context/LanguageContext';
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
    const { t, language } = useLanguage();

    const [whatsappTemplate, setWhatsappTemplate] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile) {
            setWhatsappTemplate(profile.whatsapp_template || t('invoice_details.whatsapp_template'));
        }
    }, [profile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await updateProfile({
                whatsapp_template: whatsappTemplate.trim(),
            });

            if (error) {
                showError(error, t('settings.alert_error'), t);
            } else {
                showSuccess(t('business_profile.update_success'), t('common.success'), t);
                router.back();
            }
        } catch (error) {
            showError(error, t('settings.alert_error'), t);
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

    const tags = [
        { tag: '{client}', label: t('whatsapp_settings.tags.client'), color: 'bg-blue-100/80 text-blue-700' },
        { tag: '{numero}', label: t('whatsapp_settings.tags.number'), color: 'bg-purple-100/80 text-purple-700' },
        { tag: '{montant}', label: t('whatsapp_settings.tags.amount'), color: 'bg-orange-100/80 text-orange-700' },
        { tag: '{devise}', label: t('whatsapp_settings.tags.currency'), color: 'bg-slate-200/80 text-slate-700' },
        { tag: '{link}', label: t('whatsapp_settings.tags.link'), color: 'bg-emerald-100/80 text-emerald-700' }
    ];

    return (
        <View className="flex-1 bg-background">
            <StatusBar style="light" />
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="bg-primary pt-16 pb-20 px-6 rounded-b-[40px] shadow-lg">
                    <View className="flex-row justify-between items-center mb-8">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-white/10 p-3 rounded-2xl border border-white/10"
                        >
                            <ArrowLeft size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white text-xl font-black">{t('whatsapp_settings.title')}</Text>
                        <View className="w-12" />
                    </View>

                    <View className="items-center">
                        <View className="w-20 h-20 bg-white/20 rounded-[28px] items-center justify-center border border-white/20 shadow-xl">
                            <MessageSquare size={40} color="white" />
                        </View>
                        <Text className="text-white font-bold mt-4 text-center px-10">
                            {t('whatsapp_settings.desc')}
                        </Text>
                    </View>
                </View>

                <View className="px-6 -mt-8 pb-32">
                    <View className="bg-card rounded-[32px] p-6 shadow-sm mb-8">
                        <View className="relative mb-5">
                            <View className="absolute -left-1 top-4 w-4 h-4 bg-background transform rotate-45 z-0" />
                            <TextInput
                                className={`bg-background p-5 rounded-2xl text-text-main font-medium text-sm border border-slate-100 z-10 min-h-[150px] ${language === 'ar-SA' ? 'text-right' : 'text-left'}`}
                                multiline
                                textAlignVertical="top"
                                value={whatsappTemplate}
                                onChangeText={setWhatsappTemplate}
                                placeholder={t('whatsapp_settings.placeholder')}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <Text className="text-slate-400 text-[10px] font-black uppercase mb-3 tracking-widest">{t('whatsapp_settings.insert_variable')}</Text>
                        <View className="flex-row flex-wrap mb-6" style={{ gap: 8, flexDirection: language === 'ar-SA' ? 'row-reverse' : 'row' }}>
                            {tags.map(item => (
                                <TouchableOpacity
                                    key={item.tag}
                                    onPress={() => setWhatsappTemplate(prev => prev + (prev.length > 0 ? ' ' : '') + item.tag)}
                                    className={`${item.color.split(' ')[0]} px-3 py-2 rounded-xl border border-white/50 shadow-sm`}
                                >
                                    <Text className={`${item.color.split(' ')[1]} text-[11px] font-black`}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View className="p-4 bg-background rounded-2xl flex-row items-center border border-slate-100">
                            <Info size={18} color="#64748B" />
                            <Text className={`text-text-muted text-xs ml-3 font-medium flex-1 ${language === 'ar-SA' ? 'text-right' : 'text-left'}`}>
                                {t('whatsapp_settings.info')}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        className={`w-full py-5 rounded-2xl flex-row items-center justify-center shadow-lg ${saving ? 'bg-primary/70' : 'bg-primary shadow-blue-200'
                            }`}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text className="text-white font-black text-lg mr-2">{t('whatsapp_settings.save_btn')}</Text>
                                <Check size={24} color="white" strokeWidth={3} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
