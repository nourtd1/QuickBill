import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { runSynchronization } from '../lib/syncService';
import { AppState, AppStateStatus } from 'react-native';

export const useSync = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0); // For future granular progress support

    const isSyncingRef = useRef(false);
    const lastAutoSyncAtRef = useRef<number>(0);
    const AUTO_SYNC_COOLDOWN_MS = 15000;

    // Function to manually trigger sync
    const startSync = useCallback(async () => {
        if (isSyncingRef.current || isSyncing) return;

        const now = Date.now();
        if (now - lastAutoSyncAtRef.current < AUTO_SYNC_COOLDOWN_MS) return;
        lastAutoSyncAtRef.current = now;

        isSyncingRef.current = true;
        setIsSyncing(true);
        setError(null);
        setProgress(0.1);

        try {
            const state = await NetInfo.fetch();
            if (!state.isConnected) {
                console.log('Sync skipped: Offline');
                setIsSyncing(false);
                return;
            }

            await runSynchronization();
            setProgress(1.0);
        } catch (e: any) {
            console.error('Sync Hook Error:', e);
            setError(e.message || 'Sync failed');
        } finally {
            setIsSyncing(false);
            isSyncingRef.current = false;
        }
    }, [isSyncing]);

    // Network Detection & Auto-Sync
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            if (state.isConnected && state.isInternetReachable) {
                console.log('🌐 Connection detected, triggering auto-sync...');
                startSync();
            }
        });

        return () => unsubscribe();
    }, [startSync]);

    // Optional: Sync on App Resume
    useEffect(() => {
        const handleAppStateChange = (status: AppStateStatus) => {
            if (status === 'active') {
                startSync();
            }
        };

        const sub = AppState.addEventListener('change', handleAppStateChange);
        return () => sub.remove();
    }, [startSync]);

    return {
        isSyncing,
        error,
        progress,
        startSync
    };
};
