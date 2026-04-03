import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    LayoutAnimation,
    UIManager,
    Animated,
    Easing,
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
    Percent,
    Receipt,
    StickyNote,
    Hash,
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
import { useAuth } from '../../context/AuthContext';
import { getDBConnection, getIsDBReady, initDatabase } from '../../lib/database';

interface InvoiceItemState {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
}

function SectionHeader({ step, title }: { step: string; title: string }) {
    return (
        <View className="flex-row items-center mb-3 px-0.5">
            <View className="w-8 h-8 rounded-2xl bg-indigo-600 items-center justify-center mr-3 shadow-sm shadow-indigo-500/25">
                <Text className="text-white text-xs font-extrabold">{step}</Text>
            </View>
            <Text className="flex-1 text-[15px] font-bold text-slate-900 tracking-tight">{title}</Text>
        </View>
    );
}

export default function NewInvoiceScreen() {
    const router = useRouter();
    const { data: clients } = useClients();
    const { createInvoice, saving: isSaving } = useInvoice();
    const { profile } = useProfile();
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();

    const currentYear = new Date().getFullYear();
    const [invoiceNumber, setInvoiceNumber] = useState(`${currentYear}-001`);
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().split('T')[0];
    });
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState(t('invoice_form.default_terms'));

    useEffect(() => {
        let isCancelled = false;

        const computeNextInvoiceNumber = async () => {
            if (!user?.id) return;

            try {
                // Ensure schema exists (OfflineProvider usually does this, but be defensive)
                if (!getIsDBReady()) {
                    await initDatabase();
                }

                const db = await getDBConnection();
                const likePrefix = `${currentYear}-%`;

                const rows = await db.getAllAsync<{ invoice_number: string }>(
                    `SELECT invoice_number FROM invoices WHERE user_id = ? AND invoice_number LIKE ?`,
                    [user.id, likePrefix]
                );

                let maxSuffix = 0;
                for (const r of rows) {
                    const raw = r.invoice_number;
                    if (typeof raw !== 'string') continue;

                    const match = raw.match(new RegExp(`^${currentYear}-(\\d+)$`));
                    if (!match) continue;

                    const n = parseInt(match[1], 10);
                    if (!Number.isNaN(n)) maxSuffix = Math.max(maxSuffix, n);
                }

                const next = Math.max(1, maxSuffix + 1);
                const padded = String(next).padStart(3, '0');
                if (!isCancelled) setInvoiceNumber(`${currentYear}-${padded}`);
            } catch {
                // Fallback if DB isn't ready or query fails
                if (!isCancelled) setInvoiceNumber(`${currentYear}-001`);
            }
        };

        computeNextInvoiceNumber();
        return () => {
            isCancelled = true;
        };
    }, [user?.id, currentYear]);

    const [items, setItems] = useState<InvoiceItemState[]>([
        { id: Date.now().toString(), description: '', quantity: '1', unit_price: '0' },
    ]);

    const [selectedClientId, setSelectedClientId] = useState<string | null>(
        (params.clientId as string) || null
    );
    const [clientModalVisible, setClientModalVisible] = useState(false);

    const [taxRate, setTaxRate] = useState(
        profile?.default_tax_rate ? String(profile.default_tax_rate) : '18'
    );
    const [discount, setDiscount] = useState('0');

    const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
    const [showDueDatePicker, setShowDueDatePicker] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const metaAnim = React.useRef(new Animated.Value(0)).current;
    const itemsAnim = React.useRef(new Animated.Value(0)).current;
    const notesAnim = React.useRef(new Animated.Value(0)).current;
    const summaryAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (profile?.default_tax_rate) {
            setTaxRate(String(profile.default_tax_rate));
        }
    }, [profile]);

    useEffect(() => {
        if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }, []);

    useEffect(() => {
        Animated.stagger(70, [
            Animated.timing(metaAnim, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(itemsAnim, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(notesAnim, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(summaryAnim, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, [metaAnim, itemsAnim, notesAnim, summaryAnim]);

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

    const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];

    const formatDisplayDate = useCallback(
        (iso: string) => {
            try {
                const d = new Date(`${iso}T12:00:00`);
                if (Number.isNaN(d.getTime())) return iso;
                const locale =
                    language === 'fr-FR'
                        ? 'fr-FR'
                        : language === 'ar-SA'
                          ? 'ar-SA'
                          : language === 'sw-KE'
                            ? 'sw-KE'
                            : language === 'rw-RW'
                              ? 'rw-RW'
                              : 'en-US';
                return d.toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                });
            } catch {
                return iso;
            }
        },
        [language]
    );

    const addItem = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setItems([
            ...items,
            { id: Date.now().toString(), description: '', quantity: '1', unit_price: '0' },
        ]);
    };

    const updateItem = (id: string, field: keyof InvoiceItemState, value: string) => {
        setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
    };

    const removeItem = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setItems(items.filter((i) => i.id !== id));
    };

    const handleCreate = async () => {
        if (!selectedClientId) {
            showError(new Error(t('invoice_form.client_required_msg')), t('invoice_form.client_required'), t);
            return;
        }

        const validItems = items.filter((item) => item.description.trim() !== '');
        if (validItems.length === 0) {
            showError(new Error(t('invoice_form.items_required_msg')), t('invoice_form.items_required'), t);
            return;
        }

        try {
            const formattedItems = validItems.map((i) => ({
                description: i.description.trim(),
                quantity: parseNumber(i.quantity),
                unitPrice: parseNumber(i.unit_price),
            }));

            const customerName = clients?.find((c) => c.id === selectedClientId)?.name || 'Unknown Client';

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
                    terms,
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

    const selectedClient = clients?.find((c) => c.id === selectedClientId);
    const clientInitial = selectedClient?.name?.trim()?.charAt(0)?.toUpperCase() ?? '';
    const currencyCode = profile?.currency || 'USD';

    const cardClass = 'bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm shadow-slate-200/30';

    return (
        <LinearGradient
            colors={['#F0F4FF', '#F8FAFC', '#EFF6FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1"
            style={{ paddingTop: insets.top }}
        >
            <StatusBar style="dark" />

            {/* Header */}
            <View className="px-5 pt-2 pb-4">
                <View className="flex-row items-start justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-11 h-11 rounded-2xl bg-white/90 border border-slate-200/80 items-center justify-center shadow-sm"
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Back"
                    >
                        <ArrowLeft size={22} color="#0F172A" />
                    </TouchableOpacity>
                    <View className="flex-1 items-center px-2">
                        <View className="flex-row items-center mb-1">
                            <Receipt size={18} color={COLORS.primary} />
                            <Text className="ml-1.5 text-lg font-extrabold text-slate-900">
                                {t('invoice_form.new_title')}
                            </Text>
                        </View>
                        <Text className="text-center text-[13px] text-slate-500 leading-5 px-1">
                            {t('invoice_form.subtitle_new')}
                        </Text>
                    </View>
                    <View className="w-11" />
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                <ScrollView
                    className="flex-1 px-5"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 140 }}
                >
                    {/* 1 — Client & dates */}
                    <Animated.View
                        className="mb-7"
                        style={{
                            opacity: metaAnim,
                            transform: [
                                {
                                    translateY: metaAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [12, 0],
                                    }),
                                },
                            ],
                        }}
                    >
                        <SectionHeader step="1" title={t('invoice_form.section_client')} />
                        <View className={cardClass}>
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setClientModalVisible(true);
                                }}
                                className="px-3 py-3 active:bg-slate-50/80"
                                activeOpacity={0.9}
                            >
                                <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest mb-1.5">
                                    {t('invoice_form.client')}
                                </Text>
                                <View className="flex-row items-center">
                                    <LinearGradient
                                        colors={['#4F46E5', '#2563EB']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
                                    >
                                        {clientInitial ? (
                                            <Text className="text-white text-lg font-bold">{clientInitial}</Text>
                                        ) : (
                                            <User size={22} color="white" />
                                        )}
                                    </LinearGradient>
                                    <View className="flex-1 min-w-0">
                                        <Text
                                            className={`text-base font-bold ${selectedClient ? 'text-slate-900' : 'text-slate-400'}`}
                                            numberOfLines={2}
                                        >
                                            {selectedClient?.name || t('invoice_form.select_client')}
                                        </Text>
                                        {selectedClient?.email ? (
                                            <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                                                {selectedClient.email}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <ChevronRight size={20} color="#CBD5E1" />
                                </View>
                            </TouchableOpacity>

                            <View className="h-px bg-slate-100" />

                            <View className="px-3 py-3">
                                <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest mb-1.5">
                                    {t('invoice_form.invoice_number')}
                                </Text>
                                <View className="flex-row items-center bg-slate-50/90 border border-slate-100 rounded-xl px-3 py-2.5">
                                    <View className="w-8 h-8 rounded-xl bg-indigo-50 items-center justify-center">
                                        <Hash size={16} color="#4F46E5" />
                                    </View>
                                    <TextInput
                                        className="ml-3 flex-1 text-slate-900 font-bold text-[14px]"
                                        value={invoiceNumber}
                                        onChangeText={setInvoiceNumber}
                                        placeholder={`${currentYear}-001`}
                                        placeholderTextColor="#CBD5E1"
                                        onFocus={() => setFocusedInput('invoice_number')}
                                        onBlur={() => setFocusedInput(null)}
                                    />
                                </View>
                            </View>

                            <View className="h-px bg-slate-100" />

                            <View className="flex-row">
                                <TouchableOpacity
                                    onPress={() => setShowIssueDatePicker(true)}
                                    className="flex-1 px-3 py-3 border-r border-slate-100 active:bg-slate-50/80"
                                    activeOpacity={0.85}
                                >
                                    <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest mb-1.5">
                                        {t('invoice_form.issue_date')}
                                    </Text>
                                    <View className="flex-row items-center">
                                        <View className="w-8 h-8 rounded-xl bg-blue-50 items-center justify-center">
                                            <Calendar size={16} color="#2563EB" />
                                        </View>
                                        <Text className="ml-2 text-slate-900 font-semibold text-[13px] flex-1" numberOfLines={1}>
                                            {formatDisplayDate(issueDate)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setShowDueDatePicker(true)}
                                    className="flex-1 px-3 py-3 active:bg-slate-50/80"
                                    activeOpacity={0.85}
                                >
                                    <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest mb-1.5">
                                        {t('invoice_form.due_date')}
                                    </Text>
                                    <View className="flex-row items-center">
                                        <View className="w-8 h-8 rounded-xl bg-amber-50 items-center justify-center">
                                            <Calendar size={16} color="#D97706" />
                                        </View>
                                        <Text className="ml-2 text-slate-900 font-semibold text-[13px] flex-1" numberOfLines={1}>
                                            {formatDisplayDate(dueDate)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>

                    {/* 2 — Line items */}
                    <Animated.View
                        className="mb-7"
                        style={{
                            opacity: itemsAnim,
                            transform: [
                                {
                                    translateY: itemsAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [12, 0],
                                    }),
                                },
                            ],
                        }}
                    >
                        <View className="flex-row items-center justify-between mb-2 px-0.5">
                            <View className="flex-row items-center flex-1 mr-2">
                                <View className="w-7 h-7 rounded-xl bg-indigo-600 items-center justify-center mr-2.5 shadow-sm shadow-indigo-500/25">
                                    <Text className="text-white text-[11px] font-extrabold">2</Text>
                                </View>
                                <Text className="flex-1 text-[14px] font-bold text-slate-900 tracking-tight">
                                    {t('invoice_form.section_items')}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={addItem}
                                className="flex-row items-center bg-indigo-600 px-3 py-2 rounded-full shadow-sm shadow-indigo-500/30 shrink-0"
                                activeOpacity={0.88}
                            >
                                <Plus size={16} color="white" />
                                <Text className="text-xs font-bold text-white ml-1.5">{t('invoice_form.add_item')}</Text>
                            </TouchableOpacity>
                        </View>

                        <View className={`${cardClass} divide-y divide-slate-100`}>
                            {items.map((item, index) => {
                                const lineTotal = parseNumber(item.quantity) * parseNumber(item.unit_price);
                                const label = t('invoice_form.item_label', { index: index + 1 });
                                return (
                                    <View key={item.id} className="p-3">
                                        <View className="flex-row items-start justify-between mb-2">
                                            <View className="flex-row items-center flex-1 mr-2">
                                                <View className="bg-slate-100 px-2 py-1 rounded-lg mr-2">
                                                    <Text className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                                                        {label}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">
                                                    {t('invoice_form.item_total')}
                                                </Text>
                                                <Text className="text-slate-900 font-extrabold text-[16px]">
                                                    {formatCurrency(lineTotal)}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
                                            {t('invoice_form.description')}
                                        </Text>
                                        <TextInput
                                            value={item.description}
                                            onChangeText={(text) => updateItem(item.id, 'description', text)}
                                            placeholder={t('invoice_form.description_placeholder')}
                                            placeholderTextColor="#CBD5E1"
                                            onFocus={() => setFocusedInput(`description_${item.id}`)}
                                            onBlur={() => setFocusedInput(null)}
                                            className={`rounded-xl px-3 py-2.5 text-slate-900 font-medium text-[15px] bg-slate-50/80 border ${
                                                focusedInput === `description_${item.id}`
                                                    ? 'border-indigo-400 bg-white'
                                                    : 'border-slate-100'
                                            }`}
                                        />

                                        <View className="flex-row mt-2">
                                            <View className="flex-[0.35] mr-2">
                                                <Text className="text-[10px] text-slate-400 font-semibold uppercase mb-1">
                                                    {t('invoice_form.quantity')}
                                                </Text>
                                                <TextInput
                                                    value={item.quantity}
                                                    onChangeText={(text) => updateItem(item.id, 'quantity', text)}
                                                    placeholder="1"
                                                    placeholderTextColor="#CBD5E1"
                                                    keyboardType="numeric"
                                                    onFocus={() => setFocusedInput(`quantity_${item.id}`)}
                                                    onBlur={() => setFocusedInput(null)}
                                                    className={`w-20 rounded-xl px-3 py-1.5 text-center text-slate-900 font-semibold text-[14px] bg-slate-50/80 border ${
                                                        focusedInput === `quantity_${item.id}`
                                                            ? 'border-indigo-400 bg-white'
                                                            : 'border-slate-100'
                                                    }`}
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-[10px] text-slate-400 font-semibold uppercase mb-1">
                                                    {t('invoice_form.unit_price')}
                                                </Text>
                                                <View
                                                    className={`flex-row items-center rounded-xl px-2.5 py-1 bg-slate-50/80 border ${
                                                        focusedInput === `unit_price_${item.id}`
                                                            ? 'border-indigo-400 bg-white'
                                                            : 'border-slate-100'
                                                    }`}
                                                >
                                                    <DollarSign size={12} color="#94A3B8" />
                                                    <TextInput
                                                        value={item.unit_price}
                                                        onChangeText={(text) => updateItem(item.id, 'unit_price', text)}
                                                        placeholder="0.00"
                                                        placeholderTextColor="#CBD5E1"
                                                        keyboardType="decimal-pad"
                                                        onFocus={() => setFocusedInput(`unit_price_${item.id}`)}
                                                        onBlur={() => setFocusedInput(null)}
                                                        className="ml-1 flex-1 text-slate-900 font-semibold text-[14px]"
                                                    />
                                                </View>
                                            </View>
                                        </View>

                                        {items.length > 1 ? (
                                            <TouchableOpacity
                                                onPress={() => removeItem(item.id)}
                                                className="mt-2 flex-row items-center justify-center py-2 rounded-xl bg-rose-50 border border-rose-100"
                                                activeOpacity={0.85}
                                            >
                                                <Trash2 size={16} color="#E11D48" />
                                                <Text className="text-rose-600 font-bold text-sm ml-2">
                                                    {t('invoice_form.remove_line')}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                );
                            })}
                        </View>
                    </Animated.View>

                    {/* 3 — Notes & terms */}
                    <Animated.View
                        className="mb-7"
                        style={{
                            opacity: notesAnim,
                            transform: [
                                {
                                    translateY: notesAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [12, 0],
                                    }),
                                },
                            ],
                        }}
                    >
                        <SectionHeader step="3" title={t('invoice_form.section_notes')} />
                        <View className={cardClass}>
                            <View className="px-2 py-2 border-b border-slate-100">
                                <View className="flex-row items-center mb-1.5">
                                    <StickyNote size={13} color="#64748B" />
                                    <Text className="text-[11px] text-slate-500 font-bold uppercase tracking-widest ml-2">
                                        {t('invoice_form.notes_label')}
                                    </Text>
                                </View>
                                <TextInput
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder={t('invoice_form.notes_placeholder')}
                                    placeholderTextColor="#CBD5E1"
                                    multiline
                                    onFocus={() => setFocusedInput('notes')}
                                    onBlur={() => setFocusedInput(null)}
                                    className="bg-transparent text-slate-900 text-[14px] min-h-[64px] leading-5"
                                    textAlignVertical="top"
                                />
                            </View>
                            <View className="px-3 py-3">
                                <View className="flex-row items-center mb-1.5">
                                    <FileText size={13} color="#64748B" />
                                    <Text className="text-[11px] text-slate-500 font-bold uppercase tracking-widest ml-2">
                                        {t('invoice_form.terms_label')}
                                    </Text>
                                </View>
                                <TextInput
                                    value={terms}
                                    onChangeText={setTerms}
                                    placeholder={t('invoice_form.terms_placeholder')}
                                    placeholderTextColor="#CBD5E1"
                                    multiline
                                    onFocus={() => setFocusedInput('terms')}
                                    onBlur={() => setFocusedInput(null)}
                                    className="bg-transparent text-slate-900 text-[14px] min-h-[64px] leading-5"
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                    </Animated.View>

                    {/* 4 — Totals */}
                    <Animated.View
                        className="mb-6"
                        style={{
                            opacity: summaryAnim,
                            transform: [
                                {
                                    translateY: summaryAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [12, 0],
                                    }),
                                },
                            ],
                        }}
                    >
                        <SectionHeader step="4" title={t('invoice_form.section_summary')} />
                        <View className={`${cardClass} divide-y divide-slate-100`}>
                            <View className="flex-row justify-between items-center p-4">
                                <Text className="text-slate-600 text-[15px]">{t('invoice_form.subtotal')}</Text>
                                <Text className="text-slate-900 font-bold text-[15px]">{formatCurrency(subtotal)}</Text>
                            </View>

                            <View className="p-4">
                                <View className="flex-row items-center justify-between mb-2">
                                    <View className="flex-row items-center flex-1 mr-2">
                                        <Percent size={16} color="#64748B" />
                                        <Text className="text-slate-600 text-[15px] ml-2 flex-shrink">
                                            {t('invoice_form.tax_rate_label')}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <TextInput
                                            value={taxRate}
                                            onChangeText={setTaxRate}
                                            keyboardType="decimal-pad"
                                            onFocus={() => setFocusedInput('tax_rate')}
                                            onBlur={() => setFocusedInput(null)}
                                            className={`w-16 text-right rounded-xl px-2 py-2 text-slate-900 font-bold bg-slate-50 border ${
                                                focusedInput === 'tax_rate' ? 'border-indigo-400 bg-white' : 'border-slate-100'
                                            }`}
                                        />
                                        <Text className="text-slate-500 font-semibold ml-1">%</Text>
                                    </View>
                                </View>
                                <View className="flex-row justify-between items-center pl-7">
                                    <Text className="text-slate-500 text-sm">
                                        {t('invoice_form.tax_short')} ({parseNumber(taxRate)}%)
                                    </Text>
                                    <Text className="text-slate-900 font-semibold">{formatCurrency(taxAmount)}</Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center p-4">
                                <Text className="text-slate-600 text-[15px]">{t('invoice_form.discount')}</Text>
                                <View className="flex-row items-center">
                                    <TextInput
                                        value={discount}
                                        onChangeText={setDiscount}
                                        keyboardType="decimal-pad"
                                        onFocus={() => setFocusedInput('discount')}
                                        onBlur={() => setFocusedInput(null)}
                                        className={`w-24 text-right rounded-xl px-3 py-2 text-slate-900 font-bold mr-2 bg-slate-50 border ${
                                            focusedInput === 'discount' ? 'border-indigo-400 bg-white' : 'border-slate-100'
                                        }`}
                                    />
                                    <Text className="text-emerald-600 font-bold text-[15px]">−{formatCurrency(discountAmount)}</Text>
                                </View>
                            </View>

                            <LinearGradient
                                colors={['#EEF2FF', '#F5F3FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="p-4"
                            >
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-slate-900 font-extrabold text-lg">{t('invoice_form.total_amount')}</Text>
                                    <Text className="text-indigo-600 font-black text-2xl">{formatCurrency(totalAmount)}</Text>
                                </View>
                            </LinearGradient>
                        </View>
                    </Animated.View>
                </ScrollView>

                {/* Footer */}
                <View
                    style={{ paddingBottom: Math.max(insets.bottom, 16) }}
                    className="border-t border-slate-200/80 bg-white/95 px-5 pt-4"
                >
                    <View className="flex-row justify-between items-end mb-3">
                        <View>
                            <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                {t('invoice_form.summary')}
                            </Text>
                            <Text className="text-2xl font-black text-slate-900 mt-0.5">{formatCurrency(totalAmount)}</Text>
                        </View>
                        <Text className="text-xs font-semibold text-slate-400 mb-1">{currencyCode}</Text>
                    </View>
                    <LinearGradient
                        colors={isSaving ? ['#94A3B8', '#64748B'] : ['#4F46E5', '#2563EB']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/35"
                    >
                        <TouchableOpacity
                            onPress={handleCreate}
                            disabled={isSaving}
                            className="py-4 px-4 flex-row items-center justify-center"
                            activeOpacity={0.9}
                            accessibilityRole="button"
                            accessibilityLabel={t('invoice_form.create_btn')}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Check size={22} color="white" strokeWidth={2.5} />
                                    <Text className="text-white font-extrabold text-[17px] ml-2">
                                        {t('invoice_form.create_btn')}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </KeyboardAvoidingView>

            <ClientPickerModal
                visible={clientModalVisible}
                onClose={() => setClientModalVisible(false)}
                onSelect={(id, name, client) => {
                    setSelectedClientId(client.id);
                    setClientModalVisible(false);
                }}
                selectedClientId={selectedClientId}
            />

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
        </LinearGradient>
    );
}
