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
        initialStatus: string = 'unpaid', // Default status
        options?: {
            invoiceNumber?: string;
            issueDate?: string | null;
            dueDate?: string | null;
            currency?: string;
            subtotal?: number;
            taxRate?: number;
            taxAmount?: number;
            discount?: number;
            notes?: string | null;
            terms?: string | null;
        }
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

            // 2. Préparer les données de facture pour l'enregistrement local
            const invoiceNumber =
                options?.invoiceNumber && options.invoiceNumber.trim().length > 0
                    ? options.invoiceNumber.trim()
                    : `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            const currency = options?.currency || 'RWF';
            const subtotal = typeof options?.subtotal === 'number' ? options.subtotal : totalAmount;
            const taxRate = typeof options?.taxRate === 'number' ? options.taxRate : 0;
            const taxAmount = typeof options?.taxAmount === 'number' ? options.taxAmount : 0;
            const discount = typeof options?.discount === 'number' ? options.discount : 0;
            const issueDate = options?.issueDate || new Date().toISOString();
            const dueDate = options?.dueDate ?? null;

            const invoiceData: Omit<LocalInvoice, 'id' | 'created_at' | 'updated_at' | 'sync_status'> = {
                user_id: user.id,
                customer_id: selectedClientId || null,
                invoice_number: invoiceNumber,
                status: initialStatus as any,
                currency,
                exchange_rate: 1,
                subtotal,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                discount,
                total_amount: totalAmount,
                issue_date: issueDate,
                due_date: dueDate,
                notes: options?.notes ?? null,
                terms: options?.terms ?? null,
                public_link_token: null,
                share_token: null
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
