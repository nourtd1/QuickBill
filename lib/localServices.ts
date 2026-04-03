import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { getDBConnection } from './database';

// Types (Mirroring Supabase definition basically)
export interface LocalInvoice {
    id: string;
    user_id: string;
    customer_id: string | null;
    invoice_number: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'unpaid' | 'pending_approval' | 'rejected';
    currency: string;
    exchange_rate: number;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    discount: number;
    total_amount: number;
    issue_date: string | null;
    due_date: string | null;
    notes?: string | null;
    terms?: string | null;
    public_link_token?: string | null;
    share_token?: string | null;
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

export interface LocalNotification {
    id: string;
    user_id: string;
    title: string;
    message: string | null;
    type: 'payment' | 'invoice' | 'system' | 'general';
    read_status: 0 | 1;
    data: string | null;
    created_at: string;
}

export const generateUUID = () => {
    return Crypto.randomUUID();
};

/**
 * Save a notification locally
 */
export const saveNotificationLocally = async (
    notification: Omit<LocalNotification, 'id' | 'created_at' | 'read_status'>
) => {
    const db = await getDBConnection();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
        `INSERT INTO notifications (id, user_id, title, message, type, read_status, data, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        [id, notification.user_id, notification.title, notification.message || null, notification.type || 'general', notification.data || null, now]
    );

    return id;
};

/**
 * Get all notifications for a user
 */
export const getNotificationsLocal = async (userId: string) => {
    const db = await getDBConnection();
    return await db.getAllAsync<LocalNotification>(
        `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
    );
};

/**
 * Mark a notification as read
 */
export const markNotificationAsReadLocal = async (id: string) => {
    const db = await getDBConnection();
    await db.runAsync(`UPDATE notifications SET read_status = 1 WHERE id = ?`, [id]);
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsReadLocal = async (userId: string) => {
    const db = await getDBConnection();
    await db.runAsync(`UPDATE notifications SET read_status = 1 WHERE user_id = ?`, [userId]);
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCountLocal = async (userId: string): Promise<number> => {
    const db = await getDBConnection();
    const result = await db.getAllAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_status = 0`,
        [userId]
    );
    return result[0]?.count || 0;
};

/**
 * Delete a notification
 */
export const deleteNotificationLocal = async (id: string) => {
    const db = await getDBConnection();
    await db.runAsync(`DELETE FROM notifications WHERE id = ?`, [id]);
};

/**
 * Save an image locally to the persistent document directory
 */
export const saveImageLocally = async (uri: string): Promise<string> => {
    try {
        const filename = uri.split('/').pop();
        // @ts-ignore
        const newPath = FileSystem.documentDirectory + 'images/' + filename;

        // Ensure directory exists
        // @ts-ignore
        const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'images/');
        if (!dirInfo.exists) {
            // @ts-ignore
            await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'images/');
        }

        // @ts-ignore
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
      subtotal, tax_rate, tax_amount, discount, total_amount, issue_date, due_date, 
      notes, terms, public_link_token, share_token, 
      sync_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            invoiceData.tax_amount || 0,
            invoiceData.discount || 0,
            invoiceData.total_amount,
            invoiceData.issue_date || now.split('T')[0],
            invoiceData.due_date,
            invoiceData.notes || null,
            invoiceData.terms || null,
            invoiceData.public_link_token || null,
            invoiceData.share_token || invoiceData.public_link_token || null,
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
 * Get one invoice (with items + customer) from local SQLite.
 * Used as a fallback when Supabase doesn't have the record yet.
 */
export const getInvoiceDetailsLocal = async (userId: string, invoiceId: string) => {
    const db = await getDBConnection();

    const inv = await db.getFirstAsync<LocalInvoice>(
        `SELECT * FROM invoices WHERE user_id = ? AND id = ? LIMIT 1`,
        [userId, invoiceId]
    );

    if (!inv) return null;

    const items = await db.getAllAsync<LocalInvoiceItem>(
        `SELECT * FROM invoice_items WHERE invoice_id = ?`,
        [invoiceId]
    );

    // Local clients table is what invoice UI expects for the customer relation.
    const customer = await db.getFirstAsync<any>(
        `SELECT * FROM clients WHERE id = ? LIMIT 1`,
        [inv.customer_id]
    );

    // Whatsapp history is optional in the UI. Provide an empty array if missing.
    const whatsapp_history = await db.getAllAsync<any>(
        `SELECT * FROM whatsapp_messages WHERE invoice_id = ?`,
        [invoiceId]
    );

    return {
        ...inv,
        // Ensure the UI shape matches what supabase joins provide.
        customer: customer,
        items: items,
        whatsapp_history,
    };
};

/**
 * Same as `getInvoiceDetailsLocal`, but can work even if `user.id` isn't ready.
 * It loads by invoice id only.
 */
export const getInvoiceDetailsLocalById = async (invoiceId: string) => {
    const db = await getDBConnection();

    const inv = await db.getFirstAsync<LocalInvoice>(
        `SELECT * FROM invoices WHERE id = ? LIMIT 1`,
        [invoiceId]
    );

    if (!inv) return null;

    const items = await db.getAllAsync<LocalInvoiceItem>(
        `SELECT * FROM invoice_items WHERE invoice_id = ?`,
        [invoiceId]
    );

    const customer = await db.getFirstAsync<any>(
        `SELECT * FROM clients WHERE id = ? LIMIT 1`,
        [inv.customer_id]
    );

    const whatsapp_history = await db.getAllAsync<any>(
        `SELECT * FROM whatsapp_messages WHERE invoice_id = ?`,
        [invoiceId]
    );

    return {
        ...inv,
        customer,
        items,
        whatsapp_history,
    };
};

/**
 * Save a new client locally
 */
export const saveClientLocally = async (
    clientData: { 
        user_id: string; 
        name: string; 
        email?: string; 
        phone?: string; 
        address?: string;
        notes?: string;
        registration_number?: string;
        industry?: string;
        contact_person?: string;
        tax_id?: string;
        currency?: string;
        logo_url?: string;
        portal_token?: string;
    }
): Promise<string> => {
    const db = await getDBConnection();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
        `INSERT INTO clients (
            id, user_id, name, email, phone, address, notes, 
            registration_number, industry, contact_person, tax_id, 
            currency, logo_url, portal_token, sync_status, created_at, updated_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [
            id, 
            clientData.user_id, 
            clientData.name, 
            clientData.email || null, 
            clientData.phone || null, 
            clientData.address || null,
            clientData.notes || null,
            clientData.registration_number || null,
            clientData.industry || null,
            clientData.contact_person || null,
            clientData.tax_id || null,
            clientData.currency || 'USD',
            clientData.logo_url || null,
            clientData.portal_token || null,
            now, 
            now
        ]
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
    expenseData: { 
        user_id: string; 
        amount: number; 
        category: string; 
        merchant?: string; 
        description?: string; 
        date: string; 
        receipt_url?: string 
    }
): Promise<string> => {
    const db = await getDBConnection();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
        `INSERT INTO expenses (id, user_id, amount, category, merchant, description, date, receipt_url, sync_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [
            id, 
            expenseData.user_id, 
            expenseData.amount, 
            expenseData.category, 
            expenseData.merchant || null,
            expenseData.description || null, 
            expenseData.date, 
            expenseData.receipt_url || null, 
            now, 
            now
        ]
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
         WHERE user_id = ? AND status != 'paid'`,
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
    const chartData: { value: number; income: number; expense: number; label: string; frontColor?: string }[] = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        const monthKey = d.toISOString().slice(0, 7); // YYYY-MM

        // SQLite doesn't have great date functions, so we filter in JS or use strftime if available.
        // Assuming YYYY-MM-DD format for created_at.
        const startOfMonth = `${monthKey}-01`;
        const endOfMonth = `${monthKey}-31`; // Simple approximation, works for string comparison

        const monthIncomeResult = await db.getAllAsync<{ total: number }>(
            `SELECT SUM(total_amount) as total FROM invoices 
             WHERE user_id = ? AND created_at >= ? AND created_at <= ? AND status != 'draft' AND status != 'rejected'`,
            [userId, startOfMonth, endOfMonth]
        );

        const monthExpenseResult = await db.getAllAsync<{ total: number }>(
            `SELECT SUM(amount) as total FROM expenses
             WHERE user_id = ? AND date >= ? AND date <= ?`,
            [userId, startOfMonth, endOfMonth]
        );

        const income = monthIncomeResult[0]?.total || 0;
        const expense = monthExpenseResult[0]?.total || 0;

        chartData.push({
            value: income, // Kept for backwards compatibility
            income: income,
            expense: expense,
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
