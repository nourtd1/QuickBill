/**
 * Validation utilities for form inputs and data
 */

export interface ValidationResult {
    isValid: boolean;
    errorKey?: string;
}

/**
 * Validates an email address
 */
export function validateEmail(email: string): ValidationResult {
    if (!email || email.trim().length === 0) {
        return { isValid: false, errorKey: 'validation.required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return { isValid: false, errorKey: 'validation.email_invalid' };
    }

    return { isValid: true };
}

/**
 * Validates a password
 */
export function validatePassword(password: string): ValidationResult {
    if (!password || password.length === 0) {
        return { isValid: false, errorKey: 'validation.required' };
    }

    if (password.length < 6) {
        return { isValid: false, errorKey: 'validation.password_too_short' };
    }

    return { isValid: true };
}

/**
 * Validates a person's name
 */
export function validateName(name: string): ValidationResult {
    if (!name || name.trim().length === 0) {
        return { isValid: false, errorKey: 'validation.required' };
    }

    if (name.trim().length < 2) {
        return { isValid: false, errorKey: 'validation.name_too_short' };
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
        return { isValid: false, errorKey: 'validation.item_required' };
    }

    for (const item of items) {
        if (!item.description || item.description.trim().length === 0) {
            return { isValid: false, errorKey: 'validation.item_desc_required' };
        }

        if (item.quantity <= 0) {
            return { isValid: false, errorKey: 'validation.quantity_positive' };
        }

        if (item.unitPrice < 0) {
            return { isValid: false, errorKey: 'validation.price_non_negative' };
        }
    }

    return { isValid: true };
}

/**
 * Validates a total amount
 */
export function validateTotalAmount(amount: number): ValidationResult {
    if (amount <= 0) {
        return { isValid: false, errorKey: 'validation.amount_positive' };
    }

    if (amount > 1000000000) {
        return { isValid: false, errorKey: 'validation.amount_too_high' };
    }

    return { isValid: true };
}

/**
 * Validates a phone number
 */
export function validatePhone(phone: string): ValidationResult {
    if (!phone || phone.trim().length === 0) {
        return { isValid: true }; // Phone is optional
    }

    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    if (!phoneRegex.test(phone.trim()) || phone.trim().length < 6) {
        return { isValid: false, errorKey: 'validation.phone_invalid' };
    }

    return { isValid: true };
}

/**
 * Validates a business name
 */
export function validateBusinessName(name: string): ValidationResult {
    if (!name || name.trim().length === 0) {
        return { isValid: false, errorKey: 'validation.required' };
    }

    if (name.trim().length < 2) {
        return { isValid: false, errorKey: 'validation.name_too_short' };
    }

    return { isValid: true };
}

/**
 * Validates a currency code
 */
export function validateCurrency(currency: string): ValidationResult {
    if (!currency || currency.trim().length === 0) {
        return { isValid: false, errorKey: 'validation.required' };
    }

    if (currency.trim().length !== 3) {
        return { isValid: false, errorKey: 'validation.currency_invalid' };
    }

    return { isValid: true };
}
