// Supabase Edge Function: track-invoice-view
// Location: supabase/functions/track-invoice-view/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { invoice_id, user_agent } = await req.json()

        if (!invoice_id) {
            throw new Error('Missing invoice_id');
        }

        // 1. Get Invoice & Owner Info
        const { data: invoice, error: invError } = await supabase
            .from('invoices')
            .select(`
            id, 
            invoice_number, 
            user_id,
            profiles ( expo_push_token )
        `)
            .eq('id', invoice_id)
            .single();

        if (invError || !invoice) {
            console.error('Invoice not found');
            return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 2. Log View
        await supabase.from('invoice_views').insert({
            invoice_id: invoice_id,
            user_agent: user_agent
        });

        // 3. Send Notification to Owner
        // @ts-ignore
        const pushToken = invoice.profiles?.expo_push_token;

        if (pushToken) {
            console.log(`Sending push to ${pushToken}`);

            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: pushToken,
                    sound: 'default',
                    title: '👀 Facture consultée',
                    body: `Votre client consulte la facture #${invoice.invoice_number}`,
                    data: { invoiceId: invoice.id },
                }),
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
