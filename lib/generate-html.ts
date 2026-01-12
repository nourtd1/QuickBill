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
    const primaryColor = '#2E44B1'; // Updated Primary Blue
    const secondaryColor = '#0F172A'; // Slate 900
    const accentColor = '#3B82F6'; // Blue 500 (kept for gradients)
    const lightBg = '#F8FAFC'; // Slate 50
    const darkText = '#1A1A1A'; // Deep Black for maximum contrast

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&display=swap');
        
        body {
            font-family: 'Urbanist', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: ${darkText};
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
            padding: 40px 40px 40px 50px;
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
            opacity: 0.02; /* Reduced opacity */
            z-index: 0;
            pointer-events: none;
        }

        /* Header Layout */
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
        }

        .brand-section {
            flex: 1;
        }

        .logo {
            height: 120px;
            object-fit: contain;
            margin-bottom: 15px;
            display: block;
        }

        .company-name {
            font-size: 24px;
            font-weight: 800;
            color: ${primaryColor};
            text-transform: uppercase;
            letter-spacing: -0.5px;
            margin-bottom: 4px;
        }

        .company-meta {
            font-size: 13px;
            color: ${darkText}; /* High contrast */
            font-weight: 600; /* Slightly bolder */
            line-height: 1.4;
        }

        .invoice-box {
            text-align: right;
            padding-top: 10px;
        }

        .doc-title {
            font-size: 32px;
            font-weight: 900;
            color: ${primaryColor};
            text-transform: uppercase;
            line-height: 1;
            margin-bottom: 10px;
        }

        .doc-number-box {
            background: ${primaryColor};
            color: white;
            padding: 8px 16px;
            border-radius: 8px 0 8px 8px;
            display: inline-block;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .doc-number {
            font-size: 15px;
            font-weight: 700;
        }

        .doc-date {
            font-size: 11px;
            margin-top: 2px;
            opacity: 0.95;
        }

        /* Billing Info Grid */
        .info-grid {
            display: flex;
            gap: 40px;
            margin-bottom: 30px;
            border-bottom: 2px solid ${lightBg};
            padding-bottom: 20px;
        }

        .info-col {
            flex: 1;
        }

        .label {
            font-size: 11px;
            font-weight: 800; /* Bolder label */
            text-transform: uppercase;
            letter-spacing: 1px;
            color: ${darkText}; /* High contrast */
            margin-bottom: 6px;
        }

        .recipient-name {
            font-size: 18px;
            font-weight: 800;
            color: ${secondaryColor};
            margin-bottom: 4px;
        }

        .recipient-detail {
            font-size: 14px;
            color: ${darkText};
            font-weight: 600;
        }

        /* Premium Table */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
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
            padding: 14px 15px;
            font-size: 12px;
            font-weight: 900; /* Extra bold */
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #FFFFFF; /* Pure White */
        }

        td {
            padding: 12px 15px;
            border-bottom: 1px solid #E2E8F0;
            font-size: 13px;
            color: ${darkText};
            font-weight: 600;
        }

        tbody tr:nth-child(even) {
            background-color: ${lightBg};
        }

        .text-right { text-align: right; }
        .font-bold { font-weight: 800; }

        /* Summary Section */
        .summary-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }

        .summary-box {
            width: 280px;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #E2E8F0;
            color: ${darkText};
            font-size: 13px;
            font-weight: 500;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
            padding: 15px;
            background: ${lightBg};
            border-radius: 12px;
            border: 1px solid #E2E8F0;
        }

        .total-label {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            color: ${primaryColor};
        }

        .total-amount {
            font-size: 24px;
            font-weight: 900;
            color: ${secondaryColor};
        }

        /* Footer / Notes */
        .footer-grid {
            display: flex;
            gap: 30px;
            padding-top: 20px;
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
            font-size: 14px;
            font-weight: 800;
            color: ${primaryColor};
            margin-bottom: 4px;
        }

        .payment-info {
            font-size: 11px;
            color: ${darkText};
            line-height: 1.5;
            background: #FFF;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #E2E8F0;
        }

        .qr-clean {
            width: 60px;
            height: 60px;
            border-radius: 6px;
            border: 3px solid white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .signature-img {
            height: 50px;
            object-fit: contain;
            margin-bottom: 5px;
        }

        .signature-line {
            width: 100%;
            border-top: 1px solid #CBD5E1;
            padding-top: 5px;
            font-size: 9px;
            font-weight: 700;
            color: #64748B;
            text-transform: uppercase;
        }

        /* Branding Strip Bottom */
        .bottom-branding {
            margin-top: 20px;
            text-align: center;
            font-size: 9px;
            color: #CBD5E1;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        
        /* Print optimization */
        @media print {
            .page-container {
                page-break-inside: avoid;
            }
            tr {
                page-break-inside: avoid;
            }
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
                    <div style="font-size: 22px; font-weight: 900; color: ${secondaryColor};">
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
                        <div style="font-weight: 800; margin-bottom: 2px; color: ${darkText};">Termes & Conditions</div>
                        Paiement dû à réception. Nous apprécions votre promptitude.
                        ${data.qrCodeUrl ? `<div style="margin-top: 8px; display: flex; align-items: center; gap: 10px;">
                            <img src="${data.qrCodeUrl}" class="qr-clean" />
                            <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: ${primaryColor};">Scanner pour<br>payer</div>
                        </div>` : ''}
                    </div>
                </div>

                <div class="signature-col">
                    ${data.signatureUrl ? `<img src="${data.signatureUrl}" class="signature-img" />` : '<div style="height: 50px;"></div>'}
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
