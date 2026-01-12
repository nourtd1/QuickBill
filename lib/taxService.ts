import { supabase } from './supabase';

export type TaxJurisdiction = 'RW' | 'TD' | 'OTHER';

export interface TaxReportSummary {
    totalRevenue: number;
    totalVAT: number;
    netAmount: number;
    invoiceCount: number;
    jurisdiction: TaxJurisdiction;
    period: { start: Date; end: Date };
}

export const TAX_RATES = {
    'RW': 0.18, // Rwanda 18%
    'TD': 0.18, // Chad 18% (Standard)
    'OTHER': 0
};

export const getTaxJurisdiction = (countryCode?: string): TaxJurisdiction => {
    if (countryCode === 'Rwanda' || countryCode === 'RW') return 'RW';
    if (countryCode === 'Tchad' || countryCode === 'Chad' || countryCode === 'TD') return 'TD';
    return 'OTHER';
};

export const getTaxDeadlineMessages = (jurisdiction: TaxJurisdiction): string => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Logic: Deadline is usually 15th of next month (Rwanda/Chad similar for VAT)
    // This is a simplified logic.
    const deadlineDay = 15;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    const deadlineDate = new Date(nextYear, nextMonth, deadlineDay);

    const diffTime = Math.abs(deadlineDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 5) {
        return `⚠️ Attention: Déclaration fiscale due dans ${diffDays} jours (le ${deadlineDay} du mois prochain).`;
    }
    return '';
};

export const generateTaxReport = async (
    userId: string,
    startDate: Date,
    endDate: Date,
    userCountry?: string
): Promise<TaxReportSummary> => {
    // 1. Fetch Invoices in range
    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .neq('status', 'DRAFT'); // Exclude drafts

    if (error) throw error;

    const jurisdiction = getTaxJurisdiction(userCountry);
    const taxRate = TAX_RATES[jurisdiction];

    let totalRevenue = 0;

    // Calculate totals
    invoices.forEach(inv => {
        totalRevenue += (inv.total_amount || 0);
    });

    // Reverse calc VAT if inclusive, or simple calc if exclusive?
    // Usually QuickBill amounts are "Total". Assuming Inclusive for simple compliance or Exclusive?
    // Let's assume the Invoice Amount IS the Total (TTC).
    // Net = Total / (1 + Rate)
    // VAT = Total - Net

    // Note: In real app, each line item should store tax status.
    // For MVP, we apply flat rate logic based on profile country.

    const netAmount = totalRevenue / (1 + taxRate);
    const totalVAT = totalRevenue - netAmount;

    return {
        totalRevenue,
        totalVAT,
        netAmount,
        invoiceCount: invoices.length,
        jurisdiction,
        period: { start: startDate, end: endDate }
    };
};
