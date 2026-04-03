import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { getDBConnection } from '../lib/database';
import { runSynchronization } from '../lib/syncService';
import { registerForPushNotificationsAsync, savePushTokenToProfile } from '../lib/notificationService';

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
    is_premium?: number | boolean | null;
};

const mapLocalRowToProfile = (row: LocalProfileRow): Profile => ({
    id: row.id,
    business_name: row.business_name || '',
    logo_url: row.logo_url || null,
    address: row.address || null,
    full_name: row.full_name || null,
    currency: row.currency || row.default_currency || 'USD',
    phone_contact: row.phone || row.phone_number || null,
    is_premium: !!row.is_premium,
});

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const db = await getDBConnection();

            // 1) Local-first read so profile survives restarts and offline usage.
            const localProfile = await db.getFirstAsync<LocalProfileRow>(
                `SELECT * FROM profiles WHERE id = ? LIMIT 1`,
                [userId]
            );
            if (localProfile) {
                setProfile(mapLocalRowToProfile(localProfile));
            } else {
                setProfile(null);
            }

            // 2) Remote fetch to keep in sync.
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (!error && data) {
                const remote = data as Profile;
                setProfile(remote);

                await db.runAsync(
                    `INSERT INTO profiles (id, business_name, logo_url, address, full_name, currency, default_currency, phone, phone_number, is_premium, sync_status, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)
                     ON CONFLICT(id) DO UPDATE SET
                       business_name = excluded.business_name,
                       logo_url = excluded.logo_url,
                       address = excluded.address,
                       full_name = excluded.full_name,
                       currency = excluded.currency,
                       default_currency = excluded.default_currency,
                       phone = excluded.phone,
                       phone_number = excluded.phone_number,
                       is_premium = excluded.is_premium,
                       sync_status = 'synced',
                       updated_at = excluded.updated_at`,
                    [
                        userId,
                        remote.business_name ?? null,
                        remote.logo_url ?? null,
                        remote.address ?? null,
                        remote.full_name ?? null,
                        remote.currency ?? null,
                        remote.currency ?? null,
                        remote.phone_contact ?? null,
                        remote.phone_contact ?? null,
                        remote.is_premium ? 1 : 0,
                        new Date().toISOString(),
                    ]
                );
            }
        } catch (error) {
            console.error('AuthContext fetchProfile error:', error);
        }
    };

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user.id).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(true); // Ensure loading is true while fetching profile
            if (session?.user) {
                fetchProfile(session.user.id).finally(() => setLoading(false));

                // Register for push notifications in the background (non-blocking)
                if (_event === 'SIGNED_IN') {
                    registerForPushNotificationsAsync().then(token => {
                        if (token && session.user) {
                            savePushTokenToProfile(session.user.id, token);
                        }
                    }).catch(err => console.warn('Push token registration failed:', err));
                }
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const refreshProfile = async () => {
        if (session?.user) {
            await fetchProfile(session.user.id);
        }
    };

    return (
        <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
