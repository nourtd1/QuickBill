import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';
import { useLanguage } from '../../context/LanguageContext';
import {
    ArrowLeft,
    Bell,
    Clock,
    FileText,
    Check,
    Plus,
    X,
    MessageSquare
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { showError, showSuccess } from '../../lib/error-handler';

export default function ReminderSettingsScreen() {
    const router = useRouter();
    const { profile, loading: profileLoading, fetchProfile, updateProfile } = useProfile();
    const { t, language } = useLanguage();

    const [isEnabled, setIsEnabled] = useState(false);
    const [intervals, setIntervals] = useState<number[]>([7, 14, 30]);
    const [template, setTemplate] = useState('');
    const [saving, setSaving] = useState(false);
    const [newInterval, setNewInterval] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile) {
            setIsEnabled(!!profile.reminders_enabled);
            
            // Handle intervals (stored as JSON array in local SQLite, or proper array in Supabase)
            if (typeof profile.reminder_intervals === 'string') {
                try {
                    setIntervals(JSON.parse(profile.reminder_intervals));
                } catch (e) {
                    setIntervals([7, 14, 30]);
                }
            } else if (Array.isArray(profile.reminder_intervals)) {
                setIntervals(profile.reminder_intervals);
            }

            setTemplate(profile.reminder_template || '');
        }
    }, [profile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await updateProfile({
                reminders_enabled: isEnabled,
                reminder_intervals: intervals,
                reminder_template: template.trim()
            });

            if (error) {
                showError(error, t('settings.alert_error'), t);
            } else {
                showSuccess(t('reminders.success_update'), t('common.success'), t);
                router.back();
            }
        } catch (error) {
            showError(error, t('settings.alert_error'), t);
        } finally {
            setSaving(false);
        }
    };

    const addInterval = () => {
        const val = parseInt(newInterval);
        if (!isNaN(val) && val > 0 && !intervals.includes(val)) {
            const newIntervals = [...intervals, val].sort((a, b) => a - b);
            setIntervals(newIntervals);
            setNewInterval('');
        }
    };

    const removeInterval = (val: number) => {
        setIntervals(intervals.filter(i => i !== val));
    };

    if (profileLoading && !profile) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    const tags = [
        { tag: '{client}', label: t('whatsapp_settings.tags.client') },
        { tag: '{numero}', label: t('whatsapp_settings.tags.number') },
        { tag: '{montant}', label: t('whatsapp_settings.tags.amount') },
        { tag: '{devise}', label: t('whatsapp_settings.tags.currency') },
        { tag: '{link}', label: t('whatsapp_settings.tags.link') }
    ];

    const isRTL = language === 'ar';

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />
            
            {/* Header */}
            <View className="bg-blue-700 pt-16 pb-12 px-6 rounded-b-[40px] shadow-lg">
                <View className={`flex-row justify-between items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-white/10 p-3 rounded-2xl"
                    >
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-black">{t('reminders.title')}</Text>
                    <View className="w-12" />
                </View>

                <View className="items-center">
                    <View className="w-20 h-20 bg-white/20 rounded-3xl items-center justify-center border border-white/20">
                        <Bell size={40} color="white" />
                    </View>
                    <Text className="text-white font-bold mt-4 text-center px-10">
                        {t('reminders.desc')}
                    </Text>
                </View>
            </View>

            <ScrollView 
                className="flex-1 px-6 -mt-6" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Status Card */}
                <View className="bg-white rounded-[32px] p-6 shadow-sm mb-6 border border-slate-100">
                    <View className={`flex-row items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <View className={`flex-row items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center mr-3">
                                <Clock size={20} color="#2563EB" />
                            </View>
                            <Text className={`text-slate-800 font-bold ${isRTL ? 'mr-3' : ''}`}>{t('reminders.enable')}</Text>
                        </View>
                        <Switch
                            value={isEnabled}
                            onValueChange={setIsEnabled}
                            trackColor={{ false: "#CBD5E1", true: "#93C5FD" }}
                            thumbColor={isEnabled ? "#2563EB" : "#F8FAFC"}
                        />
                    </View>
                </View>

                {isEnabled && (
                    <>
                        {/* Schedule Card */}
                        <View className="bg-white rounded-[32px] p-6 shadow-sm mb-6 border border-slate-100">
                            <Text className={`text-slate-400 text-[10px] font-black uppercase mb-4 tracking-widest ${isRTL ? 'text-right' : ''}`}>
                                {t('reminders.schedule')}
                            </Text>
                            <Text className={`text-slate-700 text-sm font-bold mb-4 ${isRTL ? 'text-right' : ''}`}>
                                {t('reminders.intervals')}
                            </Text>
                            
                            <View className={`flex-row flex-wrap mb-4 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ gap: 8 }}>
                                {intervals.map(val => (
                                    <View key={val} className="flex-row items-center bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                                        <Text className="text-blue-700 font-black text-xs mr-2">{val} {t('reminders.days')}</Text>
                                        <TouchableOpacity onPress={() => removeInterval(val)}>
                                            <X size={14} color="#1D4ED8" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>

                            <View className={`flex-row items-center mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <TextInput
                                    className={`flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold ${isRTL ? 'text-right ml-3' : 'mr-3'}`}
                                    placeholder="Ex: 45"
                                    keyboardType="numeric"
                                    value={newInterval}
                                    onChangeText={setNewInterval}
                                />
                                <TouchableOpacity 
                                    onPress={addInterval}
                                    className="w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center shadow-md shadow-blue-200"
                                >
                                    <Plus size={24} color="white" strokeWidth={3} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Template Card */}
                        <View className="bg-white rounded-[32px] p-6 shadow-sm mb-6 border border-slate-100">
                            <Text className={`text-slate-400 text-[10px] font-black uppercase mb-4 tracking-widest ${isRTL ? 'text-right' : ''}`}>
                                {t('reminders.template_title')}
                            </Text>
                            
                            <View className="relative mb-5">
                                <TextInput
                                    className={`bg-slate-50 p-5 rounded-2xl text-slate-800 font-medium text-sm border border-slate-100 min-h-[120px] ${isRTL ? 'text-right' : 'text-left'}`}
                                    multiline
                                    textAlignVertical="top"
                                    value={template}
                                    onChangeText={setTemplate}
                                    placeholder={t('whatsapp_settings.placeholder')}
                                />
                            </View>

                            <View className={`flex-row flex-wrap mb-6 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ gap: 6 }}>
                                {tags.map(item => (
                                    <TouchableOpacity
                                        key={item.tag}
                                        onPress={() => setTemplate(prev => prev + (prev.length > 0 ? ' ' : '') + item.tag)}
                                        className="bg-slate-100 px-3 py-2 rounded-xl border border-slate-200"
                                    >
                                        <Text className="text-slate-600 text-[11px] font-black">{item.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View className={`p-4 bg-blue-50 rounded-2xl flex-row items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <MessageSquare size={18} color="#2563EB" />
                                <Text className={`text-blue-700 text-[11px] font-medium leading-4 flex-1 ${isRTL ? 'mr-3 text-right' : 'ml-3'}`}>
                                    {t('reminders.desc')}
                                </Text>
                            </View>
                        </View>
                    </>
                )}

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className={`w-full py-5 rounded-2xl flex-row items-center justify-center shadow-lg ${saving ? 'bg-blue-400' : 'bg-blue-600 shadow-blue-200'}`}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text className="text-white font-black text-lg mr-2">{t('reminders.save')}</Text>
                            <Check size={24} color="white" strokeWidth={3} />
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
