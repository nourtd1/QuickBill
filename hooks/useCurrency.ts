import { useState, useEffect, useCallback } from 'react';
import { getRate } from '../lib/exchangeRateService';
import { convertAmount, formatCurrency as formatEngine } from '../lib/currencyEngine';
import styles from '../app/onboarding.tsx'; // Just to assume context usage if needed, but not required here.
import { useAuth } from '../context/AuthContext'; // To get user default currency preference if exists

export const useCurrency = (initialCurrency: string = 'USD') => {
    const [currency, setCurrency] = useState(initialCurrency);
    const [exchangeRate, setExchangeRate] = useState<number>(1);
    const [loading, setLoading] = useState(false);

    // User's default system currency (e.g. where they live)
    // Could come from AuthContext user profile
    const { profile } = useAuth();
    const systemCurrency = profile?.default_currency || 'USD';

    // When currency changes, fetch rate relative to user's system currency for display
    // OR relative to USD if we are just converting generic values.
    // Usually: We want to know 1 [InvoiceCurrency] = ? [SystemCurrency]
    // So if Invoice is USD and I am in RWF, I want rate USD->RWF.
    const fetchRate = useCallback(async (target: string, base: string = 'USD') => {
        setLoading(true);
        try {
            const rate = await getRate(base, target);
            setExchangeRate(rate);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initialize
    useEffect(() => {
        setCurrency(initialCurrency);
    }, [initialCurrency]);

    // Format helper
    const format = useCallback((amount: number, curr?: string) => {
        return formatEngine(amount, curr || currency);
    }, [currency]);

    // Convert helper
    const convert = useCallback((amount: number, targetCurr: string, rateVal?: number) => {
        // If rate provided use it, otherwise use current exchangeRate state (assuming state is correct direction)
        const activeRate = rateVal !== undefined ? rateVal : exchangeRate;
        return convertAmount(amount, activeRate, targetCurr);
    }, [exchangeRate]);

    // Function to calculate equivalent in user's home currency
    // Useful for "Equivalent: 75,000 RWF" display
    const getEquivalentInSystemCurrency = async (amount: number, invoiceCurrency: string) => {
        if (invoiceCurrency === systemCurrency) return null;
        const rate = await getRate(invoiceCurrency, systemCurrency);
        const converted = convertAmount(amount, rate, systemCurrency);
        return {
            amount: converted,
            formatted: formatEngine(converted, systemCurrency),
            currency: systemCurrency,
            rateUsed: rate
        };
    };

    return {
        currency,
        setCurrency,
        exchangeRate, // The rate for the current currency context
        loading,
        format,
        convert,
        fetchRate, // Manual trigger to update rate context
        getEquivalentInSystemCurrency
    };
};
