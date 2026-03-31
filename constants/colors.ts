/**
 * Couleurs unifiées pour l'application Quick Bill
 * Utiliser ces constantes partout pour maintenir la cohérence visuelle
 */

export const COLORS = {
    // Couleur primaire principale (Blue)
    primary: '#2563EB', // Blue-600
    primaryLight: '#3B82F6', // Blue-500
    primaryDark: '#1E40AF', // Blue-800
    
    // Couleurs d'accent
    accent: '#6366F1', // Indigo-500
    accentLight: '#818CF8', // Indigo-400
    
    // Couleurs de statut
    success: '#10B981', // Emerald-500
    successLight: '#34D399', // Emerald-400
    warning: '#F59E0B', // Amber-500
    warningLight: '#FBBF24', // Amber-400
    danger: '#EF4444', // Red-500
    dangerLight: '#F87171', // Red-400
    info: '#3B82F6', // Blue-500
    
    // Couleurs neutres
    slate50: '#F8FAFC',
    slate100: '#F1F5F9',
    slate200: '#E2E8F0',
    slate300: '#CBD5E1',
    slate400: '#94A3B8',
    slate500: '#64748B',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1E293B',
    slate900: '#0F172A',
    
    // Backgrounds
    background: '#F9FAFC',
    backgroundLight: '#FFFFFF',
    backgroundDark: '#F3F4F6',
    
    // Text
    textPrimary: '#0F172A', // slate-900
    textSecondary: '#64748B', // slate-500
    textTertiary: '#94A3B8', // slate-400
    textLight: '#CBD5E1', // slate-300
    
    // Borders
    border: '#E2E8F0', // slate-200
    borderLight: '#F1F5F9', // slate-100
    
    // Shadows
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowDark: 'rgba(0, 0, 0, 0.2)',
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    
    // Transparent
    transparent: 'transparent',
    white: '#FFFFFF',
    black: '#000000',
} as const;

// Couleurs par statut de facture
export const INVOICE_STATUS_COLORS = {
    paid: {
        bg: '#D1FAE5', // emerald-100
        text: '#047857', // emerald-700
        border: '#6EE7B7', // emerald-300
    },
    unpaid: {
        bg: '#FEF3C7', // amber-100
        text: '#B45309', // amber-700
        border: '#FCD34D', // amber-300
    },
    overdue: {
        bg: '#FEE2E2', // red-100
        text: '#B91C1C', // red-700
        border: '#FCA5A5', // red-300
    },
    sent: {
        bg: '#DBEAFE', // blue-100
        text: '#1E40AF', // blue-800
        border: '#93C5FD', // blue-300
    },
    draft: {
        bg: '#F1F5F9', // slate-100
        text: '#475569', // slate-600
        border: '#CBD5E1', // slate-300
    },
    pending_approval: {
        bg: '#FED7AA', // orange-200
        text: '#C2410C', // orange-700
        border: '#FDBA74', // orange-300
    },
} as const;

// Couleurs par catégorie de dépense
export const EXPENSE_CATEGORY_COLORS = {
    meals: '#6366F1', // Indigo-500
    travel: '#3B82F6', // Blue-500
    office: '#8B5CF6', // Violet-500
    marketing: '#EC4899', // Pink-500
    utilities: '#14B8A6', // Teal-500
    other: '#64748B', // Slate-500
} as const;

export type ColorKey = keyof typeof COLORS;
export type InvoiceStatus = keyof typeof INVOICE_STATUS_COLORS;
export type ExpenseCategory = keyof typeof EXPENSE_CATEGORY_COLORS;
