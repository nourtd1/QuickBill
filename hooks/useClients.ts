import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Client } from '../types';

export function useClients() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const fetchClients = async () => {
        if (!user) return [];

        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Client[];
    };

    const query = useQuery({
        queryKey: ['clients', user?.id],
        queryFn: fetchClients,
        enabled: !!user, // Only run if user is logged in
        // The app can create/edit clients and then immediately go back to invoice screens.
        // Our global QueryClient keeps data "fresh" for 5 minutes, so without this override
        // the client picker can show an outdated list until a full reload.
        staleTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });

    return query;
}
