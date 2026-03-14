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

  // --- MIGRATIONS (V3) ---
  // Ensure 'clients' has all necessary columns
  await addColumnIfMissing(db, 'clients', 'notes', 'TEXT');
  await addColumnIfMissing(db, 'clients', 'registration_number', 'TEXT');
  await addColumnIfMissing(db, 'clients', 'industry', 'TEXT');
  await addColumnIfMissing(db, 'clients', 'contact_person', 'TEXT');
  await addColumnIfMissing(db, 'clients', 'tax_id', 'TEXT');
  await addColumnIfMissing(db, 'clients', 'currency', "TEXT DEFAULT 'USD'");
  await addColumnIfMissing(db, 'clients', 'logo_url', 'TEXT');

  // Ensure 'invoices' has all necessary columns
  await addColumnIfMissing(db, 'invoices', 'issue_date', 'TEXT');
  await addColumnIfMissing(db, 'invoices', 'discount', 'NUMERIC DEFAULT 0');
  await addColumnIfMissing(db, 'invoices', 'tax_amount', 'NUMERIC DEFAULT 0');
  await addColumnIfMissing(db, 'invoices', 'notes', 'TEXT');
  await addColumnIfMissing(db, 'invoices', 'terms', 'TEXT');
  
  // Supabase uses 'share_token', local used 'public_link_token'. Add 'share_token' for sync compatibility.
  await addColumnIfMissing(db, 'invoices', 'share_token', 'TEXT');

  // --- PHASE 2 MIGRATIONS ---
  await addColumnIfMissing(db, 'profiles', 'whatsapp_template', 'TEXT');
  await addColumnIfMissing(db, 'profiles', 'reminders_enabled', 'INTEGER DEFAULT 0');
  await addColumnIfMissing(db, 'profiles', 'reminder_intervals', 'TEXT DEFAULT "[7, 14, 30]"');
  await addColumnIfMissing(db, 'profiles', 'reminder_template', 'TEXT');
  // Sync: Supabase profiles can have 'phone', 'expo_push_token', 'currency'
  await addColumnIfMissing(db, 'profiles', 'phone', 'TEXT');
  await addColumnIfMissing(db, 'profiles', 'expo_push_token', 'TEXT');
  await addColumnIfMissing(db, 'profiles', 'full_name', 'TEXT');
  await addColumnIfMissing(db, 'profiles', 'currency', 'TEXT');

  // Sync: Supabase invoices can have 'created_by'
  await addColumnIfMissing(db, 'invoices', 'created_by', 'TEXT');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      invoice_id TEXT,
      client_id TEXT,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'invoice_share',
      status TEXT DEFAULT 'sent',
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. INDEXES for Performance
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_invoices_sync_status ON invoices(sync_status);');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_clients_sync_status ON clients(sync_status);');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_expenses_sync_status ON expenses(sync_status);');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sync ON whatsapp_messages(sync_status);');

  if (__DEV__) console.log('Local SQLite Database Initialized (Schema V3 with Phase 2)');
};

/**
 * Helper to safely add columns to existing tables
 */
async function addColumnIfMissing(db: SQLite.SQLiteDatabase, table: string, column: string, type: string) {
  try {
    const result = await db.getAllAsync(`PRAGMA table_info(${table})`);
    const exists = result.some((col: any) => col.name === column);
    if (!exists) {
      if (__DEV__) console.log(`Adding column ${column} to ${table}...`);
      await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
    }
  } catch (error) {
    console.error(`Error adding column ${column} to ${table}:`, error);
  }
}
