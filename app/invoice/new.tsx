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
    Modal,
    FlatList,
    StyleSheet
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Plus, Trash2, Share, Check, UserPlus, Search, User, MapPin, ChevronRight, Edit3, ShoppingBag, Package, ChevronDown, MessageCircle, Globe, LayoutGrid, Info, FileText } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateInvoiceHTML } from '../../lib/generate-html';
import { useProfile } from '../../hooks/useProfile';
import { useInvoice } from '../../hooks/useInvoice';
import { useClients } from '../../hooks/useClients';
import { useItems } from '../../hooks/useItems';
import { validateCustomerName, validateInvoiceItems, validateTotalAmount } from '../../lib/validation';
import { showError, showSuccess } from '../../lib/error-handler';
import { Client, Item } from '../../types';
import { SmartPriceSuggestion, AnomalyAlert } from '../../components/AiAssistant';
import { analyzeInvoiceForAnomalies } from '../../lib/aiAssistantService';

interface NewInvoiceItem {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
}

export default function NewInvoice() {
    const router = useRouter();
    const { profile, fetchProfile } = useProfile();
    const { createInvoice, saving: isSaving } = useInvoice();

    // Clients Hook (Cached)
    const { data: allClients } = useClients();
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [isClientModalVisible, setIsClientModalVisible] = useState(false);
    const [clientSearch, setClientSearch] = useState('');

    // Items Hook (Cached)
    const { data: inventoryItems } = useItems();

    // Invoice Content State
    const [items, setItems] = useState<NewInvoiceItem[]>([
        { id: '1', description: '', quantity: '1', unit_price: '' }
    ]);
    const [total, setTotal] = useState(0);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // Inventory Items state
    const [isItemModalVisible, setIsItemModalVisible] = useState(false);
    const [itemSearch, setItemSearch] = useState('');
    const [filteredInventoryItems, setFilteredInventoryItems] = useState<Item[]>([]);

    // AI State
    const [anomalyAlerts, setAnomalyAlerts] = useState<any[]>([]);

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [savedInvoice, setSavedInvoice] = useState<any>(null);


    // HANDLE AI AUTO-FILL
    const params = useLocalSearchParams();
    useEffect(() => {
        if (params.autoParams && allClients) {
            try {
                const autoData = JSON.parse(params.autoParams as string);

                // 1. Try to find client
                if (autoData.customerName) {
                    const found = allClients.find(c => c.name.toLowerCase().includes(autoData.customerName.toLowerCase()));
                    if (found) {
                        setSelectedClient(found);
                    } else {
                        // Optional: Show alert that client was not found exactly
                        Alert.alert("Assistant IA", `Le client "${autoData.customerName}" n'a pas été trouvé dans votre liste. Veuillez le sélectionner ou le créer.`);
                    }
                }

                // 2. Fill Item
                if (autoData.description || autoData.amount) {
                    setItems([{
                        id: Date.now().toString(),
                        description: autoData.description || "Article",
                        quantity: "1",
                        unit_price: autoData.amount ? autoData.amount.toString() : "0"
                    }]);
                }

            } catch (e) {
                console.error("AI Auto-Fill Error", e);
            }
        }
    }, [params.autoParams, allClients]);


    // Filter clients in modal
    useEffect(() => {
        if (!allClients) return;
        const result = allClients.filter(c =>
            c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
            c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
            c.phone?.includes(clientSearch)
        );
        setFilteredClients(result);
    }, [clientSearch, allClients]);

    // Filter inventory items in modal
    useEffect(() => {
        if (!inventoryItems) return;
        const result = inventoryItems.filter(item =>
            item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(itemSearch.toLowerCase()))
        );
        setFilteredInventoryItems(result);
    }, [itemSearch, inventoryItems]);

    const selectClient = (client: Client) => {
        setSelectedClient(client);
        setIsClientModalVisible(false);
        setClientSearch('');
    };

    useEffect(() => {
        const newTotal = items.reduce((sum, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.unit_price) || 0;
            return sum + (qty * price);
        }, 0);
        setTotal(newTotal);

        // AI Anomaly Check (Debounced)
        const timer = setTimeout(async () => {
            if (profile?.id && selectedClient && newTotal > 0) {
                const alerts = await analyzeInvoiceForAnomalies(profile.id, {
                    customerId: selectedClient.id,
                    totalAmount: newTotal,
                    items
                });
                setAnomalyAlerts(alerts);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [items, selectedClient, profile?.id]);

    const addItem = () => {
        setItems([
            ...items,
            { id: Date.now().toString(), description: '', quantity: '1', unit_price: '' }
        ]);
    };

    const importItem = (item: Item) => {
        const newItem: NewInvoiceItem = {
            id: Date.now().toString(),
            description: item.name,
            quantity: '1',
            unit_price: item.unit_price.toString()
        };

        // If the first item is empty, replace it
        if (items.length === 1 && !items[0].description && !items[0].unit_price) {
            setItems([newItem]);
        } else {
            setItems([...items, newItem]);
        }

        setIsItemModalVisible(false);
        setItemSearch('');
    };

    const removeItem = (id: string) => {
        if (items.length === 1) {
            setItems([{ id: '1', description: '', quantity: '1', unit_price: '' }]);
            return;
        }
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof NewInvoiceItem, value: string) => {
        setItems(items.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleCreateAndShare = async () => {
        if (!selectedClient) {
            Alert.alert('Client requis', 'Veuillez sélectionner un client pour cette facture.');
            return;
        }

        const itemsData = items.map(item => ({
            description: item.description || "Article",
            quantity: parseFloat(item.quantity) || 0,
            unitPrice: parseFloat(item.unit_price) || 0
        }));

        const itemsValidation = validateInvoiceItems(itemsData);
        if (!itemsValidation.isValid) {
            Alert.alert('Erreur', itemsValidation.error);
            return;
        }

        const totalValidation = validateTotalAmount(total);
        if (!totalValidation.isValid) {
            Alert.alert('Erreur', totalValidation.error);
            return;
        }

        setGeneratingPdf(true);
        try {
            const result = await createInvoice(selectedClient.name, itemsData, total, selectedClient.id);
            if (!result) throw new Error("Erreur lors de la sauvegarde");

            setSavedInvoice(result);
            setShowSuccessModal(true);
        } catch (error: any) {
            console.error("Erreur creation :", error);
            showError(error);
        } finally {
            setGeneratingPdf(false);
        }
    };

    const handleQuickShare = async (type: 'pdf' | 'chat' | 'portal') => {
        if (!savedInvoice) return;

        if (type === 'pdf') {
            setGeneratingPdf(true);
            try {
                const invoiceData = {
                    invoiceNumber: savedInvoice.invoice_number,
                    date: new Date(savedInvoice.created_at).toLocaleDateString(),
                    customerName: selectedClient?.name || "Client",
                    businessName: profile?.business_name || "Mon Business",
                    businessPhone: profile?.phone_contact || "Contactez-nous",
                    currency: profile?.currency || "RWF",
                    logoUrl: profile?.logo_url,
                    signatureUrl: profile?.signature_url,
                    items: items.map(i => ({ description: i.description, quantity: parseFloat(i.quantity) || 0, unitPrice: parseFloat(i.unit_price) || 0, total: (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0) })),
                    totalAmount: total
                };
                const html = generateInvoiceHTML(invoiceData);
                const { uri } = await Print.printToFileAsync({ html, base64: false });
                await Sharing.shareAsync(uri);
            } catch (e) {
                showError(e);
            } finally {
                setGeneratingPdf(false);
            }
        } else if (type === 'chat') {
            setShowSuccessModal(false);
            router.push(`/invoice/${savedInvoice.id}?chat=true`);
        } else if (type === 'portal') {
            const url = `https://quickbill.app/public/client/${selectedClient?.portal_token}`;
            await Sharing.shareAsync(url);
        }
    };

    const isLoading = isSaving || generatingPdf;

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            {/* Header Upgrade */}
            <LinearGradient
                colors={['#1E40AF', '#1e3a8a']}
                className="pt-16 pb-12 px-6 rounded-b-[48px] shadow-2xl z-10"
            >
                <View className="flex-row justify-between items-center mb-6">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        disabled={isLoading}
                        className="bg-white/20 w-12 h-12 items-center justify-center rounded-2xl border border-white/10 backdrop-blur-md"
                    >
                        <X size={24} color="white" />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-white text-2xl font-black tracking-tight">Nouvelle Facture</Text>
                        <Text className="text-blue-200/80 text-[10px] font-bold uppercase tracking-[2px] mt-1">Édition Professionnelle</Text>
                    </View>
                    <View className="w-12 h-12 bg-white/10 items-center justify-center rounded-2xl border border-white/5">
                        <FileText size={20} color="white" opacity={0.5} />
                    </View>
                </View>

                <View className="bg-white/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <Text className="text-white/90 text-center font-medium leading-relaxed">
                        Créez, personnalisez et envoyez votre facture en quelques secondes.
                    </Text>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    className="flex-1 px-4 pt-8"
                    contentContainerStyle={{ paddingBottom: 180 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* AI Alerts */}
                    <AnomalyAlert alerts={anomalyAlerts} />

                    {/* Step 1: Client */}
                    <View className="flex-row items-center mb-4 ml-2">
                        <View className="w-7 h-7 bg-primary rounded-full items-center justify-center mr-3 shadow-sm shadow-blue-400">
                            <Text className="text-white font-black text-xs">1</Text>
                        </View>
                        <Text className="text-slate-900 text-lg font-black tracking-tight">Client à facturer</Text>
                    </View>

                    {!selectedClient ? (
                        <TouchableOpacity
                            onPress={() => setIsClientModalVisible(true)}
                            className="bg-white p-8 rounded-[32px] border-2 border-dashed border-slate-200 items-center justify-center mb-10 shadow-sm active:scale-[0.98] transition-all bg-slate-50/50"
                        >
                            <View className="w-20 h-20 bg-blue-50 rounded-3xl items-center justify-center mb-4 border border-blue-100 shadow-inner">
                                <UserPlus size={40} color="#1E40AF" strokeWidth={1.5} />
                            </View>
                            <Text className="text-slate-900 font-black text-xl mb-1">Qui facturez-vous ?</Text>
                            <Text className="text-slate-400 text-center text-sm font-medium">Appuyez pour sélectionner un client existant ou en créer un nouveau.</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => setIsClientModalVisible(true)}
                            className="bg-white p-6 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 mb-10 flex-row justify-between items-center active:scale-[0.98]"
                        >
                            <View className="flex-row items-center flex-1">
                                <LinearGradient
                                    colors={['#DBEAFE', '#EFF6FF']}
                                    className="w-14 h-14 rounded-2xl items-center justify-center mr-4 shadow-sm border border-blue-100"
                                >
                                    <Text className="text-primary font-black text-2xl">{selectedClient.name.charAt(0).toUpperCase()}</Text>
                                </LinearGradient>
                                <View className="flex-1">
                                    <Text className="text-slate-900 font-bold text-xl mb-0.5">{selectedClient.name}</Text>
                                    <View className="flex-row items-center">
                                        <MapPin size={12} color="#94A3B8" className="mr-1" />
                                        <Text className="text-slate-400 text-xs font-semibold" numberOfLines={1}>
                                            {selectedClient.email || selectedClient.address || 'Adresse non spécifiée'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View className="bg-slate-50 w-10 h-10 rounded-full items-center justify-center">
                                <ChevronDown size={20} color="#64748B" />
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Step 2: Articles */}
                    <View className="flex-row items-center mb-4 ml-2 mt-2">
                        <View className="w-7 h-7 bg-primary rounded-full items-center justify-center mr-3 shadow-sm shadow-blue-400">
                            <Text className="text-white font-black text-xs">2</Text>
                        </View>
                        <View className="flex-1 flex-row justify-between items-center">
                            <Text className="text-slate-900 text-lg font-black tracking-tight">Détails de la prestation</Text>
                            <TouchableOpacity
                                onPress={() => setIsItemModalVisible(true)}
                                className="bg-blue-600 px-4 py-2 rounded-xl shadow-lg shadow-blue-200 flex-row items-center active:scale-95"
                            >
                                <ShoppingBag size={14} color="white" className="mr-2" />
                                <Text className="text-white text-xs font-black uppercase tracking-wider">Catalogue</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View>
                        {items.map((item, index) => (
                            <View key={item.id} className="bg-white mb-6 rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                                <View className="bg-slate-50/80 px-5 py-3 border-b border-slate-100 flex-row justify-between items-center">
                                    <View className="flex-row items-center">
                                        <View className="w-6 h-6 bg-slate-200 rounded-full items-center justify-center mr-2">
                                            <Text className="text-slate-500 font-bold text-[10px]">{index + 1}</Text>
                                        </View>
                                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Article</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => removeItem(item.id)}
                                        disabled={isLoading}
                                        className="p-2 -mr-2"
                                    >
                                        <Trash2 size={16} color="#EF4444" opacity={0.6} />
                                    </TouchableOpacity>
                                </View>

                                <View className="p-5">
                                    {/* Description Input */}
                                    <View className="mb-5">
                                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-2 ml-1">Désignation du service</Text>
                                        <View className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 flex-row items-start">
                                            <Edit3 size={16} color="#94A3B8" className="mr-3 mt-1" />
                                            <TextInput
                                                className="flex-1 text-slate-900 font-bold text-base leading-6 p-0"
                                                placeholder="Que facturez-vous ?"
                                                placeholderTextColor="#CBD5E1"
                                                multiline
                                                value={item.description}
                                                onChangeText={(text) => updateItem(item.id, 'description', text)}
                                                editable={!isLoading}
                                            />
                                        </View>
                                        <SmartPriceSuggestion
                                            itemName={item.description}
                                            currency={profile?.currency || 'USD'}
                                            currentPrice={parseFloat(item.unit_price)}
                                            onAccept={(price) => updateItem(item.id, 'unit_price', price.toString())}
                                        />
                                    </View>

                                    {/* Values Row */}
                                    <View className="flex-row items-center space-x-3 gap-3">
                                        <View className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                                            <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">Quantité</Text>
                                            <View className="flex-row items-center">
                                                <TextInput
                                                    className="text-slate-900 font-black text-xl flex-1 p-0"
                                                    keyboardType="numeric"
                                                    value={item.quantity}
                                                    onChangeText={(text) => updateItem(item.id, 'quantity', text)}
                                                    editable={!isLoading}
                                                />
                                            </View>
                                        </View>

                                        <View className="flex-[1.5] bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200/50 ring-1 ring-blue-500/10">
                                            <Text className="text-primary text-[10px] font-black uppercase mb-1">Prix Unitaire</Text>
                                            <View className="flex-row items-center">
                                                <Text className="text-blue-400 font-bold text-sm mr-1.5">{profile?.currency}</Text>
                                                <TextInput
                                                    className="text-slate-900 font-black text-xl flex-1 p-0"
                                                    keyboardType="numeric"
                                                    placeholder="0"
                                                    placeholderTextColor="#CBD5E1"
                                                    value={item.unit_price}
                                                    onChangeText={(text) => updateItem(item.id, 'unit_price', text)}
                                                    editable={!isLoading}
                                                />
                                            </View>
                                        </View>
                                    </View>

                                    {/* Line Total Highlight */}
                                    <View className="mt-5 pt-4 border-t border-slate-50 flex-row justify-between items-center">
                                        <View className="flex-row items-center">
                                            <Info size={12} color="#94A3B8" className="mr-1.5" />
                                            <Text className="text-slate-400 text-[10px] font-medium tracking-wide">Calcul automatique</Text>
                                        </View>
                                        <View className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
                                            <Text className="text-primary font-black text-base">
                                                {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString()} <Text className="text-[10px] font-bold">{profile?.currency}</Text>
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity
                            onPress={addItem}
                            disabled={isLoading}
                            className="bg-white p-5 rounded-[24px] border border-dashed border-slate-300 flex-row items-center justify-center mb-12 shadow-sm active:bg-slate-50 active:scale-[0.98]"
                        >
                            <View className="bg-slate-100 p-2 rounded-xl mr-3">
                                <Plus size={20} color="#64748B" strokeWidth={3} />
                            </View>
                            <Text className="text-slate-600 font-black text-base">Ajouter une autre prestation</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Total Footer Section */}
            <View className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl rounded-t-[48px] shadow-2xl border-t border-slate-100 p-6 pt-5 pb-10">
                <View className="flex-row justify-between items-center mb-6 px-4">
                    <View>
                        <View className="flex-row items-center mb-1">
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mr-2">Total Facturé</Text>
                            <LayoutGrid size={12} color="#94A3B8" />
                        </View>
                        <Text className="text-4xl font-black text-slate-900 tracking-tight">
                            {total.toLocaleString()} <Text className="text-xl text-primary font-bold">{profile?.currency}</Text>
                        </Text>
                    </View>
                    <View className="bg-primary/10 px-5 py-3 rounded-2xl items-end border border-primary/10">
                        <Text className="text-primary font-black text-xl">{items.length}</Text>
                        <Text className="text-primary/60 text-[8px] font-black uppercase tracking-tighter">Lignes</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleCreateAndShare}
                    disabled={total <= 0 || isLoading || !selectedClient}
                    className={`w-full h-18 rounded-[24px] overflow-hidden shadow-2xl ${total > 0 && !isLoading && selectedClient ? 'shadow-blue-300' : 'shadow-transparent'}`}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={total > 0 && !isLoading && selectedClient ? ['#1E40AF', '#1e3a8a'] : ['#E2E8F0', '#CBD5E1']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="w-full h-16 items-center justify-center flex-row"
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text className={`font-black text-lg uppercase tracking-wider mr-3 ${total > 0 && selectedClient ? 'text-white' : 'text-slate-400'}`}>
                                    Finaliser la facture
                                </Text>
                                <Share size={20} color={total > 0 && selectedClient ? 'white' : '#94A3B8'} strokeWidth={3} />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Modal de Sélection Client */}
            <Modal
                visible={isClientModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsClientModalVisible(false)}
            >
                <View className="flex-1 bg-slate-900/40 justify-end">
                    <View className="bg-white h-[85%] rounded-t-[40px] overflow-hidden">
                        {/* Modal Header */}
                        <View className="px-6 py-5 border-b border-slate-50 flex-row justify-between items-center bg-white z-10">
                            <View>
                                <Text className="text-2xl font-black text-slate-900">Choisir un client</Text>
                                <Text className="text-slate-400 text-sm">À qui est destinée cette facture ?</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setIsClientModalVisible(false)}
                                className="bg-slate-100 p-2.5 rounded-full"
                            >
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Search Bar */}
                        <View className="p-6 pb-2">
                            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14">
                                <Search size={22} color="#94A3B8" />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-slate-900 font-medium"
                                    placeholder="Rechercher par nom, email..."
                                    placeholderTextColor="#CBD5E1"
                                    value={clientSearch}
                                    onChangeText={setClientSearch}
                                    autoFocus
                                />
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    setIsClientModalVisible(false);
                                    router.push('/clients/form');
                                }}
                                className="flex-row items-center mt-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100"
                            >
                                <View className="bg-blue-600 p-2 rounded-lg mr-3">
                                    <Plus size={16} color="white" strokeWidth={4} />
                                </View>
                                <Text className="text-blue-700 font-bold">Nouveau client</Text>
                                <ChevronRight size={18} color="#2563EB" className="ml-auto" />
                            </TouchableOpacity>
                        </View>

                        {/* Clients List */}
                        <FlatList
                            data={filteredClients}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 24, paddingBottom: 60, paddingTop: 10 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => selectClient(item)}
                                    className="bg-white border border-slate-100 p-4 rounded-3xl mb-3 flex-row items-center shadow-sm active:bg-slate-50"
                                >
                                    <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mr-4">
                                        <Text className="text-blue-600 font-black text-lg">{item.name.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-900 font-bold text-lg mb-0.5">{item.name}</Text>
                                        <Text className="text-slate-400 text-sm" numberOfLines={1}>{item.email || item.phone || 'Sans coordonnées'}</Text>
                                    </View>
                                    {selectedClient?.id === item.id && (
                                        <View className="bg-emerald-50 p-2 rounded-full">
                                            <Check size={18} color="#10B981" strokeWidth={3} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={() => (
                                <View className="items-center justify-center mt-10">
                                    <Text className="text-slate-400 font-medium">Aucun client trouvé</Text>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Modal de Sélection Article (Catalogue) */}
            <Modal
                visible={isItemModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsItemModalVisible(false)}
            >
                <View className="flex-1 bg-slate-900/40 justify-end">
                    <View className="bg-white h-[85%] rounded-t-[40px] overflow-hidden">
                        <View className="px-6 py-5 border-b border-slate-50 flex-row justify-between items-center bg-white z-10">
                            <View>
                                <Text className="text-2xl font-black text-slate-900">Catalogue</Text>
                                <Text className="text-slate-400 text-sm">Sélectionnez un produit ou service</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setIsItemModalVisible(false)}
                                className="bg-slate-100 p-2.5 rounded-full"
                            >
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View className="p-6 pb-2">
                            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14">
                                <Search size={22} color="#94A3B8" />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-slate-900 font-medium"
                                    placeholder="Rechercher un article..."
                                    placeholderTextColor="#CBD5E1"
                                    value={itemSearch}
                                    onChangeText={setItemSearch}
                                    autoFocus
                                />
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    setIsItemModalVisible(false);
                                    router.push('/items/form');
                                }}
                                className="flex-row items-center mt-4 bg-orange-50/50 p-4 rounded-2xl border border-orange-100"
                            >
                                <View className="bg-orange-500 p-2 rounded-lg mr-3">
                                    <Plus size={16} color="white" strokeWidth={4} />
                                </View>
                                <Text className="text-orange-700 font-bold">Nouvel article catalogue</Text>
                                <ChevronRight size={18} color="#F59E0B" className="ml-auto" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={filteredInventoryItems}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 24, paddingBottom: 60, paddingTop: 10 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => importItem(item)}
                                    className="bg-white border border-slate-100 p-4 rounded-3xl mb-3 flex-row items-center shadow-sm active:bg-slate-50"
                                >
                                    <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mr-4 border border-blue-100">
                                        <Package size={22} color="#1E40AF" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-900 font-bold text-lg mb-0.5">{item.name}</Text>
                                        <Text className="text-slate-400 text-sm" numberOfLines={1}>{item.description || 'Pas de description'}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-slate-900 font-black text-base">{item.unit_price.toLocaleString()} <Text className="text-sm font-normal text-slate-500">{profile?.currency}</Text></Text>
                                    </View>
                                    <Plus size={24} color="#1E40AF" className="bg-blue-100 rounded-full p-1 ml-3" />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={() => (
                                <View className="items-center justify-center mt-10">
                                    <Text className="text-slate-400 font-medium text-center">Aucun article trouvé dans votre catalogue</Text>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Modal de Succès & Envoi */}
            <Modal
                visible={showSuccessModal}
                animationType="fade"
                transparent={true}
            >
                <View className="flex-1 bg-slate-900/60 justify-center items-center px-6">
                    <View className="bg-white w-full rounded-[40px] p-8 items-center shadow-2xl">
                        <View className="bg-emerald-100 w-20 h-20 rounded-full items-center justify-center mb-6">
                            <Check size={40} color="#059669" strokeWidth={3} />
                        </View>

                        <Text className="text-2xl font-black text-slate-900 text-center mb-2">Facture Prête !</Text>
                        <Text className="text-slate-500 text-center mb-8 px-4">
                            La facture <Text className="font-bold text-primary">#{savedInvoice?.invoice_number}</Text> a été créée. Comment souhaitez-vous l'envoyer ?
                        </Text>

                        <View className="w-full space-y-4">
                            <TouchableOpacity
                                onPress={() => handleQuickShare('pdf')}
                                className="bg-slate-900 h-16 rounded-2xl flex-row items-center px-6 mb-4"
                            >
                                <View className="bg-white/10 p-2 rounded-lg mr-4">
                                    <Share size={20} color="white" />
                                </View>
                                <Text className="text-white font-bold text-lg">Partager le PDF</Text>
                                <ChevronRight size={20} color="#94A3B8" className="ml-auto" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleQuickShare('chat')}
                                className="bg-violet-600 h-16 rounded-2xl flex-row items-center px-6 mb-4"
                            >
                                <View className="bg-white/10 p-2 rounded-lg mr-4">
                                    <MessageCircle size={20} color="white" />
                                </View>
                                <View>
                                    <Text className="text-white font-bold text-lg">Discuter avec le client</Text>
                                    <Text className="text-violet-200 text-[10px] font-medium">Assistant Chat Intégré</Text>
                                </View>
                                <ChevronRight size={20} color="#C4B5FD" className="ml-auto" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleQuickShare('portal')}
                                className="bg-blue-600 h-16 rounded-2xl flex-row items-center px-6"
                            >
                                <View className="bg-white/10 p-2 rounded-lg mr-4">
                                    <Globe size={20} color="white" />
                                </View>
                                <Text className="text-white font-bold text-lg">Lien Portail Client</Text>
                                <ChevronRight size={20} color="#BFDBFE" className="ml-auto" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                setShowSuccessModal(false);
                                router.replace('/(tabs)');
                            }}
                            className="mt-8 p-4 w-full items-center"
                        >
                            <Text className="text-slate-400 font-bold">Retour à l'accueil</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
