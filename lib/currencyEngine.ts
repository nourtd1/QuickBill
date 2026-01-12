/**
 * Currency Engine
 * Handles precise calculations and formatting for multi-currency support.
 */

// List of currencies using 0 decimal places (examples)
const ZERO_DECIMAL_CURRENCIES = ['RWF', 'BIF', 'DJF', 'GNF', 'KMF', 'UGX', 'VND', 'KRW', 'JPY', 'XAF', 'XOF'];

/**
 * Determines the number of decimal places for a currency
 */
export const getCurrencyDecimals = (currencyCode: string): number => {
    return ZERO_DECIMAL_CURRENCIES.includes(currencyCode.toUpperCase()) ? 0 : 2;
};

/**
 * Robust conversion function handling the rate calculation
 */
export const convertAmount = (amount: number, rate: number, toCurrency: string): number => {
    if (!amount) return 0;

    const converted = amount * rate;
    const decimals = getCurrencyDecimals(toCurrency);

    // Precise rounding method (epsilon correction for floating point issues)
    const factor = Math.pow(10, decimals);
    return Math.round((converted + Number.EPSILON) * factor) / factor;
};

/**
 * Formats a number into a currency string (e.g. "1 500 €", "$1,500.00")
 * Uses standard Intl API but forces culture 'fr-FR' or 'en-US' based on context if needed.
 * Ideally we use user's locale, here defaulting to fr-FR for QuickBill typical usage, or passing locale.
 */
export const formatCurrency = (amount: number, currencyCode: string, locale: string = 'fr-FR'): string => {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: getCurrencyDecimals(currencyCode),
            maximumFractionDigits: getCurrencyDecimals(currencyCode),
        }).format(amount);
    } catch (e) {
        // Fallback if currency code is invalid
        return `${amount} ${currencyCode}`;
    }
};

/**
 * Unformats a currency string back to number (rough utility for parsing inputs)
 */
export const parseCurrencyInput = (input: string): number => {
    // Remove non-numeric chars except dot and comma
    const sanitized = input.replace(/[^0-9.,]/g, '');
    // Replace comma with dot if present as decimal separator
    const normalized = sanitized.replace(',', '.');
    const result = parseFloat(normalized);
    return isNaN(result) ? 0 : result;
};
