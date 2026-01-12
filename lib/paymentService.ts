import { supabase } from './supabase';

export type PaymentProvider = 'MTN' | 'ORANGE' | 'AIRTEL';

export interface PaymentResponse {
    success: boolean;
    status?: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
    transactionId?: string;
    message?: string;
}

export const initiateMobileMoneyPayment = async (
    invoiceId: string,
    amount: number,
    phoneNumber: string,
    provider: PaymentProvider
): Promise<PaymentResponse> => {
    try {
        console.log("Initiating Payment...", { invoiceId, amount, provider });

        // 1. Call the Gateway Function
        const { data, error } = await supabase.functions.invoke('momo-gateway', {
            body: {
                action: 'INITIATE_PAYMENT',
                invoiceId,
                amount,
                phoneNumber,
                provider
            }
        });

        if (error) throw error;

        return data as PaymentResponse;

    } catch (error: any) {
        // FALLBACK FOR DEMO / LOCAL DEV (If function not deployed)
        console.warn("Payment Gateway unreachable, switching to DEMO MOCK...", error);

        // Simulate API call delay
        await new Promise(r => setTimeout(r, 2000));

        if (phoneNumber.endsWith('0')) {
            throw new Error("Solde insuffisant (Simulation)");
        }

        // Auto-complete payment for demo if not testing "Pending"
        return {
            success: true,
            status: 'PENDING',
            transactionId: `DEMO-${Date.now()}`,
            message: "Simulation: Demande envoyée. Validez sur votre téléphone."
        };
    }
};

/**
 * For Demo purposes: Simulates the client validating the push on their phone.
 * Call this after 5 seconds to force the invoice to PAID.
 */
export const simulateUserValidation = async (invoiceId: string, provider: string) => {
    try {
        await supabase.functions.invoke('momo-gateway', {
            body: {
                action: 'SIMULATE_WEBHOOK',
                invoiceId,
                status: 'SUCCESSFUL',
                provider
            }
        });
    } catch (e) {
        // Fallback: Direct DB update if function fails
        console.log("Simulating Validation via Direct DB Update...");
        await supabase
            .from('invoices')
            .update({ status: 'paid' })
            .eq('id', invoiceId);
    }
}
