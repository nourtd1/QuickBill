import { ActionSheetIOS } from "react-native";

export interface InvoiceData {
    invoiceNumber: string;
    date: string;
    customerName: string;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
    totalAmount: number;
    businessName: string;
    businessPhone?: string;
    currency: string;
    logoUrl?: string | null;
    signatureUrl?: string | null;
    qrCodeUrl?: string | null;
    paymentMethod?: string | null;
    title?: string; // e.g. "FACTURE" or "DEVIS"
}

export function generateInvoiceHTML(data: InvoiceData): string {
    const primaryColor = '#1E40AF'; // Royal Blue
    const secondaryColor = '#0F172A'; // Slate 900
    const accentColor = '#3B82F6'; // Blue 500
    const lightBg = '#F8FAFC'; // Slate 50

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap');
        
        body {
            font-family: 'Urbanist', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: ${secondaryColor};
            background: #fff;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
        }

        .page-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            position: relative;
            overflow: hidden;
            min-height: 1100px; /* A4 height approx */
        }

        /* Decorative Sidebar Strip */
        .sidebar-strip {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 8px;
            background: linear-gradient(180deg, ${primaryColor} 0%, ${accentColor} 100%);
        }

        .content {
            padding: 50px 50px 50px 60px; /* Extra left padding for strip */
            position: relative;
            z-index: 2;
        }

        /* Watermark */
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-10deg);
            width: 400px;
            opacity: 0.03;
            z-index: 1;
            pointer-events: none;
        }

        /* Header Layout */
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 50px;
        }

        .brand-section {
            flex: 1;
        }

        .logo {
            height: 70px;
            object-fit: contain;
            margin-bottom: 15px;
            display: block;
        }

        .company-name {
            font-size: 26px;
            font-weight: 800;
            color: ${primaryColor};
            text-transform: uppercase;
            letter-spacing: -0.5px;
            margin-bottom: 5px;
        }

        .company-meta {
            font-size: 13px;
            color: #64748B;
            line-height: 1.5;
        }

        .invoice-box {
            text-align: right;
        }

        .doc-title {
            font-size: 42px;
            font-weight: 900;
            color: #F1F5F9; /* Very light grey for background effect */
            text-transform: uppercase;
            line-height: 0.8;
            margin-bottom: -20px;
            position: relative;
            z-index: -1;
        }

        .doc-number-box {
            background: ${primaryColor};
            color: white;
            padding: 10px 20px;
            border-radius: 8px 0 8px 8px;
            display: inline-block;
            margin-top: 10px;
            box-shadow: 0 4px 6px -1px rgba(30, 64, 175, 0.2);
        }

        .doc-number {
            font-size: 16px;
            font-weight: 700;
        }

        .doc-date {
            font-size: 12px;
            margin-top: 5px;
            opacity: 0.9;
        }

        /* Billing Info Grid */
        .info-grid {
            display: flex;
            gap: 40px;
            margin-bottom: 50px;
            border-bottom: 2px solid ${lightBg};
            padding-bottom: 30px;
        }

        .info-col {
            flex: 1;
        }

        .label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #94A3B8;
            margin-bottom: 8px;
        }

        .recipient-name {
            font-size: 18px;
            font-weight: 700;
            color: ${secondaryColor};
            margin-bottom: 4px;
        }

        .recipient-detail {
            font-size: 14px;
            color: #64748B;
        }

        /* Premium Table */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
        }

        thead {
            background: ${secondaryColor};
            color: white;
        }

        th {
            text-align: left;
            padding: 16px 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 16px 20px;
            border-bottom: 1px solid #E2E8F0;
            font-size: 14px;
            color: ${secondaryColor};
        }

        tbody tr:nth-child(even) {
            background-color: ${lightBg};
        }

        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }

        /* Summary Section */
        .summary-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 50px;
        }

        .summary-box {
            width: 300px;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #E2E8F0;
            color: #64748B;
            font-size: 14px;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 15px;
            padding: 20px;
            background: ${lightBg};
            border-radius: 12px;
            border: 1px solid #E2E8F0;
        }

        .total-label {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            color: ${primaryColor};
        }

        .total-amount {
            font-size: 28px;
            font-weight: 800;
            color: ${secondaryColor};
        }

        /* Footer / Notes */
        .footer-grid {
            display: flex;
            gap: 30px;
            padding-top: 30px;
            border-top: 2px dashed #E2E8F0;
            align-items: flex-start;
        }

        .notes-col {
            flex: 2;
        }

        .signature-col {
            flex: 1;
            text-align: center;
        }

        .thank-you {
            font-size: 16px;
            font-weight: 700;
            color: ${primaryColor};
            margin-bottom: 8px;
        }

        .payment-info {
            font-size: 12px;
            color: #64748B;
            line-height: 1.6;
            background: #FFF;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #E2E8F0;
        }

        .qr-clean {
            width: 80px;
            height: 80px;
            border-radius: 8px;
            border: 4px solid white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .signature-img {
            height: 60px;
            object-fit: contain;
            margin-bottom: 10px;
        }

        .signature-line {
            width: 100%;
            border-top: 1px solid #CBD5E1;
            padding-top: 5px;
            font-size: 10px;
            font-weight: 600;
            color: #94A3B8;
            text-transform: uppercase;
        }

        /* Branding Strip Bottom */
        .bottom-branding {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #CBD5E1;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

    </style>
</head>
<body>
    <div class="page-container">
        <div class="sidebar-strip"></div>
        
        <!-- Subtle background watermark -->
        ${data.logoUrl ? `<img src="${data.logoUrl}" class="watermark" />` : ''}

        <div class="content">
            <!-- Header -->
            <div class="header">
                <div class="brand-section">
                    ${data.logoUrl ? `<img src="${data.logoUrl}" class="logo" />` : ''}
                    <div class="company-name">${data.businessName}</div>
                    <div class="company-meta">
                        ${data.businessPhone ? `Tel: ${data.businessPhone}<br>` : ''}
                        ${data.paymentMethod ? `Paiement: ${data.paymentMethod}` : ''}
                    </div>
                </div>
                
                <div class="invoice-box">
                    <div class="doc-title">${data.title || 'FACTURE'}</div>
                    <div class="doc-number-box">
                        <div class="doc-number">#${data.invoiceNumber}</div>
                        <div class="doc-date">${data.date}</div>
                    </div>
                </div>
            </div>

            <!-- Billing Info -->
            <div class="info-grid">
                <div class="info-col">
                    <div class="label">Facturé à</div>
                    <div class="recipient-name">${data.customerName}</div>
                    <div class="recipient-detail">Client apprécié</div>
                </div>
                <div class="info-col" style="text-align: right;">
                    <div class="label">Total à payer</div>
                    <div style="font-size: 24px; font-weight: 800; color: ${secondaryColor};">
                        ${data.totalAmount.toLocaleString()} ${data.currency}
                    </div>
                </div>
            </div>

            <!-- Items Table -->
            <table>
                <thead>
                    <tr>
                        <th style="width: 50%">Désignation</th>
                        <th class="text-right">Qté</th>
                        <th class="text-right">Prix Unit.</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map(item => `
                    <tr>
                        <td class="font-bold">${item.description}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">${item.unitPrice.toLocaleString()}</td>
                        <td class="text-right font-bold">${item.total.toLocaleString()} ${data.currency}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- Summary -->
            <div class="summary-section">
                <div class="summary-box">
                    <div class="summary-row">
                        <span>Sous-total</span>
                        <span>${data.totalAmount.toLocaleString()} ${data.currency}</span>
                    </div>
                    <div class="summary-row">
                        <span>Taxes (0%)</span>
                        <span>0 ${data.currency}</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">Net à Payer</span>
                        <span class="total-amount">${data.totalAmount.toLocaleString()} <span style="font-size: 14px;">${data.currency}</span></span>
                    </div>
                </div>
            </div>

            <!-- Footer Grid -->
            <div class="footer-grid">
                <div class="notes-col">
                    <div class="thank-you">Merci de votre confiance !</div>
                    <div class="payment-info">
                        <div style="font-weight: 600; margin-bottom: 4px; color: ${secondaryColor};">Termes & Conditions</div>
                        Le paiement est dû à la réception de cette facture. Nous apprécions votre promptitude.
                        ${data.qrCodeUrl ? `<div style="margin-top: 10px; display: flex; align-items: center; gap: 10px;">
                            <img src="${data.qrCodeUrl}" class="qr-clean" />
                            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${primaryColor};">Scanner pour payer<br>instantanément</div>
                        </div>` : ''}
                    </div>
                </div>

                <div class="signature-col">
                    ${data.signatureUrl ? `<img src="${data.signatureUrl}" class="signature-img" />` : '<div style="height: 60px;"></div>'}
                    <div class="signature-line">${data.businessName}</div>
                </div>
            </div>
            
            <div class="bottom-branding">
                POWERED BY QUICKBILL
            </div>
        </div>
    </div>
</body>
</html>
    `;
}
