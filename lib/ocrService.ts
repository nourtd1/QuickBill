import { createWorker, Worker } from 'tesseract.js';
import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

/**
 * OCR Service specific for QuickBill
 * Handles image processing and text extraction
 */

export interface ReceiptData {
    total: number | null;
    date: string | null; // ISO 
    merchant: string | null;
    rawText: string;
}

/**
 * Upload image to Supabase Storage
 */
export const uploadReceiptImage = async (uri: string, userId: string): Promise<string | null> => {
    try {
        const ext = uri.substring(uri.lastIndexOf('.') + 1);
        const fileName = `${userId}/${Date.now()}.${ext}`;
        const formData = new FormData();

        // React Native specific file handling
        formData.append('files', {
            uri,
            name: fileName,
            type: `image/${ext}`
        } as any);

        const { data, error } = await supabase.storage
            .from('receipts')
            .upload(fileName, formData as any);

        if (error) throw error;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('Upload failed:', error);
        return null;
    }
};

/**
 * Scan Receipt using Tesseract.js (On Device / Local processing)
 * PRO TIP: For better results, we normally use Cloud Vision, but this is the Offline-First way.
 */
export const scanReceipt = async (imageUri: string): Promise<ReceiptData> => {
    console.log('🔍 Starting OCR scan...');
    const worker = await createWorker('fra'); // French by default as per QuickBill context

    // Tesseract.js in RN requires readAsStringAsync base64 usually, or URI.
    // However, the standard worker might need adaptation or specific parameters.
    // For this implementation, we assume the environment supports it, or we fallback.

    try {
        const { data: { text } } = await worker.recognize(imageUri);
        await worker.terminate();

        console.log('📝 Extracted Raw Text:', text.substring(0, 100) + '...');
        return parseReceiptText(text);

    } catch (e) {
        console.error('OCR Error:', e);
        // Fallback or re-throw
        throw new Error("Échec de l'analyse du reçu.");
    }
};

/**
 * Parsing Logic (Regex Magic)
 */
const parseReceiptText = (text: string): ReceiptData => {

    // 1. Total Amount
    // Matches: "Total 45.00", "TOTAL: 45,00", "Montant: 45000"
    const totalRegex = /(?:total|montant|payer|somme)[\D]*?(\d[\d\s,.]*)/i;
    const totalMatch = text.match(totalRegex);
    let total = null;
    if (totalMatch) {
        // Clean string: remove spaces, replace comma with dot
        const cleanAmount = totalMatch[1].replace(/\s/g, '').replace(',', '.');
        total = parseFloat(cleanAmount);
    }

    // 2. Date
    // Matches: DD/MM/YYYY, DD-MM-YYYY
    const dateRegex = /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/;
    const dateMatch = text.match(dateRegex);
    let date = null;
    if (dateMatch) {
        // Simple normalization (to ISO if possible, strict parsing requires moment/date-fns)
        // Here we just keep the string or try to construct Date
        try {
            const parts = dateMatch[1].split(/[-/.]/);
            // Assuming DD/MM/YYYY
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2].length === 2 ? '20' + parts[2] : parts[2], 10);
            date = new Date(year, month, day).toISOString();
        } catch (e) { }
    }

    // 3. Merchant (Heuristic: First non-empty line usually)
    const lines = text.split('\n').filter(line => line.trim().length > 3);
    const merchant = lines.length > 0 ? lines[0].trim() : null;

    return {
        total,
        date,
        merchant,
        rawText: text
    };
};
