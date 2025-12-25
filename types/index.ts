export interface Profile {
    id: string; // uuid
    business_name: string;
    logo_url?: string | null;
    phone_contact?: string | null;
    currency: string;
    is_premium?: boolean;
}

export interface Customer {
    id: string; // uuid
    user_id: string; // FK -> profiles.id
    name: string;
    phone: string;
}

export interface InvoiceItem {
    id?: string; // Optional if not yet saved
    invoice_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
}

export type InvoiceStatus = 'PAID' | 'UNPAID';

export interface Invoice {
    id: string; // uuid
    user_id: string; // FK -> profiles.id
    customer_id: string; // FK -> customers.id
    customer?: Customer | Customer[]; // Joined data (can be single or array from Supabase)
    invoice_number: string;
    status: InvoiceStatus;
    total_amount: number;
    created_at: string; // ISO timestamp
    items?: InvoiceItem[];
}

// Helper type for invoice with properly joined data
export interface InvoiceWithRelations extends Omit<Invoice, 'customer' | 'items'> {
    customer: Customer;
    items: InvoiceItem[];
}
