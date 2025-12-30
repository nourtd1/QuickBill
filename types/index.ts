export interface Profile {
    id: string; // uuid
    business_name: string;
    logo_url?: string | null;
    phone_contact?: string | null;
    currency: string;
    is_premium?: boolean;
    signature_url?: string | null;
}

export interface Customer {
    id: string; // uuid
    user_id: string; // FK -> profiles.id
    name: string;
    phone: string;
}

export interface Client {
    id: string;
    user_id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    created_at: string;
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
    customer_id: string; // FK -> clients.id
    customer?: Client | Client[]; // Joined data
    invoice_number: string;
    status: InvoiceStatus;
    total_amount: number;
    created_at: string; // ISO timestamp
    items?: InvoiceItem[];
}

// Helper type for invoice with properly joined data
export interface InvoiceWithRelations extends Omit<Invoice, 'customer' | 'items'> {
    customer: Client;
    items: InvoiceItem[];
}

export interface Item {
    id: string;
    user_id: string;
    name: string;
    description?: string | null;
    unit_price: number;
    currency: string;
    created_at: string;
}

export type EstimateStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED';

export interface EstimateItem {
    id?: string;
    estimate_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
}

export interface Estimate {
    id: string;
    user_id: string;
    customer_id: string;
    customer?: Client | Client[];
    estimate_number: string;
    status: EstimateStatus;
    total_amount: number;
    currency: string;
    created_at: string;
}

export interface EstimateWithRelations extends Omit<Estimate, 'customer'> {
    customer: Client;
    items: EstimateItem[];
}
