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
import { X, Plus, Trash2, Save, UserPlus, Search, User, Edit3, ShoppingBag, Package } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../context/AuthContext';
import { showError, showSuccess } from '../../lib/error-handler';
import { Client, Item } from '../../types';
import { supabase } from '../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <StatusBar style="dark" />

            <View className="flex-row justify-between items-center px-6 py-4 bg-white border-b border-slate-100">
                <TouchableOpacity onPress={() => router.back()} disabled={saving} className="p-2 -ml-2">
                    <X size={24} color="#64748B" />
                </TouchableOpacity>
                <Text className="text-xl font-black text-slate-900">Nouveau Devis</Text>
                <View style={{ width: 32 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                <ScrollView className="flex-1 px-4 pt-6">

                    <Text className="text-slate-500 text-xs font-bold mb-3 uppercase ml-1">Client</Text>
                    {!selectedClient ? (
                        <TouchableOpacity
                            onPress={() => setIsClientModalVisible(true)}
                            className="bg-white p-6 rounded-3xl border-2 border-dashed border-slate-200 items-center justify-center mb-8"
                        >
                            <View className="w-14 h-14 bg-orange-50 rounded-full items-center justify-center mb-3">
                                <UserPlus size={28} color="#F59E0B" />
                            </View>
                            <Text className="text-orange-600 font-bold text-lg">Sélectionner un client</Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="bg-white p-5 rounded-3xl shadow-sm border border-orange-100 mb-8 flex-row justify-between items-center">
                            <View className="flex-1">
                                <View className="flex-row items-center mb-1">
                                    <User size={16} color="#64748B" className="mr-2" />
                                    <Text className="text-slate-900 font-bold text-lg">{selectedClient.name}</Text>
                                </View>
                                <Text className="text-slate-500 text-xs">{selectedClient.email || selectedClient.phone}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsClientModalVisible(true)} className="bg-slate-50 p-2.5 rounded-xl">
                                <Edit3 size={18} color="#F59E0B" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <Text className="text-slate-500 text-xs font-bold mb-3 uppercase ml-1">Articles</Text>
                    <View className="mb-32">
                        {items.map((item) => (
                            <View key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-50 mb-4">
                                <View className="flex-row justify-between items-center mb-4">
                                    <TextInput
                                        className="flex-1 text-slate-900 font-semibold text-base"
                                        placeholder="Description..."
                                        value={item.description}
                                        onChangeText={(text) => updateItem(item.id, 'description', text)}
                                    />
                                    <TouchableOpacity onPress={() => removeItem(item.id)} className="ml-4">
                                        <Trash2 size={20} color="#F87171" />
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-row items-center space-x-4">
                                    <View className="flex-1 bg-slate-50 rounded-2xl p-3">
                                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">Qté</Text>
                                        <TextInput
                                            className="text-slate-900 font-bold text-base"
                                            keyboardType="numeric"
                                            value={item.quantity}
                                            onChangeText={(text) => updateItem(item.id, 'quantity', text)}
                                        />
                                    </View>
                                    <View className="flex-[2] bg-slate-50 rounded-2xl p-3 ml-4">
                                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">Prix</Text>
                                        <TextInput
                                            className="text-slate-900 font-bold text-base"
                                            keyboardType="numeric"
                                            value={item.unit_price}
                                            onChangeText={(text) => updateItem(item.id, 'unit_price', text)}
                                        />
                                    </View>
                                </View>
                            </View>
                        ))}

                        <View className="flex-row mt-2" style={{ gap: 12 }}>
                            <TouchableOpacity onPress={addItem} className="flex-1 flex-row items-center justify-center p-5 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                <Plus size={20} color="#F59E0B" className="mr-2" />
                                <Text className="text-orange-600 font-bold">Vide</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setIsItemModalVisible(true)} className="flex-1 flex-row items-center justify-center p-5 bg-orange-50 rounded-3xl border-2 border-dashed border-orange-200">
                                <ShoppingBag size={20} color="#F59E0B" className="mr-2" />
                                <Text className="text-orange-600 font-bold">Importer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 pb-10 shadow-xl">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-slate-500 font-bold text-lg">Total Estimé</Text>
                    <Text className="text-3xl font-black text-slate-900">{total.toLocaleString()} {profile?.currency || 'RWF'}</Text>
                </View>

                <TouchableOpacity
                    onPress={handleSaveEstimate}
                    disabled={saving || total <= 0 || !selectedClient}
                    className={`w-full h-16 rounded-2xl flex-row items-center justify-center ${total > 0 && selectedClient ? 'bg-orange-500 shadow-lg shadow-orange-200' : 'bg-slate-200'}`}
                >
                    {saving ? <ActivityIndicator color="white" /> : (
                        <>
                            <Save size={20} color="white" className="mr-2" />
                            <Text className="text-white font-black text-lg uppercase">Enregistrer Devis</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Modal Sélection Client */}
            <Modal visible={isClientModalVisible} animationType="slide" transparent={true}>
                <View className="flex-1 bg-slate-900/40 justify-end">
                    <View className="bg-white h-[85%] rounded-t-[40px] overflow-hidden">
                        <View className="px-6 py-6 border-b border-slate-50 flex-row justify-between items-center">
                            <Text className="text-2xl font-black text-slate-900">Choisir un client</Text>
                            <TouchableOpacity onPress={() => setIsClientModalVisible(false)} className="bg-slate-100 p-2 rounded-full">
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <View className="p-6">
                            <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-2xl px-5 h-14">
                                <Search size={22} color="#94A3B8" />
                                <TextInput className="flex-1 ml-3 text-base" placeholder="Rechercher..." value={clientSearch} onChangeText={setClientSearch} />
                            </View>
                        </View>
                        <FlatList
                            data={filteredClients}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 24 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => { setSelectedClient(item); setIsClientModalVisible(false); }} className="bg-white border border-slate-100 p-5 rounded-3xl mb-4 flex-row items-center shadow-sm">
                                    <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center mr-4">
                                        <Text className="text-slate-600 font-black text-lg">{item.name.charAt(0)}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-900 font-bold text-base">{item.name}</Text>
                                        <Text className="text-slate-400 text-xs">{item.email || item.phone}</Text>
                                    </View>
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
                        <View className="px-6 py-6 border-b border-slate-50 flex-row justify-between items-center">
                            <Text className="text-2xl font-black text-slate-900">Catalogue Items</Text>
                            <TouchableOpacity onPress={() => setIsItemModalVisible(false)} className="bg-slate-100 p-2 rounded-full">
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <View className="p-6">
                            <TextInput className="bg-slate-50 p-4 rounded-2xl border border-slate-100" placeholder="Rechercher..." value={itemSearch} onChangeText={setItemSearch} />
                        </View>
                        <FlatList
                            data={filteredInventoryItems}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 24 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => importItem(item)} className="bg-white border border-slate-100 p-5 rounded-3xl mb-4 flex-row items-center shadow-sm">
                                    <View className="w-12 h-12 bg-orange-50 rounded-2xl items-center justify-center mr-4">
                                        <Package size={22} color="#F59E0B" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-900 font-bold text-base">{item.name}</Text>
                                        <Text className="text-slate-900 font-black">{item.unit_price.toLocaleString()} {profile?.currency}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
