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
            // 1. Find existing customer by name (case-insensitive) or create new one
            const trimmedName = customerName.trim();
            
            // Search for existing customer
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('user_id', user.id)
                .ilike('name', trimmedName)
                .limit(1)
                .single();

            let customerId: string;

            if (existingCustomer) {
                // Use existing customer
                customerId = existingCustomer.id;
            } else {
                // Create new customer
                const { data: customerData, error: customerError } = await supabase
                    .from('customers')
                    .insert({
                        user_id: user.id,
                        name: trimmedName,
                        phone: '' // Optional for now
                    })
                    .select()
                    .single();

                if (customerError) throw customerError;
                customerId = customerData.id;
            }

            // 2. Insert Invoice
            const { data: invoiceData, error: invoiceError } = await supabase
                .from('invoices')
                .insert({
                    user_id: user.id,
                    customer_id: customerId,
                    invoice_number: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // More unique ID
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
