import { useState } from 'react';
import { parseReceipt, ExtractedReceiptData } from '../lib/ocr';

export function useOCR() {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [extractedData, setExtractedData] = useState<ExtractedReceiptData | null>(null);

    const scanReceipt = async (imageUri: string) => {
        setProcessing(true);
        setError(null);
        setExtractedData(null);

        try {
            const data = await parseReceipt(imageUri);
            setExtractedData(data);
            return data;
        } catch (err: any) {
            const errorMessage = err.message || 'Erreur lors du scan du reçu';
            setError(errorMessage);
            throw err;
        } finally {
            setProcessing(false);
        }
    };

    const reset = () => {
        setExtractedData(null);
        setError(null);
    };

    return {
        scanReceipt,
        processing,
        error,
        extractedData,
        reset,
    };
}

