import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is fresh for 5 minutes (no fetching on focus if within this time)
            staleTime: 1000 * 60 * 5,
            // Cache persists for 30 minutes
            gcTime: 1000 * 60 * 30,
            retry: 1,
            refetchOnWindowFocus: false, // Explicitly disable refetch on focus as requested
        },
    },
});
