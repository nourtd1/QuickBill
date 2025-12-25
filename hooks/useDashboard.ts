import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Invoice } from '../types';

export function useDashboard() {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Get recent invoices with customer details
            const { data, error } = await supabase
                .from('invoices')
                .select(`
          *,
          customer:customers (name)
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            // Cast the joined data somewhat loosely or ensure Type mapping
            const formattedInvoices = (data || []).map((inv: any) => ({
                ...inv,
                customer: inv.customer // Supabase returns joined object here
            })) as Invoice[];

            setInvoices(formattedInvoices);

            // 2. Calculate Stats (This month)
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // Revenue (This Month)
            const { data: revenueData, error: revenueError } = await supabase
                .from('invoices')
                .select('total_amount')
                .eq('user_id', user.id)
                .gte('created_at', firstDayOfMonth); // Invoices created this month

            if (revenueError) throw revenueError;

            const revenue = revenueData.reduce((sum, item) => sum + (item.total_amount || 0), 0);
            setMonthlyRevenue(revenue);

            // Pending Amount (Total Unpaid)
            const { data: pendingData, error: pendingError } = await supabase
                .from('invoices')
                .select('total_amount')
                .eq('user_id', user.id)
                .eq('status', 'UNPAID');

            if (pendingError) throw pendingError;

            const pending = pendingData.reduce((sum, item) => sum + (item.total_amount || 0), 0);
            setPendingAmount(pending);

        } catch (err) {
            console.error('Error fetching dashboard:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    return {
        invoices,
        monthlyRevenue,
        pendingAmount,
        loading,
        refresh: fetchDashboardData
    };
}
