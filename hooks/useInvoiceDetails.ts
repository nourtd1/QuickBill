import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { InvoiceWithRelations } from '../types';
import { useAuth } from '../context/AuthContext';
import { getInvoiceDetailsLocal, getInvoiceDetailsLocalById } from '../lib/localServices';

export function useInvoiceDetails(id: string) {
    const { user } = useAuth();
    const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const fetchInvoice = useCallback(async () => {
        if (!id) return;
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            console.error('Invalid UUID:', id);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Updated to use 'clients' table instead of 'customers'
            const { data, error } = await supabase
                .from('invoices')
                .select(`
                    *,
                    customer:clients (*),
                    items:invoice_items (*),
                    whatsapp_history:whatsapp_messages(*)
                `)
                .eq('id', id)
                .order('created_at', { foreignTable: 'whatsapp_messages', ascending: false })
                // Avoid PGRST116 by never using `.single()` on empty results.
                .limit(1);

            if (error) {
                // Supabase may fail when the invoice isn't pushed yet (schema/cache/RLS issues).
                // For the user experience, fallback to local SQLite and avoid blocking the screen.
                try {
                    const local = user?.id
                        ? await getInvoiceDetailsLocal(user.id, id)
                        : await getInvoiceDetailsLocalById(id);
                    if (local) setInvoice(local as any);
                } catch (fallbackErr) {
                    console.error('Local invoice fallback failed:', fallbackErr);
                }
                return;
            }

            // No row yet in Supabase => fallback to local SQLite.
            const row = Array.isArray(data) ? data[0] : (data as any);
            if (!row) {
                const local = user?.id
                    ? await getInvoiceDetailsLocal(user.id, id)
                    : await getInvoiceDetailsLocalById(id);
                if (local) setInvoice(local as any);
                return;
            }

            // Transform Supabase response to typed format
            const typedData: InvoiceWithRelations & { whatsapp_history?: any[] } = {
                ...row,
                customer: Array.isArray(row.customer) ? row.customer[0] : row.customer,
                items: Array.isArray(row.items) ? row.items : (row.items ? [row.items] : []),
                whatsapp_history: row.whatsapp_history || []
            };

            setInvoice(typedData);
        } catch (err) {
            // Final fallback if Supabase fails for any reason.
            console.error('Error fetching invoice details:', err);
            try {
                const local = user?.id
                    ? await getInvoiceDetailsLocal(user.id, id)
                    : await getInvoiceDetailsLocalById(id);
                if (local) setInvoice(local as any);
            } catch (fallbackErr) {
                console.error('Error fetching local invoice details:', fallbackErr);
            }
        } finally {
            setLoading(false);
        }
    }, [id, user?.id]);

    const toggleStatus = async () => {
        if (!invoice) return;
        setUpdating(true);

        const newStatus = invoice.status === 'paid' ? 'unpaid' : 'paid';

        // Optimistic Update
        setInvoice(prev => prev ? { ...prev, status: newStatus } : null);

        const { error } = await supabase
            .from('invoices')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            // Revert on error
            console.error('Error updating status:', error);
            setInvoice(prev => prev ? { ...prev, status: invoice.status } : null);
        }

        setUpdating(false);
    };

    useEffect(() => {
        fetchInvoice();
    }, [fetchInvoice]);

    return { invoice, loading, updating, toggleStatus };
}
