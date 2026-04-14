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
                // response_mime_type is restricted in some v1 regions, relying on prompt instructions
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
            if (data.error.code === 429 || data.error.status === "RESOURCE_EXHAUSTED") {
                throw new Error("Quota d'IA dépassé. Veuillez réessayer plus tard ou vérifier votre forfait.");
            }
            throw new Error(data.error.message || "Erreur Gemini API");
        }

        // 4. Parse Response
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) throw new Error("Réponse vide de Gemini");

        console.log("Gemini Raw Response:", textResponse);
        
        let cleanJson = textResponse;
        const startIndex = cleanJson.indexOf('{');
        const endIndex = cleanJson.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
            cleanJson = cleanJson.substring(startIndex, endIndex + 1);
        }
        
        return JSON.parse(cleanJson);

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
 Ton objectif est d'extraire de manière exhaustive et précise les données financières, peu importe l'origine ou le format (papier ou numérique).
IMPORTANT - MISSION DÉTECTIVE : 
- Si l'image n'est pas financière (ex: livre, lien, texte pur), résume le contenu dans "merchant" (ex: "Livre : [Titre]").
- Détermine la catégorie de dépense probable parmi : "Alimentation", "Transport", "Santé", "Loisirs", "Logement", "Services", "Autre".
Retourne UNIQUEMENT un objet JSON valide (sans balises markdown) :
{
  "merchant": string (Nom du commerce ou prestataire, null si inconnu),
  "date": string (Format YYYY-MM-DD, même si écrit différemment sur le reçu),
  "amount": number (Montant total TTC, nombre pur),
  "currency": string (Code devise ISO, ex: "RWF", "EUR", "USD", null si inconnu),
  "category": string (La catégorie détectée),
  "tax": number (Montant total des taxes ou TVA, null si absent),
  "items": [
    {
      "description": string (Nom de l'article ou service),
      "amount": number (Prix total de cet item)
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
                // response_mime_type is restricted in some v1 regions, relying on prompt instructions
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
            if (data.error.code === 429 || data.error.status === "RESOURCE_EXHAUSTED") {
                throw new Error("Quota d'IA dépassé. Veuillez réessayer plus tard ou vérifier votre forfait.");
            }
            throw new Error(data.error.message || "Erreur Gemini API");
        }

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) throw new Error("Réponse vide de Gemini");

        let cleanJson = textResponse;
        const startIndex = cleanJson.indexOf('{');
        const endIndex = cleanJson.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
            cleanJson = cleanJson.substring(startIndex, endIndex + 1);
        }
        
        return JSON.parse(cleanJson);

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
IMPORTANT - MISSION DÉTECTIVE : 
- Si le contenu n'est pas financier, résume l'info dans "merchant".
- Détermine la catégorie probable ("Alimentation", "Transport", "Santé", "Loisirs", "Logement", "Services", "Autre").
Retourne UNIQUEMENT un objet JSON valide :
{
  "merchant": string,
  "date": string (YYYY-MM-DD),
  "amount": number,
  "currency": string,
  "category": string,
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
                // response_mime_type is restricted in some v1 regions, relying on prompt instructions
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
            if (data.error.code === 429 || data.error.status === "RESOURCE_EXHAUSTED") {
                throw new Error("Quota d'IA dépassé. Veuillez réessayer plus tard ou vérifier votre forfait.");
            }
            throw new Error(data.error.message || "Erreur Gemini API");
        }

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) throw new Error("Réponse vide de Gemini");

        let cleanJson = textResponse;
        const startIndex = cleanJson.indexOf('{');
        const endIndex = cleanJson.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
            cleanJson = cleanJson.substring(startIndex, endIndex + 1);
        }
        
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Gemini QR Error:', error);
        throw error;
    }
};
