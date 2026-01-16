import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// NOTE: In a real production app, you should proxy these calls through your backend (Supabase Edge Function)
// to avoid exposing your API KEY in the client code.
// For this MVP/Demo, we might use a direct call if the user provides a key, otherwise we fallback.
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || ''; // Add this to your .env

export const transcribeAudio = async (uri: string): Promise<string> => {
    if (!OPENAI_API_KEY) {
        throw new Error("Missing OpenAI API Key. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.");
    }

    try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
            throw new Error('Audio file does not exist');
        }

        const formData = new FormData();
        formData.append('file', {
            uri,
            name: 'audio.m4a',
            type: 'audio/m4a', // Expo AV default
        } as any);
        formData.append('model', 'whisper-1');
        formData.append('language', 'fr'); // Force French for better results

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'multipart/form-data',
            },
            body: formData,
        });

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message);
        }

        return data.text;
    } catch (error) {
        console.error('Transcription Error:', error);
        throw error;
    }
};

export const analyzeInvoiceRequestGPT = async (text: string) => {
    if (!OPENAI_API_KEY) {
        console.warn("No OpenAI Key, falling back to basic regex parser.");
        return null; // Fallback to Regex
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are an invoice assistant. Extract structured data from the user input. Return JSON only: { amount: number, customerName: string, description: string }."
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0,
            }),
        });

        const data = await response.json();
        const content = data.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        console.error('GPT Error:', error);
        return null;
    }
};
