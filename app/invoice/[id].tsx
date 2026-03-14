import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2, CheckCircle, Clock, MessageCircle, Globe, Wallet, Copy, Send, AlertCircle, MoreHorizontal, MessageSquare } from 'lucide-react-native';
import { Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

import { useAuth } from '../../context/AuthContext';
import { useTeamRole } from '../../hooks/useTeamRole';
import { useInvoiceDetails } from '../../hooks/useInvoiceDetails';
import { generateInvoiceHTML } from '../../lib/generate-html';
import { generateWhatsAppLink } from '../../lib/whatsappService';
import { showError } from '../../lib/error-handler';
import { useLanguage } from '../../context/LanguageContext';
import QRCode from 'qrcode';
import ChatModal from '../../components/ChatModal';
import { InvoiceDetailSkeleton } from '../../components/InvoiceDetailSkeleton';

export default function InvoiceDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { invoice, loading, updating, toggleStatus } = useInvoiceDetails(id as string);
    const { profile, refreshProfile } = useAuth();
    const { role, isOwner, isAdmin } = useTeamRole();
    const [sharing, setSharing] = useState(false);
    const [chatVisible, setChatVisible] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { t, language } = useLanguage();

    const { chat } = useLocalSearchParams();

    useEffect(() => {
        if (chat === 'true') {
            setChatVisible(true);
        }
    }, [chat]);

    const fetchUnreadCount = async () => {
        if (!id) return;
        const { count, error } = await supabase
            .from('invoice_messages')
            .select('*', { count: 'exact', head: true })
            .eq('invoice_id', id)
            .eq('sender_type', 'client')
            .is('read_at', null);

        if (!error) setUnreadCount(count || 0);
    };

    useEffect(() => {
        fetchUnreadCount();

        // Subscription for real-time unread updates on this invoice
        const channel = supabase
            .channel(`unread:${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'invoice_messages',
                filter: `invoice_id=eq.${id}`
            }, () => {
                fetchUnreadCount();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [id]);

    const handleShare = async () => {
        if (!invoice) return;

        if (!profile || !profile.business_name) {
            await refreshProfile();
            Alert.alert(
                t('invoice_details.profile_required'),
                t('invoice_details.profile_required_msg')
            );
            return;
        }

        setSharing(true);
        try {
            const customer = invoice.customer;
            const items = invoice.items || [];

            const invoiceData = {
                title: language === 'fr-FR' ? 'FACTURE' : 'INVOICE',
                invoiceNumber: invoice.invoice_number,
                date: new Date(invoice.created_at).toLocaleDateString(language === 'fr-FR' ? 'fr-FR' : 'en-US'),
                customerName: customer?.name || (language === 'fr-FR' ? 'Client' : 'Customer'),
                businessName: profile.business_name || "Business",
                businessPhone: profile.phone_contact || "",
                currency: profile.currency || "RWF",
                logoUrl: profile?.logo_url || undefined,
                signatureUrl: profile?.signature_url || undefined,
                items: items.map((i) => ({
                    description: i.description,
                    quantity: i.quantity,
                    unitPrice: i.unit_price,
                    total: i.quantity * i.unit_price
                })),
                totalAmount: invoice.total_amount,
                qrCodeUrl: profile.payment_details ? `data:image/svg+xml;utf8,${encodeURIComponent(await QRCode.toString(profile.payment_details, { type: 'svg' }))}` : undefined,
                paymentMethod: profile.payment_method || undefined
            };

            const html = generateInvoiceHTML(invoiceData);
            const { uri } = await Print.printToFileAsync({ html, base64: false });

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    UTI: '.pdf',
                    mimeType: 'application/pdf',
                    dialogTitle: t('invoice_details.share_dialog', { number: invoice.invoice_number })
                });
            } else {
                Alert.alert(t('common.success'), t('invoice_details.pdf_generated', { uri }));
            }
        } catch (error) {
            showError(error);
        } finally {
            setSharing(false);
        }
    };

    const handleWhatsApp = async () => {
        if (!invoice || !profile) return;
        const customer = invoice.customer;

        if (!customer?.phone) {
            Alert.alert(t('invoice_details.missing_info'), t('invoice_details.missing_phone'));
            return;
        }

        const publicUrl = `https://quickbill.app/public/invoice/${invoice.share_token}`;
        
        try {
            const { url, message } = await generateWhatsAppLink({
                phone: customer.phone,
                clientName: customer.name,
                invoiceNumber: invoice.invoice_number,
                amount: invoice.total_amount,
                currency: profile.currency || (language === 'fr-FR' ? 'RWF' : 'USD'),
                publicUrl,
                template: profile.whatsapp_template,
                defaultTemplate: t('invoice_details.whatsapp_template'),
                locale: language
            });

            // Log the message for history
            const { logWhatsAppMessage } = await import('../../lib/whatsappService');
            await logWhatsAppMessage({
                user_id: profile.id,
                invoice_id: invoice.id,
                client_id: customer.id,
                message,
                type: 'invoice_share'
            });

            await Linking.openURL(url);
        } catch (error) {
            Alert.alert(t('common.error'), language === 'fr-FR' ? "Impossible d'ouvrir WhatsApp." : "Could not open WhatsApp.");
        }
    };

    const handleCopyWebLink = async () => {
        if (!invoice?.share_token) {
            Alert.alert(t('common.error'), t('invoice_details.link_unavailable'));
            return;
        }
        const publicUrl = `https://quickbill.app/public/invoice/${invoice.share_token}`;
        await Clipboard.setStringAsync(publicUrl);
        Alert.alert(t('invoice_details.link_copied'), t('invoice_details.link_copied_msg'));
    };

    if (loading || !invoice) {
        return <InvoiceDetailSkeleton />;
    }

    const isPaid = invoice.status === 'PAID';
    const currency = profile?.currency || 'RWF';

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            {/* Header Curve */}
            <LinearGradient
                colors={['#1E40AF', '#1e3a8a']}
                className="absolute top-0 left-0 right-0 h-[180px] rounded-b-[40px]"
            />

            <SafeAreaView className="flex-1">
                {/* Header Content */}
                <View className="flex-row items-center justify-between px-6 py-4 mb-2">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white/20 items-center justify-center rounded-full backdrop-blur-md"
                    >
                        <ArrowLeft size={20} color="white" />
                    </TouchableOpacity>
                    <Text className="text-xl font-black text-white tracking-tight">{t('invoice_details.title')}</Text>

                    {(isAdmin || isOwner) ? (
                        <TouchableOpacity
                            onPress={() => {
                                Alert.alert(t('invoice_details.delete_confirm'), t('invoice_details.delete_msg'), [
                                    { text: t('invoice_details.cancel'), style: "cancel" },
                                    {
                                        text: t('invoice_details.delete'), style: "destructive", onPress: async () => {
                                            const { error } = await supabase.from('invoices').delete().eq('id', id);
                                            if (error) showError(error);
                                            else {
                                                router.replace('/(tabs)/invoices');
                                            }
                                        }
                                    }
                                ]);
                            }}
                            className="w-10 h-10 bg-white/20 items-center justify-center rounded-full backdrop-blur-md"
                        >
                            <MoreHorizontal size={20} color="white" />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 40 }} />
                    )}
                </View>

                <ScrollView
                    className="flex-1 px-6"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Invoice Number & Status */}
                    <View className="items-center mb-6">
                        <Text className="text-white/80 text-sm font-medium uppercase tracking-widest mb-1">{t('invoice_details.invoice_no')}</Text>
                        <Text className="text-white text-2xl font-black tracking-tight">{invoice.invoice_number}</Text>
                    </View>

                    {/* Status Card */}
                    {(invoice.status !== 'PENDING_APPROVAL' && invoice.status !== 'REJECTED') && (
                        <View className="bg-white p-5 rounded-3xl shadow-lg shadow-blue-900/10 mb-6 border border-slate-100">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className={`w-12 h-12 rounded-2xl items-center justify-center ${isPaid ? 'bg-emerald-100' : 'bg-amber-100'} mr-4`}>
                                        {isPaid ? (
                                            <CheckCircle size={24} color="#059669" />
                                        ) : (
                                            <Clock size={24} color="#d97706" />
                                        )}
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                                            {t('invoice_details.payment_status')}
                                        </Text>
                                        <Text className={`text-lg font-bold ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {isPaid ? t('invoice_details.paid') : t('invoice_details.pending')}
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={isPaid}
                                    onValueChange={toggleStatus}
                                    trackColor={{ false: "#fed7aa", true: "#bbf7d0" }}
                                    thumbColor={isPaid ? "#16a34a" : "#ea580c"}
                                    style={{ transform: [{ scale: 0.9 }] }}
                                />
                            </View>
                        </View>
                    )}

                    {/* Approval Workflow Block */}
                    {invoice.status === 'PENDING_APPROVAL' && (isAdmin || isOwner) && (
                        <View className="bg-amber-50 p-5 rounded-3xl border border-amber-100 mb-6">
                            <View className="flex-row items-center mb-3">
                                <AlertCircle size={20} color="#D97706" />
                                <Text className="text-amber-900 font-black text-lg ml-2">{t('invoice_details.approval_required')}</Text>
                            </View>
                            <Text className="text-amber-700/80 text-sm font-medium mb-4">
                                {t('invoice_details.approval_desc')}
                            </Text>
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={async () => {
                                        const { error } = await supabase.from('invoices').update({ status: 'UNPAID' }).eq('id', id);
                                        if (error) showError(error);
                                        else {
                                            Alert.alert(t('common.success'), t('invoice_details.validated_msg'));
                                            router.replace('/(tabs)/invoices');
                                        }
                                    }}
                                    className="flex-1 bg-emerald-500 py-3 rounded-xl items-center shadow-lg shadow-emerald-200"
                                >
                                    <Text className="text-white font-black uppercase tracking-wider text-xs">{t('invoice_details.validate')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={async () => {
                                        const { error } = await supabase.from('invoices').update({ status: 'REJECTED' }).eq('id', id);
                                        if (error) showError(error);
                                        else Alert.alert(t('common.success'), t('invoice_details.rejected_msg'));
                                    }}
                                    className="flex-1 bg-white border border-red-200 py-3 rounded-xl items-center"
                                >
                                    <Text className="text-red-500 font-black uppercase tracking-wider text-xs">{t('invoice_details.reject')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {invoice.status === 'PENDING_APPROVAL' && !isAdmin && !isOwner && (
                        <View className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6 flex-row items-center">
                            <Clock size={20} color="#2563EB" />
                            <Text className="text-blue-800 font-bold ml-3 flex-1">{t('invoice_details.pending_manager')}</Text>
                        </View>
                    )}

                    {/* Main Details Card */}
                    <View className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden mb-6">
                        {/* Client Section */}
                        <View className="p-6 bg-slate-50 border-b border-slate-100">
                            <View className="flex-row justify-between items-start">
                                <View>
                                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t('invoice_details.client')}</Text>
                                    <Text className="text-xl font-bold text-slate-900">{invoice.customer?.name || t('invoice_details.client_unknown')}</Text>
                                    {invoice.customer?.phone && (
                                        <Text className="text-slate-500 text-sm mt-1">{invoice.customer.phone}</Text>
                                    )}
                                </View>
                                <View className="items-end">
                                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t('invoice_details.date')}</Text>
                                    <Text className="text-base font-semibold text-slate-700">
                                        {new Date(invoice.created_at).toLocaleDateString(language === 'fr-FR' ? 'fr-FR' : 'en-US')}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Items List */}
                        <View className="p-6">
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">{t('invoice_details.items')}</Text>
                            {(invoice.items || []).map((item, idx) => (
                                <View key={idx} className="flex-row justify-between items-center mb-4 last:mb-0">
                                    <View className="flex-1 mr-4">
                                        <Text className="text-slate-800 font-semibold text-base mb-0.5">{item.description}</Text>
                                        <Text className="text-slate-400 text-xs">{t('invoice_details.qte')}: {item.quantity} × {item.unit_price.toLocaleString(language === 'fr-FR' ? 'fr-FR' : 'en-US')}</Text>
                                    </View>
                                    <Text className="text-slate-900 font-bold text-base">
                                        {(item.quantity * item.unit_price).toLocaleString(language === 'fr-FR' ? 'fr-FR' : 'en-US')}
                                    </Text>
                                </View>
                            ))}

                            {/* Divider */}
                            <View className="h-px bg-slate-100 my-6" />

                            {/* Total Section */}
                            <View className="flex-row justify-between items-center">
                                <Text className="text-slate-500 font-medium text-lg">{t('invoice_details.total_to_pay')}</Text>
                                <View className="items-end">
                                    <Text className="text-3xl font-black text-primary">
                                        {invoice.total_amount.toLocaleString(language === 'fr-FR' ? 'fr-FR' : 'en-US')}
                                    </Text>
                                    <Text className="text-slate-400 text-sm font-semibold">{currency}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* WhatsApp History Section */}
                    <View className="bg-white rounded-3xl p-6 shadow-sm mb-6 border border-slate-100">
                        <View className="flex-row items-center mb-4">
                            <View className="w-8 h-8 bg-emerald-100 rounded-lg items-center justify-center mr-3">
                                <MessageSquare size={16} color="#059669" />
                            </View>
                            <Text className="text-slate-800 font-bold text-base">{t('invoice_details.whatsapp_history')}</Text>
                        </View>

                        {(invoice as any).whatsapp_history && (invoice as any).whatsapp_history.length > 0 ? (
                            (invoice as any).whatsapp_history.map((msg: any, idx: number) => (
                                <View key={msg.id || idx} className={`p-4 rounded-2xl bg-slate-50 mb-3 last:mb-0 border border-slate-100 ${language === 'ar-SA' ? 'items-end' : 'items-start'}`}>
                                    <Text className={`text-slate-700 text-xs font-medium mb-2 ${language === 'ar-SA' ? 'text-right' : 'text-left'}`}>
                                        {msg.message}
                                    </Text>
                                    <View className="flex-row justify-between w-full mt-1">
                                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                            {msg.type === 'reminder' ? '📅 RAPPEL' : '📤 ENVOI'}
                                        </Text>
                                        <Text className="text-slate-400 text-[10px] font-medium">
                                            {new Date(msg.created_at).toLocaleString(language === 'fr-FR' ? 'fr-FR' : 'en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View className="items-center py-6">
                                <Text className="text-slate-400 text-sm font-medium italic">{t('invoice_details.no_history')}</Text>
                            </View>
                        )}
                    </View>

                </ScrollView>
            </SafeAreaView>

            {/* Bottom Action Bar */}
            <View className="absolute bottom-0 left-0 right-0 bg-white p-5 pt-4 pb-8 border-t border-slate-100 rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={handleWhatsApp}
                        className="w-12 h-14 bg-emerald-500 rounded-2xl items-center justify-center shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
                    >
                        <Send size={20} color="white" strokeWidth={2.5} className="-ml-0.5 mt-0.5" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setChatVisible(true)}
                        className="w-12 h-14 bg-violet-600 rounded-2xl items-center justify-center shadow-lg shadow-violet-200 active:scale-95 transition-transform relative"
                    >
                        <MessageCircle size={20} color="white" strokeWidth={2.5} />
                        {unreadCount > 0 && (
                            <View className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full items-center justify-center border-2 border-violet-600">
                                <Text className="text-white text-[8px] font-bold">{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleCopyWebLink}
                        className="w-12 h-14 bg-blue-500 rounded-2xl items-center justify-center shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                    >
                        <Globe size={20} color="white" strokeWidth={2.5} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleShare}
                        disabled={sharing}
                        className="flex-1 bg-slate-900 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-slate-300 active:scale-95 transition-transform"
                    >
                        {sharing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Share2 size={20} color="white" strokeWidth={2.5} className="mr-2" />
                                <Text className="text-white font-bold text-base tracking-wide">PDF</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ChatModal
                invoiceId={id as string}
                visible={chatVisible}
                onClose={() => setChatVisible(false)}
            />
        </View>
    );
}
