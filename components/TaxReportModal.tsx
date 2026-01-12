import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FileText, Download, X, Calendar } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateTaxReport, TaxReportSummary } from '../lib/taxService';
import { useAuth } from '../context/AuthContext';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function TaxReportModal({ visible, onClose }: Props) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<TaxReportSummary | null>(null);

    const handleGenerate = async () => {
        if (!profile) return;
        setLoading(true);
        try {
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Generate for current month
            const data = await generateTaxReport(profile.id, firstDayOfMonth, now, profile.country);
            setReport(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        if (!report || !profile) return;

        const html = `
            <html>
            <head>
                <style>
                    body { font-family: Helvetica, Arial, sans-serif; padding: 40px; }
                    h1 { color: #1e3a8a; }
                    .header { margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                    .summary-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                    .label { font-weight: bold; color: #64748b; }
                    .value { font-weight: bold; font-size: 1.2em; }
                    .footer { margin-top: 50px; font-size: 0.8em; color: #94a3b8; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Rapport Fiscal Mensuel</h1>
                    <p>Entreprise: ${profile.business_name || 'N/A'}</p>
                    <p>NIF/TIN: ${profile.tax_id || 'Non Renseigné'}</p>
                    <p>Période: ${report.period.start.toLocaleDateString()} - ${report.period.end.toLocaleDateString()}</p>
                </div>

                <div class="summary-box">
                    <div class="row">
                        <span class="label">Chiffre d'Affaires (TTC)</span>
                        <span class="value">${report.totalRevenue.toLocaleString()} ${profile.currency || 'RWF'}</span>
                    </div>
                    <div class="row">
                        <span class="label">Montant Net (HT)</span>
                        <span class="value">${report.netAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${profile.currency || 'RWF'}</span>
                    </div>
                    <div class="row">
                        <span class="label">TVA Collectée (${report.jurisdiction === 'RW' ? '18%' : 'Standard'})</span>
                        <span class="value" style="color: #dc2626;">${report.totalVAT.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${profile.currency || 'RWF'}</span>
                    </div>
                     <div class="row">
                        <span class="label">Factures Émises</span>
                        <span class="value">${report.invoiceCount}</span>
                    </div>
                </div>

                <p>Ce document est généré automatiquement par QuickBill pour faciliter vos déclarations RRA/DGI.</p>
                
                <div class="footer">
                    Généré le ${new Date().toLocaleString()} • QuickBill Compliance Module
                </div>
            </body>
            </html>
        `;

        const { uri } = await Print.printToFileAsync({ html, base64: false });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Rapport Fiscal' });
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl p-6 h-[60%]">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-slate-900">Conformité Fiscale</Text>
                        <TouchableOpacity onPress={onClose}><X size={24} color="#64748B" /></TouchableOpacity>
                    </View>

                    {!report ? (
                        <View className="flex-1 justify-center items-center">
                            <Text className="text-slate-500 text-center mb-6 px-8">
                                Générez un rapport de TVA estimatif pour vos déclarations (RRA / DGI).
                            </Text>
                            <TouchableOpacity
                                onPress={handleGenerate}
                                disabled={loading}
                                className="bg-blue-600 px-8 py-4 rounded-xl flex-row items-center"
                            >
                                {loading ? <ActivityIndicator color="white" /> : (
                                    <>
                                        <Calendar color="white" size={20} className="mr-2" />
                                        <Text className="text-white font-bold text-lg">Générer Rapport Mensuel</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="flex-1">
                            <View className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
                                <Text className="text-slate-500 text-sm mb-1">TVA à Déclarer (Estimation)</Text>
                                <Text className="text-3xl font-black text-slate-900">{report.totalVAT.toLocaleString(undefined, { maximumFractionDigits: 0 })} <Text className="text-base text-slate-500">{profile?.currency}</Text></Text>
                            </View>

                            <View className="flex-row justify-between mb-2">
                                <Text className="text-slate-500">Total TTC</Text>
                                <Text className="font-bold text-slate-900">{report.totalRevenue.toLocaleString()}</Text>
                            </View>
                            <View className="flex-row justify-between mb-8">
                                <Text className="text-slate-500">Base Imposable (HT)</Text>
                                <Text className="font-bold text-slate-900">{report.netAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
                            </View>

                            <TouchableOpacity
                                onPress={handleExportPDF}
                                className="bg-slate-900 w-full py-4 rounded-xl flex-row justify-center items-center"
                            >
                                <Download color="white" size={20} className="mr-2" />
                                <Text className="text-white font-bold text-lg">Exporter PDF (Officiel)</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}
