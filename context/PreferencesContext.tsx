import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PreferencesContextType = {
    hasLaunched: boolean | null;
    completeOnboarding: () => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextType>({
    hasLaunched: null,
    completeOnboarding: async () => { },
});

export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
    const [hasLaunched, setHasLaunched] = useState<boolean | null>(null);

    useEffect(() => {
        async function checkHasLaunched() {
            try {
                const launched = await AsyncStorage.getItem('hasLaunched');
                setHasLaunched(launched === 'true');
            } catch (error) {
                console.error('Error reading hasLaunched:', error);
                setHasLaunched(false);
            }
        }
        checkHasLaunched();
    }, []);

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem('hasLaunched', 'true');
            setHasLaunched(true);
        } catch (error) {
            console.error('Error saving onboarding status:', error);
        }
    };

    return (
        <PreferencesContext.Provider value={{ hasLaunched, completeOnboarding }}>
            {children}
        </PreferencesContext.Provider>
    );
};

export const usePreferences = () => useContext(PreferencesContext);
