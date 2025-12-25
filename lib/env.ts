/**
 * Environment variables validation and configuration
 */

const requiredEnvVars = {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
};

/**
 * Validates that all required environment variables are set
 * @throws Error if any required variable is missing
 */
export function validateEnv(): void {
    const missing: string[] = [];

    for (const [key, value] of Object.entries(requiredEnvVars)) {
        if (!value || value.trim().length === 0) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Variables d'environnement manquantes : ${missing.join(', ')}\n` +
            'Veuillez créer un fichier .env avec ces variables ou les configurer dans app.json.'
        );
    }
}

/**
 * Gets the Supabase URL with validation
 */
export function getSupabaseUrl(): string {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!url || url.trim().length === 0) {
        throw new Error('EXPO_PUBLIC_SUPABASE_URL n\'est pas définie');
    }
    return url;
}

/**
 * Gets the Supabase anonymous key with validation
 */
export function getSupabaseAnonKey(): string {
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!key || key.trim().length === 0) {
        throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY n\'est pas définie');
    }
    return key;
}

