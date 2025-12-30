import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../types';

export function useProfile() {
    const { user, refreshProfile: refreshAuthProfile } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!error && data) {
                setProfile(data as Profile);
            }
        } catch (err) {
            console.error("Erreur fetchProfile:", err);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) return { error: 'No user' };

        console.log("Tentative d'update profil avec:", updates);
        const { error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() });

        if (!error) {
            setProfile(prev => prev ? { ...prev, ...updates } : null);
            await refreshAuthProfile(); // Synchroniser avec le contexte global d'Auth
            await fetchProfile();
        }

        return { error };
    };

    return { profile, loading, fetchProfile, updateProfile };
}
