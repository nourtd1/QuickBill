/**
 * Unit tests for lib/validation.ts (T3.3)
 */
import {
    validateEmail,
    validatePassword,
    validateName,
    validatePhone,
    validateInvoiceItems,
    validateTotalAmount,
    validateBusinessName,
    validateCurrency,
} from '../../lib/validation';

describe('validateEmail', () => {
    it('returns invalid for empty string', () => {
        expect(validateEmail('').isValid).toBe(false);
        expect(validateEmail('   ').isValid).toBe(false);
    });
    it('returns invalid for bad format', () => {
        expect(validateEmail('notanemail').isValid).toBe(false);
        expect(validateEmail('a@b').isValid).toBe(false);
    });
    it('returns valid for correct email', () => {
        expect(validateEmail('user@example.com').isValid).toBe(true);
        expect(validateEmail('  user@domain.co  ').isValid).toBe(true);
    });
});

describe('validatePassword', () => {
    it('returns invalid for empty or too short', () => {
        expect(validatePassword('').isValid).toBe(false);
        expect(validatePassword('12345').isValid).toBe(false);
    });
    it('returns valid for 6+ chars', () => {
        expect(validatePassword('123456').isValid).toBe(true);
        expect(validatePassword('password').isValid).toBe(true);
    });
});

describe('validateName', () => {
    it('returns invalid for empty or too short', () => {
        expect(validateName('').isValid).toBe(false);
        expect(validateName('A').isValid).toBe(false);
    });
    it('returns valid for 2+ chars', () => {
        expect(validateName('John').isValid).toBe(true);
    });
});

describe('validatePhone', () => {
    it('returns valid for empty (optional)', () => {
        expect(validatePhone('').isValid).toBe(true);
        expect(validatePhone('   ').isValid).toBe(true);
    });
    it('returns invalid for too short or invalid chars', () => {
        expect(validatePhone('123').isValid).toBe(false);
        expect(validatePhone('abc').isValid).toBe(false);
    });
    it('returns valid for valid phone', () => {
        expect(validatePhone('+33612345678').isValid).toBe(true);
        expect(validatePhone('0612345678').isValid).toBe(true);
    });
});

describe('validateInvoiceItems', () => {
    it('returns invalid for empty array', () => {
        expect(validateInvoiceItems([]).isValid).toBe(false);
    });
    it('returns invalid for item without description', () => {
        expect(validateInvoiceItems([{ description: '', quantity: 1, unitPrice: 10 }]).isValid).toBe(false);
    });
    it('returns invalid for quantity <= 0 or negative price', () => {
        expect(validateInvoiceItems([{ description: 'Item', quantity: 0, unitPrice: 10 }]).isValid).toBe(false);
        expect(validateInvoiceItems([{ description: 'Item', quantity: 1, unitPrice: -1 }]).isValid).toBe(false);
    });
    it('returns valid for valid items', () => {
        expect(validateInvoiceItems([{ description: 'Service', quantity: 2, unitPrice: 50 }]).isValid).toBe(true);
    });
});

describe('validateTotalAmount', () => {
    it('returns invalid for <= 0 or too high', () => {
        expect(validateTotalAmount(0).isValid).toBe(false);
        expect(validateTotalAmount(-1).isValid).toBe(false);
        expect(validateTotalAmount(1000000001).isValid).toBe(false);
    });
    it('returns valid for reasonable amount', () => {
        expect(validateTotalAmount(100).isValid).toBe(true);
    });
});

describe('validateCurrency', () => {
    it('returns invalid for empty or not 3 chars', () => {
        expect(validateCurrency('').isValid).toBe(false);
        expect(validateCurrency('US').isValid).toBe(false);
    });
    it('returns valid for 3-letter code', () => {
        expect(validateCurrency('USD').isValid).toBe(true);
        expect(validateCurrency('EUR').isValid).toBe(true);
    });
});
