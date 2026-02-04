import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDBConnection = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = await SQLite.openDatabaseAsync('quickbill.db');
  return dbInstance;
};

export const initDatabase = async () => {
  const db = await getDBConnection();

  // Enable Foreign Keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // 1. PROFILES
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY NOT NULL,
      business_name TEXT,
      logo_url TEXT,
      default_currency TEXT DEFAULT 'USD',
      phone_number TEXT,
      address TEXT,
      sync_status TEXT DEFAULT 'pending', -- 'synced', 'pending', 'error'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. CLIENTS (Aligned with Supabase table 'clients')
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      total_spent NUMERIC DEFAULT 0,
      portal_token TEXT,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. INVOICES
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      customer_id TEXT, -- Maps to clients.id
      invoice_number TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      currency TEXT DEFAULT 'USD',
      exchange_rate NUMERIC DEFAULT 1,
      subtotal NUMERIC DEFAULT 0,
      tax_rate NUMERIC DEFAULT 0,
      total_amount NUMERIC DEFAULT 0,
      due_date TEXT,
      public_link_token TEXT,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES clients(id) ON DELETE SET NULL
    );
  `);

  // 4. INVOICE ITEMS
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY NOT NULL,
      invoice_id TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity NUMERIC DEFAULT 1,
      unit_price NUMERIC DEFAULT 0,
      total NUMERIC DEFAULT 0,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
  `);

  // 5. PAYMENTS
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY NOT NULL,
      invoice_id TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      payment_method TEXT,
      transaction_ref TEXT,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
  `);

  // 6. EXPENSES
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      category TEXT,
      description TEXT,
      date TEXT,
      receipt_url TEXT,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Local SQLite Database Initialized (Schema V2)');
};
