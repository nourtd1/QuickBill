import React, { useState, useEffect, useCallback } from 'react';
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
    FlatList
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { X, Plus, Trash2, Share, Check, UserPlus, Search, User, MapPin, ChevronRight, Edit3, ShoppingBag, Package } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateInvoiceHTML } from '../../lib/generate-html';
import { useProfile } from '../../hooks/useProfile';
import { useInvoice } from '../../hooks/useInvoice';
import { validateCustomerName, validateInvoiceItems, validateTotalAmount } from '../../lib/validation';
import { showError, showSuccess } from '../../lib/error-handler';
import { Client, Item } from '../../types';
import { supabase } from '../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

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

    // Clients State
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [allClients, setAllClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [isClientModalVisible, setIsClientModalVisible] = useState(false);
    const [clientSearch, setClientSearch] = useState('');

    // Invoice Content State
    const [items, setItems] = useState<NewInvoiceItem[]>([
        { id: '1', description: '', quantity: '1', unit_price: '' }
    ]);
    const [total, setTotal] = useState(0);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // Inventory Items state
    const [isItemModalVisible, setIsItemModalVisible] = useState(false);
    const [itemSearch, setItemSearch] = useState('');
    const [inventoryItems, setInventoryItems] = useState<Item[]>([]);
    const [filteredInventoryItems, setFilteredInventoryItems] = useState<Item[]>([]);

    useEffect(() => {
        fetchProfile();
        loadClients();
        loadInventoryItems();
    }, []);

    // Refresh clients when screen is focused (useful if user creates a client and returns)
    useFocusEffect(
        useCallback(() => {
            loadClients();
        }, [])
    );

    const loadClients = async () => {
        const { data } = await supabase.from('clients').select('*').order('name');
        if (data) {
            setAllClients(data);
            setFilteredClients(data);
        }
    };

    const loadInventoryItems = async () => {
        const { data } = await supabase.from('items').select('*').order('name');
        if (data) {
            setInventoryItems(data);
            setFilteredInventoryItems(data);
        }
    };

    // Filter clients in modal
    useEffect(() => {
        const result = allClients.filter(c =>
            c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
            c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
            c.phone?.includes(clientSearch)
        );
        setFilteredClients(result);
    }, [clientSearch, allClients]);

    // Filter inventory items in modal
    useEffect(() => {
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
    }, [items]);

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

        // Prepare and validate items
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
            console.log("Sauvegarde de la facture en base de données...");
            const savedInvoice = await createInvoice(selectedClient.name, itemsData, total, selectedClient.id);

            if (!savedInvoice) throw new Error("Erreur lors de la sauvegarde");

            console.log("Préparation des données PDF...");
            const invoiceData = {
                invoiceNumber: savedInvoice.invoice_number,
                date: new Date(savedInvoice.created_at).toLocaleDateString(),
                customerName: selectedClient.name,
                businessName: profile?.business_name || "Mon Business",
                businessPhone: profile?.phone_contact || "Contactez-nous",
                currency: profile?.currency || "RWF",
                logoUrl: profile?.logo_url,
                signatureUrl: profile?.signature_url,
                items: itemsData.map(i => ({ ...i, total: i.quantity * i.unitPrice })),
                totalAmount: total
            };

            console.log("Génération du HTML...");
            const html = generateInvoiceHTML(invoiceData);

            console.log("Impression en PDF...");
            const { uri } = await Print.printToFileAsync({ html, base64: false });
            console.log("PDF généré à :", uri);

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                console.log("Ouverture du menu de partage...");
                await Sharing.shareAsync(uri, {
                    UTI: '.pdf',
                    mimeType: 'application/pdf',
                    dialogTitle: `Facture ${savedInvoice.invoice_number}`
                });
                showSuccess("Facture envoyée !", "Succès");
                router.replace('/(tabs)');
            } else {
                console.warn("Le partage n'est pas disponible, affichage de l'URI");
                Alert.alert("Info", `PDF sauvegardé : ${uri}`);
                router.replace('/(tabs)');
            }

        } catch (error: any) {
            console.error("Erreur complète lors de la création/partage :", error);
            showError(error, "Erreur lors de la création");
        } finally {
            setGeneratingPdf(false);
        }
    };

    const isLoading = isSaving || generatingPdf;

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <StatusBar style="dark" />

            {/* Header */}
            <View className="flex-row justify-between items-center px-6 py-4 bg-white border-b border-slate-100">
                <TouchableOpacity onPress={() => router.back()} disabled={isLoading} className="p-2 -ml-2">
                    <X size={24} color="#64748B" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900">Nouvelle Facture</Text>
                <View style={{ width: 32 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView className="flex-1 px-4 pt-6">

                    {/* Section Client - Expert UX */}
                    <Text className="text-slate-500 text-xs font-bold mb-3 uppercase tracking-wider ml-1">Client de la facture</Text>

                    {!selectedClient ? (
                        <TouchableOpacity
                            onPress={() => setIsClientModalVisible(true)}
                            className="bg-white p-6 rounded-3xl border-2 border-dashed border-slate-200 items-center justify-center mb-8"
                        >
                            <View className="w-14 h-14 bg-blue-50 rounded-full items-center justify-center mb-3">
                                <UserPlus size={28} color="#2563EB" />
                            </View>
                            <Text className="text-blue-600 font-bold text-lg">Sélectionner un client</Text>
                            <Text className="text-slate-400 text-sm mt-1">Recherchez ou créez un nouveau client</Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="bg-white p-5 rounded-3xl shadow-sm border border-blue-100 mb-8 relative overflow-hidden">
                            <View className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
                            <View className="flex-row justify-between items-start">
                                <View className="flex-1">
                                    <View className="flex-row items-center mb-1">
                                        <User size={16} color="#64748B" className="mr-2" />
                                        <Text className="text-slate-900 font-bold text-lg">{selectedClient.name}</Text>
                                    </View>
                                    {selectedClient.address && (
                                        <View className="flex-row items-start">
                                            <MapPin size={14} color="#94A3B8" className="mr-2 mt-0.5" />
                                            <Text className="text-slate-500 text-sm flex-1">{selectedClient.address}</Text>
                                        </View>
                                    )}
                                    <View className="flex-row items-center mt-3">
                                        <Text className="text-blue-600 font-medium text-xs bg-blue-50 px-2.5 py-1 rounded-full">{selectedClient.email || 'Pas d\'email'}</Text>
                                        <Text className="text-slate-400 mx-2">•</Text>
                                        <Text className="text-slate-500 text-xs">{selectedClient.phone || 'Pas de tél'}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setIsClientModalVisible(true)}
                                    className="bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                                >
                                    <Edit3 size={18} color="#2563EB" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Section Articles */}
                    <Text className="text-slate-500 text-xs font-bold mb-3 uppercase tracking-wider ml-1">Articles & Services</Text>

                    <View className="mb-32">
                        {items.map((item) => (
                            <View key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-50 mb-4 transition-all">
                                <View className="flex-row justify-between items-center mb-4">
                                    <TextInput
                                        className="flex-1 text-slate-900 font-semibold text-base p-0"
                                        placeholder="Description du produit ou service"
                                        placeholderTextColor="#CBD5E1"
                                        value={item.description}
                                        onChangeText={(text) => updateItem(item.id, 'description', text)}
                                        editable={!isLoading}
                                    />
                                    <TouchableOpacity
                                        onPress={() => removeItem(item.id)}
                                        disabled={isLoading}
                                        className="ml-4 p-1"
                                    >
                                        <Trash2 size={20} color={isLoading ? "#E2E8F0" : "#F87171"} />
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-row items-center space-x-4">
                                    <View className="flex-1 bg-slate-50 rounded-2xl p-3">
                                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">Qté</Text>
                                        <TextInput
                                            className="text-slate-900 font-bold text-base p-0"
                                            keyboardType="numeric"
                                            value={item.quantity}
                                            onChangeText={(text) => updateItem(item.id, 'quantity', text)}
                                            editable={!isLoading}
                                        />
                                    </View>

                                    <View className="flex-[2] bg-slate-50 rounded-2xl p-3 ml-4">
                                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">Prix Unitaire</Text>
                                        <View className="flex-row items-center">
                                            <TextInput
                                                className="flex-1 text-slate-900 font-bold text-base p-0"
                                                keyboardType="numeric"
                                                placeholder="0.00"
                                                placeholderTextColor="#CBD5E1"
                                                value={item.unit_price}
                                                onChangeText={(text) => updateItem(item.id, 'unit_price', text)}
                                                editable={!isLoading}
                                            />
                                            <Text className="text-slate-400 font-bold text-xs">{profile?.currency || 'RWF'}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="mt-4 pt-3 border-t border-slate-50 flex-row justify-between items-center">
                                    <Text className="text-slate-400 text-xs font-medium">Sous-total</Text>
                                    <Text className="text-slate-900 font-bold">
                                        {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString()} {profile?.currency || 'RWF'}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        <View className="flex-row mt-2" style={{ gap: 12 }}>
                            <TouchableOpacity
                                onPress={addItem}
                                disabled={isLoading}
                                className="flex-1 flex-row items-center justify-center p-5 bg-white rounded-3xl border-2 border-dashed border-slate-200"
                            >
                                <Plus size={20} color={isLoading ? "#CBD5E1" : "#2563EB"} className="mr-2" />
                                <Text className={`${isLoading ? 'text-slate-300' : 'text-blue-600'} font-bold text-base`}>Vide</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setIsItemModalVisible(true)}
                                disabled={isLoading}
                                className="flex-1 flex-row items-center justify-center p-5 bg-blue-50 rounded-3xl border-2 border-dashed border-blue-200"
                            >
                                <ShoppingBag size={20} color={isLoading ? "#CBD5E1" : "#2563EB"} className="mr-2" />
                                <Text className={`${isLoading ? 'text-slate-300' : 'text-blue-600'} font-bold text-base`}>Importer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Total Footer Section */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 pb-10 shadow-xl">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-slate-500 font-bold text-lg">Total à payer</Text>
                    <Text className="text-3xl font-black text-slate-900">{total.toLocaleString()} {profile?.currency || 'RWF'}</Text>
                </View>

                <TouchableOpacity
                    onPress={handleCreateAndShare}
                    disabled={total <= 0 || isLoading || !selectedClient}
                    className={`w-full h-16 rounded-2xl flex-row items-center justify-center shadow-lg ${total > 0 && !isLoading && selectedClient ? 'bg-blue-600 shadow-blue-200' : 'bg-slate-200'}`}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text className="text-white font-black text-lg mr-2 uppercase tracking-wide">Finaliser la facture</Text>
                            <Share size={20} color="white" strokeWidth={3} />
                        </>
                    )}
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
                        <View className="px-6 py-6 border-b border-slate-50 flex-row justify-between items-center">
                            <Text className="text-2xl font-black text-slate-900">Choisir un client</Text>
                            <TouchableOpacity
                                onPress={() => setIsClientModalVisible(false)}
                                className="bg-slate-100 p-2 rounded-full"
                            >
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Search Bar */}
                        <View className="p-6 pb-2">
                            <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-2xl px-5 h-14">
                                <Search size={22} color="#94A3B8" />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-slate-900 font-medium"
                                    placeholder="Rechercher par nom, email..."
                                    placeholderTextColor="#94A3B8"
                                    value={clientSearch}
                                    onChangeText={setClientSearch}
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
                            contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => selectClient(item)}
                                    className="bg-white border border-slate-100 p-5 rounded-3xl mb-4 flex-row items-center shadow-sm"
                                >
                                    <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center mr-4 border border-slate-100">
                                        <Text className="text-slate-600 font-black text-lg">{item.name.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-900 font-bold text-base">{item.name}</Text>
                                        <Text className="text-slate-400 text-xs" numberOfLines={1}>{item.email || item.phone || 'Sans coordonnées'}</Text>
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
            {/* Modal de Sélection Article (Inventaire) */}
            <Modal
                visible={isItemModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsItemModalVisible(false)}
            >
                <View className="flex-1 bg-slate-900/40 justify-end">
                    <View className="bg-white h-[85%] rounded-t-[40px] overflow-hidden">
                        <View className="px-6 py-6 border-b border-slate-50 flex-row justify-between items-center">
                            <Text className="text-2xl font-black text-slate-900">Importer un article</Text>
                            <TouchableOpacity
                                onPress={() => setIsItemModalVisible(false)}
                                className="bg-slate-100 p-2 rounded-full"
                            >
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View className="p-6 pb-2">
                            <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-2xl px-5 h-14">
                                <Search size={22} color="#94A3B8" />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-slate-900 font-medium"
                                    placeholder="Rechercher un article..."
                                    placeholderTextColor="#94A3B8"
                                    value={itemSearch}
                                    onChangeText={setItemSearch}
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
                            contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => importItem(item)}
                                    className="bg-white border border-slate-100 p-5 rounded-3xl mb-4 flex-row items-center shadow-sm"
                                >
                                    <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mr-4 border border-blue-100">
                                        <Package size={22} color="#2563EB" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-900 font-bold text-base">{item.name}</Text>
                                        <Text className="text-slate-400 text-xs" numberOfLines={1}>{item.description || 'Pas de description'}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-slate-900 font-black text-base">{item.unit_price.toLocaleString()} {profile?.currency || 'RWF'}</Text>
                                    </View>
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
        </SafeAreaView>
    );
}
