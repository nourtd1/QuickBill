import { supabase } from './supabase';

interface SuggestionResponse {
    suggestion: {
        price: number;
        confidence: 'high' | 'medium' | 'low';
        basedOn: number;
    } | null;
}

interface AnomalyResponse {
    alerts: Array<{
        type: 'DUPLICATE' | 'DEVIATION';
        message: string;
        severity: 'warning' | 'danger';
    }>;
}

export const getSmartPriceSuggestion = async (userId: string, description: string): Promise<SuggestionResponse['suggestion']> => {
    try {
        const { data, error } = await supabase.functions.invoke('invoice-assistant', {
            body: {
                action: 'SUGGEST_PRICE',
                userId,
                data: { description }
            }
        });

        if (error) throw error;
        return data?.suggestion || null;
    } catch (e) {
        console.error('AI Suggestion Failed', e);
        return null; // Fail silently
    }
};

export const analyzeInvoiceForAnomalies = async (userId: string, invoiceData: any): Promise<AnomalyResponse['alerts']> => {
    try {
        const { data, error } = await supabase.functions.invoke('invoice-assistant', {
            body: {
                action: 'CHECK_ANOMALIES',
                userId,
                data: invoiceData
            }
        });

        if (error) throw error;
        return data?.alerts || [];
    } catch (e) {
        console.error('AI Analysis Failed', e);
        return [];
    }
};
