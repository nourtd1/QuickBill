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
export function getErrorMessage(error: any): string {
    if (typeof error === 'string') {
        return error;
    }

    if (error?.message) {
        return error.message;
    }

    if (error?.error_description) {
        return error.error_description;
    }

    if (error?.code) {
        // Map common Supabase error codes to French messages
        const errorMessages: Record<string, string> = {
            '23505': 'Cette entrée existe déjà',
            '23503': 'Référence invalide',
            '42501': 'Permission refusée',
            'PGRST116': 'Aucun résultat trouvé',
            'invalid_credentials': 'Email ou mot de passe incorrect',
            'email_not_confirmed': 'Veuillez confirmer votre email',
            'user_not_found': 'Utilisateur non trouvé',
            'network_error': 'Erreur de connexion. Vérifiez votre internet.',
        };

        return errorMessages[error.code] || error.message || 'Une erreur est survenue';
    }

    return 'Une erreur inattendue est survenue';
}

/**
 * Shows an error alert to the user
 */
export function showError(error: any, title: string = 'Erreur') {
    const message = getErrorMessage(error);
    Alert.alert(title, message);
}

/**
 * Shows a success alert to the user
 */
export function showSuccess(message: string, title: string = 'Succès') {
    Alert.alert(title, message);
}

/**
 * Wraps an async function with error handling
 */
export async function handleAsyncError<T>(
    fn: () => Promise<T>,
    errorMessage?: string
): Promise<{ data: T | null; error: AppError | null }> {
    try {
        const data = await fn();
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

