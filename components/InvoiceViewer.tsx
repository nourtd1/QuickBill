import React, { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { styled } from 'nativewind';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { generateQRCodeBase64 } from '../lib/qrCodeHelper';
import InvoiceQRCode from './InvoiceQRCode';

// Types
interface InvoiceData {
    id: string;
    invoice_number: string;
    created_at: string;
    due_date: string;
    status: string;
    total_amount: number;
    currency: string;
    customer?: {
        name: string;
        email: string;
        address: string;
    };
    profile?: {
        business_name: string;
        logo_url: string;
        email: string;
        address: string;
        phone_number: string;
    };
    items: {
        description: string;
        quantity: number;
        unit_price: number;
        total: number;
    }[];
    public_link_token?: string;
}

interface Props {
    data: InvoiceData;
}

const InvoiceViewer: React.FC<Props> = ({ data }) => {
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'USD' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const handleDownloadPDF = async () => {
        // 1. Generate QR Code Base64
        // Determine content: Link if status is sent/paid, or payment payload default
        const qrPayload = data.public_link_token
            ? `https://quickbill.app/public/invoice/${data.public_link_token}`
            : `PAY|${data.total_amount}|${data.currency}|REF:${data.invoice_number}`;

        const qrCodeImage = await generateQRCodeBase64(qrPayload);

        const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .title { font-size: 24px; font-weight: bold; color: #1e293b; }
            .meta { margin-top: 10px; color: #64748b; font-size: 14px; }
            .status { display: inline-block; padding: 5px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; margin-top: 10px; }
            .status.paid { background: #dcfce7; color: #166534; }
            .status.pending { background: #fef9c3; color: #854d0e; }
            .status.overdue { background: #fee2e2; color: #991b1b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 10px; background: #f8fafc; color: #475569; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
            td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .total-section { margin-top: 30px; text-align: right; }
            .total-row { display: flex; justify-content: flex-end; padding: 5px 0; }
            .total-label { width: 150px; color: #64748b; }
            .total-value { width: 100px; font-weight: bold; color: #1e293b; }

            /* Enhanced Footer with QR */
            .footer-row { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; }
            .footer-text { font-size: 12px; color: #94a3b8; }
            .qr-container { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${data.profile?.business_name || 'Business'}</div>
              <div class="meta">${data.profile?.address || ''}</div>
              <div class="meta">${data.profile?.phone_number || ''}</div>
            </div>
            <div style="text-align: right;">
              <div class="title">FACTURE</div>
              <div class="meta">#${data.invoice_number}</div>
              <div class="meta">Date: ${formatDate(data.created_at)}</div>
              <div class="status ${data.status === 'paid' ? 'paid' : data.status === 'overdue' ? 'overdue' : 'pending'}">${data.status.toUpperCase()}</div>
            </div>
          </div>

          <div style="margin-bottom: 30px;">
             <strong>Facturé à :</strong><br/>
             ${data.customer?.name || 'Client'}<br/>
             <span style="color: #64748b; font-size: 14px;">${data.customer?.email || ''}</span><br/>
             <span style="color: #64748b; font-size: 14px;">${data.customer?.address || ''}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Qté</th>
                <th style="text-align: right;">Prix Unit.</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td style="text-align: right;">${item.quantity}</td>
                  <td style="text-align: right;">${formatCurrency(item.unit_price, data.currency)}</td>
                  <td style="text-align: right;">${formatCurrency(item.total, data.currency)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Total</span>
              <span class="total-value" style="font-size: 18px;">${formatCurrency(data.total_amount, data.currency)}</span>
            </div>
          </div>

          <div class="footer-row">
            <div class="footer-text">
               Merci pour votre confiance.<br/>
               Généré par QuickBill.
            </div>
            <div class="qr-container">
               <img src="${qrCodeImage}" width="100" height="100" />
               <div style="font-size: 10px; color: #94a3b8; margin-top: 5px;">SCANNEZ POUR PAYER</div>
            </div>
          </div>
        </body>
      </html>
    `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error('PDF generation error:', error);
        }
    };

    const statusColors = {
        paid: 'bg-green-100 text-green-800 border-green-200',
        draft: 'bg-gray-100 text-gray-800 border-gray-200',
        sent: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        overdue: 'bg-red-100 text-red-800 border-red-200',
    };

    const qrCodeContent = data.public_link_token
        ? `https://quickbill.app/public/invoice/${data.public_link_token}`
        : `PAY|${data.total_amount}|${data.currency}|REF:${data.invoice_number}`;

    return (
        <View className="flex-1 bg-gray-50 max-w-4xl mx-auto w-full shadow-lg rounded-xl overflow-hidden my-4 md:my-10">
            {/* HEADER */}
            <View className="bg-white p-6 md:p-10 border-b border-gray-100 flex-row justify-between items-start">
                <View>
                    {data.profile?.logo_url && (
                        <Image source={{ uri: data.profile.logo_url }} className="w-16 h-16 rounded-lg mb-4" resizeMode="contain" />
                    )}
                    <Text className="text-xl font-bold text-slate-800">{data.profile?.business_name}</Text>
                    <Text className="text-sm text-slate-500 mt-1">{data.profile?.address}</Text>
                    <Text className="text-sm text-slate-500">{data.profile?.phone_number}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-sm text-slate-400 font-medium tracking-widest uppercase">Facture</Text>
                    <Text className="text-2xl font-bold text-slate-800 mt-1">#{data.invoice_number}</Text>
                    <View className={`mt-3 px-3 py-1 rounded-full border ${statusColors[data.status as keyof typeof statusColors] || statusColors.draft}`}>
                        <Text className={`text-xs font-bold uppercase ${statusColors[data.status as keyof typeof statusColors]?.split(' ')[1]}`}>
                            {data.status}
                        </Text>
                    </View>
                </View>
            </View>

            {/* CLIENT INFO */}
            <View className="bg-white p-6 md:p-10 border-b border-gray-100 flex-row justify-between">
                <View>
                    <Text className="text-xs text-slate-400 uppercase font-bold mb-2">Facturé à</Text>
                    <Text className="text-lg font-semibold text-slate-800">{data.customer?.name}</Text>
                    <Text className="text-slate-500">{data.customer?.email}</Text>
                    <Text className="text-slate-500">{data.customer?.address}</Text>
                </View>
                <View className="text-right">
                    <Text className="text-xs text-slate-400 uppercase font-bold mb-2">Dates</Text>
                    <Text className="text-sm text-slate-600">Émise le: <Text className="font-semibold">{formatDate(data.created_at)}</Text></Text>
                    <Text className="text-sm text-slate-600">À régler avant: <Text className="font-semibold">{formatDate(data.due_date)}</Text></Text>
                </View>
            </View>

            {/* ITEMS */}
            <View className="bg-white p-6 md:p-10 min-h-[300px]">
                {/* Table Header */}
                <View className="flex-row border-b border-gray-100 pb-3 mb-3">
                    <Text className="flex-[3] text-xs font-bold text-slate-400 uppercase">Description</Text>
                    <Text className="flex-1 text-xs font-bold text-slate-400 uppercase text-right">Qté</Text>
                    <Text className="flex-1 text-xs font-bold text-slate-400 uppercase text-right">Prix</Text>
                    <Text className="flex-1 text-xs font-bold text-slate-400 uppercase text-right">Total</Text>
                </View>

                {/* Rows */}
                {data.items.map((item, index) => (
                    <View key={index} className="flex-row py-3 border-b border-gray-50 last:border-0">
                        <Text className="flex-[3] text-sm text-slate-700">{item.description}</Text>
                        <Text className="flex-1 text-sm text-slate-600 text-right">{item.quantity}</Text>
                        <Text className="flex-1 text-sm text-slate-600 text-right">{formatCurrency(item.unit_price, data.currency)}</Text>
                        <Text className="flex-1 text-sm font-semibold text-slate-800 text-right">{formatCurrency(item.total, data.currency)}</Text>
                    </View>
                ))}

                {/* TOTAL SECTION */}
                <View className="bg-white p-6 md:p-10 border-t border-gray-100 flex-row justify-between items-center">
                    {/* QR Code Section */}
                    <View className="hidden md:flex">
                        <InvoiceQRCode
                            invoiceId={data.id}
                            totalAmount={data.total_amount}
                            token={data.public_link_token}
                            currency={data.currency}
                            size={100}
                            showLogo={false}
                        />
                    </View>

                    <View className="w-full md:w-1/3">
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-slate-500">Sous-total</Text>
                            <Text className="text-slate-800 font-medium">{formatCurrency(data.total_amount, data.currency)}</Text>
                        </View>
                        <View className="flex-row justify-between pt-4 border-t border-slate-100">
                            <Text className="text-slate-800 font-bold text-lg">Total</Text>
                            <Text className="text-2xl font-bold text-slate-900">{formatCurrency(data.total_amount, data.currency)}</Text>
                        </View>
                    </View>
                </View>          </View>

            {/* ACTIONS FOOTER */}
            <View className="bg-slate-50 p-6 flex-col md:flex-row gap-4 items-center justify-between border-t border-gray-200">
                <TouchableOpacity
                    onPress={handleDownloadPDF}
                    className="bg-white border border-slate-300 px-6 py-3 rounded-lg flex-row items-center justify-center w-full md:w-auto"
                >
                    <Text className="text-slate-700 font-semibold">📄 Télécharger PDF</Text>
                </TouchableOpacity>

                {data.status !== 'paid' && (
                    <TouchableOpacity
                        className="bg-indigo-600 px-8 py-3 rounded-lg flex-row items-center justify-center shadow-lg shadow-indigo-200 w-full md:w-auto"
                        onPress={() => alert('Module de paiement Mobile Money en cours...')}
                    >
                        <Text className="text-white font-bold">💳 Payer maintenant</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default InvoiceViewer;
