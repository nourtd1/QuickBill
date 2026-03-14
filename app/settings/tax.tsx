import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Switch,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Percent,
    Building2,
    FileText,
    Info,
    CheckCircle2,
    HelpCircle,
    ShieldCheck,
    Briefcase,
    Zap
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../../hooks/useProfile';
import { showSuccess, showError } from '../../lib/error-handler';
import { useLanguage } from '../../context/LanguageContext';

export default function TaxSettingsScreen() {
    const router = useRouter();
    const { profile, loading: profileLoading, fetchProfile, updateProfile } = useProfile();
    const { t } = useLanguage();

    const [taxId, setTaxId] = useState('');
    const [rccm, setRccm] = useState('');
    const [defaultTaxRate, setDefaultTaxRate] = useState('18');
    const [taxInclusive, setTaxInclusive] = useState(false);
    const [autoCalculate, setAutoCalculate] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile) {
            setTaxId(profile.tax_id || '');
            setRccm(profile.rccm || '');
            if ((profile as any).default_tax_rate) {
                setDefaultTaxRate(String((profile as any).default_tax_rate));
            }
            if ((profile as any).tax_inclusive !== undefined) {
                setTaxInclusive((profile as any).tax_inclusive);
            }
        }
    }, [profile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await updateProfile({
                tax_id: taxId.trim() || null,
                rccm: rccm.trim() || null,
                default_tax_rate: parseFloat(defaultTaxRate) || 0,
                tax_inclusive: taxInclusive,
            } as any);

            if (error) {
                showError(error, t('tax_settings.update_error'));
            } else {
                showSuccess(t('tax_settings.update_success'));
                router.back();
            }
        } catch (error) {
            showError(error, t('tax_settings.system_error'));
        } finally {
            setSaving(false);
        }
    };

    const FeatureCard = ({ icon: Icon, title, subtitle, value, onToggle }: any) => (
        <View className="bg-white rounded-[22px] p-4 mb-3 shadow-sm shadow-indigo-100/50 border border-slate-50 flex-row items-center justify-between">
            <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-1">
                    <View className="w-9 h-9 rounded-xl bg-indigo-50 items-center justify-center mr-3">
                        <Icon size={18} color="#4F46E5" strokeWidth={2.5} />
                    </View>
                    <Text className="text-slate-900 font-extrabold text-[14px] tracking-tight">{title}</Text>
                </View>
                <Text className="text-slate-500 text-[10px] font-medium leading-4 ml-[48px]">{subtitle}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: "#E2E8F0", true: "#1337ec" }}
                thumbColor="#FFFFFF"
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
        </View>
    );

    const ModernInput = ({ label, value, onChangeText, placeholder, icon: Icon, helpText }: any) => (
        <View className="mb-5">
            <View className="flex-row items-center justify-between mb-1.5 px-1">
                <Text className="text-slate-400 text-[9px] font-black uppercase tracking-[1.5px]">{label}</Text>
                {helpText && <HelpCircle size={12} color="#CBD5E1" />}
            </View>
            <View className="bg-white rounded-[18px] px-4 py-3 shadow-lg shadow-indigo-200/10 border border-slate-100 flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-slate-50 items-center justify-center mr-3">
                    <Icon size={16} color="#64748B" strokeWidth={2} />
                </View>
                <TextInput
                    className="flex-1 text-slate-900 font-bold text-sm h-8"
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#CBD5E1"
                />
            </View>
        </View>
    );

    if (profileLoading && !profile) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F9FAFC]">
                <ActivityIndicator size="large" color="#1337ec" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F9FAFC]">
            <StatusBar style="dark" />
            
            <View className="absolute top-0 left-0 right-0 h-[40%]">
                <LinearGradient
                    colors={['#EEF2FF', '#F8FAFC', '#ffffff']}
                    className="flex-1"
                />
            </View>

            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                <View className="flex-row justify-between items-center px-6 pt-2 pb-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-white w-10 h-10 rounded-[16px] items-center justify-center shadow-lg shadow-indigo-100/50 border border-white"
                    >
                        <ChevronLeft size={20} color="#1337ec" strokeWidth={3} className="-ml-0.5" />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-[16px] font-black text-slate-900 tracking-tight">{t('tax_settings.title')}</Text>
                        <View className="h-0.5 w-6 bg-blue-600 rounded-full mt-1" />
                    </View>
                    <View className="w-10" />
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                    <ScrollView 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
                    >
                        <LinearGradient
                            colors={['#1337ec', '#1e40af']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="rounded-[24px] p-5 mb-6 shadow-xl shadow-blue-500/20 relative overflow-hidden"
                        >
                            <View className="flex-row items-center z-10">
                                <View className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                                    <ShieldCheck size={20} color="white" />
                                </View>
                                <View className="ml-3.5 flex-1">
                                    <Text className="text-white font-black text-base mb-0.5">{t('tax_settings.card_title')}</Text>
                                    <Text className="text-blue-100 text-[10px] font-medium leading-4 opacity-90">
                                        {t('tax_settings.card_desc')}
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>

                        <ModernInput
                            label={t('tax_settings.tin')}
                            value={taxId}
                            onChangeText={setTaxId}
                            placeholder={t('tax_settings.tin_placeholder')}
                            icon={FileText}
                        />

                        <ModernInput
                            label={t('tax_settings.rccm')}
                            value={rccm}
                            onChangeText={setRccm}
                            placeholder={t('tax_settings.rccm_placeholder')}
                            icon={Briefcase}
                        />

                        <View className="mb-6">
                            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-[1.5px] mb-3 px-1">
                                {t('tax_settings.vat_settings')}
                            </Text>
                            <View className="bg-white rounded-[24px] p-5 shadow-xl shadow-indigo-200/20 border border-slate-50 items-center">
                                <View className="flex-row items-center justify-between w-full">
                                    <View className="flex-row items-center">
                                        <View className="w-10 h-10 rounded-2xl bg-orange-50 items-center justify-center mr-3">
                                            <Percent size={20} color="#EA580C" strokeWidth={2.5} />
                                        </View>
                                        <View>
                                            <Text className="text-slate-900 font-extrabold text-sm">{t('tax_settings.vat_rate')}</Text>
                                            <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">{t('tax_settings.default_value')}</Text>
                                        </View>
                                    </View>
                                    <View className="flex-row items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                        <TextInput
                                            className="text-xl font-black text-[#1337ec] mr-1 w-10 text-center"
                                            value={defaultTaxRate}
                                            onChangeText={setDefaultTaxRate}
                                            keyboardType="numeric"
                                            maxLength={3}
                                        />
                                        <Text className="text-indigo-300 font-black text-base">%</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <Text className="text-slate-400 text-[9px] font-black uppercase tracking-[1.5px] mb-3 px-1">
                            {t('tax_settings.calculation_logic')}
                        </Text>
                        
                        <FeatureCard
                            icon={CheckCircle2}
                            title={t('tax_settings.tax_inclusive')}
                            subtitle={t('tax_settings.tax_inclusive_desc')}
                            value={taxInclusive}
                            onToggle={setTaxInclusive}
                        />

                        <FeatureCard
                            icon={Zap}
                            title={t('tax_settings.auto_calculate')}
                            subtitle={t('tax_settings.auto_calculate_desc')}
                            value={autoCalculate}
                            onToggle={setAutoCalculate}
                        />

                        <View className="mt-2 p-4 bg-indigo-50/50 rounded-[20px] border border-indigo-100/50 flex-row items-start">
                            <Info size={14} color="#4F46E5" style={{ marginTop: 2, marginRight: 10 }} />
                            <Text className="flex-1 text-indigo-900/60 text-[10px] font-bold leading-4 italic">
                                {t('tax_settings.note')}
                            </Text>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <View className="absolute bottom-8 left-8 right-8">
                 <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.9}
                    className="shadow-2xl shadow-blue-500/40"
                 >
                    <LinearGradient
                        colors={['#1337ec', '#1e40af']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="h-14 rounded-[20px] items-center justify-center flex-row"
                    >
                         {saving ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <CheckCircle2 size={18} color="white" style={{marginRight: 8}} strokeWidth={3} />
                                <Text className="text-white font-black text-sm uppercase tracking-[1.5px]">{t('tax_settings.save_btn')}</Text>
                            </>
                        )}
                    </LinearGradient>
                 </TouchableOpacity>
            </View>
        </View>
    );
}
