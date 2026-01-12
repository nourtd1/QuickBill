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
            // OPTIMISATION: Une seule requête RPC pour tout charger
            const { data, error } = await supabase
                .rpc('get_dashboard_stats', { p_user_id: user.id });

            if (error) throw error;

            if (data) {
                setMonthlyRevenue(data.monthlyRevenue || 0);
                setMonthlyExpenses(data.monthlyExpenses || 0);
                setPendingAmount(data.pendingAmount || 0);
                setChartData(data.chartData || []);
                // Les factures récentes incluent déjà l'objet customer { name: ... } via le SQL
                setInvoices((data.recentInvoices || []) as any);
            }

        } catch (err) {
            console.error('Error fetching dashboard via RPC:', err);
            // Fallback optionnel si la RPC n'existe pas encore (commenté pour forcer l'usage optimal)
            /* 
               Si vous voyez cette erreur, assurez-vous d'avoir exécuté le script SQL 
               disponible dans docs/rpc_migration.sql dans votre projet Supabase.
            */
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
