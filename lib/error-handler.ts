/**
 * Centralized error handling utilities
 */

import { Alert } from 'react-native';

export interface AppError {
    message: string;
    code?: string;
    originalError?: any;
}

/**
 * Extracts a user-friendly error message from various error types
 */
export function getErrorMessage(error: any, t?: (key: string) => string): string {
    if (typeof error === 'string') {
        return error;
    }

    // Try localized error message from code
    if (error?.code && t) {
        const localized = t(`errors.${error.code}`);
        if (localized !== `errors.${error.code}`) {
            return localized;
        }
    }

    if (error?.message) {
        return error.message;
    }

    if (error?.error_description) {
        return error.error_description;
    }

    if (error?.code) {
        // Fallback mapping if no translator provided
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

        return errorMessages[error.code] || error.message || 'An error occurred';
    }

    return t ? t('errors.unexpected') : 'An unexpected error occurred';
}

/**
 * Shows an error alert to the user
 */
export function showError(error: any, title: string = 'Error', t?: any) {
    const message = getErrorMessage(error, t);
    const localizedTitle = title === 'Error' || title === 'Erreur' ? (t ? t('errors.title') : title) : title;
    Alert.alert(localizedTitle, message);
}

/**
 * Shows a success alert to the user
 */
export function showSuccess(message: string, title: string = 'Success', t?: any) {
    const localizedTitle = title === 'Success' || title === 'Succès' ? (t ? t('common.success') : title) : title;
    Alert.alert(localizedTitle, message);
}

/**
 * Checks if an error is a network-related error that could be retried
 */
export function isNetworkError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return (
        message.includes('network error') ||
        message.includes('network request failed') ||
        message.includes('failed to fetch') ||
        error?.code === 'network_error' ||
        error?.status === 0 ||
        error?.status === 502 ||
        error?.status === 503 ||
        error?.status === 504
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
    let lastError: any;
    
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
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
    } catch (error: any) {
        const appError: AppError = {
            message: errorMessage || getErrorMessage(error),
            code: error?.code,
            originalError: error,
        };
        return { data: null, error: appError };
    }
}

