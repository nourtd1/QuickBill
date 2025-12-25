import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../types';

export function useProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        if (!user) return;

        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!error && data) {
            setProfile(data as Profile);
        }
        setLoading(false);
    };

    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) return { error: 'No user' };

        const { error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, ...updates });

        if (!error) {
            setProfile(prev => prev ? { ...prev, ...updates } : null);
            await fetchProfile();
        }

        return { error };
    };

    return { profile, loading, fetchProfile, updateProfile };
}
