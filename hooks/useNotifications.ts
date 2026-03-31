import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDBConnection } from '../lib/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

export type ActivityType = 'payment' | 'invoice' | 'system' | 'general';

export interface ActivityItem {
    id: string;
    type: ActivityType;
    title: string;
    message: string | null;
    read_status: 0 | 1;
    created_at: string;
    data?: string | null;
}

export interface ActivitySection {
    titleKey: string;
    data: ActivityItem[];
}

import { 
    getNotificationsLocal, 
    markAllNotificationsAsReadLocal, 
    getUnreadNotificationCountLocal,
    LocalNotification
} from '../lib/localServices';

export function useNotifications() {
    const { user } = useAuth();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [sections, setSections] = useState<ActivitySection[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchActivities = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const data = await getNotificationsLocal(user.id);
            const count = await getUnreadNotificationCountLocal(user.id);
            
            setUnreadCount(count);
            
            // Map LocalNotification to ActivityItem (legacy support for index.tsx)
            const mapped: ActivityItem[] = data.map(n => ({
                id: n.id,
                type: n.type as any,
                title: n.title,
                message: n.message,
                read_status: n.read_status,
                created_at: n.created_at,
                data: n.data
            }));

            setActivities(mapped);

            // Grouping for sections
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const todayData: ActivityItem[] = [];
            const yesterdayData: ActivityItem[] = [];
            const olderData: ActivityItem[] = [];

            mapped.forEach(item => {
                const d = new Date(item.created_at);
                if (d >= today) todayData.push(item);
                else if (d >= yesterday) yesterdayData.push(item);
                else olderData.push(item);
            });

            const newSections: ActivitySection[] = [];
            if (todayData.length > 0) newSections.push({ titleKey: 'activity.sections.today', data: todayData });
            if (yesterdayData.length > 0) newSections.push({ titleKey: 'activity.sections.yesterday', data: yesterdayData });
            if (olderData.length > 0) newSections.push({ titleKey: 'activity.sections.older', data: olderData });

            setSections(newSections);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchActivities();
        }, [fetchActivities])
    );

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            await markAllNotificationsAsReadLocal(user.id);
            setUnreadCount(0);
            setActivities(prev => prev.map(a => ({ ...a, read_status: 1 as const })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return {
        activities,
        sections,
        unreadCount,
        loading,
        refresh: fetchActivities,
        markAllAsRead
    };
}
