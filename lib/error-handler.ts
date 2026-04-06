/**
 * Centralized error handling utilities
 */

import { Alert } from 'react-native';

export interface AppError {
    message: string;
    code?: string;
    originalError?: unknown;
}

function errRecord(error: unknown): Record<string, unknown> | null {
    if (error !== null && typeof error === 'object') {
        return error as Record<string, unknown>;
    }
    return null;
}

/**
 * Extracts a user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown, t?: (key: string) => string): string {
    if (typeof error === 'string') {
        return error;
    }

    const rec = errRecord(error);
    if (!rec) {
        return t ? t('errors.unexpected') : 'An unexpected error occurred';
    }

    // Try localized error message from code
    const code = rec.code;
    if (typeof code === 'string' && t) {
        const localized = t(`errors.${code}`);
        if (localized !== `errors.${code}`) {
            return localized;
        }
    }

    if (typeof rec.message === 'string') {
        return rec.message;
    }

    if (typeof rec.error_description === 'string') {
        return rec.error_description;
    }

    if (typeof code === 'string') {
        const errorMessages: Record<string, string> = {
            '23505': 'This entry already exists',
            '23503': 'Invalid reference',
            '42501': 'Permission denied',
            'PGRST116': 'No results found',
            'invalid_credentials': 'Incorrect email or password',
            'email_not_confirmed': 'Please confirm your email',
            'user_not_found': 'User not found',
            'network_error': 'Connection error. Check your internet.',
        };

        const mapped = errorMessages[code];
        const msg = typeof rec.message === 'string' ? rec.message : undefined;
        return mapped || msg || 'An error occurred';
    }

    return t ? t('errors.unexpected') : 'An unexpected error occurred';
}

/**
 * Shows an error alert to the user
 */
export function showError(error: unknown, title: string = 'Error', t?: (key: string) => string) {
    const message = getErrorMessage(error, t);
    const localizedTitle = title === 'Error' || title === 'Erreur' ? (t ? t('errors.title') : title) : title;
    Alert.alert(localizedTitle, message);
}

/**
 * Shows a success alert to the user
 */
export function showSuccess(message: string, title: string = 'Success', t?: (key: string) => string) {
    const localizedTitle = title === 'Success' || title === 'Succès' ? (t ? t('common.success') : title) : title;
    Alert.alert(localizedTitle, message);
}

/**
 * Checks if an error is a network-related error that could be retried
 */
export function isNetworkError(error: unknown): boolean {
    const rec = errRecord(error);
    const message =
        rec && typeof rec.message === 'string' ? rec.message.toLowerCase() : '';
    return (
        message.includes('network error') ||
        message.includes('network request failed') ||
        message.includes('failed to fetch') ||
        rec?.code === 'network_error' ||
        rec?.status === 0 ||
        rec?.status === 502 ||
        rec?.status === 503 ||
        rec?.status === 504
    );
}

/**
 * Wraps an async function with automatic retry logic and exponential backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> {
    let lastError: unknown;

    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (error: unknown) {
            lastError = error;
            
            if (i < maxRetries && isNetworkError(error)) {
                const delay = initialDelay * Math.pow(2, i);
                console.log(`🔄 Retrying after network error (attempt ${i + 1}/${maxRetries}) in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            break;
        }
    }
    
    throw lastError;
}

/**
 * Wraps an async function with error handling and optional retry
 */
export async function handleAsyncError<T>(
    fn: () => Promise<T>,
    errorMessage?: string,
    options: { retry?: boolean; maxRetries?: number } = {}
): Promise<{ data: T | null; error: AppError | null }> {
    try {
        const data = options.retry 
            ? await withRetry(fn, options.maxRetries || 3)
            : await fn();
        return { data, error: null };
    } catch (error: unknown) {
        const rec = errRecord(error);
        const code = rec && typeof rec.code === 'string' ? rec.code : undefined;
        const appError: AppError = {
            message: errorMessage || getErrorMessage(error),
            code,
            originalError: error,
        };
        return { data: null, error: appError };
    }
}

