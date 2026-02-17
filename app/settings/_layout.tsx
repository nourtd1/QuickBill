import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function SettingsLayout() {
    const colorScheme = useColorScheme();

    return (
        <Stack
            screenOptions={{
                headerShown: false, // We are using custom headers in the screens
                contentStyle: { backgroundColor: '#f6f6f8' },
                animation: 'slide_from_right'
            }}
        >
            <Stack.Screen name="personal-info" options={{ title: 'Personal Info' }} />
            <Stack.Screen name="security" options={{ title: 'Security' }} />
            <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
            <Stack.Screen name="business" options={{ title: 'Business Profile' }} />
            <Stack.Screen name="tax" options={{ title: 'Tax Settings' }} />
            <Stack.Screen name="payment" options={{ title: 'Payment Methods' }} />
            <Stack.Screen name="theme" options={{ title: 'App Theme' }} />
            <Stack.Screen name="language" options={{ title: 'Language' }} />
            {/* Other existing screens */}
            <Stack.Screen name="help" options={{ title: 'Help Center' }} />
            <Stack.Screen name="about" options={{ title: 'About' }} />
            <Stack.Screen name="subscription" options={{ title: 'Subscription' }} />
            <Stack.Screen name="team" options={{ title: 'Team' }} />
            <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
            <Stack.Screen name="success" options={{ title: 'Success', gestureEnabled: false }} />
            <Stack.Screen name="signature" options={{ title: 'Signature' }} />
        </Stack>
    );
}
