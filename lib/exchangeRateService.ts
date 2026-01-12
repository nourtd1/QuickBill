import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'quickbill_exchange_rates';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest/';

interface RatesCache {
    base: string;
    date: string;
    rates: Record<string, number>;
    timestamp: number;
}

/**
 * Validates if the cached rates are still valid (less than 24h old)
 */
constisCacheValid = (cache: RatesCache | null): boolean => {
    if (!cache) return false;
    const now = Date.now();
    return (now - cache.timestamp) < CACHE_DURATION;
};

/**
 * Fetches exchange rates from API or Cache
 * Defaults to USD base if not specified
 */
export const getExchangeRates = async (baseCurrency: string = 'USD'): Promise<Record<string, number>> => {
    try {
        // 1. Check Cache
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const cache: RatesCache = JSON.parse(cachedData);
            if (cache.base === baseCurrency && isCacheValid(cache)) {
                console.log('💱 Using cached exchange rates');
                return cache.rates;
            }
        }

        // 2. Fetch from API
        console.log(`🌐 Fetching fresh exchange rates for ${baseCurrency}...`);
        const response = await fetch(`${API_BASE_URL}${baseCurrency}`);

        if (!response.ok) {
            throw new Error('Failed to fetch rates');
        }

        const data = await response.json();

        // 3. Save to Cache
        const newCache: RatesCache = {
            base: baseCurrency,
            date: data.date,
            rates: data.rates,
            timestamp: Date.now()
        };

        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(newCache));

        return data.rates;
    } catch (error) {
        console.error('❌ Error in exchange rate service:', error);
        // Fallback: try to return stale cache if available, otherwise return empty rates (1:1)
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedData) {
            console.warn('⚠️ Returning stale cache due to fetch error');
            return JSON.parse(cachedData).rates;
        }
        return { [baseCurrency]: 1 };
    }
};

/**
 * Get specific rate between two currencies
 * If direct pair exists in cache (from base), calculates cross rate.
 */
export const getRate = async (from: string, to: string): Promise<number> => {
    if (from === to) return 1;

    // We fetch base=USD typically to have all rates relative to USD.
    // Or we fetch base=FROM. Optimally we accept the base provided by getExchangeRates default.
    const rates = await getExchangeRates('USD');

    const fromRate = rates[from];
    const toRate = rates[to];

    if (!fromRate || !toRate) {
        console.warn(`Rates not found for ${from} or ${to}`);
        return 1;
    }

    // specific rate = (Target / Base) / (Source / Base) if Base is common denominator (e.g. USD)
    // Ex: USD->EUR = 0.85, USD->GBP = 0.75
    // EUR->GBP = 0.75 / 0.85
    return toRate / fromRate;
};
