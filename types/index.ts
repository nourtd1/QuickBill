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
    customer?: Customer; // Joined data
    invoice_number: string;
    status: InvoiceStatus;
    total_amount: number;
    created_at: string; // ISO timestamp
    items?: InvoiceItem[];
}
