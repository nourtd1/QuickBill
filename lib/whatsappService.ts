/**
 * WhatsApp integration service
 */

/**
 * Shortens a URL using a public API
 */
export async function shortenUrl(url: string): Promise<string> {
    try {
        const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
            method: 'GET'
        });
        if (response.ok) {
            const shortened = await response.text();
            return shortened;
        }
        return url;
    } catch (error) {
        console.error('Error shortening URL:', error);
        return url;
    }
}

/**
 * Generates a WhatsApp message with localized formatting and shortened link
 */
export async function generateWhatsAppLink(params: {
    phone: string;
    clientName: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    publicUrl: string;
    template?: string;
    defaultTemplate: string;
    locale?: string;
}): Promise<{ url: string; message: string }> {
    const { 
        phone, clientName, invoiceNumber, amount, 
        currency, publicUrl, template, defaultTemplate, locale 
    } = params;

    // 1. Shorten the URL if possible
    const shortLink = await shortenUrl(publicUrl);

    // 2. Clean phone number
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // 3. Format amount
    const formattedAmount = amount.toLocaleString(locale === 'fr' || locale === 'fr-FR' ? 'fr-FR' : 'en-US');

    // 4. Fill template
    let message = template || defaultTemplate;
    message = message
        .replace('{client}', clientName)
        .replace('{numero}', invoiceNumber)
        .replace('{montant}', formattedAmount)
        .replace('{devise}', currency)
        .replace('{link}', shortLink);

    // 5. Create final WhatsApp API link
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    return { url, message };
}

/**
 * Logs a WhatsApp message to the database
 */
export async function logWhatsAppMessage(params: {
    user_id: string;
    invoice_id?: string;
    client_id?: string;
    message: string;
    type?: 'invoice_share' | 'reminder' | 'custom';
}) {
    const { supabase } = await import('./supabase');
    
    const { data, error } = await supabase.from('whatsapp_messages').insert({
        user_id: params.user_id,
        invoice_id: params.invoice_id,
        client_id: params.client_id,
        message: params.message,
        type: params.type || 'invoice_share'
    });

    if (error) {
        console.error('Error logging WhatsApp message:', error);
    }

    // Also log locally if needed (syncService will handle standard sync if we add it there)
    // For now, Supabase is the primary log
    return data;
}
