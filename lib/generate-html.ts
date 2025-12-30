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
    title?: string; // e.g. "FACTURE" or "DEVIS"
}

export function generateInvoiceHTML(data: InvoiceData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            padding: 20px;
            margin: 0;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
        }
        .logo {
            max-height: 80px;
            margin-bottom: 15px;
            object-fit: contain;
        }
        .business-name {
            font-size: 28px;
            font-weight: bold;
            color: #007AFF;
            margin: 0;
            text-transform: uppercase;
        }
        .business-info {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
        }
        .invoice-meta h1 {
            font-size: 24px;
            margin: 0 0 5px 0;
            color: #333;
        }
        .client-info h3 {
            font-size: 14px;
            text-transform: uppercase;
            color: #888;
            margin: 0 0 5px 0;
        }
        .client-name {
            font-size: 18px;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th {
            background-color: #f2f2f7;
            text-align: left;
            padding: 12px;
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
            border-bottom: 1px solid #ddd;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            font-size: 14px;
        }
        .text-right {
            text-align: right;
        }
        .total-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
        }
        .total-box {
            text-align: right;
            background-color: #007AFF;
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
        }
        .total-label {
            font-size: 14px;
            margin-bottom: 5px;
            opacity: 0.9;
        }
        .total-amount {
            font-size: 24px;
            font-weight: bold;
        }
        .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 12px;
            color: #aaa;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: flex-end;
            padding-right: 20px;
        }
        .signature-container {
            text-align: center;
            width: 200px;
        }
        .signature-image {
            max-width: 150px;
            max-height: 80px;
            object-fit: contain;
            margin-bottom: 5px;
        }
        .signature-line {
            border-top: 1px solid #ccc;
            margin-top: 5px;
            padding-top: 5px;
            font-size: 10px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="header">
        ${data.logoUrl ? `<img src="${data.logoUrl}" class="logo" />` : ''}
        <h1 class="business-name">${data.businessName}</h1>
        ${data.businessPhone ? `<div class="business-info">Tél: ${data.businessPhone}</div>` : ''}
    </div>

    <div class="invoice-details">
        <div class="client-info">
            <h3>Facturé à</h3>
            <div class="client-name">${data.customerName}</div>
        </div>
        <div class="invoice-meta text-right">
            <h1>${data.title || 'FACTURE'}</h1>
            <div style="color: #666;">#${data.invoiceNumber}</div>
            <div style="color: #666;">${data.date}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 50%;">Description</th>
                <th class="text-right">Qté</th>
                <th class="text-right">Prix Unit.</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            ${data.items.map(item => `
            <tr>
                <td>${item.description}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${item.unitPrice.toLocaleString()}</td>
                <td class="text-right">${item.total.toLocaleString()} ${data.currency}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-box">
            <div class="total-label">${data.title === 'DEVIS' ? 'TOTAL ESTIMÉ' : 'TOTAL À PAYER'}</div>
            <div class="total-amount">${data.totalAmount.toLocaleString()} ${data.currency}</div>
        </div>
    </div>

    ${data.signatureUrl ? `
    <div class="signature-section">
        <div class="signature-container">
            <img src="${data.signatureUrl}" class="signature-image" />
            <div class="signature-line">Signature du Responsable</div>
        </div>
    </div>
    ` : ''}

    <div class="footer">
        Généré gratuitement avec QuickBill - facturation simple et rapide.
    </div>
</body>
</html>
    `;
}
