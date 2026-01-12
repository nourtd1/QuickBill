// Supabase Edge Function: momo-gateway
// Location: supabase/functions/momo-gateway/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handling CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const body = await req.json()
        const { action, invoiceId, phoneNumber, provider, amount } = body

        // ------------------------------------------------------------------
        // ACTION: INITIATE_PAYMENT (Push STK)
        // ------------------------------------------------------------------
        if (action === 'INITIATE_PAYMENT') {
            if (!invoiceId || !phoneNumber || !provider || !amount) {
                throw new Error('Missing payment details')
            }

            console.log(`[MoMo] Initiating ${provider} Payment of ${amount} for Invoice ${invoiceId} to ${phoneNumber}`);

            // 1. Log Transaction in DB (Recommended for audit)
            // Ideally create a 'transactions' table. For now, we just log to console.

            // 2. Call Provider API (MOCKED FOR DEMO)
            // In production, you would switch(provider) and call MTN/Orange APIs here.

            // SIMULATION LOGIC:
            // if phone ends with '0', simulate failure
            // if phone ends with '1', simulate instant success (via mock webhook)
            // default: simulate success after delay

            const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Simulate Provider Logic
            if (phoneNumber.endsWith('0')) {
                return new Response(JSON.stringify({
                    success: false,
                    message: "Solde insuffisant ou num\u00e9ro invalide."
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
            }

            // In a real scenario, we return "PENDING" and wait for Webhook.
            // For this demo, we can perform the "Webhook" side-effect here if instant, 
            // OR return pending and let the frontend poll.

            // Let's trigger the "Mock" update in 5 seconds to simulate user typing PIN
            // We can't use setTimeout well in Edge Functions if we return response.
            // So we'll trust the User Logic: The UI will show "Waiting".

            // However, to make it work "End-to-End" without real provider:
            // We will auto-update the invoice to PAID after 2 seconds via a separate async process or just here for MVP.

            // LET'S DO THE PROPER WAY: 
            // Return PENDING.
            // And exposes a 'SIMULATE_WEBHOOK' action for testing.

            return new Response(JSON.stringify({
                success: true,
                status: 'PENDING',
                transactionId,
                message: `Demande de paiement envoyée au ${phoneNumber}. Veuillez valider sur votre téléphone.`
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ------------------------------------------------------------------
        // ACTION: WEBHOOK (Real Providers call this)
        // ------------------------------------------------------------------
        // This simulates what MTN/Orange would send us back
        if (action === 'WEBHOOK' || action === 'SIMULATE_WEBHOOK') {
            const { transactionId, status, externalRef } = body;

            console.log(`[Webhook] Received update for ${invoiceId}: ${status}`);

            if (status === 'SUCCESSFUL') {
                // Update Invoice Status to PAID
                const { error } = await supabase
                    .from('invoices')
                    .update({
                        status: 'paid',
                        payment_method: provider || 'MOBILE_MONEY', // ensure col exists or ignore
                        updated_at: new Date()
                    })
                    .eq('id', invoiceId);

                if (error) throw error;

                return new Response(JSON.stringify({ received: true, updated: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            return new Response(JSON.stringify({ received: true, updated: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        throw new Error('Unknown Action');

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
