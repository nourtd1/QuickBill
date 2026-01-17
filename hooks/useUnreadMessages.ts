import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useUnreadMessages() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        if (!user) return;

        // Count messages where sender is client and read_at is null
        // We filter by invoices belonging to the user
        const { count, error } = await supabase
            .from('invoice_messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_type', 'client')
            .is('read_at', null);

        // Note: RLS will automatically filter messages for invoices the user doesn't own
        if (error) {
            console.error('Error fetching unread count:', error);
        } else {
            setUnreadCount(count || 0);
        }
    };

    useEffect(() => {
        fetchUnreadCount();

        // Subscribe to new messages
        const channel = supabase
            .channel('global-unread-messages')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT (new msg) and UPDATE (marked as read)
                    schema: 'public',
                    table: 'invoice_messages'
                },
                () => {
                    fetchUnreadCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    return unreadCount;
}
