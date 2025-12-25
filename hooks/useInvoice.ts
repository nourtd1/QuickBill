import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Invoice, InvoiceItem } from '../types';

export function useInvoice() {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);

    const createInvoice = async (
        customerName: string,
        items: { description: string; quantity: number; unitPrice: number }[],
        totalAmount: number
    ) => {
        if (!user) throw new Error('Utilisateur non connecté');

        setSaving(true);
        try {
            // 1. Create or Get Customer (Basic logic: Just create for now or find by name if you prefer)
            // For MVP simplicity, we will just create a new customer record or attach to existing if found?
            // Let's first Insert the Invoice. 
            // Ideally we need a customer_id. Let's insert a customer first.

            const { data: customerData, error: customerError } = await supabase
                .from('customers')
                .insert({
                    user_id: user.id,
                    name: customerName,
                    phone: '' // Optional for now
                })
                .select()
                .single();

            if (customerError) throw customerError;

            // 2. Insert Invoice
            const { data: invoiceData, error: invoiceError } = await supabase
                .from('invoices')
                .insert({
                    user_id: user.id,
                    customer_id: customerData.id,
                    invoice_number: `INV-${Math.floor(Math.random() * 100000)}`, // Simple Random ID
                    status: 'UNPAID',
                    total_amount: totalAmount,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (invoiceError) throw invoiceError;

            // 3. Insert Invoice Items
            const invoiceItems = items.map(item => ({
                invoice_id: invoiceData.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unitPrice
            }));

            const { error: itemsError } = await supabase
                .from('invoice_items')
                .insert(invoiceItems);

            if (itemsError) throw itemsError;

            return invoiceData;

        } catch (error) {
            console.error('Error creating invoice:', error);
            throw error;
        } finally {
            setSaving(false);
        }
    };

    return { createInvoice, saving };
}
