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
        totalAmount: number,
        clientId?: string, // Optionnel: si le client est déjà sélectionné
        initialStatus: string = 'UNPAID' // Default status
    ) => {
        if (!user) throw new Error('Utilisateur non connecté');

        setSaving(true);
        try {
            let selectedClientId = clientId;

            // 1. Si pas de clientId, on cherche par nom ou on crée
            if (!selectedClientId) {
                const trimmedName = customerName.trim();

                // Recherche dans la nouvelle table 'clients'
                const { data: existingClient } = await supabase
                    .from('clients')
                    .select('id')
                    .eq('user_id', user.id)
                    .ilike('name', trimmedName)
                    .limit(1)
                    .single();

                if (existingClient) {
                    selectedClientId = existingClient.id;
                } else {
                    // Création automatique dans 'clients' si non trouvé
                    const { data: clientData, error: clientError } = await supabase
                        .from('clients')
                        .insert({
                            user_id: user.id,
                            name: trimmedName,
                        })
                        .select()
                        .single();

                    if (clientError) throw clientError;
                    selectedClientId = clientData.id;
                }
            }

            // 2. Insert Invoice (On garde temporairement customer_id pour la compatibilité schéma si besoin, 
            // mais idéalement on devrait migrer la FK vers client_id si le schéma change)
            // Note: Je suppose ici que le schéma des invoices utilise 'customer_id' 
            // et que la table 'clients' est la nouvelle référence.
            const { data: invoiceData, error: invoiceError } = await supabase
                .from('invoices')
                .insert({
                    user_id: user.id,
                    customer_id: selectedClientId, // On réutilise le champ customer_id pour pointer vers 'clients'
                    invoice_number: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    status: initialStatus,
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
