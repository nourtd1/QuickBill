import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { getDBConnection } from './database';

// Types (Mirroring Supabase definition basically)
export interface LocalInvoice {
    id: string;
    user_id: string;
    customer_id: string | null;
    invoice_number: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    currency: string;
    exchange_rate: number;
    subtotal: number;
    tax_rate: number;
    total_amount: number;
    due_date: string | null;
    public_link_token?: string | null;
    created_at: string;
    updated_at: string;
    sync_status: 'synced' | 'pending' | 'error';
}

export interface LocalInvoiceItem {
    id: string;
    invoice_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    sync_status: 'synced' | 'pending' | 'error';
}

export const generateUUID = () => {
    return Crypto.randomUUID();
};

/**
 * Save an image locally to the persistent document directory
 */
export const saveImageLocally = async (uri: string): Promise<string> => {
    try {
        const filename = uri.split('/').pop();
        const newPath = FileSystem.documentDirectory + 'images/' + filename;

        // Ensure directory exists
        const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'images/');
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'images/');
        }

        await FileSystem.copyAsync({
            from: uri,
            to: newPath
        });

        return newPath;
    } catch (error) {
        console.error('Error saving image locally:', error);
        throw error;
    }
};

/**
 * Save valid invoice and its items to local SQLite
 */
export const saveInvoiceLocally = async (
    invoiceData: Omit<LocalInvoice, 'id' | 'created_at' | 'updated_at' | 'sync_status'>,
    itemsData: Omit<LocalInvoiceItem, 'id' | 'invoice_id' | 'sync_status'>[]
) => {
    const db = await getDBConnection();
    const invoiceId = generateUUID();
    const now = new Date().toISOString();

    // 1. Insert Invoice
    await db.runAsync(
        `INSERT INTO invoices (
      id, user_id, customer_id, invoice_number, status, currency, exchange_rate, 
      subtotal, tax_rate, total_amount, due_date, public_link_token, 
      sync_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            invoiceId,
            invoiceData.user_id,
            invoiceData.customer_id,
            invoiceData.invoice_number,
            invoiceData.status,
            invoiceData.currency,
            invoiceData.exchange_rate,
            invoiceData.subtotal,
            invoiceData.tax_rate,
            invoiceData.total_amount,
            invoiceData.due_date,
            invoiceData.public_link_token || null,
            'pending',
            now,
            now
        ]
    );

    // 2. Insert Items
    for (const item of itemsData) {
        const itemId = generateUUID();
        await db.runAsync(
            `INSERT INTO invoice_items (
        id, invoice_id, description, quantity, unit_price, total, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                itemId,
                invoiceId,
                item.description,
                item.quantity,
                item.unit_price,
                item.total,
                'pending'
            ]
        );
    }

    return invoiceId;
};

/**
 * Update an existing local invoice
 */
export const updateInvoiceLocally = async (
    id: string,
    updates: Partial<Omit<LocalInvoice, 'id' | 'user_id' | 'created_at'>>
) => {
    const db = await getDBConnection();
    const now = new Date().toISOString();

    // Helper to construct dynamic query
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
        fields.push(`${key} = ?`);
        values.push(value);
    });

    // Always update sync_status to pending and updated_at
    fields.push(`sync_status = ?`);
    values.push('pending');
    fields.push(`updated_at = ?`);
    values.push(now);

    values.push(id); // For WHERE clause

    const query = `UPDATE invoices SET ${fields.join(', ')} WHERE id = ?`;

    await db.runAsync(query, values);
};

/**
 * Get all invoices with their items
 */
export const getAllInvoicesLocal = async (userId: string) => {
    const db = await getDBConnection();

    // Get Invoices
    const invoices = await db.getAllAsync<LocalInvoice>(
        `SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
    );

    // Get Items for these invoices (Optimization: could be one JOIN, but separate queries are often cleaner for object nesting in JS side)
    // For simplicity/performance on local device, getting all items for user or loop.
    // Let's do a loop or a large IN query. Loop is fine for local.
    // A better way: JOIN
    /*
      const result = await db.getAllAsync(`
        SELECT i.*, it.id as item_id, it.description, ... 
        FROM invoices i LEFT JOIN invoice_items it ON i.id = it.invoice_id
        WHERE i.user_id = ?
      `, [userId]);
      // Then reduce/map to structure.
    */

    // Stick to simple separate fetch for clarity and to return clean objects
    const results = await Promise.all(invoices.map(async (inv) => {
        const items = await db.getAllAsync<LocalInvoiceItem>(
            `SELECT * FROM invoice_items WHERE invoice_id = ?`,
            [inv.id]
        );
        return { ...inv, items };
    }));

    return results;
};

/**
 * Save a new client locally
 */
export const saveClientLocally = async (
    clientData: { user_id: string; name: string; email?: string; phone?: string; address?: string }
): Promise<string> => {
    const db = await getDBConnection();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
        `INSERT INTO clients (id, user_id, name, email, phone, address, sync_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [id, clientData.user_id, clientData.name, clientData.email || null, clientData.phone || null, clientData.address || null, now, now]
    );

    return id;
};

/**
 * Find a client by name locally
 */
export const findClientByNameLocally = async (userId: string, name: string): Promise<any | null> => {
    const db = await getDBConnection();
    // Using simple LIKE for now, SQLite doesn't support ILIKE by default usually but some versions do. 
    // We'll try to match exact or standard lower case in JS if needed.
    // For now simple query:
    const result = await db.getAllAsync(
        `SELECT * FROM clients WHERE user_id = ? AND name = ? LIMIT 1`,
        [userId, name]
    );
    return result.length > 0 ? result[0] : null;
};

/**
 * Save an expense locally
 */
export const saveExpenseLocally = async (
    expenseData: { user_id: string; amount: number; category: string; description?: string; date: string; receipt_url?: string }
): Promise<string> => {
    const db = await getDBConnection();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
        `INSERT INTO expenses (id, user_id, amount, category, description, date, receipt_url, sync_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [id, expenseData.user_id, expenseData.amount, expenseData.category, expenseData.description || null, expenseData.date, expenseData.receipt_url || null, now, now]
    );

    return id;
};

/**
 * Aggregation for Dashboard (Offline capable)
 */
export const getDashboardStatsLocal = async (userId: string) => {
    const db = await getDBConnection();
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    // 1. Monthly Revenue (Invoices created this month)
    const revenueResult = await db.getAllAsync<{ total: number }>(
        `SELECT SUM(total_amount) as total FROM invoices 
         WHERE user_id = ? AND created_at >= ? AND created_at <= ?`,
        [userId, firstDayOfMonth, lastDayOfMonth]
    );
    const monthlyRevenue = revenueResult[0]?.total || 0;

    // 2. Monthly Expenses
    const expenseResult = await db.getAllAsync<{ total: number }>(
        `SELECT SUM(amount) as total FROM expenses
         WHERE user_id = ? AND date >= ? AND date <= ?`,
        [userId, firstDayOfMonth.split('T')[0], lastDayOfMonth.split('T')[0]] // Expenses use YYYY-MM-DD usually for date column
    );
    const monthlyExpenses = expenseResult[0]?.total || 0;

    // 3. Pending Amount (Unpaid invoices)
    const pendingResult = await db.getAllAsync<{ total: number }>(
        `SELECT SUM(total_amount) as total FROM invoices
         WHERE user_id = ? AND status != 'PAID'`,
        [userId]
    );
    const pendingAmount = pendingResult[0]?.total || 0;

    // 4. Recent Invoices
    const recentInvoicesRaw = await db.getAllAsync<LocalInvoice>(
        `SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
        [userId]
    );

    // We need to fetch the customer name for these invoices to display them properly
    const recentInvoices = await Promise.all(recentInvoicesRaw.map(async (inv) => {
        let customerName = 'Unknown';
        if (inv.customer_id) {
            const client = await db.getAllAsync<{ name: string }>(`SELECT name FROM clients WHERE id = ?`, [inv.customer_id]);
            if (client.length > 0) customerName = client[0].name;
        }
        return {
            ...inv,
            customer: { name: customerName } // Mock structure to match UI expectation
        };
    }));

    // 5. Recent Expenses
    const recentExpenses = await db.getAllAsync(
        `SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
        [userId]
    );

    // 6. Chart Data (Last 6 months) - simplified for SQLite
    // We will just return null for now or implement a heavy query.
    // Let's return empty array, UI handles it with dummy data if empty.
    // 6. Chart Data (Last 6 months)
    const chartData: { value: number; label: string; frontColor?: string }[] = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        const monthKey = d.toISOString().slice(0, 7); // YYYY-MM

        // SQLite doesn't have great date functions, so we filter in JS or use strftime if available.
        // Assuming YYYY-MM-DD format for created_at.
        const startOfMonth = `${monthKey}-01`;
        const endOfMonth = `${monthKey}-31`; // Simple approximation, works for string comparison

        const monthResult = await db.getAllAsync<{ total: number }>(
            `SELECT SUM(total_amount) as total FROM invoices 
             WHERE user_id = ? AND created_at >= ? AND created_at <= ? AND status != 'merged'`, // Exclude merged/deleted if any
            [userId, startOfMonth, endOfMonth]
        );

        chartData.push({
            value: monthResult[0]?.total || 0,
            label: monthLabel,
            frontColor: i === 0 ? '#2563EB' : '#E0E7FF', // Highlight current month
        });
    }

    return {
        monthlyRevenue,
        monthlyExpenses,
        pendingAmount,
        recentInvoices,
        recentExpenses,
        chartData
    };
};
