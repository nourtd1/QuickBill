import { supabase } from './supabase';
import { getDBConnection } from './database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalInvoice, LocalInvoiceItem } from './localServices';

const SYNC_KEY = 'last_sync_timestamp'; // Kept for legacy/fallback if needed

// Helper to get limit 3 months ago
const getFallbackSyncDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString();
};

// Tables definition with order for dependency resolution
const SYNC_TABLES = [
    'profiles',
    'clients',
    'invoices',
    'invoice_items',
    'payments',
    'expenses'
];

type SyncStatus = 'pending' | 'synced' | 'error';

/**
 * Clean data for Supabase (remove local-only fields)
 */
const prepareForCloud = (row: any) => {
    const { sync_status, ...rest } = row;
    return rest;
};

/**
 * 1. PUSH: Send local pending changes to Supabase
 */
export const syncLocalChanges = async () => {
    const db = await getDBConnection();
    if (__DEV__) console.log('🔄 Starting PUSH sync...');

    for (const table of SYNC_TABLES) {
        try {
            // Get pending records
            const pendingRows = await db.getAllAsync(`SELECT * FROM ${table} WHERE sync_status = 'pending'`);

            if (pendingRows.length === 0) continue;

            if (__DEV__) console.log(`📤 Pushing ${pendingRows.length} rows to ${table}`);

            // Process in batches or one-by-one? 
            // Upsert supports batch. Let's do batch for performance.
            const payload = pendingRows.map(prepareForCloud);

            // Perform Upsert on Supabase
            const { error } = await supabase
                .from(table)
                .upsert(payload, { onConflict: 'id' });

            if (error) {
                console.error(`❌ Error syncing table ${table}:`, error);
                // Mark as error locally ? Or keep pending for retry?
                // User requested: "passer en 'error'"
                const ids = pendingRows.map((r: any) => r.id);
                const placeholders = ids.map(() => '?').join(',');
                await db.runAsync(
                    `UPDATE ${table} SET sync_status = 'error' WHERE id IN (${placeholders})`,
                    ...ids
                );
            } else {
                // Success: Mark as synced
                const ids = pendingRows.map((r: any) => r.id);
                const placeholders = ids.map(() => '?').join(',');
                await db.runAsync(
                    `UPDATE ${table} SET sync_status = 'synced' WHERE id IN (${placeholders})`,
                    ...ids
                );
                if (__DEV__) console.log(`✅ Synced ${table} successfully`);
            }
        } catch (e) {
            console.error(`❌ Critical error pushing ${table}`, e);
        }
    }
};

/**
 * 2. PULL: Fetch remote changes since last sync
 */
export const fetchRemoteChanges = async () => {
    const db = await getDBConnection();
    if (__DEV__) console.log('🔄 Starting PULL sync...');

    const newSyncTime = new Date().toISOString(); // Capture start time
    const fallbackSyncDate = getFallbackSyncDate();

    // Ensure metadata table exists
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_metadata (
            table_name TEXT PRIMARY KEY NOT NULL,
            last_sync_at TEXT NOT NULL
        );
    `);

    for (const table of SYNC_TABLES) {
        try {
            // Get last sync for this specific table from SQLite
            const metadataRow = await db.getFirstAsync<{ last_sync_at: string }>(
                `SELECT last_sync_at FROM sync_metadata WHERE table_name = ?`,
                [table]
            );
            const lastSync = metadataRow?.last_sync_at;

            // Apply a safety limit to prevent memory crash on huge datasets
            let query = supabase.from(table).select('*').limit(1000);

            if (lastSync) {
                // If we synced before, only pull new changes
                query = query.gt('updated_at', lastSync);
            } else if (table !== 'profiles' && table !== 'clients') {
                // For heavy transaction tables, on first sync, limit to last 3 months
                query = query.gte('updated_at', fallbackSyncDate);
            }

            const { data, error } = await query;

            if (error) {
                console.error(`❌ Error fetching ${table}:`, error);
                continue;
            }

            if (data && data.length > 0) {
                if (__DEV__) console.log(`📥 Received ${data.length} updates for ${table}`);

                // Disable FK during pull so invoices can sync before their clients exist locally
                await db.execAsync('PRAGMA foreign_keys = OFF;');

                try {
                    for (const row of data) {
                        const columns = Object.keys(row);
                        const columnsWithSync = [...columns, 'sync_status'];
                        const values = Object.values(row);
                        const valuesWithSync = [...values, 'synced'];

                        const placeholders = valuesWithSync.map(() => '?').join(',');
                        const updateSet = columns.map((c: string) => `${c} = excluded.${c}`).join(', ');

                        const sql = `
            INSERT INTO ${table} (${columnsWithSync.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT(id) DO UPDATE SET
            ${updateSet},
            sync_status = 'synced';
          `;
                        await db.runAsync(sql, ...(valuesWithSync as any[]));
                    }
                } finally {
                    await db.execAsync('PRAGMA foreign_keys = ON;');
                }
            }

            // Successfully fetched and processed changes for this table, update last_sync_at
            await db.runAsync(
                `INSERT INTO sync_metadata (table_name, last_sync_at) VALUES (?, ?) 
                 ON CONFLICT(table_name) DO UPDATE SET last_sync_at = excluded.last_sync_at`,
                table,
                newSyncTime
            );

        } catch (e) {
            console.error(`❌ Critical error pulling ${table}`, e);
        }
    }

    // Optionally update old AsyncStorage just in case other parts of the app use it
    await AsyncStorage.setItem(SYNC_KEY, newSyncTime);
};

/**
 * MAIN SYNC FUNCTION
 * Orchestrates Push then Pull
 */
export const runSynchronization = async () => {
    try {
        // 1. Check Auth (we need user_id typically, but RLS handles it on Supabase side)
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
            if (__DEV__) console.log('⏹️ Sync skipped: No active session');
            return;
        }

        // 2. Push Local Changes
        await syncLocalChanges();

        // 3. Pull Remote Changes
        await fetchRemoteChanges();

        if (__DEV__) console.log('✅ Synchronization completed');
    } catch (error) {
        console.error('❌ Synchronization failed:', error);
        throw error;
    }
};
