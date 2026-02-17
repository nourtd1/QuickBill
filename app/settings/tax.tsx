import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../hooks/useProfile';
import {
    ArrowLeft,
    Save,
    Info,
    Pencil,
    Plus,
    CheckCircle
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { showSuccess, showError } from '../../lib/error-handler';

export default function TaxSettingsScreen() {
    const router = useRouter();
    const { profile, loading: profileLoading, fetchProfile, updateProfile } = useProfile();

    const [defaultTaxRate, setDefaultTaxRate] = useState('20.00');
    const [taxId, setTaxId] = useState('');
    const [taxInclusive, setTaxInclusive] = useState(true);
    const [autoCalculate, setAutoCalculate] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile) {
            setTaxId((profile as any).tax_id || '');
            if ((profile as any).default_tax_rate) setDefaultTaxRate(String((profile as any).default_tax_rate));
        }
    }, [profile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await updateProfile({
                tax_id: taxId.trim() || null,
            } as any);

            if (error) {
                showError(error, "Update Failed");
            } else {
                showSuccess("Tax settings updated!");
                router.back();
            }
        } catch (error) {
            showError(error, "Update Failed");
        } finally {
            setSaving(false);
        }
    };

    const SectionHeader = ({ title, action }: { title: string, action?: React.ReactNode }) => (
        <View className="flex-row items-center justify-between mb-4 mt-8 px-1">
            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</Text>
            {action}
        </View>
    );

    const TaxRegionRow = ({ name, description, rate, bgClass, textClass, label }: any) => (
        <View className="flex-row items-center justify-between py-4 border-b border-slate-50 pl-4 pr-6">
            <View className="flex-row items-center flex-1">
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${bgClass}`}>
                    <Text className={`font-bold text-xs ${textClass}`}>{label}</Text>
                </View>
                <View>
                    <Text className="text-slate-900 font-bold text-base">{name}</Text>
                    <Text className="text-slate-400 text-sm font-medium mt-0.5">{description}</Text>
                </View>
            </View>
            <View className="flex-row items-center">
                <Text className="text-slate-900 font-bold text-base mr-4">{rate}%</Text>
                <Pencil size={18} color="#CBD5E1" />
            </View>
        </View>
    );

    if (profileLoading && !profile) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F9FAFB]">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-2 mb-2">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={24} color="#2563EB" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900">Tax Settings</Text>
                    <TouchableOpacity className="w-10 h-10 bg-blue-50 items-center justify-center rounded-full" onPress={handleSave}>
                        {saving ? <ActivityIndicator size="small" color="#2563EB" /> : <Save size={20} color="#2563EB" />}
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
                    <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                        {/* GENERAL CONFIGURATION */}
                        <SectionHeader title="GENERAL CONFIGURATION" />

                        <View className="bg-white rounded-[20px] p-5 mb-2 shadow-sm border border-slate-50">
                            <View className="mb-6">
                                <Text className="text-slate-500 text-xs font-medium mb-3">Default Tax Rate (%)</Text>
                                <View className="bg-slate-50 rounded-xl px-4 py-3 flex-row items-center justify-between">
                                    <TextInput
                                        value={defaultTaxRate}
                                        onChangeText={setDefaultTaxRate}
                                        className="text-xl font-bold text-slate-900 flex-1 text-center"
                                        keyboardType="numeric"
                                    />
                                    <Text className="text-slate-400 text-lg font-medium">%</Text>
                                </View>
                            </View>

                            <View>
                                <Text className="text-slate-500 text-xs font-medium mb-3">Tax ID Number / VATIN</Text>
                                <View className="bg-slate-50 rounded-xl px-4 py-3 flex-row items-center justify-between">
                                    <TextInput
                                        value={taxId}
                                        onChangeText={setTaxId}
                                        placeholder="GB 849 2018 44"
                                        className="text-lg font-bold text-slate-900 flex-1"
                                    />
                                    <CheckCircle size={20} color="#22C55E" />
                                </View>
                            </View>
                        </View>

                        {/* CALCULATION PREFERENCES */}
                        <SectionHeader title="CALCULATION PREFERENCES" />

                        <View className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-slate-50 mb-2">
                            <View className="flex-row items-center justify-between p-5 border-b border-slate-50">
                                <View className="flex-1 mr-4">
                                    <Text className="text-slate-900 font-bold text-base">Tax Inclusive Pricing</Text>
                                    <Text className="text-slate-400 text-xs mt-1">Prices entered include tax by default</Text>
                                </View>
                                <Switch
                                    value={taxInclusive}
                                    onValueChange={setTaxInclusive}
                                    trackColor={{ false: "#E2E8F0", true: "#2563EB" }}
                                    thumbColor={"#FFFFFF"}
                                    ios_backgroundColor="#E2E8F0"
                                />
                            </View>

                            <View className="flex-row items-center justify-between p-5">
                                <View className="flex-1 mr-4">
                                    <Text className="text-slate-900 font-bold text-base">Auto-Calculate Tax</Text>
                                    <Text className="text-slate-400 text-xs mt-1">Apply default rate to new items</Text>
                                </View>
                                <Switch
                                    value={autoCalculate}
                                    onValueChange={setAutoCalculate}
                                    trackColor={{ false: "#E2E8F0", true: "#2563EB" }}
                                    thumbColor={"#FFFFFF"}
                                    ios_backgroundColor="#E2E8F0"
                                />
                            </View>
                        </View>

                        {/* SAVED TAX REGIONS */}
                        <SectionHeader
                            title="SAVED TAX REGIONS"
                            action={
                                <TouchableOpacity>
                                    <Text className="text-blue-600 text-sm font-bold">Add New</Text>
                                </TouchableOpacity>
                            }
                        />

                        <View className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-slate-50 mb-6">
                            <TaxRegionRow
                                name="United Kingdom"
                                description="Standard Rate"
                                rate="20"
                                bgClass="bg-purple-100"
                                textClass="text-purple-600"
                                label="VAT"
                            />
                            <TaxRegionRow
                                name="Australia"
                                description="Goods & Services Tax"
                                rate="10"
                                bgClass="bg-blue-100"
                                textClass="text-blue-600"
                                label="GST"
                            />
                            <TaxRegionRow
                                name="Germany"
                                description="MwSt"
                                rate="19"
                                bgClass="bg-emerald-100"
                                textClass="text-emerald-600"
                                label="VAT"
                            />
                        </View>

                        {/* Info Note */}
                        <View className="bg-yellow-50 rounded-2xl p-4 flex-row border border-yellow-100 mb-8">
                            <Info size={20} color="#D97706" style={{ marginTop: 2, marginRight: 12 }} />
                            <Text className="flex-1 text-yellow-800 text-xs leading-5">
                                Changing your default tax rate will only affect future invoices. Existing drafts and sent invoices will retain their original tax settings.
                            </Text>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
