import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from 'expo-router';
import { AppNotification, ActivityType } from '../types';

export interface ActivitySection {
    titleKey: string;
    data: AppNotification[];
}

import { 
    getNotificationsLocal, 
    markAllNotificationsAsReadLocal, 
    getUnreadNotificationCountLocal,
    markNotificationAsReadLocal,
    deleteNotificationLocal
} from '../lib/localServices';

export function useNotifications() {
    const { user } = useAuth();
    const [activities, setActivities] = useState<AppNotification[]>([]);
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
            setActivities(data);

            // Grouping for sections
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const todayData: AppNotification[] = [];
            const yesterdayData: AppNotification[] = [];
            const olderData: AppNotification[] = [];

            data.forEach(item => {
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

    const markAsRead = async (id: string) => {
        try {
            await markNotificationAsReadLocal(id);
            setActivities(prev => prev.map(a => a.id === id ? { ...a, read_status: 1 as const } : a));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await deleteNotificationLocal(id);
            setActivities(prev => prev.filter(a => a.id !== id));
            fetchActivities(); // Refresh sections
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    return {
        activities,
        sections,
        unreadCount,
        loading,
        refresh: fetchActivities,
        markAllAsRead,
        markAsRead,
        deleteNotification
    };
}
