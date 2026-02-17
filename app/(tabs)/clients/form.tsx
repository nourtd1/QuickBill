import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    Camera,
    ChevronDown,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Globe,
    FileText,
    Pencil
} from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import * as ExpoCrypto from 'expo-crypto';

export default function ClientFormScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditing);

    // Form State matching the design
    const [businessName, setBusinessName] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [industry, setIndustry] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [taxId, setTaxId] = useState('');
    const [currency, setCurrency] = useState('USD ($)');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isEditing) {
            fetchClientDetails();
        }
    }, [id]);

    const fetchClientDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                // Mapping DB fields to UI fields
                setBusinessName(data.name || '');
                setEmail(data.email || '');
                setPhone(data.phone || '');
                setAddress(data.address || '');
                setNotes(data.notes || '');
                // Other fields would be populated here if they existed in DB
            }
        } catch (error) {
            console.error('Error loading client:', error);
            Alert.alert('Error', 'Could not load client details.');
            router.back();
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        if (!businessName.trim()) {
            Alert.alert('Missing Information', 'Business Name is required.');
            return;
        }

        setLoading(true);
        try {
            // Mapping UI fields back to DB fields
            // Note: New fields (Registration, Industry, Contact Person, Tax ID, Currency) 
            // are not currently saved as they likely don't exist in the schema yet.
            // We save the core fields.
            const clientData = {
                name: businessName.trim(),
                email: email.trim() || null,
                phone: phone.trim() || null,
                address: address.trim() || null,
                notes: notes.trim() || null,
            };

            if (isEditing) {
                const { error } = await supabase
                    .from('clients')
                    .update(clientData)
                    .eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('clients')
                    .insert([{
                        ...clientData,
                        user_id: user?.id,
                        portal_token: ExpoCrypto.randomUUID()
                    }]);
                if (error) throw error;
            }

            router.back();
        } catch (error: any) {
            console.error('Save error:', error);
            Alert.alert('Error', error.message || 'Failed to save client.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F3E8FF]">
                <ActivityIndicator size="large" color="#9333EA" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#F3E8FF]">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="flex-row justify-between items-center px-6 py-4">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900">
                    {isEditing ? 'Edit Client' : 'Add New Client'}
                </Text>
                <TouchableOpacity onPress={handleSave}>
                    <Text className="text-purple-600 font-bold text-base">Save</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 px-6"
                    contentContainerStyle={{ paddingBottom: 150 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo/Photo Upload */}
                    <View className="items-center mb-8 mt-4">
                        <View className="relative">
                            <View className="w-24 h-24 rounded-full bg-slate-300 items-center justify-center border-4 border-white shadow-sm overflow-hidden dash-spinner">
                                <Camera size={32} color="white" />
                                {/* Dashed border effect simulation can be a separate SVG or Image overlay if needed, sticking to CSS for now */}
                            </View>
                            <TouchableOpacity className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-2 border-white">
                                <Pencil size={14} color="white" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-purple-600 font-bold text-sm mt-3">Upload Logo/Photo</Text>
                    </View>

                    {/* Business Details */}
                    <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 ml-1">BUSINESS DETAILS</Text>

                    <View className="mb-4">
                        <Text className="text-slate-600 text-sm font-semibold mb-2 ml-1">Business Name</Text>
                        <TextInput
                            className="bg-white rounded-2xl px-4 py-4 text-slate-900 font-semibold shadow-sm border border-transparent focus:border-purple-500"
                            placeholder="Acme Corp, Inc."
                            placeholderTextColor="#CBD5E1"
                            value={businessName}
                            onChangeText={setBusinessName}
                        />
                    </View>

                    <View className="mb-4">
                        <View className="flex-row justify-between mb-2 ml-1">
                            <Text className="text-slate-600 text-sm font-semibold">Registration Number</Text>
                            <Text className="text-slate-400 text-xs">(Optional)</Text>
                        </View>
                        <TextInput
                            className="bg-white rounded-2xl px-4 py-4 text-slate-900 font-semibold shadow-sm border border-transparent focus:border-purple-500"
                            placeholder="e.g. 12345678"
                            placeholderTextColor="#CBD5E1"
                            value={registrationNumber}
                            onChangeText={setRegistrationNumber}
                        />
                    </View>

                    <View className="mb-8">
                        <Text className="text-slate-600 text-sm font-semibold mb-2 ml-1">Industry / Category</Text>
                        <View className="bg-slate-100 rounded-2xl px-4 py-4 flex-row justify-between items-center">
                            <TextInput
                                className="flex-1 text-slate-900 font-semibold p-0"
                                placeholder="Select Industry"
                                placeholderTextColor="#64748B"
                                value={industry}
                                onChangeText={setIndustry}
                            />
                            <ChevronDown size={20} color="#94A3B8" />
                        </View>
                    </View>

                    {/* Contact Information */}
                    <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 ml-1">CONTACT INFORMATION</Text>

                    <View className="mb-4">
                        <Text className="text-slate-600 text-sm font-semibold mb-2 ml-1">Contact Person</Text>
                        <TextInput
                            className="bg-white rounded-2xl px-4 py-4 text-slate-900 font-semibold shadow-sm border border-transparent focus:border-purple-500"
                            placeholder="Full Name"
                            placeholderTextColor="#CBD5E1"
                            value={contactPerson}
                            onChangeText={setContactPerson}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-slate-600 text-sm font-semibold mb-2 ml-1">Email Address</Text>
                        <View className="bg-white rounded-2xl px-4 py-4 flex-row items-center shadow-sm border border-transparent focus:border-purple-500">
                            <Mail size={18} color="#94A3B8" className="mr-3" />
                            <TextInput
                                className="flex-1 text-slate-900 font-semibold p-0"
                                placeholder="client@company.com"
                                placeholderTextColor="#CBD5E1"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-slate-600 text-sm font-semibold mb-2 ml-1">Phone Number</Text>
                        <View className="bg-white rounded-2xl flex-row shadow-sm border border-transparent overflow-hidden">
                            <View className="bg-slate-50 px-4 py-4 border-r border-slate-100 flex-row items-center">
                                <Phone size={14} color="#64748B" className="mr-2" />
                                <Text className="text-slate-600 font-bold">+1</Text>
                            </View>
                            <TextInput
                                className="flex-1 px-4 py-4 text-slate-900 font-semibold"
                                placeholder="(555) 000-0000"
                                placeholderTextColor="#CBD5E1"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <View className="mb-8">
                        <Text className="text-slate-600 text-sm font-semibold mb-2 ml-1">Billing Address</Text>
                        <TextInput
                            className="bg-white rounded-2xl px-4 py-4 text-slate-900 font-semibold shadow-sm border border-transparent focus:border-purple-500 min-h-[100px]"
                            placeholder="Street address, City, State, Zip Code"
                            placeholderTextColor="#CBD5E1"
                            value={address}
                            onChangeText={setAddress}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Additional Details */}
                    <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 ml-1">ADDITIONAL DETAILS</Text>

                    <View className="flex-row justify-between mb-4 gap-4">
                        <View className="flex-1">
                            <Text className="text-slate-600 text-sm font-semibold mb-2 ml-1">Tax ID / VAT</Text>
                            <TextInput
                                className="bg-white rounded-2xl px-4 py-4 text-slate-900 font-semibold shadow-sm border border-transparent focus:border-purple-500"
                                placeholder="Optional"
                                placeholderTextColor="#CBD5E1"
                                value={taxId}
                                onChangeText={setTaxId}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-600 text-sm font-semibold mb-2 ml-1">Currency</Text>
                            <View className="bg-slate-100 rounded-2xl px-4 py-4 flex-row justify-between items-center">
                                <Text className="text-slate-900 font-semibold">{currency}</Text>
                                <ChevronDown size={16} color="#64748B" />
                            </View>
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-slate-600 text-sm font-semibold mb-2 ml-1">Internal Notes</Text>
                        <TextInput
                            className="bg-white rounded-2xl px-4 py-4 text-slate-900 font-semibold shadow-sm border border-transparent focus:border-purple-500 min-h-[80px]"
                            placeholder="Private notes only visible to your team..."
                            placeholderTextColor="#CBD5E1"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer Button */}
            <View className="absolute bottom-0 w-full bg-white/95 backdrop-blur-lg px-6 py-4 pb-8 border-t border-slate-100 rounded-t-[32px] shadow-2xl">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    className="w-full bg-[#4F46E5] h-14 rounded-full flex-row items-center justify-center shadow-lg shadow-indigo-500/30"
                    // Note: Screenshot uses purple similar to invoice (#9333EA) or indigo (#4F46E5). 
                    // Screenshot looks vivid blue/purple. Let's use #4F46E5 (Indigo) or #6366F1 matching the 'Create Client' button color.
                    // The invoice 'Preview & Send' was purple. The screenshot has a very "Blurple" button.
                    style={{ backgroundColor: '#4F46E5' }}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text className="text-white font-bold text-lg mr-2">Create Client</Text>
                            <ArrowLeft size={20} color="white" style={{ transform: [{ rotate: '180deg' }] }} strokeWidth={2.5} />
                        </>
                    )}
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}
