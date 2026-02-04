import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Invoice, InvoiceItem } from '../types';
import { saveClientLocally, saveInvoiceLocally, findClientByNameLocally, LocalInvoice, LocalInvoiceItem, generateUUID } from '../lib/localServices';
import { runSynchronization } from '../lib/syncService';
import NetInfo from '@react-native-community/netinfo';

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

            // 1. Si pas de clientId, on cherche par nom ou on crée LOCALEMENT
            if (!selectedClientId) {
                const trimmedName = customerName.trim();

                // Recherche locale
                const existingClient = await findClientByNameLocally(user.id, trimmedName);

                if (existingClient) {
                    selectedClientId = existingClient.id;
                } else {
                    // Création locale
                    const newClientId = await saveClientLocally({
                        user_id: user.id,
                        name: trimmedName
                    });
                    selectedClientId = newClientId;
                }
            }

            // 2. Prepare Invoice Data for Local Save
            const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            const invoiceData: Omit<LocalInvoice, 'id' | 'created_at' | 'updated_at' | 'sync_status'> = {
                user_id: user.id,
                customer_id: selectedClientId || null,
                invoice_number: invoiceNumber,
                status: initialStatus as any,
                currency: 'RWF', // Should come from profile/settings ideally
                exchange_rate: 1,
                subtotal: totalAmount, // Assuming no tax logic yet for simplicity
                tax_rate: 0,
                total_amount: totalAmount,
                due_date: null
            };

            const itemsData: Omit<LocalInvoiceItem, 'id' | 'invoice_id' | 'sync_status'>[] = items.map(item => ({
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total: item.quantity * item.unitPrice
            }));

            // 3. Save Locally
            const newInvoiceId = await saveInvoiceLocally(invoiceData, itemsData);

            // 4. Trigger Sync in Background if Online
            NetInfo.fetch().then(state => {
                if (state.isConnected) {
                    runSynchronization().catch(err => console.log('Background sync error:', err));
                }
            });

            // 5. Return constructed object for UI
            return {
                id: newInvoiceId,
                ...invoiceData,
                invoice_number: invoiceNumber,
                created_at: new Date().toISOString(),
                status: initialStatus
            };

        } catch (error) {
            console.error('Error creating invoice:', error);
            throw error;
        } finally {
            setSaving(false);
        }
    };

    return { createInvoice, saving };
}
