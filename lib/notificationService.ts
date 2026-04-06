import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from './supabase';

/**
 * Dans Expo Go (SDK 53+), le module enregistre des effets de bord au chargement
 * et les push Android ne sont plus supportés — on évite tout `import` statique.
 */
const isExpoGo = Constants.appOwnership === 'expo';

type NotificationsModule = typeof import('expo-notifications');

let notificationsMod: NotificationsModule | null = null;

function getNotifications(): NotificationsModule | null {
    if (isExpoGo) return null;
    if (!notificationsMod) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            notificationsMod = require('expo-notifications') as NotificationsModule;
        } catch {
            return null;
        }
    }
    return notificationsMod;
}

let handlerConfigured = false;

export function configureNotificationHandler(): void {
    if (handlerConfigured || isExpoGo) return;
    const Notifications = getNotifications();
    if (!Notifications) return;
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
    handlerConfigured = true;
}

/**
 * Register for Push Notifications and get the token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    if (isExpoGo) return undefined;

    const Notifications = getNotifications();
    if (!Notifications) return undefined;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return undefined;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return undefined;
    }

    try {
        const projectId =
            process.env.EXPO_PUBLIC_PROJECT_ID ??
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;

        if (!projectId) {
            console.log('Push Tokens: EXPO_PUBLIC_PROJECT_ID / EAS projectId is not set');
            return undefined;
        }

        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('🔔 Expo Push Token:', token);
        return token;
    } catch (e) {
        console.error('Error getting push token:', e);
        return undefined;
    }
}

/**
 * Save token to Supabase Profile
 */
export async function savePushTokenToProfile(userId: string, token: string) {
    if (!userId || !token) return;

    const { error } = await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);

    if (error) {
        console.error('Error saving push token to profile:', error);
    } else {
        console.log('✅ Push Token synced with Supabase');
    }
}
