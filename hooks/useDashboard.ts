import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Invoice } from '../types';

export interface MonthlyData {
    month: string;
    value: number;
}

export function useDashboard() {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    const [monthlyExpenses, setMonthlyExpenses] = useState(0);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [chartData, setChartData] = useState<MonthlyData[]>([]);
    const [recentExpenses, setRecentExpenses] = useState<any[]>([]); // New State
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Fetch Main Stats via RPC
            const { data, error } = await supabase
                .rpc('get_dashboard_stats', { p_user_id: user.id });

            if (data) {
                setMonthlyRevenue(data.monthlyRevenue || 0);
                setMonthlyExpenses(data.monthlyExpenses || 0);
                setPendingAmount(data.pendingAmount || 0);
                setChartData(data.chartData || []);
                setInvoices((data.recentInvoices || []) as any);
            }

            // 2. Fetch Recent Expenses separately (Standard Query)
            const { data: expensesData, error: expError } = await supabase
                .from('expenses')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(5);

            if (expensesData) {
                setRecentExpenses(expensesData);
            }

        } catch (err) {
            console.error('Error fetching dashboard:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    return {
        invoices,
        monthlyRevenue,
        monthlyExpenses,
        netProfit: monthlyRevenue - monthlyExpenses,
        pendingAmount,
        chartData,
        recentExpenses, // Return new data
        loading,
        refresh: fetchDashboardData
    };
}
