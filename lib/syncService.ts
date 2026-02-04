import { supabase } from './supabase';
import { getDBConnection } from './database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalInvoice, LocalInvoiceItem } from './localServices';

const SYNC_KEY = 'last_sync_timestamp';

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
    console.log('🔄 Starting PUSH sync...');

    for (const table of SYNC_TABLES) {
        try {
            // Get pending records
            const pendingRows = await db.getAllAsync(`SELECT * FROM ${table} WHERE sync_status = 'pending'`);

            if (pendingRows.length === 0) continue;

            console.log(`📤 Pushing ${pendingRows.length} rows to ${table}`);

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
                console.log(`✅ Synced ${table} successfully`);
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
    console.log('🔄 Starting PULL sync...');

    const lastSync = await AsyncStorage.getItem(SYNC_KEY);
    const newSyncTime = new Date().toISOString(); // Capture start time

    for (const table of SYNC_TABLES) {
        try {
            let query = supabase.from(table).select('*');

            if (lastSync) {
                query = query.gt('updated_at', lastSync);
            }

            const { data, error } = await query;

            if (error) {
                console.error(`❌ Error fetching ${table}:`, error);
                continue;
            }

            if (data && data.length > 0) {
                console.log(`📥 Received ${data.length} updates for ${table}`);

                // Insert or Replace into Local SQLite
                for (const row of data) {
                    const columns = Object.keys(row);
                    // Add sync_status = 'synced' because it comes from cloud
                    const columnsWithSync = [...columns, 'sync_status'];
                    const values = Object.values(row);
                    const valuesWithSync = [...values, 'synced'];

                    const placeholders = valuesWithSync.map(() => '?').join(',');
                    const updateSet = columns.map(c => `${c} = excluded.${c}`).join(', ');

                    const sql = `
            INSERT INTO ${table} (${columnsWithSync.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT(id) DO UPDATE SET
            ${updateSet},
            sync_status = 'synced';
          `;

                    await db.runAsync(sql, ...(valuesWithSync as any[]));
                }
            }
        } catch (e) {
            console.error(`❌ Critical error pulling ${table}`, e);
        }
    }

    // Update Last Sync Timestamp
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
            console.log('⏹️ Sync skipped: No active session');
            return;
        }

        // 2. Push Local Changes
        await syncLocalChanges();

        // 3. Pull Remote Changes
        await fetchRemoteChanges();

        console.log('✅ Synchronization completed');
    } catch (error) {
        console.error('❌ Synchronization failed:', error);
        throw error;
    }
};
