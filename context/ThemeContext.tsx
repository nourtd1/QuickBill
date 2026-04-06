import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { useColorScheme as useRNColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark' | 'system';

type ThemeContextType = {
    userThemePreference: ThemeType;
    resolvedTheme: 'light' | 'dark';
    setThemePreference: (theme: ThemeType) => void;
};

const ThemeContext = createContext<ThemeContextType>({
    userThemePreference: 'light',
    resolvedTheme: 'light',
    setThemePreference: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemTheme = useRNColorScheme() ?? 'light';
    const { setColorScheme } = useNativeWindColorScheme();
    
    const [userThemePreference, setUserThemePreference] = useState<ThemeType>('light');

    useEffect(() => {
        AsyncStorage.getItem('quickbill_theme').then((savedTheme) => {
            if (savedTheme === 'light') {
                setUserThemePreference('light');
            } else if (savedTheme === 'dark' || savedTheme === 'system') {
                setUserThemePreference('light');
                AsyncStorage.setItem('quickbill_theme', 'light');
            }
        });
    }, []);

    // Calculate the *actual* applied theme based on preference + system
    const resolvedTheme = userThemePreference === 'system' ? systemTheme : userThemePreference;

    // Sync NativeWind whenever resolvedTheme changes
    useEffect(() => {
        try {
            setColorScheme(resolvedTheme);
        } catch (e) {
            console.log('Error setting NativeWind colorScheme via hook', e);
        }
        
        try {
            // This forces React Native APIs like useColorScheme() and system elements to align
            Appearance.setColorScheme(resolvedTheme);
        } catch (e) {
            console.log('Error syncing Appearance', e);
        }
    }, [resolvedTheme, setColorScheme]);

    const setThemePreference = async (theme: ThemeType) => {
        if (theme !== 'light') return;
        setUserThemePreference('light');
        await AsyncStorage.setItem('quickbill_theme', 'light');
    };

    return (
        <ThemeContext.Provider value={{ userThemePreference, resolvedTheme, setThemePreference }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
