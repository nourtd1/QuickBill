import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from './supabase';

/**
 * Configure default notification handler (how they appear when app is foregrounded)
 */
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/**
 * Register for Push Notifications and get the token
 */
export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        try {
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log('🔔 Expo Push Token:', token);
        } catch (e) {
            console.error('Error getting push token:', e);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}

/**
 * Save token to Supabase Profile
 */
export async function savePushTokenToProfile(userId: string, token: string) {
    if (!userId || !token) return;

    // We assume an 'expo_push_token' column exists in 'profiles'
    // You might need to add this column via SQL migration:
    // ALTER TABLE profiles ADD COLUMN expo_push_token TEXT;

    const { error } = await supabase
        .from('profiles')
        .update({ expo_push_token: token })
        .eq('id', userId);

    if (error) {
        console.error('Error saving push token to profile:', error);
    } else {
        console.log('✅ Push Token synced with Supabase');
    }
}
