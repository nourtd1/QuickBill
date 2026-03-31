import { supabase } from './supabase';
import { getDBConnection, getIsDBReady } from './database';
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

const getLocalTableColumnTypes = async (db: any, table: string): Promise<Map<string, string>> => {
    const info = await db.getAllAsync(`PRAGMA table_info(${table})`);
    const map = new Map<string, string>();
    for (const col of info) {
        map.set(col.name, String(col.type || ''));
    }
    return map;
};

const filterRowToLocalColumns = (row: Record<string, any>, localColumns: Set<string>) => {
    const filtered: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
        if (localColumns.has(key)) {
            filtered[key] = value;
        }
    }
    return filtered;
};

const coerceValueForSqlite = (value: any, declaredType: string) => {
    if (value === undefined) return null;
    if (value === null) return null;

    const type = (declaredType || '').toUpperCase();

    if (typeof value === 'boolean') {
        if (type.includes('INT') || type.includes('BOOL')) {
            return value ? 1 : 0;
        }
        return value ? 'true' : 'false';
    }

    if (typeof value === 'object') {
        // Supabase can return json/jsonb as objects/arrays; store as TEXT locally.
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }

    if (typeof value === 'number') {
        // SQLite bindings can fail on NaN/Infinity.
        if (!Number.isFinite(value)) return null;
    }

    return value;
};

const sanitizeRowForSqlite = (row: Record<string, any>, columnTypes: Map<string, string>) => {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
        sanitized[key] = coerceValueForSqlite(value, columnTypes.get(key) || '');
    }
    return sanitized;
};

/**
 * Clean data for Supabase (remove local-only fields)
 */
const prepareForCloud = (tableName: string, row: any) => {
    const { sync_status, ...rest } = row;
    
    // Remove local-only columns that don't exist in Supabase schema
    if (tableName === 'invoices') {
        delete rest.currency;
    } else if (tableName === 'invoice_items') {
        delete rest.created_at;
        delete rest.updated_at;
    }

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
            const payload = pendingRows.map(row => prepareForCloud(table, row));

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
                    ids
                );
            } else {
                // Success: Mark as synced
                const ids = pendingRows.map((r: any) => r.id);
                const placeholders = ids.map(() => '?').join(',');
                await db.runAsync(
                    `UPDATE ${table} SET sync_status = 'synced' WHERE id IN (${placeholders})`,
                    ids
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

    // Cache local table columns to avoid repeated PRAGMA calls.
    const localColumnsByTable = new Map<string, Set<string>>();
    const localColumnTypesByTable = new Map<string, Map<string, string>>();

    // Ensure metadata table exists
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_metadata (
            table_name TEXT PRIMARY KEY NOT NULL,
            last_sync_at TEXT NOT NULL
        );
    `);

    for (const table of SYNC_TABLES) {
        try {
            if (!localColumnsByTable.has(table)) {
                const types = await getLocalTableColumnTypes(db, table);
                localColumnTypesByTable.set(table, types);
                localColumnsByTable.set(table, new Set(types.keys()));
            }
            const localColumns = localColumnsByTable.get(table)!;
            const localColumnTypes = localColumnTypesByTable.get(table)!;

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

                // Transaction + deferred FK checks for stability.
                // Also filter incoming columns to those that exist locally to avoid schema mismatch crashes.
                await db.execAsync('PRAGMA foreign_keys = OFF;');
                await db.execAsync('BEGIN;');
                await db.execAsync('PRAGMA defer_foreign_keys = ON;');

                try {
                    for (const rawRow of data) {
                        const row = sanitizeRowForSqlite(
                            filterRowToLocalColumns(rawRow as any, localColumns),
                            localColumnTypes
                        );

                        // Guard against FK issues when remote rows reference data not yet present locally.
                        // This keeps the pull resilient even if table ordering or partial datasets occur.
                        if (table === 'invoices' && typeof (row as any).customer_id === 'string' && (row as any).customer_id) {
                            const existingClient = await db.getFirstAsync(
                                'SELECT id FROM clients WHERE id = ? LIMIT 1',
                                [(row as any).customer_id]
                            );
                            if (!existingClient) {
                                (row as any).customer_id = null;
                            }
                        }

                        if ((table === 'invoice_items' || table === 'payments') && typeof (row as any).invoice_id === 'string' && (row as any).invoice_id) {
                            const existingInvoice = await db.getFirstAsync(
                                'SELECT id FROM invoices WHERE id = ? LIMIT 1',
                                [(row as any).invoice_id]
                            );
                            if (!existingInvoice) {
                                continue;
                            }
                        }
                        const columns = Object.keys(row);

                        // If the row contains no locally-known fields (very unlikely), skip.
                        if (columns.length === 0) continue;

                        const columnsWithSync = [...columns, 'sync_status'];
                        const values = Object.values(row);
                        const valuesWithSync = [...values, 'synced'];

                        const placeholders = valuesWithSync.map(() => '?').join(',');
                        const updateColumns = columns.filter((c: string) => c !== 'id');
                        const updateSet = updateColumns.map((c: string) => `${c} = excluded.${c}`).join(', ');

                        const sql = `
            INSERT INTO ${table} (${columnsWithSync.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT(id) DO UPDATE SET
            ${updateSet ? `${updateSet},` : ''}
            sync_status = 'synced';
          `;

                        try {
                            await db.runAsync(sql, valuesWithSync as any[]);
                        } catch (e) {
                            const rowId = (rawRow as any)?.id;
                            const declaredTypes = Object.fromEntries(
                                columns.map((c: string) => [c, localColumnTypes.get(c) || ''])
                            );
                            const valuePreview = Object.fromEntries(
                                columns.map((c: string) => {
                                    const v = (row as any)[c];
                                    if (typeof v === 'string') return [c, v.length > 120 ? v.slice(0, 120) + '…' : v];
                                    return [c, v];
                                })
                            );
                            console.error(`❌ SQLite upsert failed for table=${table} id=${rowId}`,
                                {
                                    columns,
                                    valueTypes: Object.fromEntries(
                                        columns.map((c: string) => [c, typeof (row as any)[c]])
                                    ),
                                    declaredTypes,
                                    valuePreview,
                                });
                            throw e;
                        }
                    }

                    await db.execAsync('COMMIT;');
                } catch (e) {
                    await db.execAsync('ROLLBACK;');
                    throw e;
                } finally {
                    await db.execAsync('PRAGMA foreign_keys = ON;');
                }
            }

            // Successfully fetched and processed changes for this table, update last_sync_at
            await db.runAsync(
                `INSERT INTO sync_metadata (table_name, last_sync_at) VALUES (?, ?) 
                 ON CONFLICT(table_name) DO UPDATE SET last_sync_at = excluded.last_sync_at`,
                [table, newSyncTime]
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
        if (!getIsDBReady()) {
            if (__DEV__) console.log('⏳ Sync skipped: Database not ready');
            return;
        }

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
