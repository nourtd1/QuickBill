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
