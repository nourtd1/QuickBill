import * as FileSystem from 'expo-file-system/legacy';

// We check both variables to be flexible, but we know the user put a Gemini key in the OpenAI variable
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

export const processAudioWithGemini = async (uri: string): Promise<any> => {
    if (!API_KEY) {
        throw new Error("Missing API Key (EXPO_PUBLIC_GEMINI_API_KEY or EXPO_PUBLIC_OPENAI_API_KEY)");
    }

    try {
        // 1. Convert Audio to Base64
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
        });

        // 2. Prepare Request for Gemini 1.5 Flash (Multimodal)
        // Note: Expo AV 'm4a' is typically 'audio/mp4' compatible container for Gemini
        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: `Tu es un assistant comptable intelligent. Analyse cet enregistrement vocal où un utilisateur dicte les informations d'une facture à créer. 
Ton objectif est d'extraire les éléments essentiels avec une précision absolue. 
Retourne UNIQUEMENT un objet JSON valide (aucun bloc markdown, aucune explication) avec cette structure exacte : 
{
  "amount": number (Le montant total de la facture, nombre uniquement, pas de texte, null si absent),
  "customerName": string (Le nom du client, null si non précisé),
  "description": string (Une courte description de la prestation ou des articles facturés, null si non précisé)
}.`
                    },
                    {
                        inline_data: {
                            mime_type: "audio/mp4",
                            data: base64Audio
                        }
                    }
                ]
            }],
            generationConfig: {
                response_mime_type: "application/json"
            }
        };

        // 3. Call Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gemini API Error:", data.error);
            throw new Error(data.error.message || "Erreur Gemini API");
        }

        // 4. Parse Response
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) throw new Error("Réponse vide de Gemini");

        console.log("Gemini Raw Response:", textResponse);
        return JSON.parse(textResponse);

    } catch (error) {
        console.error('Gemini Processing Error:', error);
        throw error;
    }
};

export const processReceiptWithGemini = async (base64Image: string, mimeType: string = "image/jpeg"): Promise<any> => {
    if (!API_KEY) {
        throw new Error("Missing API Key (EXPO_PUBLIC_GEMINI_API_KEY or EXPO_PUBLIC_OPENAI_API_KEY)");
    }

    try {
        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: `Tu es un expert comptable spécialisé dans l'extraction de données et la reconnaissance optique de caractères (OCR). Analyse attentivement cette image. 
Il peut s'agir d'une facture formelle classique, d'un simple ticket de caisse papier, d'une note manuscrite, ou même d'une capture d'écran d'un texte reçu (SMS, WhatsApp, conversation) décrivant une vente ou un service.
Ton objectif est d'extraire de manière exhaustive et précise les données financières, peu importe l'origine ou le format (papier ou numérique). Ignore tout le texte non pertinent (politesse, salutations, blabla).
IMPORTANT - MISSION DÉTECTIVE : S'il s'agit d'une tout autre information non financière (exemple : le scan d'un livre, un lien web, ou un texte générique), ne retourne SURTOUT PAS que des valeurs nulles. Tu dois analyser ces informations et inscrire un résumé très clair de ce que tu as trouvé dans le champ "merchant" (ex: "Livre : [Titre et Infos]", "Lien URL : [Lien]", ou "Texte : [Contenu]").
Retourne UNIQUEMENT un objet JSON valide (aucun bloc markdown, aucune explication ni balise) respectant scrupuleusement cette structure :
{
  "merchant": string (Nom du commerce, de l'expéditeur du message ou du prestataire, null si introuvable),
  "date": string (Format YYYY-MM-DD, null si introuvable),
  "amount": number (Le montant total TTC, format numérique pur sans devise ni virgule, ex: 15400. null si introuvable),
  "currency": string (Le code de la devise, ex: "RWF", "EUR", "USD", null si introuvable),
  "tax": number (Le montant total des taxes, format numérique pur, null si absent),
  "items": [
    {
      "description": string (Description claire de l'article, du lot ou du service facturé),
      "amount": number (Montant total pour cet article, format numérique)
    }
  ]
}`
                    },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Image
                        }
                    }
                ]
            }],
            generationConfig: {
                response_mime_type: "application/json"
            }
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gemini API Error:", data.error);
            throw new Error(data.error.message || "Erreur Gemini API");
        }

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) throw new Error("Réponse vide de Gemini");

        return JSON.parse(textResponse);

    } catch (error) {
        console.error('Gemini Receipt Error:', error);
        throw error;
    }
};

export const processQRCodeWithGemini = async (qrText: string): Promise<any> => {
    if (!API_KEY) {
        throw new Error("Missing API Key (EXPO_PUBLIC_GEMINI_API_KEY or EXPO_PUBLIC_OPENAI_API_KEY)");
    }

    try {
        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: `Tu es un expert comptable. Voici le contenu brut d'un code QR scanné sur une facture ou un reçu :
"${qrText}"

Ton objectif est d'extraire de manière exhaustive et précise les données financières.
IMPORTANT - MISSION DÉTECTIVE : Si le code QR contient une tout autre information non financière (exemple : un code ISBN de livre, un site web, ou un texte aléatoire), ne retourne SURTOUT PAS que des valeurs nulles. Analyse intellectuellement l'information et donne un résumé très détaillé de ce que tu as trouvé dans le champ "merchant" (ex: "Livre : [Titre/Auteur]", "Lien Internet : [URL]", "Contenu : [Texte]").
Retourne UNIQUEMENT un objet JSON valide (aucun bloc markdown, aucune explication) respectant cette structure (utilise des valeurs null si l'information est introuvable) :
{
  "merchant": string,
  "date": string (YYYY-MM-DD),
  "amount": number,
  "currency": string,
  "tax": number,
  "items": [
    {
      "description": string,
      "amount": number
    }
  ]
}`
                    }
                ]
            }],
            generationConfig: {
                response_mime_type: "application/json"
            }
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || "Erreur Gemini API");
        }

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) throw new Error("Réponse vide de Gemini");

        return JSON.parse(textResponse);
    } catch (error) {
        console.error('Gemini QR Error:', error);
        throw error;
    }
};
