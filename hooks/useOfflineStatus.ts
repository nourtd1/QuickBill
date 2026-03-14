import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { getDBConnection } from '../lib/database';

export const useOfflineStatus = () => {
    const [isConnected, setIsConnected] = useState<boolean | null>(true);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        // 1. Monitor Network
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            setIsConnected(state.isConnected);
            if (state.isConnected) {
                // Refresh pending count when coming back online
                checkPendingActions();
            }
        });

        // 2. Initial check for pending actions
        checkPendingActions();

        // 3. Set up a small interval to re-check pending count (since actions happen throughout the app)
        const interval = setInterval(checkPendingActions, 5000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const checkPendingActions = async () => {
        try {
            const db = await getDBConnection();
            let total = 0;
            const tables = ['profiles', 'clients', 'invoices', 'invoice_items', 'payments', 'expenses'];
            
            for (const table of tables) {
                const result = await db.getFirstAsync<{ count: number }>(
                    `SELECT COUNT(*) as count FROM ${table} WHERE sync_status = 'pending'`
                );
                total += result?.count || 0;
            }
            setPendingCount(total);
        } catch (e) {
            console.error('Error checking pending actions:', e);
        }
    };

    return {
        isConnected,
        pendingCount,
        refreshPendingCount: checkPendingActions
    };
};
