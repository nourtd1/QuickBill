import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { processReceiptWithGemini } from './gemini';

export interface ExtractedReceiptData {
    merchant: string | null;
    date: string | null;
    amount: number | null;
    currency: string | null;
    items: Array<{ description: string; amount: number }>;
    tax: number | null;
}

/**
 * Uploads local image to Supabase Storage and returns public URL
 */
async function uploadReceiptImage(uri: string): Promise<string> {
    const fileName = `receipt_${Date.now()}.jpg`;
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

    const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, decode(base64), {
            contentType: 'image/jpeg',
            upsert: true
        });

    if (error) {
        console.warn("Storage Upload Warn:", error.message);
        throw error;
    }

    const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName);
    return publicUrl;
}

/**
 * Scans a receipt using user's Gemini API Key (Client Side)
 * ensuring Real Data is extracted.
 */
export async function scanReceipt(imageUri: string): Promise<ExtractedReceiptData> {
    console.log("Starts scanning:", imageUri);

    try {
        // 1. Convert Image to Base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });

        // Detect Mime Type
        const ext = imageUri.split('.').pop()?.toLowerCase();
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        // support webp or others? Gemini supports: image/png, image/jpeg, image/webp, image/heic, image/heif

        // 2. Call Gemini AI
        console.log("Calling Gemini for analysis...");
        const aiData = await processReceiptWithGemini(base64, mimeType);

        // 3. Upload Background (Best Effort) - Non-blocking if possible or after
        // We do it after success to ensure we don't save garbage, or parallel?
        // Parallel is better for speed.
        uploadReceiptImage(imageUri).catch(e => console.warn("Upload failed but OCR succeeded", e));

        return aiData;

    } catch (error: any) {
        console.error("Scan Error:", error);
        throw new Error("Impossible d'analyser le reçu. Veuillez réessayer.");
    }
}
