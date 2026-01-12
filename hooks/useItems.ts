import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Item } from '../types';

export function useItems() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const fetchItems = async () => {
        if (!user) return [];

        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Item[];
    };

    const query = useQuery({
        queryKey: ['items', user?.id],
        queryFn: fetchItems,
        enabled: !!user,
    });

    return query;
}
