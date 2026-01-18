import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    Dimensions,
    Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import ActivityLogList from '../../components/ActivityLogList';
import { supabase } from '../../lib/supabase';
import {
    LogOut,
    Building2,
    PenTool,
    ChevronRight,
    Package,
    ShieldCheck,
    FileText,
    Users,
    X,
    TrendingDown,
    Camera,
    Plus,
    Info,
    Settings,
    CreditCard,
    Bell,
    Globe,
    HelpCircle
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import TaxReportModal from '../../components/TaxReportModal';
const { width } = Dimensions.get('window');

export default function SettingsScreen() {
    const router = useRouter();
    const { signOut, user } = useAuth();
    const { profile, fetchProfile } = useProfile();
    const [taxModalVisible, setTaxModalVisible] = useState(false);
    const [recentExpenses, setRecentExpenses] = useState<any[]>([]);

    useEffect(() => {
        fetchProfile();
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(3);
        if (data) setRecentExpenses(data);
    };

    const handleSignOut = () => {
        Alert.alert(
            "Déconnexion",
            "Êtes-vous sûr de vouloir vous déconnecter ?",
            [
                { text: "Annuler", style: "cancel" },
                { text: "Se déconnecter", style: "destructive", onPress: signOut }
            ]
        );
    };

    const MenuButton = ({ icon: Icon, title, subtitle, onPress, color, bgColor }: any) => (
        <TouchableOpacity
            onPress={onPress}
            className="bg-white rounded-[28px] p-4 flex-row items-center mb-4 shadow-sm border border-slate-100 active:bg-slate-50 transition-all"
        >
            <View className={`w-12 h-12 ${bgColor} rounded-2xl items-center justify-center mr-4 border border-white/10`}>
                <Icon size={22} color={color} strokeWidth={2.5} />
            </View>
            <View className="flex-1">
                <Text className="text-slate-900 font-black text-base">{title}</Text>
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">{subtitle}</Text>
            </View>
            <View className="bg-slate-50 p-2 rounded-xl">
                <ChevronRight size={16} color="#CBD5E1" strokeWidth={3} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            <LinearGradient
                colors={['#1E40AF', '#1e3a8a']}
                className="pt-14 pb-10 px-6 rounded-b-[42px] shadow-2xl z-10"
            >
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-3xl font-black text-white tracking-tight">Paramètres</Text>
                        <Text className="text-blue-200/60 text-[10px] font-bold uppercase tracking-[1.5px] mt-0.5">Configuration & Compte</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="bg-red-500/20 w-12 h-12 items-center justify-center rounded-[18px] border border-red-500/20 shadow-lg"
                    >
                        <LogOut size={22} color="#F87171" strokeWidth={2.5} />
                    </TouchableOpacity>
                </View>

                {/* Profile Card Glassmorphism */}
                <TouchableOpacity
                    onPress={() => router.push('/settings/business')}
                    className="bg-white/10 p-5 rounded-[32px] flex-row items-center border border-white/20 backdrop-blur-md"
                >
                    <View className="w-16 h-16 rounded-[22px] bg-white items-center justify-center overflow-hidden shadow-lg border border-white/10">
                        {profile?.logo_url ? (
                            <Image source={{ uri: profile.logo_url }} className="w-full h-full" />
                        ) : (
                            <Building2 size={32} color="#1E40AF" />
                        )}
                    </View>
                    <View className="ml-4 flex-1">
                        <Text className="text-white font-black text-xl leading-tight" numberOfLines={1}>
                            {profile?.business_name || 'Mon Business'}
                        </Text>
                        <View className="bg-white/20 self-start px-2 py-0.5 rounded-lg mt-1">
                            <Text className="text-blue-100 text-[9px] font-black uppercase tracking-widest">{user?.email}</Text>
                        </View>
                    </View>
                    <View className="bg-white/15 p-2 rounded-full">
                        <PenTool size={16} color="white" />
                    </View>
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 24 }}
            >
                {/* Section: Business */}
                <View className="px-6">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-2">Mon Entreprise</Text>
                    <MenuButton
                        icon={Building2}
                        title="Profil Business"
                        subtitle="Identité & Coordonnées"
                        onPress={() => router.push('/settings/business')}
                        color="#2563EB"
                        bgColor="bg-blue-50"
                    />
                    <MenuButton
                        icon={PenTool}
                        title="Signature"
                        subtitle="Personnaliser vos documents"
                        onPress={() => router.push('/settings/signature')}
                        color="#7C3AED"
                        bgColor="bg-purple-50"
                    />
                    <MenuButton
                        icon={Users}
                        title="Gestion d'Équipe"
                        subtitle="Inviter des collaborateurs"
                        onPress={() => router.push('/settings/team')}
                        color="#10B981"
                        bgColor="bg-emerald-50"
                    />
                </View>

                {/* Section: Finance & Tax */}
                <View className="px-6 mt-8">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-2">Finances & Coordonnées</Text>
                    <MenuButton
                        icon={CreditCard}
                        title="Paiements & RIB"
                        subtitle="Coordonnées bancaires & QR Code"
                        onPress={() => router.push('/settings/payment')}
                        color="#2563EB"
                        bgColor="bg-blue-50"
                    />
                    <MenuButton
                        icon={FileText}
                        title="Rapports Fiscaux"
                        subtitle="TVA, EBM et Exports"
                        onPress={() => setTaxModalVisible(true)}
                        color="#0F172A"
                        bgColor="bg-slate-200"
                    />
                    <MenuButton
                        icon={TrendingDown}
                        title="Abonnement"
                        subtitle="Gérer votre plan Pro"
                        onPress={() => router.push('/settings/subscription')}
                        color="#F59E0B"
                        bgColor="bg-amber-50"
                    />
                </View>

                {/* Section: App Settings */}
                <View className="px-6 mt-8">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-2">Application</Text>
                    <MenuButton
                        icon={ShieldCheck}
                        title="Sécurité"
                        subtitle="Mot de passe et accès"
                        onPress={() => router.push('/settings/security')}
                        color="#64748B"
                        bgColor="bg-slate-100"
                    />
                    <MenuButton
                        icon={Info}
                        title="À propos"
                        subtitle="Version & Aide"
                        onPress={() => router.push('/settings/about')}
                        color="#3B82F6"
                        bgColor="bg-blue-50"
                    />
                </View>

                {/* Recent Activities Widget */}
                <View className="px-6 mt-8">
                    <View className="flex-row justify-between items-center mb-4 ml-2">
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px]">Activité Récente</Text>
                    </View>
                    <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                        <ActivityLogList />
                    </View>
                </View>

                {/* Version Footer */}
                <View className="py-12 items-center">
                    <View className="flex-row items-center mb-2">
                        <View className="w-1 h-1 rounded-full bg-emerald-500 mr-2" />
                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Connecté en mode sécurisé</Text>
                    </View>
                    <Text className="text-slate-300 text-[9px] font-black uppercase tracking-[3px]">
                        QuickBill Premium v2.5
                    </Text>
                </View>
            </ScrollView>

            <TaxReportModal visible={taxModalVisible} onClose={() => setTaxModalVisible(false)} />
        </View>
    );
}
