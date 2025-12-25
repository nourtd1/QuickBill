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
    ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Plus, Trash2, Share } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { generateInvoiceHTML } from '../../lib/generate-html';
import { useProfile } from '../../hooks/useProfile';
import { useInvoice } from '../../hooks/useInvoice';
import { validateCustomerName, validateInvoiceItems, validateTotalAmount } from '../../lib/validation';
import { showError, showSuccess, getErrorMessage } from '../../lib/error-handler';

interface NewInvoiceItem {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
}

export default function NewInvoice() {
    const router = useRouter();
    const { profile, fetchProfile } = useProfile();
    const { createInvoice, saving: isSaving } = useInvoice(); // Renaming saving to avoid conflict

    const [customerName, setCustomerName] = useState('');
    const [items, setItems] = useState<NewInvoiceItem[]>([
        { id: '1', description: '', quantity: '1', unit_price: '' }
    ]);
    const [total, setTotal] = useState(0);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

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
        // Validate customer name
        const customerValidation = validateCustomerName(customerName);
        if (!customerValidation.isValid) {
            Alert.alert('Erreur', customerValidation.error);
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

        // Validate total amount
        const totalValidation = validateTotalAmount(total);
        if (!totalValidation.isValid) {
            Alert.alert('Erreur', totalValidation.error);
            return;
        }

        setGeneratingPdf(true);
        try {
            // 1. Save to Database first
            const savedInvoice = await createInvoice(customerName.trim(), itemsData, total);

            if (!savedInvoice) {
                throw new Error("Erreur inconnue lors de la sauvegarde");
            }

            // 2. Prepare Data for PDF using Real Profile & Saved Data
            const invoiceData = {
                invoiceNumber: savedInvoice.invoice_number,
                date: new Date(savedInvoice.created_at).toLocaleDateString(),
                customerName: customerName.trim(),
                businessName: profile?.business_name || "Mon Business",
                businessPhone: profile?.phone_contact || "Contactez-nous",
                currency: profile?.currency || "RWF",
                logoUrl: profile?.logo_url,
                items: itemsData.map(i => ({ ...i, total: i.quantity * i.unitPrice })),
                totalAmount: total
            };

            // 3. Generate HTML
            const html = generateInvoiceHTML(invoiceData);

            // 4. Generate PDF
            const { uri } = await Print.printToFileAsync({ html, base64: false });

            // 5. Share PDF
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    UTI: '.pdf',
                    mimeType: 'application/pdf',
                    dialogTitle: `Facture ${savedInvoice.invoice_number}`
                });

                // Success & Cloud sync done
                showSuccess("Facture enregistrée et prête à être envoyée !", "Succès");
                router.back();
            } else {
                Alert.alert("Info", `PDF sauvegardé : ${uri}`);
                router.back();
            }

        } catch (error: any) {
            showError(error, "Erreur lors de la création");
        } finally {
            setGeneratingPdf(false);
        }
    };

    const isLoading = isSaving || generatingPdf;

    return (
        <View className="flex-1 bg-background pt-4">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="flex-row justify-between items-center px-4 mb-4">
                <TouchableOpacity onPress={() => router.back()} disabled={isLoading} className="p-2 bg-gray-200 rounded-full">
                    <X size={24} color="#333" />
                </TouchableOpacity>
                <Text className="text-xl font-bold">Nouvelle Facture</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
                keyboardVerticalOffset={100}
            >
                <ScrollView className="flex-1 px-4">

                    {/* Customer Section */}
                    <View className="bg-white p-4 rounded-xl shadow-sm mb-6">
                        <Text className="text-gray-500 text-sm font-semibold mb-2">CLIENT</Text>
                        <TextInput
                            className="text-lg font-medium border-b border-gray-200 pb-2"
                            placeholder="Nom du client (ex: Jean)"
                            value={customerName}
                            onChangeText={setCustomerName}
                            editable={!isLoading}
                        />
                    </View>

                    {/* Items Section */}
                    <View className="mb-24">
                        <Text className="text-gray-500 text-sm font-semibold mb-3 px-1">ARTICLES</Text>

                        {items.map((item, index) => (
                            <View key={item.id} className="bg-white p-4 rounded-xl shadow-sm mb-3">
                                <View className="mb-3">
                                    <TextInput
                                        className="text-base text-gray-800"
                                        placeholder="Description"
                                        value={item.description}
                                        onChangeText={(text) => updateItem(item.id, 'description', text)}
                                        editable={!isLoading}
                                    />
                                </View>

                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center space-x-2 w-1/3">
                                        <Text className="text-gray-400 text-xs">Qté</Text>
                                        <TextInput
                                            className="bg-gray-50 rounded-lg p-2 flex-1 text-center font-bold"
                                            keyboardType="numeric"
                                            value={item.quantity}
                                            onChangeText={(text) => updateItem(item.id, 'quantity', text)}
                                            editable={!isLoading}
                                        />
                                    </View>

                                    <View className="flex-row items-center space-x-2 w-1/3 pl-2">
                                        <Text className="text-gray-400 text-xs">Prix</Text>
                                        <TextInput
                                            className="bg-gray-50 rounded-lg p-2 flex-1 text-center font-bold"
                                            keyboardType="numeric"
                                            placeholder="0"
                                            value={item.unit_price}
                                            onChangeText={(text) => updateItem(item.id, 'unit_price', text)}
                                            editable={!isLoading}
                                        />
                                    </View>

                                    <TouchableOpacity onPress={() => removeItem(item.id)} disabled={isLoading} className="p-2 ml-2">
                                        <Trash2 size={20} color={isLoading ? "#ccc" : "#FF3B30"} />
                                    </TouchableOpacity>
                                </View>

                                <View className="items-end mt-2">
                                    <Text className="text-gray-400 text-xs">
                                        {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString()} {profile?.currency || 'RWF'}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity
                            onPress={addItem}
                            disabled={isLoading}
                            className="flex-row items-center justify-center p-4 bg-white rounded-xl border border-dashed border-gray-300 mt-2"
                        >
                            <Plus size={20} color={isLoading ? "#ccc" : "#007AFF"} className="mr-2" />
                            <Text className={`${isLoading ? 'text-gray-400' : 'text-primary'} font-semibold`}>Ajouter un article</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer / Total */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-gray-500 font-medium text-lg">Total</Text>
                    <Text className="text-3xl font-bold">{total.toLocaleString()} {profile?.currency || 'RWF'}</Text>
                </View>

                <TouchableOpacity
                    onPress={handleCreateAndShare}
                    disabled={total <= 0 || isLoading}
                    className={`w-full py-4 rounded-xl flex-row items-center justify-center ${total > 0 && !isLoading ? 'bg-primary' : 'bg-gray-300'}`}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text className="text-white font-bold text-lg mr-2">Sauvegarder & Partager</Text>
                            <Share size={20} color="white" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
