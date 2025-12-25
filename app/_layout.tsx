import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useCallback } from 'react';
import { View, Text } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from 'nativewind';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { validateEnv } from '../lib/env';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const { session, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const [loaded] = useFonts({
        // Add custom fonts here if needed, or leave empty if using system fonts
        // SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });

    useEffect(() => {
        if (loading || !loaded) return;

        // Hide splash screen once fonts and auth are checked
        SplashScreen.hideAsync();

        const inAuthGroup = segments[0] === '(auth)';

        if (session && inAuthGroup) {
            router.replace('/(tabs)');
        } else if (!session && !inAuthGroup) {
            router.replace('/(auth)/login');
        }
    }, [session, loading, segments, loaded]);

    if (loading || !loaded) {
        return <View />; // Keep splash screen visible via the native API
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="invoice/new" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="invoice/[id]" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
    );
}


export default function RootLayout() {
    // Validate environment variables on app start
    useEffect(() => {
        try {
            validateEnv();
        } catch (error: any) {
            console.error('❌ Configuration error:', error.message);
            // In production, you might want to show an error screen instead
        }
    }, []);

    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}
