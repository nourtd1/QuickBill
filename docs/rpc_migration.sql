-- Met à jour la fonction get_dashboard_stats pour utiliser la bonne colonne customer_id
-- À exécuter dans l'éditeur SQL de Supabase

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_monthly_revenue NUMERIC := 0;
    v_monthly_expenses NUMERIC := 0;
    v_pending_amount NUMERIC := 0;
    v_chart_data JSONB := '[]'::JSONB;
    v_recent_invoices JSONB := '[]'::JSONB;
    v_start_of_month TIMESTAMP;
    v_month_names TEXT[] := ARRAY['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    i INT;
    v_iter_date TIMESTAMP;
    v_iter_start TIMESTAMP;
    v_iter_end TIMESTAMP;
    v_month_idx INT;
    v_month_total NUMERIC;
BEGIN
    -- Définir le début du mois courant
    v_start_of_month := date_trunc('month', now());

    -- 1. Revenus du mois (Factures PAYÉES ce mois-ci)
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_monthly_revenue
    FROM invoices
    WHERE user_id = p_user_id
    AND status = 'PAID'
    AND created_at >= v_start_of_month;

    -- 2. Dépenses du mois
    SELECT COALESCE(SUM(amount), 0)
    INTO v_monthly_expenses
    FROM expenses
    WHERE user_id = p_user_id
    AND date >= v_start_of_month::date;

    -- 3. Montant en attente (Toutes factures NON PAYÉES)
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_pending_amount
    FROM invoices
    WHERE user_id = p_user_id
    AND status = 'UNPAID';

    -- 4. Données du graphique (6 derniers mois)
    FOR i IN REVERSE 5..0 LOOP
        v_iter_date := now() - (i || ' month')::interval;
        v_iter_start := date_trunc('month', v_iter_date);
        v_iter_end := (date_trunc('month', v_iter_date) + interval '1 month' - interval '1 second');
        
        -- Index du mois (1-12)
        v_month_idx := EXTRACT(MONTH FROM v_iter_date)::INT;

        SELECT COALESCE(SUM(total_amount), 0)
        INTO v_month_total
        FROM invoices
        WHERE user_id = p_user_id
        AND status = 'PAID'
        AND created_at >= v_iter_start
        AND created_at <= v_iter_end;

        v_chart_data := v_chart_data || jsonb_build_object(
            'month', v_month_names[v_month_idx],
            'value', v_month_total
        );
    END LOOP;

    -- 5. Factures récentes (Limit 5) avec info client
    -- CORRECTION ICI : Utilisation de i.customer_id au lieu de i.client_id
    SELECT jsonb_agg(to_jsonb(t) || jsonb_build_object('customer', jsonb_build_object('name', t.customer_name)))
    INTO v_recent_invoices
    FROM (
        SELECT i.*, c.name as customer_name
        FROM invoices i
        LEFT JOIN clients c ON i.customer_id = c.id
        WHERE i.user_id = p_user_id
        ORDER BY i.created_at DESC
        LIMIT 5
    ) t;

    -- Construction de l'objet de retour final
    RETURN jsonb_build_object(
        'monthlyRevenue', v_monthly_revenue,
        'monthlyExpenses', v_monthly_expenses,
        'pendingAmount', v_pending_amount,
        'chartData', v_chart_data,
        'recentInvoices', COALESCE(v_recent_invoices, '[]'::JSONB)
    );
END;
$$;
