import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal, TextInput as RNTextInput, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Plus,
    Lock,
    Wifi,
    Landmark,
    MoreVertical,
    ChevronRight,
    CheckCircle,
    RefreshCw,
    Receipt,
    Wallet,
    ShieldCheck,
    CreditCard
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../../hooks/useProfile';
import { showSuccess, showError } from '../../lib/error-handler';
import { useLanguage } from '../../context/LanguageContext';

export default function PaymentMethodsScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const { profile, loading: profileLoading, fetchProfile, updateProfile } = useProfile();
    const [autoInvoicing, setAutoInvoicing] = useState(true);
    const [currency, setCurrency] = useState('USD ($)');
    const [isConnectingStripe, setIsConnectingStripe] = useState(false);

    const [savedCards, setSavedCards] = useState<any[]>([]);

    React.useEffect(() => {
        fetchProfile();
        // Simulation de chargement de cartes depuis Supabase/Profile
        setSavedCards([
            { id: '1', number: '4242', name: 'ALEX STERLING', expiry: '09/28', type: 'Business Platinum' }
        ]);
    }, []);

    React.useEffect(() => {
        if (profile?.currency) {
            setCurrency(profile.currency);
        }
    }, [profile]);

    const currencies = [
        { label: 'Dollar US ($)', value: 'USD ($)' },
        { label: 'Euro (€)', value: 'EUR (€)' },
        { label: 'Franc CFA (XOF)', value: 'XOF (CFA)' },
        { label: 'Franc Guinéen (GNF)', value: 'GNF (FG)' },
        { label: 'Livre Sterling (£)', value: 'GBP (£)' }
    ];

    const [activeModal, setActiveModal] = useState<'card' | 'bank' | 'mobile' | null>(null);
    const [countrySelectorVisible, setCountrySelectorVisible] = useState(false);
    const [newCard, setNewCard] = useState({ number: '', name: '', expiry: '' });
    const [newBank, setNewBank] = useState({ name: '', iban: '' });
    const [newMobile, setNewMobile] = useState({ operator: '', phone: '', countryCode: '+224', placeholder: '622 00 00 00' });

    const africanCountries = [
        { label: 'Guinée', code: 'GN', dial: '+224', placeholder: '622 00 00 00' },
        { label: 'Sénégal', code: 'SN', dial: '+221', placeholder: '77 000 00 00' },
        { label: 'Côte d\'Ivoire', code: 'CI', dial: '+225', placeholder: '07 00 00 00 00' },
        { label: 'Mali', code: 'ML', dial: '+223', placeholder: '70 00 00 00' },
        { label: 'Rwanda', code: 'RW', dial: '+250', placeholder: '780 000 000' },
        { label: 'Bénin', code: 'BJ', dial: '+229', placeholder: '90 00 00 00' },
        { label: 'Burkina Faso', code: 'BF', dial: '+226', placeholder: '70 00 00 00' },
        { label: 'Cameroun', code: 'CM', dial: '+237', placeholder: '6 00 00 00 00' },
        { label: 'Gabon', code: 'GA', dial: '+241', placeholder: '06 00 00 00' },
        { label: 'Niger', code: 'NE', dial: '+227', placeholder: '90 00 00 00' },
        { label: 'Togo', code: 'TG', dial: '+228', placeholder: '90 00 00 00' },
        { label: 'RD Congo', code: 'CD', dial: '+243', placeholder: '810 000 000' },
        { label: 'Congo-Brazzaville', code: 'CG', dial: '+242', placeholder: '06 000 0000' },
        { label: 'Mauritanie', code: 'MR', dial: '+222', placeholder: '45 00 00 00' },
        { label: 'Maroc', code: 'MA', dial: '+212', placeholder: '6 00 00 00 00' },
        { label: 'Algérie', code: 'DZ', dial: '+213', placeholder: '5 00 00 00 00' },
        { label: 'Tunisie', code: 'TN', dial: '+216', placeholder: '20 000 000' },
        { label: 'Ghana', code: 'GH', dial: '+233', placeholder: '20 000 0000' },
        { label: 'Nigéria', code: 'NG', dial: '+234', placeholder: '803 000 0000' },
        { label: 'Kenya', code: 'KE', dial: '+254', placeholder: '700 000000' },
        { label: 'Tanzanie', code: 'TZ', dial: '+255', placeholder: '600 000 000' },
        { label: 'Ouganda', code: 'UG', dial: '+256', placeholder: '700 000000' },
        { label: 'Ethiopie', code: 'ET', dial: '+251', placeholder: '90 000 0000' },
        { label: 'Afrique du Sud', code: 'ZA', dial: '+27', placeholder: '012 345 6789' },
        { label: 'Angola', code: 'AO', dial: '+244', placeholder: '900 000 000' },
        { label: 'Mozambique', code: 'MZ', dial: '+258', placeholder: '80 000 0000' },
        { label: 'Botswana', code: 'BW', dial: '+267', placeholder: '71 000 000' },
        { label: 'Namibie', code: 'NA', dial: '+264', placeholder: '81 000 0000' },
        { label: 'Malawi', code: 'MW', dial: '+265', placeholder: '1 000 000' },
        { label: 'Zambie', code: 'ZM', dial: '+260', placeholder: '95 000 0000' },
        { label: 'Zimbabwe', code: 'ZW', dial: '+263', placeholder: '71 000 0000' },
        { label: 'Madagascar', code: 'MG', dial: '+261', placeholder: '32 00 000 00' },
        { label: 'Tchad', code: 'TD', dial: '+235', placeholder: '66 00 00 00' },
        { label: 'République Centrafricaine', code: 'CF', dial: '+236', placeholder: '70 00 00 00' },
        { label: 'Soudan', code: 'SD', dial: '+249', placeholder: '90 000 0000' },
        { label: 'Soudan du Sud', code: 'SS', dial: '+211', placeholder: '91 000 0000' },
        { label: 'Somalie', code: 'SO', dial: '+252', placeholder: '61 000 000' },
        { label: 'Djibouti', code: 'DJ', dial: '+253', placeholder: '77 00 00 00' },
        { label: 'Burundi', code: 'BI', dial: '+257', placeholder: '79 00 00 00' },
        { label: 'Sierra Leone', code: 'SL', dial: '+232', placeholder: '76 000 000' },
        { label: 'Libéria', code: 'LR', dial: '+231', placeholder: '77 000 000' },
        { label: 'Gambie', code: 'GM', dial: '+220', placeholder: '900 0000' },
        { label: 'Guinée-Bissau', code: 'GW', dial: '+245', placeholder: '950 00 00' },
        { label: 'Guinée Équatoriale', code: 'GQ', dial: '+240', placeholder: '222 000 000' },
        { label: 'Cabo Verde', code: 'CV', dial: '+238', placeholder: '900 00 00' },
        { label: 'Comores', code: 'KM', dial: '+269', placeholder: '320 00 00' },
        { label: 'Maurice', code: 'MU', dial: '+230', placeholder: '500 0000' },
        { label: 'Seychelles', code: 'SC', dial: '+248', placeholder: '2 000 000' }
    ].sort((a, b) => a.label.localeCompare(b.label));

    const handleCountryCodeChange = () => {
        setCountrySelectorVisible(true);
    };

    const handleOperatorChange = () => {
        const operators = ['Orange Money', 'MTN Mobile Money', 'Airtel Money', 'M-Pesa', 'Wave', 'Moov Money'];
        Alert.alert(
            t('payment.mobile.operator_label'),
            t('payment.mobile.operator_placeholder'),
            operators.map(op => ({
                text: op,
                onPress: () => setNewMobile({ ...newMobile, operator: op })
            }))
        );
    };

    const handleCurrencyChange = () => {
        Alert.alert(
            t('payment.currency.title'),
            t('payment.currency.desc'),
            currencies.map(c => ({
                text: c.label,
                onPress: () => setCurrency(c.value)
            }))
        );
    };

    const handleAddMethod = () => {
        Alert.alert(
            t('payment.new_method_title'),
            t('payment.new_method_desc'),
            [
                { text: t('payment.add_card'), onPress: () => setActiveModal('card') },
                { text: t('payment.add_bank'), onPress: () => setActiveModal('bank') },
                { text: t('payment.add_mobile'), onPress: () => setActiveModal('mobile') },
                { text: t('common.cancel'), style: "cancel" }
            ]
        );
    };

    const handleSaveNewMethod = () => {
        if (activeModal === 'card') {
            if (!newCard.number || !newCard.expiry) {
                Alert.alert(t('common.error'), t('payment.card.error_info'));
                return;
            }
            const cardToAdd = {
                id: Math.random().toString(),
                number: newCard.number.slice(-4),
                name: newCard.name.toUpperCase() || 'TITULAIRE',
                expiry: newCard.expiry,
                type: t('payment.card.type')
            };
            setSavedCards([...savedCards, cardToAdd]);
            showSuccess(t('payment.card.success'));
            setNewCard({ number: '', name: '', expiry: '' });
        } else {
            showSuccess(t('payment.save_success'));
        }
        setActiveModal(null);
    };

    const handleDeleteCard = (id: string) => {
        Alert.alert(
            t('payment.card.delete_title'),
            t('payment.card.delete_desc'),
            [
                { text: t('common.cancel'), style: "cancel" },
                { 
                    text: t('invoice_details.delete'), 
                    style: "destructive", 
                    onPress: () => {
                        setSavedCards(savedCards.filter(c => c.id !== id));
                        showSuccess(t('payment.card.removed'));
                    }
                }
            ]
        );
    };

    const handleStripePress = async () => {
        if (profile?.stripe_connected) {
            Alert.alert(
                t('payment.stripe.manage'),
                t('payment.stripe.connected_msg'),
                [
                    { text: t('payment.stripe.disconnect'), style: "destructive", onPress: handleDisconnectStripe },
                    { text: t('payment.stripe.dashboard'), onPress: () => Alert.alert(t('payment.stripe.dashboard'), t('payment.stripe.dashboard_opening')) },
                    { text: t('invoice_details.cancel'), style: "cancel" }
                ]
            );
        } else {
            Alert.alert(
                t('payment.stripe.connect_title'),
                t('payment.stripe.connect_desc'),
                [
                    { text: t('payment.stripe.connect_now'), onPress: handleConnectStripe },
                    { text: t('payment.stripe.later'), style: "cancel" }
                ]
            );
        }
    };

    const handleConnectStripe = async () => {
        setIsConnectingStripe(true);
        // Simulation d'une redirection OAuth / Connection flow
        setTimeout(async () => {
            try {
                const { error } = await updateProfile({
                    stripe_connected: true,
                    stripe_account_id: 'acct_' + Math.random().toString(36).substr(2, 9)
                });

                if (error) throw error;
                showSuccess(t('payment.stripe.success'));
            } catch (err) {
                showError(err, t('payment.stripe.error_connect'));
            } finally {
                setIsConnectingStripe(false);
            }
        }, 2000);
    };

    const handleDisconnectStripe = async () => {
        Alert.alert(
            t('payment.stripe.disconnect_confirm'),
            t('payment.stripe.disconnect_desc'),
            [
                { text: t('common.cancel'), style: "cancel" },
                { 
                    text: t('payment.stripe.disconnect'), 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            const { error } = await updateProfile({
                                stripe_connected: false,
                                stripe_account_id: null
                            });
                            if (error) throw error;
                            showSuccess(t('payment.stripe.disconnected_msg'));
                        } catch (err) {
                            showError(err, t('payment.stripe.error_disconnect'));
                        }
                    } 
                }
            ]
        );
    };

    const SectionHeader = ({ title, extra }: { title: string, extra?: React.ReactNode }) => (
        <View className="flex-row items-center justify-between mt-8 mb-3 px-1">
            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-[1.5px]">{title}</Text>
            {extra}
        </View>
    );

    const ServiceItem = ({ icon: Icon, iconBg, iconColor, name, details, connected = false, isLast = false, onPress }: any) => (
        <TouchableOpacity 
            onPress={onPress}
            activeOpacity={0.7}
            className={`flex-row items-center justify-between py-4 bg-white px-5 ${!isLast ? 'border-b border-slate-50' : ''}`}
        >
            <View className="flex-row items-center flex-1">
                <View className={`w-9 h-9 rounded-xl items-center justify-center mr-4 ${iconBg}`}>
                    {typeof Icon === 'string' ? (
                        <Text className={`text-base font-black ${iconColor}`}>{Icon}</Text>
                    ) : (
                        <Icon size={18} color={iconColor} strokeWidth={2.5} /> 
                    )}
                </View>
                <View>
                    <Text className="text-slate-900 font-extrabold text-[14px] tracking-tight">{name}</Text>
                    <Text className="text-slate-400 text-[10px] font-medium mt-0.5">{details}</Text>
                </View>
            </View>
            <View className="flex-row items-center">
                {connected ? (
                    <View className="bg-emerald-50 px-2 py-1 rounded-lg flex-row items-center mr-2">
                        <CheckCircle size={10} color="#059669" strokeWidth={3} />
                        <Text className="text-emerald-600 text-[9px] font-black ml-1 uppercase">Actif</Text>
                    </View>
                ) : (
                    <Text className="text-slate-300 text-[9px] font-black mr-2 uppercase">Connecter</Text>
                )}
                <ChevronRight size={16} color="#CBD5E1" strokeWidth={3} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-[#F9FAFC]">
            <StatusBar style="dark" />
            
            {/* Background Gradient */}
            <View className="absolute top-0 left-0 right-0 h-[35%]">
                <LinearGradient
                    colors={['#F0F4FF', '#F8FAFC', '#ffffff']}
                    className="flex-1"
                />
            </View>

            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
                    <TouchableOpacity 
                        onPress={() => router.back()} 
                        className="bg-white w-10 h-10 rounded-[16px] items-center justify-center shadow-lg shadow-indigo-100/50 border border-white"
                    >
                        <ChevronLeft size={20} color="#1337ec" strokeWidth={3} className="-ml-0.5" />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-[16px] font-black text-slate-900 tracking-tight">{t('payment.title')}</Text>
                        <View className="h-0.5 w-6 bg-blue-600 rounded-full mt-1" />
                    </View>
                    <TouchableOpacity 
                        onPress={handleAddMethod}
                        className="bg-white w-10 h-10 rounded-[16px] items-center justify-center shadow-lg shadow-indigo-100/50 border border-white"
                    >
                        <Plus size={20} color="#1337ec" strokeWidth={3} />
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    className="flex-1 px-6" 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    {/* Security Badge */}
                    <View className="flex-row items-center justify-center bg-blue-50/50 border border-blue-100/50 rounded-2xl py-3 px-4 mt-2">
                        <ShieldCheck size={16} color="#2563EB" strokeWidth={2.5} />
                        <Text className="text-blue-700 text-[10px] font-black ml-2 uppercase tracking-wider">{t('payment.security_badge')}</Text>
                    </View>

                    {/* SAVED CARDS */}
                    <SectionHeader
                        title={t('payment.sections.your_cards')}
                        extra={
                            <View className="flex-row items-center">
                                <Lock size={10} color="#10B981" style={{ marginRight: 4 }} />
                                <Text className="text-emerald-500 text-[9px] font-black uppercase tracking-wider">{t('business_profile.identity_verified').split(' & ')[1]}</Text>
                            </View>
                        }
                    />

                    {/* Dynamic Cards Display */}
                    {savedCards.map((card) => (
                        <TouchableOpacity 
                            key={card.id}
                            activeOpacity={0.9} 
                            onPress={() => Alert.alert(
                                card.name, 
                                t('payment.card.desc', { number: card.number }),
                                [
                                    { text: t('invoice_details.delete'), style: "destructive", onPress: () => handleDeleteCard(card.id) },
                                    { text: t('invoice_details.cancel'), style: "cancel" }
                                ]
                            )}
                        >
                            <LinearGradient
                                colors={card.id === '1' ? ['#1e1b4b', '#312e81'] : ['#475569', '#1e293b']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="rounded-[28px] p-6 mb-4 h-52 justify-between shadow-2xl relative overflow-hidden"
                            >
                                <View className="absolute top-[-20] right-[-20] w-40 h-40 bg-white/5 rounded-full" />
                                
                                <View className="flex-row justify-between items-start z-10">
                                    <View>
                                        <Text className="text-white/60 text-[9px] font-black tracking-[2px] uppercase mb-1">{card.type}</Text>
                                        <Wifi size={20} color="white" strokeWidth={2} style={{ opacity: 0.8 }} />
                                    </View>
                                    <View className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                                        <Text className="text-white font-black text-[14px] italic tracking-tighter">{t('payment.card.visa')}</Text>
                                    </View>
                                </View>

                                <View className="z-10">
                                    <Text className="text-white text-xl font-mono tracking-[4px] mb-1">•••• •••• •••• {card.number}</Text>
                                </View>

                                <View className="flex-row justify-between items-end z-10">
                                    <View>
                                        <Text className="text-white/50 text-[8px] font-black uppercase mb-1">{t('payment.card.holder')}</Text>
                                        <Text className="text-white font-bold text-xs tracking-wide">{card.name}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-white/50 text-[8px] font-black uppercase mb-1">{t('payment.card.expiry')}</Text>
                                        <Text className="text-white font-bold text-xs tracking-wide">{card.expiry}</Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}

                    {/* Bank Account */}
                    <TouchableOpacity 
                        activeOpacity={0.7}
                        className="bg-white rounded-[22px] p-4 flex-row items-center shadow-sm shadow-indigo-100/50 border border-slate-50 mb-6"
                    >
                        <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-4">
                            <Landmark size={20} color="#475569" strokeWidth={2} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-900 font-extrabold text-sm tracking-tight">Chase Business Checking</Text>
                            <Text className="text-slate-400 text-[10px] font-medium mt-0.5">Compte principal •••• 8839</Text>
                        </View>
                        <View className="bg-blue-50 px-2 py-1 rounded-lg">
                            <Text className="text-blue-600 text-[8px] font-black uppercase">{t('payment.bank.primary')}</Text>
                        </View>
                        <TouchableOpacity className="ml-3 p-1">
                            <MoreVertical size={16} color="#CBD5E1" />
                        </TouchableOpacity>
                    </TouchableOpacity>

                    {/* PAYMENT SERVICES */}
                    <SectionHeader title={t('payment.sections.payment_services')} />

                    <View className="bg-white rounded-[24px] overflow-hidden shadow-sm shadow-indigo-100/50 border border-slate-50 mb-6">
                        <ServiceItem
                            icon="S"
                            iconBg="bg-indigo-50"
                            iconColor="#4F46E5"
                            name="Stripe"
                            details={profile?.stripe_connected ? `${t('payment.status.active')} • ${profile.stripe_account_id}` : t('payment.stripe.accept_cards')}
                            connected={profile?.stripe_connected}
                            onPress={handleStripePress}
                        />
                        {isConnectingStripe && (
                            <View className="absolute inset-0 bg-white/80 items-center justify-center">
                                <ActivityIndicator size="small" color="#4F46E5" />
                                <Text className="text-[10px] font-black text-indigo-600 mt-2 uppercase tracking-widest">{t('payment.stripe.connecting')}</Text>
                            </View>
                        )}
                        <ServiceItem
                            icon="P"
                            iconBg="bg-blue-50"
                            iconColor="#2563EB"
                            name="PayPal"
                            details={t('payment.paypal.manual_config')}
                            connected={false}
                            isLast={true}
                            onPress={() => Alert.alert("PayPal", t('payment.paypal.desc'))}
                        />
                    </View>

                    {/* PREFERENCES */}
                    <SectionHeader title={t('payment.sections.preferences')} />

                    <View className="bg-white rounded-[24px] overflow-hidden shadow-sm shadow-indigo-100/50 border border-slate-50 mb-8">
                        <TouchableOpacity 
                            onPress={handleCurrencyChange}
                            className="flex-row items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50"
                        >
                            <View className="flex-row items-center">
                                <View className="w-9 h-9 rounded-xl bg-slate-50 items-center justify-center mr-4">
                                    <Wallet size={18} color="#475569" strokeWidth={2} />
                                </View>
                                <Text className="text-slate-900 font-extrabold text-sm tracking-tight">{t('payment.currency.title')}</Text>
                            </View>
                            <View className="flex-row items-center">
                                <Text className="text-slate-500 font-bold text-[13px] mr-2">{currency}</Text>
                                <ChevronRight size={16} color="#CBD5E1" strokeWidth={3} />
                            </View>
                        </TouchableOpacity>

                        <View className="flex-row items-center justify-between p-4">
                            <View className="flex-row items-center">
                                <View className="w-9 h-9 rounded-xl bg-slate-50 items-center justify-center mr-4">
                                    <Receipt size={18} color="#475569" strokeWidth={2} />
                                </View>
                                <Text className="text-slate-900 font-extrabold text-sm tracking-tight">{t('payment.auto_invoicing')}</Text>
                            </View>
                            <Switch
                                value={autoInvoicing}
                                onValueChange={setAutoInvoicing}
                                trackColor={{ false: "#E2E8F0", true: "#1337ec" }}
                                thumbColor={"#FFFFFF"}
                                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                            />
                        </View>
                    </View>

                    {/* Info Note */}
                    <View className="items-center mb-10 px-4">
                        <Text className="text-slate-400 text-[10px] text-center leading-4 font-medium">
                            {t('payment.security_note')}
                        </Text>
                    </View>

                </ScrollView>
            </SafeAreaView>

            {/* Add Payment Method Modals */}
            <Modal
                visible={!!activeModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setActiveModal(null)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-[32px] p-8 pb-12 shadow-2xl">
                        <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mb-6" />
                        
                        <Text className="text-xl font-black text-slate-900 mb-6">
                            {activeModal === 'card' ? t('payment.card.title') : 
                             activeModal === 'bank' ? t('payment.bank.title') : t('payment.mobile.title')}
                        </Text>

                        {activeModal === 'card' && (
                            <View className="space-y-4">
                                <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('payment.card.name_label')}</Text>
                                    <RNTextInput 
                                        className="text-base font-bold text-slate-900" 
                                        placeholder={t('payment.card.name_placeholder')} 
                                        value={newCard.name}
                                        onChangeText={(text) => setNewCard({...newCard, name: text})}
                                    />
                                </View>
                                <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('payment.card.number_label')}</Text>
                                    <RNTextInput 
                                        className="text-base font-bold text-slate-900" 
                                        placeholder={t('payment.card.number_placeholder')} 
                                        keyboardType="numeric" 
                                        value={newCard.number}
                                        onChangeText={(text) => setNewCard({...newCard, number: text})}
                                    />
                                </View>
                                <View className="flex-row mb-4">
                                    <View className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 mr-4">
                                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('payment.card.expiry_label')}</Text>
                                        <RNTextInput 
                                            className="text-base font-bold text-slate-900" 
                                            placeholder="MM/YY" 
                                            value={newCard.expiry}
                                            onChangeText={(text) => setNewCard({...newCard, expiry: text})}
                                        />
                                    </View>
                                    <View className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('payment.card.cvc_label')}</Text>
                                        <RNTextInput className="text-base font-bold text-slate-900" placeholder="123" keyboardType="numeric" />
                                    </View>
                                </View>
                            </View>
                        )}

                        {activeModal === 'bank' && (
                            <View className="space-y-4">
                                <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('payment.bank.name_label')}</Text>
                                    <RNTextInput className="text-base font-bold text-slate-900" placeholder={t('payment.bank.name_placeholder')} />
                                </View>
                                <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('payment.bank.iban_label')}</Text>
                                    <RNTextInput className="text-base font-bold text-slate-900" placeholder={t('payment.bank.iban_placeholder')} />
                                </View>
                            </View>
                        )}

                        {activeModal === 'mobile' && (
                            <View className="space-y-4">
                                <TouchableOpacity 
                                    onPress={handleOperatorChange}
                                    className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4"
                                >
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('payment.mobile.operator_label')}</Text>
                                    <View className="flex-row items-center justify-between">
                                         <Text className="text-base font-bold text-slate-900">
                                             {newMobile.operator || t('payment.mobile.operator_placeholder')}
                                         </Text>
                                         <ChevronRight size={20} color="#1337ec" strokeWidth={2.5} />
                                    </View>
                                </TouchableOpacity>
                                <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('payment.mobile.phone_label')}</Text>
                                    <View className="flex-row items-center">
                                        <TouchableOpacity 
                                            onPress={handleCountryCodeChange}
                                            className="bg-white px-3 py-2 rounded-xl border border-slate-200 mr-3 flex-row items-center shadow-sm"
                                        >
                                            <Text className="text-slate-900 font-black text-sm">{newMobile.countryCode}</Text>
                                            <ChevronRight size={12} color="#64748B" style={{ transform: [{ rotate: '90deg' }], marginLeft: 4 }} />
                                        </TouchableOpacity>
                                        <RNTextInput 
                                            className="flex-1 text-base font-bold text-slate-900" 
                                            placeholder={newMobile.placeholder} 
                                            keyboardType="phone-pad"
                                            value={newMobile.phone}
                                            onChangeText={(text) => setNewMobile({ ...newMobile, phone: text })}
                                        />
                                    </View>
                                </View>
                            </View>
                        )}

                        <View className="flex-row mt-6">
                            <TouchableOpacity 
                                onPress={() => setActiveModal(null)}
                                className="flex-1 bg-slate-100 h-14 rounded-2xl items-center justify-center mr-4"
                            >
                                <Text className="text-slate-600 font-bold uppercase tracking-widest">{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={handleSaveNewMethod}
                                className="flex-2 bg-[#1337ec] h-14 rounded-2xl items-center justify-center flex-row px-8"
                            >
                                <Text className="text-white font-black uppercase tracking-[1.5px]">{t('common.confirm')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* African Countries Selector Modal */}
            <Modal
                visible={countrySelectorVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setCountrySelectorVisible(false)}
            >
                <View className="flex-1 justify-center bg-black/60 px-6">
                    <View className="bg-white rounded-[32px] h-[70%] shadow-2xl overflow-hidden">
                        <View className="p-6 border-b border-slate-100 flex-row items-center justify-between">
                            <Text className="text-xl font-black text-slate-900">{t('payment.mobile.countries_modal')}</Text>
                            <TouchableOpacity onPress={() => setCountrySelectorVisible(false)}>
                                <Text className="text-blue-600 font-bold">{t('payment.mobile.close')}</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={africanCountries}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    onPress={() => {
                                        setNewMobile({ ...newMobile, countryCode: item.dial, placeholder: item.placeholder });
                                        setCountrySelectorVisible(false);
                                    }}
                                    className="px-6 py-4 border-b border-slate-50 flex-row items-center justify-between active:bg-slate-50"
                                >
                                    <View className="flex-row items-center">
                                        <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center mr-3">
                                            <Text className="text-[10px] font-black text-slate-500">{item.code}</Text>
                                        </View>
                                        <Text className="text-slate-900 font-bold text-sm">{item.label}</Text>
                                    </View>
                                    <Text className="text-blue-600 font-black text-sm">{item.dial}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}
