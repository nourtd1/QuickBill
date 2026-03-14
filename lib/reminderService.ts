import { supabase } from './supabase';
import { generateWhatsAppLink } from './whatsappService';

export interface ReminderConfig {
    enabled: boolean;
    delays: number[]; // e.g., [7, 14, 30]
    template?: string;
}

/**
 * Detects invoices that are past their due date and not paid
 */
export async function detectOverdueInvoices() {
    const today = new Date().toISOString();
    
    const { data, error } = await supabase
        .from('invoices')
        .select('*, customer:clients(*)')
        .neq('status', 'paid')
        .neq('status', 'PAID')
        .lt('due_date', today);

    if (error) {
        if (__DEV__) console.error('Error detecting overdue invoices:', error);
        return [];
    }

    return data;
}

/**
 * Prepares a reminder message for an invoice
 */
export async function prepareReminder(invoice: any, profile: any, t: any, language: string) {
    if (!invoice.customer?.phone) return null;

    const publicUrl = `https://quickbill.app/public/invoice/${invoice.share_token}`;
    
    // Default reminder template if none set in profile
    const defaultTemplate = language === 'fr-FR' 
        ? "Rappel : Votre facture {numero} de {montant} {devise} est en retard. Merci de régulariser. Lien : {link}"
        : "Reminder: Your invoice {numero} of {montant} {devise} is overdue. Please settle. Link: {link}";

    const url = await generateWhatsAppLink({
        phone: invoice.customer.phone,
        clientName: invoice.customer.name,
        invoiceNumber: invoice.invoice_number,
        amount: invoice.total_amount,
        currency: profile.currency || (language === 'fr-FR' ? 'RWF' : 'USD'),
        publicUrl,
        template: profile.reminder_template || defaultTemplate,
        defaultTemplate,
        locale: language
    });

    return url;
}
