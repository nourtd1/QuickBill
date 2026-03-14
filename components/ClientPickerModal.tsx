import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { User, Check, Search, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useClients } from '../hooks/useClients';
import { useLanguage } from '../context/LanguageContext';
import { Client } from '../types';

interface ClientPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (clientId: string, clientName: string, client: Client) => void;
    selectedClientId?: string | null;
}

export function ClientPickerModal({ visible, onClose, onSelect, selectedClientId }: ClientPickerModalProps) {
    const { data: clients } = useClients();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useLanguage();

    const [searchQuery, setSearchQuery] = useState('');

    const filteredClients = useMemo(() => {
        if (!clients) return [];
        if (!searchQuery) return clients;
        const q = searchQuery.toLowerCase();
        return clients.filter(c =>
            c.name.toLowerCase().includes(q) ||
            (c.email && c.email.toLowerCase().includes(q)) ||
            (c.phone && c.phone.includes(q))
        );
    }, [clients, searchQuery]);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-black/50">
                <View
                    className="bg-white rounded-t-[32px] max-h-[85%]"
                    style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                >
                    <View className="px-6 py-5 border-b border-slate-50 flex-row justify-between items-center bg-white z-10 rounded-t-[32px]">
                        <View>
                            <Text className="text-xl font-bold text-slate-900">{t('client_picker.title')}</Text>
                            <Text className="text-slate-400 text-sm">{t('client_picker.subtitle')}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="bg-slate-100 p-2.5 rounded-full">
                            <X size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <View className="p-6 pb-2">
                        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14">
                            <Search size={22} color="#94A3B8" />
                            <TextInput
                                className="flex-1 ml-3 text-base text-slate-900 font-medium"
                                placeholder={t('client_picker.search_placeholder')}
                                placeholderTextColor="#CBD5E1"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingTop: 10 }}>
                        {filteredClients.map(client => (
                            <TouchableOpacity
                                key={client.id}
                                onPress={() => onSelect(client.id, client.name, client)}
                                className={`p-4 rounded-2xl mb-3 flex-row justify-between items-center ${selectedClientId === client.id
                                        ? 'bg-blue-50 border-2 border-blue-200'
                                        : 'bg-white border border-slate-100 shadow-sm'
                                    }`}
                            >
                                <View className="flex-row items-center flex-1">
                                    <View className="w-12 h-12 rounded-2xl bg-blue-50 items-center justify-center mr-4">
                                        {client.name ? <Text className="text-blue-600 font-black text-lg">{client.name.charAt(0)}</Text> : <User size={20} color="#2563EB" />}
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-bold text-slate-900 text-lg mb-0.5">{client.name}</Text>
                                        <Text className="text-slate-500 text-sm mt-0.5">{client.email || client.phone}</Text>
                                    </View>
                                </View>
                                {selectedClientId === client.id && (
                                    <View className="w-6 h-6 bg-blue-600 rounded-full items-center justify-center">
                                        <Check size={14} color="white" strokeWidth={3} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}

                        {(!clients || clients.length === 0) && !searchQuery && (
                            <View className="py-10 items-center">
                                <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
                                    <User size={32} color="#94A3B8" />
                                </View>
                                <Text className="text-slate-900 font-bold text-lg mb-2">{t('client_picker.no_clients')}</Text>
                                <Text className="text-slate-500 text-center mb-6 px-8">
                                    {t('client_picker.no_clients_desc')}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        onClose();
                                        router.push('/(tabs)/clients/form');
                                    }}
                                    className="bg-blue-600 px-6 py-3 rounded-full"
                                >
                                    <Text className="text-white font-bold">{t('client_picker.add_client')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {searchQuery && filteredClients.length === 0 && (
                            <View className="py-10 items-center">
                                <Text className="text-slate-500 text-center">
                                    {t('client_picker.no_results')}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
