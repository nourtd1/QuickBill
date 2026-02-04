import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const handler = async (req: Request): Promise<Response> => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
    }

    try {
        const { email, role, inviterEmail } = await req.json();

        if (!RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is not set");
        }

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
        
            },
            body: JSON.stringify({
                from: "QuickBill Team <onboarding@resend.dev>", // Note: Verify this domain on Resend dashboard or use default
                to: [email],
                subject: "Invitation à rejoindre l'équipe QuickBill",
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1E40AF;">Bienvenue sur QuickBill !</h1>
            <p>Bonjour,</p>
            <p><strong>${inviterEmail}</strong> vous a invité à rejoindre son espace de travail en tant que <span style="background-color: #DBEAFE; color: #1E40AF; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${role.toUpperCase()}</span>.</p>
            <p>Pour commencer, téléchargez l'application et connectez-vous simplement avec votre adresse email :</p>
            <div style="background-color: #F8FAFC; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <strong>${email}</strong>
            </div>
            <p style="color: #64748B; font-size: 14px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
          </div>
        `,
            }),
        });

        const data = await res.json();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }
};

serve(handler);
