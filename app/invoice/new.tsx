import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    RefreshCw,
    Calendar,
    Plus,
    Layers,
    ChevronRight,
    Box
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useClients } from '../../hooks/useClients';
import { useInvoice } from '../../hooks/useInvoice';
import { useProfile } from '../../hooks/useProfile';

// Constants
const PRIMARY_COLOR = '#A855F7'; // Purple from design
const BG_COLOR = '#F3E8FF'; // Light lavender background

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

    // Form State
    const [invoiceNumber, setInvoiceNumber] = useState('INV-2024-' + Math.floor(100 + Math.random() * 900));
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split('T')[0];
    });

    const params = useLocalSearchParams();

    // Items State
    const [items, setItems] = useState<InvoiceItemState[]>([
        { id: '1', description: 'Web Design Services', quantity: '10', unit_price: '100' },
        { id: '2', description: 'SEO Optimization', quantity: '1', unit_price: '500' }
    ]);

    // Client State (Mocked for design view, typically selected)
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    // Calculations
    const subtotal = items.reduce((acc, item) => {
        return acc + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    }, 0);
    const taxRate = 0.18; // Mock 18% for design match
    const tax = subtotal * taxRate;
    const discount = 0;
    const totalAmount = subtotal + tax - discount;

    // Handlers
    const addItem = () => {
        setItems([
            ...items,
            { id: Date.now().toString(), description: 'New Item', quantity: '1', unit_price: '0' }
        ]);
    };

    const updateItem = (id: string, field: keyof InvoiceItemState, value: string) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const handleCreate = async () => {
        // Mock save for UI demo
        Alert.alert('Success', 'Invoice created successfully!', [
            { text: 'OK', onPress: () => router.back() }
        ]);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F3E8FF]">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="flex-row justify-between items-center px-6 py-4">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900">New Invoice</Text>
                <TouchableOpacity>
                    <Text className="text-purple-600 font-bold text-base">Save Draft</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 px-6 pt-2"
                    contentContainerStyle={{ paddingBottom: 150 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Invoice Number Card */}
                    <View className="bg-white rounded-[32px] p-6 mb-6 shadow-sm border border-purple-50 flex-row justify-between items-center">
                        <View>
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">INVOICE NUMBER</Text>
                            <Text className="text-slate-900 text-xl font-black tracking-tight">#{invoiceNumber}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setInvoiceNumber('INV-2024-' + Math.floor(100 + Math.random() * 900))}>
                            <RefreshCw size={20} color="#A855F7" />
                        </TouchableOpacity>
                    </View>

                    {/* Dates */}
                    <View className="flex-row justify-between mb-8">
                        {/* Issue Date */}
                        <View className="w-[48%]">
                            <Text className="text-slate-500 text-sm font-medium mb-2 pl-1">Issue Date</Text>
                            <TouchableOpacity className="bg-white rounded-[20px] p-4 flex-row items-center border border-slate-200 shadow-sm">
                                <Calendar size={18} color="#A855F7" className="mr-2" />
                                <Text className="text-slate-900 font-bold">{issueDate}</Text>
                            </TouchableOpacity>
                        </View>
                        {/* Due Date */}
                        <View className="w-[48%]">
                            <Text className="text-slate-500 text-sm font-medium mb-2 pl-1">Due Date</Text>
                            <TouchableOpacity className="bg-white rounded-[20px] p-4 flex-row items-center border border-slate-200 shadow-sm">
                                <Calendar size={18} color="#A855F7" className="mr-2" />
                                <Text className="text-slate-900 font-bold">{dueDate}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Items & Services Header */}
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-slate-900">Items & Services</Text>
                        <TouchableOpacity
                            onPress={addItem}
                            className="bg-purple-100 px-3 py-1.5 rounded-full flex-row items-center"
                        >
                            <Plus size={14} color="#A855F7" className="mr-1" />
                            <Text className="text-purple-600 text-xs font-bold uppercase">Add Item</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Items List */}
                    <View className="mb-8">
                        {items.map((item, index) => (
                            <View
                                key={item.id}
                                className="bg-white rounded-[28px] p-4 mb-4 shadow-sm border border-slate-50 flex-row items-center"
                            >
                                {/* Icon */}
                                <View className="w-12 h-12 rounded-full bg-slate-100 items-center justify-center mr-4">
                                    <Layers size={20} color="#64748B" />
                                </View>

                                {/* Inputs */}
                                <View className="flex-1 mr-2">
                                    <TextInput
                                        value={item.description}
                                        onChangeText={(text) => updateItem(item.id, 'description', text)}
                                        className="text-slate-900 font-bold text-base p-0 mb-1"
                                        placeholder="Item Name"
                                    />
                                    <View className="flex-row items-center">
                                        <TextInput
                                            value={item.quantity}
                                            onChangeText={(text) => updateItem(item.id, 'quantity', text)}
                                            className="text-slate-400 text-xs p-0 m-0 w-8"
                                            placeholder="Example: 1"
                                            keyboardType="numeric"
                                        />
                                        <Text className="text-slate-400 text-xs mr-1">hrs @</Text>
                                        <TextInput
                                            value={item.unit_price}
                                            onChangeText={(text) => updateItem(item.id, 'unit_price', text)}
                                            className="text-slate-400 text-xs p-0 m-0 w-16"
                                            placeholder="Unit Price"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <Text className="text-purple-500 text-[10px] font-bold mt-1">Design & Prototyping</Text>
                                </View>

                                {/* Amount */}
                                <Text className="text-slate-900 font-bold text-lg">
                                    {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0))}
                                </Text>
                            </View>
                        ))}

                        {/* Add New Item Dashed Button */}
                        <TouchableOpacity
                            onPress={addItem}
                            className="w-full py-4 border-2 border-dashed border-purple-200 rounded-[28px] items-center justify-center flex-row bg-purple-50/50"
                        >
                            <View className="bg-purple-500 rounded-full p-0.5 mr-2">
                                <Plus size={14} color="white" />
                            </View>
                            <Text className="text-purple-600 font-medium">Add New Item</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Summary Card */}
                    <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 mb-6">
                        <View className="flex-row justify-between mb-3">
                            <Text className="text-slate-500 font-medium text-base">Subtotal</Text>
                            <Text className="text-slate-900 font-bold text-base">{formatCurrency(subtotal)}</Text>
                        </View>
                        <View className="flex-row justify-between mb-3 items-center">
                            <View className="flex-row items-center">
                                <Text className="text-slate-500 font-medium text-base mr-2">Tax</Text>
                                <View className="bg-slate-100 px-2 py-0.5 rounded-md">
                                    <Text className="text-slate-500 text-[10px] font-bold">VAT</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center gap-4">
                                <Text className="text-purple-500 font-bold text-sm">18%</Text>
                                <Text className="text-slate-900 font-bold text-base">{formatCurrency(tax)}</Text>
                            </View>
                        </View>
                        <View className="flex-row justify-between mb-6">
                            <Text className="text-slate-500 font-medium text-base">Discount</Text>
                            <Text className="text-emerald-500 font-bold text-base">-${formatCurrency(discount)}</Text>
                        </View>

                        <View className="flex-row justify-between items-center pt-6 border-t border-slate-100">
                            <Text className="text-slate-500 font-bold text-lg">Total Amount</Text>
                            <Text className="text-purple-600 font-black text-3xl">{formatCurrency(totalAmount)}</Text>
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer Main Button */}
            <View className="absolute bottom-0 w-full bg-white px-6 py-4 pb-8 border-t border-slate-100 shadow-2xl rounded-t-[32px]">
                <TouchableOpacity
                    onPress={handleCreate}
                    disabled={isSaving}
                    className="w-full bg-[#9333EA] h-14 rounded-[28px] flex-row items-center justify-center shadow-lg shadow-purple-500/30"
                >
                    {isSaving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text className="text-white font-bold text-lg mr-2">Preview & Send</Text>
                            <ChevronRight size={20} color="white" strokeWidth={3} />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
