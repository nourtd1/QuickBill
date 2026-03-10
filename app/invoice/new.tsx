import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Modal
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
    Tag,
    Layers,
    Box
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useClients } from '../../hooks/useClients';
import { useInvoice } from '../../hooks/useInvoice';
import { useProfile } from '../../hooks/useProfile';
import { COLORS } from '../../constants/colors';
import { showSuccess, showError } from '../../lib/error-handler';
import { ClientPickerModal } from '../../components/ClientPickerModal';

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
    const [terms, setTerms] = useState('Payment due within 30 days');

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
    const [taxRate, setTaxRate] = useState('18'); // Default 18% VAT
    const [discount, setDiscount] = useState('0');

    // Calculations
    const subtotal = items.reduce((acc, item) => {
        return acc + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    }, 0);
    const taxAmount = subtotal * (parseFloat(taxRate) / 100);
    const discountAmount = parseFloat(discount) || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Handlers
    const addItem = () => {
        setItems([
            ...items,
            { id: Date.now().toString(), description: '', quantity: '1', unit_price: '0' }
        ]);
    };

    const updateItem = (id: string, field: keyof InvoiceItemState, value: string) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const handleCreate = async () => {
        if (!selectedClientId) {
            showError(new Error('Please select a client'), 'Client Required');
            return;
        }

        const validItems = items.filter(item => item.description.trim() !== '');
        if (validItems.length === 0) {
            showError(new Error('Please add at least one item'), 'Items Required');
            return;
        }

        try {
            const formattedItems = validItems.map(i => ({
                description: i.description.trim(),
                quantity: parseFloat(i.quantity) || 0,
                unitPrice: parseFloat(i.unit_price) || 0
            }));

            await createInvoice(
                clients?.find(c => c.id === selectedClientId)?.name || 'Unknown Client',
                formattedItems,
                totalAmount,
                selectedClientId
            );

            showSuccess('Invoice created successfully!');
            router.back();
        } catch (error: any) {
            showError(error, 'Failed to create invoice');
        }
    };

    const formatCurrency = (amount: number) => {
        const currency = profile?.currency || 'USD';
        return new Intl.NumberFormat('en-US', {
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
                <Text className="text-xl font-bold text-slate-900">New Invoice</Text>
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
                    {/* Client Selector */}
                    <View className="mb-6 mt-2">
                        <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3 ml-1">CLIENT</Text>
                        <TouchableOpacity
                            onPress={() => setClientModalVisible(true)}
                            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex-row justify-between items-center"
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
                                    <User size={20} color={COLORS.primary} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-900 font-bold text-base">
                                        {selectedClient?.name || 'Select a client'}
                                    </Text>
                                    {selectedClient?.email && (
                                        <Text className="text-slate-400 text-sm mt-0.5">{selectedClient.email}</Text>
                                    )}
                                </View>
                            </View>
                            <ChevronRight size={20} color="#CBD5E1" />
                        </TouchableOpacity>
                    </View>

                    {/* Invoice Number Card */}
                    <View className="rounded-2xl mb-6 overflow-hidden shadow-sm">
                        <LinearGradient
                            colors={['#EFF6FF', '#E0E7FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="p-5 border-2 border-blue-100"
                        >
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center mr-3 shadow-lg shadow-blue-500/30">
                                        <FileText size={20} color="white" />
                                    </View>
                                    <View>
                                        <Text className="text-slate-900 font-bold text-base">Invoice Number</Text>
                                        <Text className="text-slate-500 text-xs">Auto-generated • Editable</Text>
                                    </View>
                                </View>
                            </View>
                            <View className="bg-white rounded-xl px-4 py-3 border border-blue-200 shadow-sm">
                                <TextInput
                                    className="text-slate-900 text-lg font-bold"
                                    value={invoiceNumber}
                                    onChangeText={setInvoiceNumber}
                                    placeholder="INV-2026-001"
                                    placeholderTextColor="#CBD5E1"
                                />
                            </View>
                            <View className="flex-row items-center mt-2 ml-1">
                                <Text className="text-blue-600 text-lg mr-1">💡</Text>
                                <Text className="text-slate-600 text-xs font-medium">
                                    Tip: Keep it unique for easy tracking
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Dates */}
                    <View className="flex-row justify-between mb-8 gap-4">
                        {/* Issue Date */}
                        <View className="flex-1">
                            <Text className="text-slate-600 text-sm font-semibold mb-2 ml-1">Issue Date</Text>
                            <View className="bg-white rounded-2xl px-4 py-4 flex-row items-center border border-slate-100 shadow-sm">
                                <Calendar size={18} color="#94A3B8" />
                                <TextInput
                                    className="flex-1 ml-3 text-slate-900 font-semibold"
                                    value={issueDate}
                                    onChangeText={setIssueDate}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#CBD5E1"
                                />
                            </View>
                        </View>
                        {/* Due Date */}
                        <View className="flex-1">
                            <Text className="text-slate-600 text-sm font-semibold mb-2 ml-1">Due Date</Text>
                            <View className="bg-white rounded-2xl px-4 py-4 flex-row items-center border border-slate-100 shadow-sm">
                                <Calendar size={18} color="#94A3B8" />
                                <TextInput
                                    className="flex-1 ml-3 text-slate-900 font-semibold"
                                    value={dueDate}
                                    onChangeText={setDueDate}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#CBD5E1"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Items & Services Header */}
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-slate-900">Items & Services</Text>
                        <TouchableOpacity
                            onPress={addItem}
                            className="bg-blue-100 px-4 py-2 rounded-full flex-row items-center"
                        >
                            <Plus size={16} color={COLORS.primary} />
                            <Text className="text-blue-600 text-sm font-bold ml-1">Add Item</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Items List */}
                    <View className="mb-8">
                        {items.map((item, index) => (
                            <View
                                key={item.id}
                                className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-slate-100"
                            >
                                {/* Item Header */}
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3">
                                            <Tag size={18} color="#64748B" />
                                        </View>
                                        <Text className="text-slate-400 text-xs font-bold">ITEM #{index + 1}</Text>
                                    </View>
                                    {items.length > 1 && (
                                        <TouchableOpacity
                                            onPress={() => removeItem(item.id)}
                                            className="bg-red-50 p-2 rounded-full"
                                        >
                                            <Trash2 size={16} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Description */}
                                <View className="mb-3">
                                    <Text className="text-slate-600 text-xs font-semibold mb-2 ml-1">Description</Text>
                                    <TextInput
                                        value={item.description}
                                        onChangeText={(text) => updateItem(item.id, 'description', text)}
                                        className="bg-slate-50 rounded-xl px-4 py-3 text-slate-900 font-semibold border border-slate-100"
                                        placeholder="e.g. Web Development Services"
                                        placeholderTextColor="#CBD5E1"
                                    />
                                </View>

                                {/* Quantity and Price */}
                                <View className="flex-row gap-3">
                                    <View className="flex-1">
                                        <Text className="text-slate-600 text-xs font-semibold mb-2 ml-1">Quantity</Text>
                                        <View className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                                            <TextInput
                                                value={item.quantity}
                                                onChangeText={(text) => updateItem(item.id, 'quantity', text)}
                                                className="text-slate-900 font-bold text-center"
                                                placeholder="1"
                                                placeholderTextColor="#CBD5E1"
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-600 text-xs font-semibold mb-2 ml-1">Unit Price</Text>
                                        <View className="bg-slate-50 rounded-xl px-4 py-3 flex-row items-center border border-slate-100">
                                            <DollarSign size={16} color="#94A3B8" />
                                            <TextInput
                                                value={item.unit_price}
                                                onChangeText={(text) => updateItem(item.id, 'unit_price', text)}
                                                className="flex-1 text-slate-900 font-bold"
                                                placeholder="0.00"
                                                placeholderTextColor="#CBD5E1"
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Item Total */}
                                <View className="mt-3 pt-3 border-t border-slate-100 flex-row justify-between items-center">
                                    <Text className="text-slate-500 font-semibold">Item Total</Text>
                                    <Text className="text-slate-900 font-black text-lg">
                                        {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0))}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        {/* Add New Item Button */}
                        <TouchableOpacity
                            onPress={addItem}
                            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl items-center justify-center flex-row bg-slate-50"
                        >
                            <View className="bg-blue-600 rounded-full p-1 mr-2">
                                <Plus size={14} color="white" />
                            </View>
                            <Text className="text-slate-600 font-semibold">Add Another Item</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Summary Card */}
                    <View className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
                        <Text className="text-slate-900 font-bold text-lg mb-4">Invoice Summary</Text>

                        <View className="flex-row justify-between mb-3">
                            <Text className="text-slate-600 font-medium">Subtotal</Text>
                            <Text className="text-slate-900 font-bold">{formatCurrency(subtotal)}</Text>
                        </View>

                        <View className="flex-row justify-between mb-3 items-center">
                            <View className="flex-row items-center">
                                <Percent size={16} color="#94A3B8" />
                                <Text className="text-slate-600 font-medium ml-2">Tax (18% VAT)</Text>
                            </View>
                            <Text className="text-slate-900 font-bold">{formatCurrency(taxAmount)}</Text>
                        </View>

                        <View className="flex-row justify-between mb-6">
                            <Text className="text-slate-600 font-medium">Discount</Text>
                            <Text className="text-emerald-600 font-bold">-{formatCurrency(discountAmount)}</Text>
                        </View>

                        <View className="flex-row justify-between items-center pt-4 border-t-2 border-slate-100">
                            <Text className="text-slate-900 font-bold text-lg">Total Amount</Text>
                            <Text className="text-blue-600 font-black text-2xl">{formatCurrency(totalAmount)}</Text>
                        </View>
                    </View>

                </ScrollView >

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
                                <Text className="text-white font-bold text-lg ml-2">Create Invoice</Text>
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
        </View >
    );
}
