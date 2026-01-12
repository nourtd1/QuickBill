import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

// Mock AI Logic (Replace with OpenAI fetch in production)
const MOCK_RECEIPT_DATA = {
    merchant: "Carrefour Market",
    date: new Date().toISOString().split('T')[0],
    amount: 15400,
    currency: "RWF",
    items: [
        { description: "Lait Inyange", amount: 1200 },
        { description: "Pain Supa", amount: 1500 },
        { description: "Riz Basmati 5kg", amount: 12700 }
    ],
    tax: 2350
};

serve(async (req) => {
    try {
        const { image_url } = await req.json();

        // In a real scenario:
        // 1. Fetch image from image_url
        // 2. Send to GPT-4o with prompt: "Extract receipt data as JSON"
        // 3. Return JSON

        // Simulating processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        return new Response(JSON.stringify({
            success: true,
            data: MOCK_RECEIPT_DATA
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
