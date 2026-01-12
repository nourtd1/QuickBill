/**
 * OCR (Optical Character Recognition) pour extraction de texte depuis images de reçus
 * Utilise Tesseract.js - 100% GRATUIT et fonctionne offline
 */

import { createWorker, Worker } from 'tesseract.js';

let worker: Worker | null = null;

/**
 * Initialise le worker Tesseract (à faire une seule fois)
 */
async function initWorker(): Promise<Worker> {
    if (!worker) {
        worker = await createWorker('fra'); // Français (peut être 'eng' pour anglais)
        await worker.setParameters({
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/-: ',
        });
    }
    return worker;
}

/**
 * Extrait le texte brut d'une image
 */
export async function extractTextFromImage(imageUri: string): Promise<string> {
    try {
        const worker = await initWorker();
        const { data: { text } } = await worker.recognize(imageUri);
        return text.trim();
    } catch (error) {
        console.error('Erreur OCR:', error);
        throw new Error('Impossible d\'extraire le texte de l\'image');
    }
}

/**
 * Structure des données extraites d'un reçu
 */
export interface ExtractedReceiptData {
    amount: number | null;
    date: string | null;
    merchant: string | null;
    items: Array<{ description: string; amount: number }>;
    tax: number | null;
    confidence: number; // 0-1
}

/**
 * Parse un reçu et extrait les informations structurées
 */
export async function parseReceipt(imageUri: string): Promise<ExtractedReceiptData> {
    const text = await extractTextFromImage(imageUri);

    // Extraction du montant total
    // Patterns communs : "TOTAL: 50,000 RWF", "Total: 50000", etc.
    const amountPatterns = [
        /total[:\s]+([\d\s,]+\.?\d*)\s*(RWF|USD|EUR|rwf|usd|eur)/i,
        /montant[:\s]+([\d\s,]+\.?\d*)\s*(RWF|USD|EUR|rwf|usd|eur)/i,
        /([\d\s,]+\.?\d*)\s*(RWF|USD|EUR|rwf|usd|eur)/i,
    ];

    let amount: number | null = null;
    for (const pattern of amountPatterns) {
        const match = text.match(pattern);
        if (match) {
            const amountStr = match[1].replace(/[\s,]/g, '');
            amount = parseFloat(amountStr);
            if (!isNaN(amount)) break;
        }
    }

    // Extraction de la date
    // Patterns : "12/01/2026", "12-01-2026", "12 Janvier 2026"
    const datePatterns = [
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
        /(\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{2,4})/i,
    ];

    let date: string | null = null;
    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            date = match[1];
            break;
        }
    }

    // Si pas de date trouvée, utiliser aujourd'hui
    if (!date) {
        date = new Date().toISOString().split('T')[0];
    }

    // Extraction du nom du marchand (première ligne significative)
    const lines = text.split('\n').filter(line => line.trim().length > 3);
    const merchant = lines[0] || null;

    // Extraction de la TVA/Taxe (optionnel)
    const taxPatterns = [
        /tva[:\s]+([\d\s,]+\.?\d*)/i,
        /tax[:\s]+([\d\s,]+\.?\d*)/i,
    ];

    let tax: number | null = null;
    for (const pattern of taxPatterns) {
        const match = text.match(pattern);
        if (match) {
            const taxStr = match[1].replace(/[\s,]/g, '');
            tax = parseFloat(taxStr);
            if (!isNaN(tax)) break;
        }
    }

    // Extraction d'items (basique - peut être amélioré)
    const items: Array<{ description: string; amount: number }> = [];
    // Logique simple : chercher des lignes avec montants
    const itemLines = lines.filter(line => {
        const hasAmount = /[\d\s,]+\.?\d*\s*(RWF|USD|EUR)/i.test(line);
        return hasAmount && !line.toLowerCase().includes('total');
    });

    itemLines.forEach(line => {
        const amountMatch = line.match(/([\d\s,]+\.?\d*)\s*(RWF|USD|EUR)/i);
        if (amountMatch) {
            const itemAmount = parseFloat(amountMatch[1].replace(/[\s,]/g, ''));
            const description = line.replace(amountMatch[0], '').trim();
            if (description && !isNaN(itemAmount)) {
                items.push({ description, amount: itemAmount });
            }
        }
    });

    // Calculer confiance basique (peut être amélioré)
    const confidence = amount ? 0.8 : 0.5; // Si montant trouvé, confiance plus élevée

    return {
        amount,
        date,
        merchant,
        items,
        tax,
        confidence,
    };
}

/**
 * Nettoie le worker (à appeler quand l'app se ferme)
 */
export async function cleanupWorker(): Promise<void> {
    if (worker) {
        await worker.terminate();
        worker = null;
    }
}

