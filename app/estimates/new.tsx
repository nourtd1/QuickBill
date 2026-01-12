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
import { X, Plus, Trash2, Save, UserPlus, Search, User, Edit3, ShoppingBag, Package, ChevronDown, Check } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../context/AuthContext';
import { showError, showSuccess } from '../../lib/error-handler';
import { Client, Item } from '../../types';
import { supabase } from '../../lib/supabase';

interface NewEstimateItem {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
}

export default function NewEstimate() {
    const router = useRouter();
    const { profile, fetchProfile } = useProfile();
    const { user } = useAuth();

    const [saving, setSaving] = useState(false);

    // Clients State
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [allClients, setAllClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [isClientModalVisible, setIsClientModalVisible] = useState(false);
    const [clientSearch, setClientSearch] = useState('');

    // Inventory Items state
    const [isItemModalVisible, setIsItemModalVisible] = useState(false);
    const [itemSearch, setItemSearch] = useState('');
    const [inventoryItems, setInventoryItems] = useState<Item[]>([]);
    const [filteredInventoryItems, setFilteredInventoryItems] = useState<Item[]>([]);

    // Estimate Content State
    const [items, setItems] = useState<NewEstimateItem[]>([
        { id: '1', description: '', quantity: '1', unit_price: '' }
    ]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchProfile();
        loadClients();
        loadInventoryItems();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadClients();
            loadInventoryItems();
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

    // Filters
    useEffect(() => {
        const result = allClients.filter(c =>
            c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
            c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
            c.phone?.includes(clientSearch)
        );
        setFilteredClients(result);
    }, [clientSearch, allClients]);

    useEffect(() => {
        const result = inventoryItems.filter(item =>
            item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(itemSearch.toLowerCase()))
        );
        setFilteredInventoryItems(result);
    }, [itemSearch, inventoryItems]);

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
        const newItem: NewEstimateItem = {
            id: Date.now().toString(),
            description: item.name,
            quantity: '1',
            unit_price: item.unit_price.toString()
        };
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

    const updateItem = (id: string, field: keyof NewEstimateItem, value: string) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleSaveEstimate = async () => {
        if (!selectedClient) {
            Alert.alert('Client requis', 'Veuillez sélectionner un client.');
            return;
        }

        const validItems = items.filter(i => i.description.trim() !== '');
        if (validItems.length === 0) {
            Alert.alert('Articles requis', 'Veuillez ajouter au moins un article avec une description.');
            return;
        }

        setSaving(true);
        try {
            // Get count for estimate number
            const { count } = await supabase
                .from('estimates')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user?.id);

            const estimateNumber = `EST-${(count || 0) + 101}`;

            const { data: estimate, error: estError } = await supabase
                .from('estimates')
                .insert({
                    user_id: user?.id,
                    customer_id: selectedClient.id,
                    estimate_number: estimateNumber,
                    status: 'DRAFT',
                    total_amount: total,
                    currency: profile?.currency || 'RWF'
                })
                .select()
                .single();

            if (estError) throw estError;

            const estimateItems = validItems.map(i => ({
                estimate_id: estimate.id,
                description: i.description,
                quantity: parseFloat(i.quantity) || 0,
                unit_price: parseFloat(i.unit_price) || 0
            }));

            const { error: itemsError } = await supabase
                .from('estimate_items')
                .insert(estimateItems);

            if (itemsError) throw itemsError;

            showSuccess("Devis créé avec succès !");
            router.replace('/estimates');
        } catch (error) {
            showError(error, "Erreur de création");
        } finally {
            setSaving(false);
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-primary pt-16 pb-8 px-6 rounded-b-[40px] shadow-lg z-10">
                <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()} className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                        <X size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-black tracking-tight">Nouveau Devis</Text>
                    <View style={{ width: 40 }} />
                </View>
                <Text className="text-blue-100 text-center font-medium">Remplissez les informations ci-dessous pour créer un nouveau devis.</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>

                    {/* Client Section */}
                    <View className="mb-6">
                        <Text className="text-slate-500 text-xs font-bold mb-3 uppercase ml-4 tracking-wider">Client Destinataire</Text>
                        {!selectedClient ? (
                            <TouchableOpacity
                                onPress={() => setIsClientModalVisible(true)}
                                className="bg-white p-6 rounded-3xl border border-dashed border-slate-300 items-center justify-center shadow-sm"
                            >
                                <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-3 border border-blue-100">
                                    <UserPlus size={32} color="#1E40AF" />
                                </View>
                                <Text className="text-blue-800 font-bold text-lg">Sélectionner un client</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={() => setIsClientModalVisible(true)} className="bg-white p-5 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 flex-row justify-between items-center">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-12 h-12 bg-blue-100 rounded-2xl items-center justify-center mr-4">
                                        <Text className="text-blue-700 font-black text-lg">{selectedClient.name.charAt(0)}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-900 font-bold text-lg mb-0.5">{selectedClient.name}</Text>
                                        <Text className="text-slate-400 text-sm font-medium">{selectedClient.email || selectedClient.phone}</Text>
                                    </View>
                                </View>
                                <View className="bg-slate-50 p-2 rounded-xl">
                                    <Edit3 size={18} color="#64748B" />
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Items Section */}
                    <View>
                        <View className="flex-row justify-between items-center mb-3 px-4">
                            <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider">Articles & Services</Text>
                            <TouchableOpacity onPress={() => setIsItemModalVisible(true)} className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-full">
                                <ShoppingBag size={14} color="#1E40AF" className="mr-1.5" />
                                <Text className="text-blue-700 text-xs font-bold">Importer</Text>
                            </TouchableOpacity>
                        </View>

                        {items.map((item, index) => (
                            <View key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-4">
                                <View className="flex-row justify-between items-start mb-4">
                                    <View className="bg-slate-50 w-8 h-8 rounded-full items-center justify-center mr-3 mt-1">
                                        <Text className="text-slate-400 font-bold text-xs">{index + 1}</Text>
                                    </View>
                                    <TextInput
                                        className="flex-1 text-slate-900 font-bold text-base bg-slate-50 rounded-xl px-3 py-2 min-h-[40px]"
                                        placeholder="Description de l'article..."
                                        placeholderTextColor="#94A3B8"
                                        multiline
                                        value={item.description}
                                        onChangeText={(text) => updateItem(item.id, 'description', text)}
                                    />
                                    <TouchableOpacity onPress={() => removeItem(item.id)} className="ml-3 mt-2 bg-red-50 p-2 rounded-xl">
                                        <Trash2 size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-row items-center space-x-3">
                                    <View className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">Qté</Text>
                                        <TextInput
                                            className="text-slate-900 font-bold text-lg"
                                            keyboardType="numeric"
                                            value={item.quantity}
                                            onChangeText={(text) => updateItem(item.id, 'quantity', text)}
                                        />
                                    </View>
                                    <View className="flex-[1.5] bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">Prix Unit.</Text>
                                        <View className="flex-row items-center">
                                            <TextInput
                                                className="text-slate-900 font-bold text-lg flex-1"
                                                keyboardType="numeric"
                                                value={item.unit_price}
                                                onChangeText={(text) => updateItem(item.id, 'unit_price', text)}
                                            />
                                            <Text className="text-slate-400 font-medium text-xs ml-1">{profile?.currency}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View className="mt-3 pt-3 border-t border-slate-50 flex-row justify-end">
                                    <Text className="text-slate-400 text-xs font-medium mr-2">Sous-total:</Text>
                                    <Text className="text-slate-900 font-bold">
                                        {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString()} {profile?.currency}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity
                            onPress={addItem}
                            className="flex-row items-center justify-center p-4 bg-slate-100 rounded-2xl border border-dashed border-slate-300 mb-8 active:bg-slate-200"
                        >
                            <Plus size={20} color="#475569" className="mr-2" />
                            <Text className="text-slate-600 font-bold">Ajouter une ligne vide</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Action Bar */}
            <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-slate-100 p-6 pt-5 pb-8">
                <View className="flex-row justify-between items-center mb-5 px-2">
                    <View>
                        <Text className="text-slate-400 text-xs font-bold uppercase">Total Estimé</Text>
                        <Text className="text-3xl font-black text-slate-900 tracking-tight">
                            {total.toLocaleString()} <Text className="text-lg text-slate-500 font-medium">{profile?.currency || 'RWF'}</Text>
                        </Text>
                    </View>
                    <View className="bg-blue-50 px-3 py-1.5 rounded-full">
                        <Text className="text-blue-700 text-xs font-bold">{items.length} Articles</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleSaveEstimate}
                    disabled={saving || total <= 0 || !selectedClient}
                    className={`w-full h-16 rounded-2xl flex-row items-center justify-center shadow-lg ${total > 0 && selectedClient ? 'bg-primary shadow-blue-200' : 'bg-slate-200 shadow-transparent'
                        }`}
                >
                    {saving ? <ActivityIndicator color="white" /> : (
                        <>
                            <Text className={`font-black text-lg uppercase mr-2 ${total > 0 && selectedClient ? 'text-white' : 'text-slate-400'}`}>
                                Enregistrer Devis
                            </Text>
                            {total > 0 && selectedClient && <Check size={24} color="white" strokeWidth={3} />}
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Modal Sélection Client */}
            <Modal visible={isClientModalVisible} animationType="slide" transparent={true}>
                <View className="flex-1 bg-slate-900/40 justify-end">
                    <View className="bg-white h-[85%] rounded-t-[40px] overflow-hidden">
                        <View className="px-6 py-5 border-b border-slate-50 flex-row justify-between items-center bg-white z-10">
                            <View>
                                <Text className="text-2xl font-black text-slate-900">Choisir un client</Text>
                                <Text className="text-slate-400 text-sm">À qui est destiné ce devis ?</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsClientModalVisible(false)} className="bg-slate-100 p-2.5 rounded-full">
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>
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
                        </View>
                        <FlatList
                            data={filteredClients}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 24, paddingTop: 10 }}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => { setSelectedClient(item); setIsClientModalVisible(false); }} className="bg-white border border-slate-100 p-4 rounded-3xl mb-3 flex-row items-center shadow-sm active:bg-slate-50">
                                    <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mr-4">
                                        <Text className="text-blue-600 font-black text-lg">{item.name.charAt(0)}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-900 font-bold text-lg mb-0.5">{item.name}</Text>
                                        <Text className="text-slate-400 text-sm">{item.email || item.phone}</Text>
                                    </View>
                                    <ChevronDown size={20} color="#CBD5E1" style={{ transform: [{ rotate: '-90deg' }] }} />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Modal Sélection Article */}
            <Modal visible={isItemModalVisible} animationType="slide" transparent={true}>
                <View className="flex-1 bg-slate-900/40 justify-end">
                    <View className="bg-white h-[85%] rounded-t-[40px] overflow-hidden">
                        <View className="px-6 py-5 border-b border-slate-50 flex-row justify-between items-center bg-white z-10">
                            <View>
                                <Text className="text-2xl font-black text-slate-900">Catalogue</Text>
                                <Text className="text-slate-400 text-sm">Sélectionnez un produit ou service</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsItemModalVisible(false)} className="bg-slate-100 p-2.5 rounded-full">
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
                        </View>
                        <FlatList
                            data={filteredInventoryItems}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 24, paddingTop: 10 }}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => importItem(item)} className="bg-white border border-slate-100 p-4 rounded-3xl mb-3 flex-row items-center shadow-sm active:bg-slate-50">
                                    <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mr-4">
                                        <Package size={22} color="#1E40AF" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-900 font-bold text-lg mb-0.5">{item.name}</Text>
                                        <Text className="text-slate-900 font-black">{item.unit_price.toLocaleString()} <Text className="text-sm font-normal text-slate-500">{profile?.currency}</Text></Text>
                                    </View>
                                    <Plus size={24} color="#1E40AF" className="bg-blue-100 rounded-full p-1" />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}
