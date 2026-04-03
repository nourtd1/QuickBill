import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useEffect, useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import { useColorScheme } from 'nativewind';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { PreferencesProvider, usePreferences } from '../context/PreferencesContext';
import { OfflineProvider } from '../context/OfflineContext';
import { LanguageProvider } from '../context/LanguageContext';
import { validateEnv } from '../lib/env';
import ConfigError from '../components/ConfigError';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { COLORS } from '../constants/colors';

SplashScreen.preventAutoHideAsync().catch(() => {
    /* ignore error */
});

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

function RootLayoutNav() {
    const { session, profile, loading } = useAuth();
    const { hasLaunched } = usePreferences();
    const segments = useSegments();
    const router = useRouter();
    const navigationState = useRootNavigationState();
    const { colorScheme, setColorScheme } = useColorScheme();
    const [loaded] = useFonts({
        // Add custom fonts here if needed, or leave empty if using system fonts
        // SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });

    // Theme persistence
    useEffect(() => {
        AsyncStorage.getItem('quickbill_theme').then(savedTheme => {
            if (savedTheme) {
                setColorScheme(savedTheme as any);
            } else {
                setColorScheme('system'); // default
            }
        });
    }, [setColorScheme]);

    const stackBackground = colorScheme === 'dark' ? COLORS.slate900 : '#EFF6FF';

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

    // Handle Push Notifications registration 
    useEffect(() => {
        if (session && profile) {
            registerForPushNotificationsAsync().then(token => {
                if (token) {
                    console.log('Push token acquired:', token);
                    // TODO: Send token to Supabase profiles table
                }
            });
        }
    }, [session, !!profile]);

    async function registerForPushNotificationsAsync() {
        let token;
        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') return null;

            try {
                // EXPO_PUBLIC_PROJECT_ID should be defined in .env
                const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
                
                if (!projectId) {
                    console.log('Push Tokens: EXPO_PUBLIC_PROJECT_ID is not set in .env');
                    return null;
                }

                token = (await Notifications.getExpoPushTokenAsync({
                    projectId: projectId,
                })).data;
            } catch (e) {
                console.warn('Push Token Error:', e);
                return null;
            }
        }
        return token;
    }

    if (loading || !loaded) {
        return <View />; // Keep splash screen visible via the native API
    }

    return (
        <>
            <StatusBar style="auto" />
            <Stack screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: stackBackground },
                headerStyle: { backgroundColor: stackBackground },
                headerShadowVisible: false,
            }}>
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                <Stack.Screen name="setup" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen name="activity" options={{ headerShown: false }} />
                <Stack.Screen name="items/form" options={{ headerShown: false }} />
                <Stack.Screen name="estimates/index" options={{ headerShown: false }} />
                <Stack.Screen name="estimates/new" options={{ headerShown: false }} />
                <Stack.Screen name="estimates/[id]" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="invoice/new" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="invoice/[id]" options={{ presentation: 'modal', headerShown: false }} />

                {/* Added Missing Pages to prevent RNSScreen crashes */}
                <Stack.Screen name="expenses/scan" options={{ headerShown: false }} />
                <Stack.Screen name="expenses/add" options={{ headerShown: false }} />
                <Stack.Screen name="finance/reconcile" options={{ headerShown: false }} />
                <Stack.Screen name="stats/whatsapp" options={{ headerShown: false }} />

                <Stack.Screen name="settings" options={{ headerShown: false }} />
            </Stack>
            <OfflineIndicator />
        </>
    );
}


import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/react-query';

import ErrorBoundary from '../components/ErrorBoundary';

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
        <ErrorBoundary>
            <SafeAreaProvider>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <PreferencesProvider>
                            <OfflineProvider>
                                <LanguageProvider>
                                    <RootLayoutNav />
                                </LanguageProvider>
                            </OfflineProvider>
                        </PreferencesProvider>
                    </AuthProvider>
                </QueryClientProvider>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}
