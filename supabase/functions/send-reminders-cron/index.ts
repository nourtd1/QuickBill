// Supabase Edge Function: send-reminders-cron (T2.27)
// À appeler via cron (Supabase Cron ou externe) pour détecter les factures en retard.
// L'envoi WhatsApp réel est effectué par l'app via reminderService quand l'utilisateur l'ouvre.

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

        const today = new Date().toISOString().split('T')[0]

        const { data: overdue, error } = await supabase
            .from('invoices')
            .select('id, user_id, invoice_number, due_date, total_amount, status')
            .neq('status', 'paid')
            .neq('status', 'draft')
            .lt('due_date', today)

        if (error) {
            throw error
        }

        const count = overdue?.length ?? 0

        return new Response(JSON.stringify({
            success: true,
            overdue_count: count,
            overdue_ids: (overdue ?? []).map((r: any) => r.id),
            message: count > 0
                ? `${count} facture(s) en retard. Les relances sont envoyées par l'app (reminderService).`
                : 'Aucune facture en retard.',
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
