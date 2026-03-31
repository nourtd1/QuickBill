import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../types';
import { getDBConnection } from '../lib/database';
import { runSynchronization } from '../lib/syncService';

type LocalProfileRow = {
    id: string;
    business_name?: string | null;
    logo_url?: string | null;
    address?: string | null;
    full_name?: string | null;
    currency?: string | null;
    default_currency?: string | null;
    phone?: string | null;
    phone_number?: string | null;
};

const mapLocalRowToProfile = (row: LocalProfileRow): Profile => ({
    id: row.id,
    business_name: row.business_name || '',
    logo_url: row.logo_url || null,
    address: row.address || null,
    full_name: row.full_name || null,
    currency: row.currency || row.default_currency || 'USD',
    phone_contact: row.phone || row.phone_number || null,
});

const buildLocalProfilePayload = (userId: string, updates: Partial<Profile>) => {
    const payload: Record<string, any> = {
        id: userId,
        updated_at: new Date().toISOString(),
        sync_status: 'pending',
    };

    if ('business_name' in updates) payload.business_name = updates.business_name ?? null;
    if ('logo_url' in updates) payload.logo_url = updates.logo_url ?? null;
    if ('address' in updates) payload.address = updates.address ?? null;
    if ('full_name' in updates) payload.full_name = updates.full_name ?? null;
    if ('currency' in updates) {
        payload.currency = updates.currency ?? null;
        payload.default_currency = updates.currency ?? null;
    }
    if ('phone_contact' in updates) {
        payload.phone = updates.phone_contact ?? null;
        payload.phone_number = updates.phone_contact ?? null;
    }

    return payload;
};

export function useProfile() {
    const { user, refreshProfile: refreshAuthProfile } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // 1) Local-first read for instant offline-safe state
            const db = await getDBConnection();
            const localProfile = await db.getFirstAsync<LocalProfileRow>(
                `SELECT * FROM profiles WHERE id = ? LIMIT 1`,
                [user.id]
            );
            if (localProfile) {
                setProfile(mapLocalRowToProfile(localProfile));
            }

            // 2) Remote read, then hydrate local cache
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!error && data) {
                const remoteProfile = data as Profile;
                setProfile(remoteProfile);

                await db.runAsync(
                    `INSERT INTO profiles (id, business_name, logo_url, address, full_name, currency, default_currency, phone, phone_number, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)
                     ON CONFLICT(id) DO UPDATE SET
                       business_name = excluded.business_name,
                       logo_url = excluded.logo_url,
                       address = excluded.address,
                       full_name = excluded.full_name,
                       currency = excluded.currency,
                       default_currency = excluded.default_currency,
                       phone = excluded.phone,
                       phone_number = excluded.phone_number,
                       sync_status = 'synced',
                       updated_at = excluded.updated_at`,
                    [
                        user.id,
                        remoteProfile.business_name ?? null,
                        remoteProfile.logo_url ?? null,
                        remoteProfile.address ?? null,
                        remoteProfile.full_name ?? null,
                        remoteProfile.currency ?? null,
                        remoteProfile.currency ?? null,
                        remoteProfile.phone_contact ?? null,
                        remoteProfile.phone_contact ?? null,
                        new Date().toISOString(),
                    ]
                );
            }
        } catch (err) {
            console.error("Erreur fetchProfile:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) return { error: 'No user' };

        try {
            const db = await getDBConnection();
            const localPayload = buildLocalProfilePayload(user.id, updates);

            const columns = Object.keys(localPayload);
            const placeholders = columns.map(() => '?').join(', ');
            const updatesSql = columns
                .filter((column) => column !== 'id')
                .map((column) => `${column} = excluded.${column}`)
                .join(', ');

            await db.runAsync(
                `INSERT INTO profiles (${columns.join(', ')})
                 VALUES (${placeholders})
                 ON CONFLICT(id) DO UPDATE SET ${updatesSql}`,
                Object.values(localPayload)
            );

            setProfile((prev) => ({
                id: user.id,
                business_name: updates.business_name ?? prev?.business_name ?? '',
                logo_url: updates.logo_url ?? prev?.logo_url ?? null,
                address: updates.address ?? prev?.address ?? null,
                full_name: updates.full_name ?? prev?.full_name ?? null,
                currency: updates.currency ?? prev?.currency ?? 'USD',
                phone_contact: updates.phone_contact ?? prev?.phone_contact ?? null,
            }));

            // Try remote upsert now (best effort), but local save remains source of truth.
            const { error } = await supabase
                .from('profiles')
                .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() });

            if (!error) {
                await db.runAsync(`UPDATE profiles SET sync_status = 'synced' WHERE id = ?`, [user.id]);
                await refreshAuthProfile();
            }

            // Kick sync pipeline (handles retries for pending rows when online).
            runSynchronization().catch(() => { });

            return { error: null };
        } catch (error: any) {
            console.error("Erreur updateProfile:", error);
            return { error };
        }
    };

    return { profile, loading, fetchProfile, updateProfile };
}
