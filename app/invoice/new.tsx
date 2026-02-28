import React, { useState } from 'react';
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
    Image,
    Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    RefreshCw,
    Calendar,
    Plus,
    Layers,
    ChevronRight,
    Box,
    Trash2
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
    const insets = useSafeAreaInsets();

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
        { id: Date.now().toString(), description: '', quantity: '1', unit_price: '0' }
    ]);

    // Client State (Mocked for design view, typically selected)
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [clientModalVisible, setClientModalVisible] = useState(false);

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
            Alert.alert('Erreur', 'Veuillez sélectionner un client.');
            return;
        }

        const validItems = items.filter(item => item.description.trim() !== '');
        if (validItems.length === 0) {
            Alert.alert('Erreur', 'Veuillez ajouter au moins un article avec une description.');
            return;
        }

        try {
            const formattedItems = validItems.map(i => ({
                description: i.description.trim(),
                quantity: parseFloat(i.quantity) || 0,
                unitPrice: parseFloat(i.unit_price) || 0
            }));

            const selectedClient = clients?.find(c => c.id === selectedClientId);

            await createInvoice(
                selectedClient?.name || 'Client Inconnu',
                formattedItems,
                totalAmount,
                selectedClientId
            );

            Alert.alert('Succès', 'Facture créée avec succès!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Impossible de créer la facture.');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <View className="flex-1 bg-[#F3E8FF]" style={{ paddingTop: insets.top }}>
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
                    showsVerticalScrollIndicator={false}
                >
                    {/* Client Selector (Added) */}
                    <View className="mb-6 mt-2">
                        <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 ml-1">CLIENT</Text>
                        <TouchableOpacity
                            onPress={() => setClientModalVisible(true)}
                            className="bg-white rounded-[24px] p-5 shadow-sm border border-purple-50 flex-row justify-between items-center"
                        >
                            <View>
                                <Text className="text-slate-900 font-bold text-base">
                                    {clients?.find(c => c.id === selectedClientId)?.name || 'Sélectionner un client'}
                                </Text>
                            </View>
                            <ChevronRight size={20} color="#CBD5E1" />
                        </TouchableOpacity>
                    </View>

                    {/* Invoice Number Card */}
                    <View className="bg-white rounded-[32px] p-6 mb-6 shadow-sm border border-purple-50 flex-row justify-between items-center focus-within:border-purple-300">
                        <View className="flex-1">
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">INVOICE NUMBER</Text>
                            <TextInput
                                className="text-slate-900 text-xl font-black tracking-tight p-0 m-0"
                                value={invoiceNumber}
                                onChangeText={setInvoiceNumber}
                                placeholder="e.g. INV-001"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                    </View>

                    {/* Dates */}
                    <View className="flex-row justify-between mb-8">
                        {/* Issue Date */}
                        <View className="w-[48%]">
                            <Text className="text-slate-500 text-sm font-medium mb-2 pl-1">Issue Date</Text>
                            <View className="bg-white rounded-[20px] p-4 flex-row items-center border border-slate-200 shadow-sm">
                                <Calendar size={18} color="#A855F7" className="mr-2" />
                                <TextInput
                                    className="flex-1 text-slate-900 font-bold p-0 m-0"
                                    value={issueDate}
                                    onChangeText={setIssueDate}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>
                        {/* Due Date */}
                        <View className="w-[48%]">
                            <Text className="text-slate-500 text-sm font-medium mb-2 pl-1">Due Date</Text>
                            <View className="bg-white rounded-[20px] p-4 flex-row items-center border border-slate-200 shadow-sm">
                                <Calendar size={18} color="#A855F7" className="mr-2" />
                                <TextInput
                                    className="flex-1 text-slate-900 font-bold p-0 m-0"
                                    value={dueDate}
                                    onChangeText={setDueDate}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
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
                            <Text className="text-purple-600 text-xs font-bold uppercase">Ajouter</Text>
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
                                </View>

                                {/* Amount & Actions */}
                                <View className="items-end gap-2">
                                    <Text className="text-slate-900 font-bold text-lg">
                                        {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0))}
                                    </Text>
                                    {items.length > 1 && (
                                        <TouchableOpacity onPress={() => removeItem(item.id)} className="bg-red-50 p-1.5 rounded-full">
                                            <Trash2 size={14} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
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
                            <Text className="text-purple-600 font-medium">Ajouter une ligne vide</Text>
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

                </ScrollView >

                {/* Footer Main Button */}
                <View style={{ paddingBottom: Math.max(insets.bottom, 20), paddingTop: 16 }} className="w-full bg-[#F3E8FF] px-6 border-t border-purple-100 shadow-2xl rounded-t-[32px]">
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
            </KeyboardAvoidingView >

            {/* Client Selection Modal */}
            <Modal visible={clientModalVisible} transparent animationType="slide">
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-[32px] p-6 max-h-[80%] pb-[100px]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-slate-900">Sélectionner un client</Text>
                            <TouchableOpacity onPress={() => setClientModalVisible(false)} className="bg-slate-100 px-4 py-2 rounded-full">
                                <Text className="font-bold text-slate-500">Fermer</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {clients?.map(client => (
                                <TouchableOpacity
                                    key={client.id}
                                    onPress={() => {
                                        setSelectedClientId(client.id);
                                        setClientModalVisible(false);
                                    }}
                                    className={`p-4 rounded-2xl mb-3 flex-row justify-between items-center ${selectedClientId === client.id ? 'bg-purple-50 border border-purple-200' : 'bg-slate-50 border border-slate-100'}`}
                                >
                                    <View>
                                        <Text className="font-bold text-slate-800 text-base">{client.name}</Text>
                                        {client.email && <Text className="text-slate-500 text-xs mt-1">{client.email}</Text>}
                                    </View>
                                    {selectedClientId === client.id && <Box size={20} color="#A855F7" />}
                                </TouchableOpacity>
                            ))}
                            {(!clients || clients.length === 0) && (
                                <View className="py-8 items-center">
                                    <Text className="text-slate-500 text-center mb-4">Aucun client trouvé.</Text>
                                    <TouchableOpacity onPress={() => {
                                        setClientModalVisible(false);
                                        router.push('/(tabs)/clients/form');
                                    }} className="bg-purple-100 px-4 py-2 rounded-full">
                                        <Text className="text-purple-600 font-bold">Ajouter un client</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View >
    );
}
