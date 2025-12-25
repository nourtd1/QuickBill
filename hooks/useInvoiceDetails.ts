import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Invoice, InvoiceWithRelations } from '../types';

export function useInvoiceDetails(id: string) {
    const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const fetchInvoice = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select(`
          *,
          customer:customers (*),
          items:invoice_items (*)
        `)
                .eq('id', id)
                .single();

            if (error) throw error;

            // Transform Supabase response to typed format
            const typedData: InvoiceWithRelations = {
                ...data,
                customer: Array.isArray(data.customer) ? data.customer[0] || null : data.customer || null,
                items: Array.isArray(data.items) ? data.items : (data.items ? [data.items] : []),
            };

            setInvoice(typedData);
        } catch (err) {
            console.error('Error fetching invoice details:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const toggleStatus = async () => {
        if (!invoice) return;
        setUpdating(true);

        const newStatus = invoice.status === 'PAID' ? 'UNPAID' : 'PAID';

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
