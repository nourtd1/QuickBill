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
                        text: "Tu es un assistant comptable. Analyse cet enregistrement vocal et extrais les détails de la facture. Retourne UNIQUEMENT un objet JSON valide (sans Markdown) avec cette structure : { \"amount\": number (numeric only), \"customerName\": string, \"description\": string }. Si une information manque, devine-la ou mets null."
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

        // 3. Call Gemini API (Using the standard alias for latest stable flash model)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
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
