import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    Calendar,
    Plus,
    Trash2,
    User,
    ChevronRight,
    Check,
    FileText,
    DollarSign,
    Percent
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useClients } from '../../hooks/useClients';
import { useInvoice } from '../../hooks/useInvoice';
import { useProfile } from '../../hooks/useProfile';
import { COLORS } from '../../constants/colors';
import { showSuccess, showError } from '../../lib/error-handler';
import { ClientPickerModal } from '../../components/ClientPickerModal';
import { useLanguage } from '../../context/LanguageContext';

interface InvoiceItemState {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
}

export default function NewInvoiceScreen() {
    const router = useRouter();
    const { data: clients } = useClients();
    const { createInvoice, saving: isSaving } = useInvoice();
    const { profile } = useProfile();
    const { t, language } = useLanguage();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();

    // Form State
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30); // 30 days default
        return d.toISOString().split('T')[0];
    });
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState(t('invoice_form.default_terms'));

    // Generate invoice number on mount
    useEffect(() => {
        const year = new Date().getFullYear();
        const random = Math.floor(100 + Math.random() * 900);
        setInvoiceNumber(`INV-${year}-${random}`);
    }, []);

    // Items State
    const [items, setItems] = useState<InvoiceItemState[]>([
        { id: Date.now().toString(), description: '', quantity: '1', unit_price: '0' }
    ]);

    // Client State
    const [selectedClientId, setSelectedClientId] = useState<string | null>(
        params.clientId as string || null
    );
    const [clientModalVisible, setClientModalVisible] = useState(false);

    // Tax and Discount
    const [taxRate, setTaxRate] = useState(profile?.default_tax_rate ? String(profile.default_tax_rate) : '18');
    const [discount, setDiscount] = useState('0');

    // Date pickers
    const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
    const [showDueDatePicker, setShowDueDatePicker] = useState(false);

    // Sync tax rate & currency defaults if profile loads later
    useEffect(() => {
        if (profile?.default_tax_rate) {
            setTaxRate(String(profile.default_tax_rate));
        }
    }, [profile]);

    // Calculations
    const subtotal = items.reduce((acc, item) => {
        return acc + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    }, 0);
    const taxAmount = subtotal * (parseFloat(taxRate) / 100);
    const discountAmount = parseFloat(discount) || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    const parseNumber = (value: string) => {
        const n = parseFloat(value.replace(',', '.'));
        return isNaN(n) ? 0 : n;
    };

    const formatDateForInput = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    // Handlers
    const addItem = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setItems([
            ...items,
            { id: Date.now().toString(), description: '', quantity: '1', unit_price: '0' }
        ]);
    };

    const updateItem = (id: string, field: keyof InvoiceItemState, value: string) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const removeItem = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setItems(items.filter(i => i.id !== id));
    };

    const handleCreate = async () => {
        if (!selectedClientId) {
            showError(new Error(t('invoice_form.client_required_msg')), t('invoice_form.client_required'), t);
            return;
        }

        const validItems = items.filter(item => item.description.trim() !== '');
        if (validItems.length === 0) {
            showError(new Error(t('invoice_form.items_required_msg')), t('invoice_form.items_required'), t);
            return;
        }

        try {
            const formattedItems = validItems.map(i => ({
                description: i.description.trim(),
                quantity: parseNumber(i.quantity),
                unitPrice: parseNumber(i.unit_price)
            }));

            const customerName = clients?.find(c => c.id === selectedClientId)?.name || 'Unknown Client';

            await createInvoice(
                customerName,
                formattedItems,
                totalAmount,
                selectedClientId,
                'unpaid',
                {
                    invoiceNumber,
                    issueDate,
                    dueDate,
                    currency: profile?.currency || 'RWF',
                    subtotal,
                    taxRate: parseNumber(taxRate),
                    taxAmount,
                    discount: discountAmount,
                    notes,
                    terms
                }
            );

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showSuccess(t('invoice_form.success_msg'), t('common.success'), t);
            router.back();
        } catch (error: any) {
            showError(error, t('invoice_form.error_create'), t);
        }
    };

    const formatCurrency = (amount: number) => {
        const currency = profile?.currency || 'USD';
        return new Intl.NumberFormat(language === 'fr-FR' ? 'fr-FR' : 'en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const selectedClient = clients?.find(c => c.id === selectedClientId);

    return (
        <View className="flex-1 bg-[#F9FAFC]" style={{ paddingTop: insets.top }}>
            <StatusBar style="dark" />

            {/* Header */}
            <View className="flex-row justify-between items-center px-6 py-4 bg-[#F9FAFC]">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900">{t('invoice_form.new_title')}</Text>
                <View className="w-10" />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 px-6 pt-2"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Meta Data Section - Grouped List */}
                    <View className="mt-4 mb-6">
                        <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 ml-1">
                            {t('invoice_form.meta_section') || 'DÉTAILS'}
                        </Text>
                        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                            {/* Client row */}
                            <TouchableOpacity
                                onPress={() => setClientModalVisible(true)}
                                className="flex-row items-center px-4 py-4"
                            >
                                <View className="w-9 h-9 rounded-full bg-blue-100 items-center justify-center mr-3">
                                    <User size={18} color={COLORS.primary} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">
                                        {t('invoice_form.client')}
                                    </Text>
                                    <Text className="text-slate-900 font-semibold mt-0.5" numberOfLines={1}>
                                        {selectedClient?.name || t('invoice_form.select_client')}
                                    </Text>
                                </View>
                                <ChevronRight size={18} color="#CBD5E1" />
                            </TouchableOpacity>

                            <View className="h-px bg-slate-100" />

                            {/* Invoice number row */}
                            <View className="flex-row items-center px-4 py-3">
                                <View className="flex-1 mr-3">
                                    <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">
                                        {t('invoice_form.invoice_number')}
                                    </Text>
                                </View>
                                <View className="flex-row items-center flex-[1.3]">
                                    <FileText size={16} color="#94A3B8" />
                                    <TextInput
                                        className="ml-2 flex-1 text-right text-slate-900 font-semibold"
                                        value={invoiceNumber}
                                        onChangeText={setInvoiceNumber}
                                        placeholder="INV-2026-001"
                                        placeholderTextColor="#CBD5E1"
                                    />
                                </View>
                            </View>

                            <View className="h-px bg-slate-100" />

                            {/* Issue date row */}
                            <TouchableOpacity
                                onPress={() => setShowIssueDatePicker(true)}
                                className="flex-row items-center px-4 py-3"
                            >
                                <View className="flex-1 mr-3">
                                    <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">
                                        {t('invoice_form.issue_date')}
                                    </Text>
                                </View>
                                <View className="flex-row items-center flex-[1.3] justify-end">
                                    <Calendar size={16} color="#94A3B8" />
                                    <Text className="ml-2 text-slate-900 font-semibold">
                                        {issueDate}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <View className="h-px bg-slate-100" />

                            {/* Due date row */}
                            <TouchableOpacity
                                onPress={() => setShowDueDatePicker(true)}
                                className="flex-row items-center px-4 py-3"
                            >
                                <View className="flex-1 mr-3">
                                    <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">
                                        {t('invoice_form.due_date')}
                                    </Text>
                                </View>
                                <View className="flex-row items-center flex-[1.3] justify-end">
                                    <Calendar size={16} color="#94A3B8" />
                                    <Text className="ml-2 text-slate-900 font-semibold">
                                        {dueDate}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Items Section - Compact rows */}
                    <View className="mb-6">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest ml-1">
                                {t('invoice_form.items_services')}
                            </Text>
                            <TouchableOpacity onPress={addItem}>
                                <Text className="text-blue-600 text-xs font-semibold">
                                    + {t('invoice_form.add_item')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="bg-white rounded-2xl border border-slate-100">
                            {items.map((item, index) => {
                                const lineTotal = parseNumber(item.quantity) * parseNumber(item.unit_price);
                                const isLast = index === items.length - 1;
                                return (
                                    <View key={item.id}>
                                        <View className="flex-row items-center px-4 py-3">
                                            <View className="flex-1 mr-2">
                                                <TextInput
                                                    value={item.description}
                                                    onChangeText={(text) => updateItem(item.id, 'description', text)}
                                                    placeholder={t('invoice_form.description_placeholder') || 'Article / Service'}
                                                    placeholderTextColor="#CBD5E1"
                                                    className="text-slate-900 font-semibold"
                                                />
                                                <View className="flex-row items-center mt-1">
                                                    <TextInput
                                                        value={item.quantity}
                                                        onChangeText={(text) => updateItem(item.id, 'quantity', text)}
                                                        placeholder="1"
                                                        placeholderTextColor="#CBD5E1"
                                                        keyboardType="numeric"
                                                        className="w-12 text-[13px] text-slate-600"
                                                    />
                                                    <Text className="text-slate-400 mx-1 text-[13px]">x</Text>
                                                    <View className="flex-row items-center">
                                                        <DollarSign size={12} color="#94A3B8" />
                                                        <TextInput
                                                            value={item.unit_price}
                                                            onChangeText={(text) => updateItem(item.id, 'unit_price', text)}
                                                            placeholder="0.00"
                                                            placeholderTextColor="#CBD5E1"
                                                            keyboardType="numeric"
                                                            className="ml-1 w-16 text-[13px] text-slate-600"
                                                        />
                                                    </View>
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-slate-900 font-bold text-sm">
                                                    {formatCurrency(lineTotal)}
                                                </Text>
                                                {items.length > 1 && (
                                                    <TouchableOpacity
                                                        onPress={() => removeItem(item.id)}
                                                        className="mt-2"
                                                    >
                                                        <Trash2 size={16} color="#CBD5E1" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                        {!isLast && <View className="h-px bg-slate-100" />}
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Notes / Terms (optional, compact) */}
                    <View className="mb-6">
                        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                            <View className="px-4 py-3 border-b border-slate-100">
                                <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest mb-1">
                                    {t('invoice_form.notes_label') || 'NOTES'}
                                </Text>
                                <TextInput
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder={t('invoice_form.notes_placeholder') || ''}
                                    placeholderTextColor="#CBD5E1"
                                    multiline
                                    className="text-slate-900 text-sm"
                                />
                            </View>
                            <View className="px-4 py-3">
                                <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest mb-1">
                                    {t('invoice_form.terms_label') || 'CONDITIONS'}
                                </Text>
                                <TextInput
                                    value={terms}
                                    onChangeText={setTerms}
                                    placeholder={t('invoice_form.terms_placeholder') || ''}
                                    placeholderTextColor="#CBD5E1"
                                    multiline
                                    className="text-slate-900 text-sm"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Financial Summary */}
                    <View className="mb-8">
                        <View className="bg-white rounded-2xl border border-slate-100 p-4">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-slate-600 text-sm">{t('invoice_form.subtotal')}</Text>
                                <Text className="text-slate-900 font-semibold">
                                    {formatCurrency(subtotal)}
                                </Text>
                            </View>

                            <View className="flex-row justify-between items-center mb-2">
                                <View className="flex-row items-center">
                                    <Percent size={14} color="#94A3B8" />
                                    <Text className="text-slate-600 text-sm ml-2">
                                        {t('invoice_form.tax_short') || 'TVA'}
                                    </Text>
                                </View>
                                <View className="flex-row items-center">
                                    <TextInput
                                        value={taxRate}
                                        onChangeText={setTaxRate}
                                        keyboardType="numeric"
                                        className="w-12 text-right text-slate-900 font-semibold mr-1"
                                    />
                                    <Text className="text-slate-500 text-sm mr-2">%</Text>
                                    <Text className="text-slate-900 font-semibold">
                                        {formatCurrency(taxAmount)}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-slate-600 text-sm">
                                    {t('invoice_form.discount')}
                                </Text>
                                <View className="flex-row items-center">
                                    <TextInput
                                        value={discount}
                                        onChangeText={setDiscount}
                                        keyboardType="numeric"
                                        className="w-16 text-right text-slate-900 font-semibold mr-1"
                                    />
                                    <Text className="text-slate-500 text-sm mr-2">
                                        {profile?.currency || 'USD'}
                                    </Text>
                                    <Text className="text-emerald-600 font-semibold">
                                        -{formatCurrency(discountAmount)}
                                    </Text>
                                </View>
                            </View>

                            <View className="h-px bg-slate-100 my-3" />

                            <View className="flex-row justify-between items-center">
                                <Text className="text-slate-900 font-semibold text-base">
                                    {t('invoice_form.total_amount')}
                                </Text>
                                <Text className="text-blue-600 font-black text-xl">
                                    {formatCurrency(totalAmount)}
                                </Text>
                            </View>
                        </View>
                    </View>

                </ScrollView>

                {/* Footer Main Button */}
                <View
                    style={{ paddingBottom: Math.max(insets.bottom, 20), paddingTop: 16 }}
                    className="w-full bg-white px-6 border-t border-slate-100 shadow-2xl"
                >
                    <TouchableOpacity
                        onPress={handleCreate}
                        disabled={isSaving}
                        style={{ backgroundColor: isSaving ? '#94A3B8' : COLORS.primary }}
                        className="w-full h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-500/30"
                    >
                        {isSaving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Check size={20} color="white" strokeWidth={2.5} />
                                <Text className="text-white font-bold text-lg ml-2">{t('invoice_form.create_btn')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView >

            {/* Client Selection Modal */}
            <ClientPickerModal
                visible={clientModalVisible}
                onClose={() => setClientModalVisible(false)}
                onSelect={(id, name, client) => {
                    setSelectedClientId(client.id);
                    setClientModalVisible(false);
                }}
                selectedClientId={selectedClientId}
            />

            {/* Native Date Pickers */}
            {showIssueDatePicker && (
                <DateTimePicker
                    value={new Date(issueDate)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, selectedDate) => {
                        if (Platform.OS !== 'ios') {
                            setShowIssueDatePicker(false);
                        }
                        if (selectedDate) {
                            setIssueDate(formatDateForInput(selectedDate));
                        }
                    }}
                />
            )}
            {showDueDatePicker && (
                <DateTimePicker
                    value={new Date(dueDate)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, selectedDate) => {
                        if (Platform.OS !== 'ios') {
                            setShowDueDatePicker(false);
                        }
                        if (selectedDate) {
                            setDueDate(formatDateForInput(selectedDate));
                        }
                    }}
                />
            )}
        </View >
    );
}
