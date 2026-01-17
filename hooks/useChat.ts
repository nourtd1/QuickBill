import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface Message {
    id: string;
    content: string;
    sender_type: 'owner' | 'client';
    created_at: string;
    sender_id?: string;
}

export const useChat = (invoiceId: string, userType: 'owner' | 'client') => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!invoiceId) return;

        // 1. Initial Fetch
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('invoice_messages')
                .select('*')
                .eq('invoice_id', invoiceId)
                .order('created_at', { ascending: true });

            if (data) setMessages(data);
            setLoading(false);
        };

        fetchMessages();

        // 2. Realtime Subscription
        const channel = supabase
            .channel(`chat:${invoiceId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'invoice_messages',
                    filter: `invoice_id=eq.${invoiceId}`
                },
                (payload) => {
                    const newMessage = payload.new as Message;
                    // Optimistic update check to avoid duplication if we just sent it
                    setMessages((current) => {
                        if (current.find(m => m.id === newMessage.id)) return current;
                        return [...current, newMessage];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [invoiceId]);

    const sendMessage = async (content: string, userId?: string) => {
        if (!content.trim()) return;

        // Optimistic UI update (optional, but good for UX)
        // We skip it here to let Realtime handle the feedback loop for strict sync.

        const { error } = await supabase
            .from('invoice_messages')
            .insert({
                invoice_id: invoiceId,
                content: content,
                sender_type: userType,
                sender_id: userId || null
            });

        if (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    };

    const markAsRead = async () => {
        if (!invoiceId || userType !== 'owner') return;

        const { error } = await supabase
            .from('invoice_messages')
            .update({ read_at: new Date().toISOString() })
            .eq('invoice_id', invoiceId)
            .eq('sender_type', 'client')
            .is('read_at', null);

        if (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    return {
        messages,
        loading,
        sendMessage,
        markAsRead
    };
};
