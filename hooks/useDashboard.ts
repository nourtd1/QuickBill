import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getDashboardStatsLocal } from '../lib/localServices';
import { useAuth } from '../context/AuthContext';
import { Invoice } from '../types';

export interface MonthlyData {
    value: number;
    label: string;
    frontColor?: string;
}

export function useDashboard() {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    const [monthlyExpenses, setMonthlyExpenses] = useState(0);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [chartData, setChartData] = useState<MonthlyData[]>([]);
    const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const data = await getDashboardStatsLocal(user.id);

            setMonthlyRevenue(data.monthlyRevenue || 0);
            setMonthlyExpenses(data.monthlyExpenses || 0);
            setPendingAmount(data.pendingAmount || 0);
            setChartData(data.chartData || []);
            setInvoices((data.recentInvoices || []) as any);
            setRecentExpenses(data.recentExpenses || []);

        } catch (err) {
            console.error('Error fetching dashboard:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Calculate Growth (Last month vs Previous month)
    const growth = chartData.length >= 2
        ? (() => {
            const current = chartData[chartData.length - 1].value;
            const previous = chartData[5 - 1].value || 1; // Avoid division by zero, use 1 or handle logic
            // Actually, chartData is generic. If I pushed 6 months:
            // index 5 = current month (0 months ago)
            // index 4 = previous month (1 month ago)
            // Wait, the loop was i=5 down to 0.
            // i=0 is current month (pushed Last).
            // NO, I pushed inside the loop `for (let i = 5; i >= 0; i--)`.
            // First iteration i=5 (5 months ago) -> Pushed first.
            // Last iteration i=0 (0 months ago) -> Pushed last.
            // So chartData[5] is current month. chartData[4] is previous.

            const curr = chartData[5]?.value || 0;
            const prev = chartData[4]?.value || 0;

            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        })()
        : 0;

    return {
        invoices,
        monthlyRevenue,
        monthlyExpenses,
        netProfit: monthlyRevenue - monthlyExpenses,
        pendingAmount,
        chartData,
        recentExpenses,
        growth, // New Return
        loading,
        refresh: fetchDashboardData
    };
}
