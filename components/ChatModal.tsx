import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Send, User, MessageCircle, X, MoreHorizontal } from 'lucide-react-native';
import { useChat, Message } from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';

interface Props {
    invoiceId: string;
    visible: boolean;
    onClose: () => void;
    userType?: 'owner' | 'client'; // Defaults to owner if logged in
}

const PRE_WRITTEN_MESSAGES = [
    "Merci pour votre paiement !",
    "Avez-vous bien reçu la facture ?",
    "La facture arrive à échéance demain.",
    "N'hésitez pas si vous avez des questions."
];

export default function ChatModal({ invoiceId, visible, onClose, userType = 'owner' }: Props) {
    const { messages, sendMessage, loading, markAsRead } = useChat(invoiceId, userType);
    const { user } = useAuth();
    const [inputText, setInputText] = useState('');
    const listRef = useRef<FlatList>(null);
    const [showTemplates, setShowTemplates] = useState(false);

    useEffect(() => {
        if (visible) {
            markAsRead();
        }
    }, [visible, messages]);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim()) return;
        try {
            await sendMessage(inputText, user?.id);
            setInputText('');
        } catch (e) {
            // Error handling
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.sender_type === userType;
        return (
            <View className={`flex-row mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                    <View className="w-8 h-8 rounded-full bg-slate-200 items-center justify-center mr-2 self-end mb-1">
                        <User size={16} color="#64748B" />
                    </View>
                )}
                <View
                    className={`px-4 py-2.5 rounded-2xl max-w-[75%] ${isMe
                        ? 'bg-blue-600 rounded-br-none'
                        : 'bg-slate-100 rounded-bl-none'
                        }`}
                >
                    <Text className={`text-sm ${isMe ? 'text-white' : 'text-slate-800'}`}>
                        {item.content}
                    </Text>
                    <Text className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-slate-400'} text-right`}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View className="flex-1 bg-white">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
                    <View className="flex-row items-center">
                        <View className="bg-blue-50 p-2 rounded-full mr-3">
                            <MessageCircle size={20} color="#2563EB" />
                        </View>
                        <View>
                            <Text className="font-bold text-slate-900 text-lg">Discussion</Text>
                            <Text className="text-slate-500 text-xs">Direct avec le client</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose} className="bg-slate-50 p-2 rounded-full">
                        <X size={20} color="#64748B" />
                    </TouchableOpacity>
                </View>

                {/* Messages List */}
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                    className="flex-1 bg-slate-50"
                    inverted={false} // Normal order
                />

                {/* Templates (Quick Replies) */}
                {showTemplates && (
                    <View className="bg-white border-t border-slate-100 h-40">
                        <FlatList
                            data={PRE_WRITTEN_MESSAGES}
                            keyExtractor={i => i}
                            horizontal={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => { setInputText(item); setShowTemplates(false); }}
                                    className="px-4 py-3 border-b border-slate-50 active:bg-slate-50"
                                >
                                    <Text className="text-slate-700">{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* Input Area */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
                    <View className="p-3 border-t border-slate-100 bg-white flex-row items-center">
                        <TouchableOpacity
                            onPress={() => setShowTemplates(!showTemplates)}
                            className="mr-2 p-2"
                        >
                            <MoreHorizontal size={24} color="#94A3B8" />
                        </TouchableOpacity>

                        <TextInput
                            className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-slate-900 mx-2 max-h-24"
                            placeholder="Écrivez un message..."
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!inputText.trim()}
                            className={`w-10 h-10 rounded-full items-center justify-center ${inputText.trim() ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                            <Send size={18} color="white" className="ml-0.5" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}
