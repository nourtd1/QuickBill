-- Supabase RPC Function to fetch invoice by public token safely
-- This bypasses RLS for the specific row matched by the token

CREATE OR REPLACE FUNCTION get_invoice_by_token(token_arg TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (admin), bypassing RLS
AS $$
DECLARE
    v_invoice_data JSONB;
    v_items_data JSONB;
    v_curr_invoice_id UUID;
BEGIN
    -- 1. Fetch Invoice Details
    SELECT to_jsonb(i) || jsonb_build_object(
        'customer', to_jsonb(c),
        'profile', to_jsonb(p)
    )
    INTO v_invoice_data
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN profiles p ON i.user_id = p.id
    WHERE i.public_link_token = token_arg
    LIMIT 1;

    -- If no invoice found, return null
    IF v_invoice_data IS NULL THEN
        RETURN NULL;
    END IF;

    v_curr_invoice_id := (v_invoice_data->>'id')::UUID;

    -- 2. Fetch Invoice Items
    SELECT jsonb_agg(to_jsonb(it))
    INTO v_items_data
    FROM invoice_items it
    WHERE it.invoice_id = v_curr_invoice_id;

    -- 3. Log Access (First view)
    -- Optional: Create a viewing_log table or update a 'viewed_at' column if it exists
    -- For now, let's assuming we just return the data.

    -- 4. Combine and Return
    RETURN v_invoice_data || jsonb_build_object('items', COALESCE(v_items_data, '[]'::JSONB));
END;
$$;

-- Grant execute permission to anonymous users (if public access is desired) and authenticated users
GRANT EXECUTE ON FUNCTION get_invoice_by_token(TEXT) TO anon, authenticated, service_role;
