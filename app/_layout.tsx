import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import { useColorScheme } from 'nativewind';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { PreferencesProvider, usePreferences } from '../context/PreferencesContext';
import { validateEnv } from '../lib/env';
import ConfigError from '../components/ConfigError';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
    /* ignore error */
});

function RootLayoutNav() {
    const { session, profile, loading } = useAuth();
    const { hasLaunched } = usePreferences();
    const segments = useSegments();
    const router = useRouter();
    const navigationState = useRootNavigationState();
    const [loaded] = useFonts({
        // Add custom fonts here if needed, or leave empty if using system fonts
        // SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });

    // Use a string representation of segments for stable effect dependencies
    const segmentsPath = segments.join('/');

    // Handle splash screen separately
    useEffect(() => {
        if (!loading && loaded && hasLaunched !== null) {
            SplashScreen.hideAsync().catch(() => { /* ignore error */ });
        }
    }, [loading, loaded, hasLaunched]);

    useEffect(() => {
        // Wait for all states including navigation state to be ready
        if (loading || !loaded || hasLaunched === null || !navigationState?.key) return;

        const rootSegment = segments[0];
        const isOnboarding = rootSegment === 'onboarding';
        const isAuthScreen = rootSegment === 'auth';
        const isSetupScreen = rootSegment === 'setup';

        // 1. Onboarding first
        if (!hasLaunched) {
            if (!isOnboarding) {
                router.replace('/onboarding');
            }
            return;
        }

        // 2. Not logged in -> Auth
        if (!session) {
            if (!isAuthScreen && !isOnboarding) {
                router.replace('/auth');
            }
            return;
        }

        // 3. Logged in -> Check Profile
        const isProfileIncomplete = !profile || !profile.business_name;

        if (isProfileIncomplete) {
            if (!isSetupScreen) {
                router.replace('/setup');
            }
        } else {
            // Profile complete -> ensure we are not on auth/setup/onboarding
            if (isAuthScreen || isSetupScreen || isOnboarding) {
                router.replace('/(tabs)');
            }
        }
    }, [
        session === null, // depend only on existence of session
        profile?.business_name,
        loading,
        segmentsPath,
        loaded,
        hasLaunched,
        navigationState?.key // Ensure we trigger when navigation is ready
    ]);

    if (loading || !loaded) {
        return <View />; // Keep splash screen visible via the native API
    }

    return (
        <Stack screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#EFF6FF' },
            headerStyle: { backgroundColor: '#EFF6FF' },
            headerShadowVisible: false,
        }}>
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="setup" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="settings/signature" options={{ headerShown: false, title: 'Signature' }} />
            <Stack.Screen name="items/index" options={{ headerShown: false }} />
            <Stack.Screen name="items/form" options={{ headerShown: false }} />
            <Stack.Screen name="estimates/index" options={{ headerShown: false }} />
            <Stack.Screen name="estimates/new" options={{ headerShown: false }} />
            <Stack.Screen name="estimates/[id]" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="invoice/new" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="invoice/[id]" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
    );
}


import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/react-query';

// ... (existing imports)

export default function RootLayout() {
    const [configError, setConfigError] = useState<string | null>(null);

    // Validate environment variables on app start
    useEffect(() => {
        try {
            validateEnv();
        } catch (error: any) {
            console.error('❌ Configuration error:', error.message);
            setConfigError(error.message);
        }
    }, []);

    if (configError) {
        return (
            <SafeAreaProvider>
                <ConfigError error={configError} />
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <PreferencesProvider>
                        <RootLayoutNav />
                    </PreferencesProvider>
                </AuthProvider>
            </QueryClientProvider>
        </SafeAreaProvider>
    );
}
