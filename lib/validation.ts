/**
 * Validation utilities for form inputs and data
 */

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates an email address
 */
export function validateEmail(email: string): ValidationResult {
    if (!email || email.trim().length === 0) {
        return { isValid: false, error: 'L\'email est requis' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return { isValid: false, error: 'Format d\'email invalide' };
    }

    return { isValid: true };
}

/**
 * Validates a password
 */
export function validatePassword(password: string): ValidationResult {
    if (!password || password.length === 0) {
        return { isValid: false, error: 'Le mot de passe est requis' };
    }

    if (password.length < 6) {
        return { isValid: false, error: 'Le mot de passe doit contenir au moins 6 caractères' };
    }

    return { isValid: true };
}

/**
 * Validates a customer name
 */
export function validateCustomerName(name: string): ValidationResult {
    if (!name || name.trim().length === 0) {
        return { isValid: false, error: 'Le nom du client est requis' };
    }

    if (name.trim().length < 2) {
        return { isValid: false, error: 'Le nom doit contenir au moins 2 caractères' };
    }

    return { isValid: true };
}

/**
 * Validates invoice items
 */
export function validateInvoiceItems(
    items: { description: string; quantity: number; unitPrice: number }[]
): ValidationResult {
    if (!items || items.length === 0) {
        return { isValid: false, error: 'Au moins un article est requis' };
    }

    for (const item of items) {
        if (!item.description || item.description.trim().length === 0) {
            return { isValid: false, error: 'Tous les articles doivent avoir une description' };
        }

        if (item.quantity <= 0) {
            return { isValid: false, error: 'La quantité doit être supérieure à 0' };
        }

        if (item.unitPrice < 0) {
            return { isValid: false, error: 'Le prix unitaire ne peut pas être négatif' };
        }
    }

    return { isValid: true };
}

/**
 * Validates a total amount
 */
export function validateTotalAmount(amount: number): ValidationResult {
    if (amount <= 0) {
        return { isValid: false, error: 'Le montant total doit être supérieur à 0' };
    }

    if (amount > 1000000000) {
        return { isValid: false, error: 'Le montant est trop élevé' };
    }

    return { isValid: true };
}

/**
 * Validates a phone number (basic validation)
 */
export function validatePhone(phone: string): ValidationResult {
    if (!phone || phone.trim().length === 0) {
        return { isValid: true }; // Phone is optional
    }

    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    if (!phoneRegex.test(phone.trim())) {
        return { isValid: false, error: 'Format de téléphone invalide' };
    }

    return { isValid: true };
}

/**
 * Validates a business name
 */
export function validateBusinessName(name: string): ValidationResult {
    if (!name || name.trim().length === 0) {
        return { isValid: false, error: 'Le nom du business est requis' };
    }

    if (name.trim().length < 2) {
        return { isValid: false, error: 'Le nom doit contenir au moins 2 caractères' };
    }

    return { isValid: true };
}

/**
 * Validates a currency code
 */
export function validateCurrency(currency: string): ValidationResult {
    if (!currency || currency.trim().length === 0) {
        return { isValid: false, error: 'La devise est requise' };
    }

    if (currency.trim().length < 3 || currency.trim().length > 3) {
        return { isValid: false, error: 'La devise doit être un code à 3 lettres (ex: RWF, USD, EUR)' };
    }

    return { isValid: true };
}

