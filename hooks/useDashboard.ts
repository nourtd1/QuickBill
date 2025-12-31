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
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Get recent 5 invoices
            const { data: invoiceData, error: invoiceError } = await supabase
                .from('invoices')
                .select(`*, customer:clients (name)`)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (invoiceError) throw invoiceError;
            setInvoices((invoiceData || []) as any);

            // 2. Stats calculation
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // Encaissé ce mois (Revenue)
            const { data: paidData, error: paidError } = await supabase
                .from('invoices')
                .select('total_amount')
                .eq('user_id', user.id)
                .eq('status', 'PAID')
                .gte('created_at', firstDayOfMonth);

            if (paidError) throw paidError;
            const revenue = paidData.reduce((sum, item) => sum + (item.total_amount || 0), 0);
            setMonthlyRevenue(revenue);

            // Dépenses ce mois
            const { data: expenseData, error: expenseError } = await supabase
                .from('expenses')
                .select('amount')
                .eq('user_id', user.id)
                .gte('date', firstDayOfMonth.split('T')[0]);

            if (expenseError) throw expenseError;
            const expenses = expenseData.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            setMonthlyExpenses(expenses);

            // En attente (UNPAID)
            const { data: unpaidData, error: unpaidError } = await supabase
                .from('invoices')
                .select('total_amount')
                .eq('user_id', user.id)
                .eq('status', 'UNPAID');

            if (unpaidError) throw unpaidError;
            setPendingAmount(unpaidData.reduce((sum, item) => sum + (item.total_amount || 0), 0));

            // 3. Chart Data (Last 6 months)
            const monthsNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
            const last6Months: MonthlyData[] = [];

            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthIndex = d.getMonth();
                const year = d.getFullYear();

                const startOfMonth = new Date(year, monthIndex, 1).toISOString();
                const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59).toISOString();

                const { data: mData } = await supabase
                    .from('invoices')
                    .select('total_amount')
                    .eq('user_id', user.id)
                    .eq('status', 'PAID')
                    .gte('created_at', startOfMonth)
                    .lte('created_at', endOfMonth);

                const total = (mData || []).reduce((sum, item) => sum + (item.total_amount || 0), 0);

                last6Months.push({
                    month: monthsNames[monthIndex],
                    value: total
                });
            }
            setChartData(last6Months);

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
        loading,
        refresh: fetchDashboardData
    };
}
