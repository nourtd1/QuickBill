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
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import TaxReportModal from '../../components/TaxReportModal';
import TeamSettings from '../../components/TeamSettings';
import ActivityLogList from '../../components/ActivityLogList';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
    const router = useRouter();
    const { signOut, user } = useAuth();
    const { profile, fetchProfile } = useProfile();
    const [taxModalVisible, setTaxModalVisible] = useState(false);
    const [teamModalVisible, setTeamModalVisible] = useState(false);
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
            .limit(5);
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
            className="bg-zinc-50 rounded-[24px] p-4 flex-row items-center mb-4 shadow-sm active:opacity-70 border border-slate-100"
        >
            <View className={`w-14 h-14 ${bgColor} rounded-2xl items-center justify-center mr-4`}>
                <Icon size={26} color={color} />
            </View>
            <View className="flex-1">
                <Text className="text-slate-900 font-black text-base">{title}</Text>
                <Text className="text-slate-500 text-xs font-medium">{subtitle}</Text>
            </View>
            <ChevronRight size={20} color="#CBD5E1" />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="light" />

            <View className="bg-blue-600 pt-16 pb-12 px-6 rounded-b-[40px] shadow-lg mb-8">
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-blue-100 text-sm font-bold uppercase tracking-widest">Compte</Text>
                        <Text className="text-white text-3xl font-black">Paramètres</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="bg-white/20 p-3 rounded-2xl"
                    >
                        <LogOut size={22} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Profile Card */}
                <View className="bg-white p-4 rounded-3xl flex-row items-center shadow-lg shadow-blue-900/20">
                    <View className="w-16 h-16 rounded-2xl bg-slate-100 items-center justify-center overflow-hidden border border-slate-100">
                        {profile?.logo_url ? (
                            <Image source={{ uri: profile.logo_url }} className="w-full h-full" />
                        ) : (
                            <Building2 size={28} color="#94A3B8" />
                        )}
                    </View>
                    <View className="ml-4 flex-1">
                        <Text className="text-slate-900 font-black text-lg" numberOfLines={1}>
                            {profile?.business_name || 'Mon Business'}
                        </Text>
                        <Text className="text-slate-500 text-xs font-bold">{user?.email}</Text>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Section: Entreprise */}
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-2">Mon Entreprise</Text>
                <MenuButton
                    icon={Building2}
                    title="Profil Business"
                    subtitle="Identité, Logo et Coordonnées"
                    onPress={() => router.push('/settings/business')}
                    color="#2563EB"
                    bgColor="bg-blue-50"
                />
                <MenuButton
                    icon={PenTool}
                    title="Signature Documents"
                    subtitle="Personnaliser votre signature"
                    onPress={() => router.push('/settings/signature')}
                    color="#7C3AED"
                    bgColor="bg-purple-50"
                />
                <MenuButton
                    icon={Users}
                    title="Gestion d'Équipe"
                    subtitle="Inviter des collaborateurs (RBAC)"
                    onPress={() => setTeamModalVisible(true)}
                    color="#22C55E"
                    bgColor="bg-green-50"
                />

                {/* Section: Commercial */}
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mt-6 mb-4 ml-2">Commercial</Text>
                <MenuButton
                    icon={FileText}
                    title="Mes Devis"
                    subtitle="Gérer et convertir les devis"
                    onPress={() => router.push('/estimates')}
                    color="#F59E0B"
                    bgColor="bg-amber-50"
                />
                <MenuButton
                    icon={Package}
                    title="Catalogue Produits"
                    subtitle="Services et Articles récurrents"
                    onPress={() => router.push('/items')}
                    color="#EC4899"
                    bgColor="bg-pink-50"
                />

                {/* Section: Dépenses */}
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mt-6 mb-4 ml-2">Dépenses & Achats</Text>
                <MenuButton
                    icon={Camera}
                    title="Scanner Intelligent (IA)"
                    subtitle="Numériser un reçu automatiquement"
                    onPress={() => router.push('/expenses/scan')}
                    color="#8B5CF6"
                    bgColor="bg-violet-50"
                />
                <MenuButton
                    icon={Plus}
                    title="Saisir une Dépense"
                    subtitle="Ajout manuel rapide"
                    onPress={() => router.push('/expenses/add')}
                    color="#EF4444"
                    bgColor="bg-red-50"
                />

                {/* Section: Fiscalité */}
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mt-6 mb-4 ml-2">Fiscalité</Text>
                <MenuButton
                    icon={FileText}
                    title="Rapports Fiscaux"
                    subtitle="TVA, EBM et Exports"
                    onPress={() => setTaxModalVisible(true)}
                    color="#0F172A"
                    bgColor="bg-slate-200"
                />

                {/* Section: Système */}
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mt-6 mb-4 ml-2">Système</Text>
                <MenuButton
                    icon={ShieldCheck}
                    title="Sécurité"
                    subtitle="Mot de passe et accès"
                    onPress={() => router.push('/settings/security')}
                    color="#64748B"
                    bgColor="bg-slate-100"
                />

                {/* Recent Expenses Widget */}
                <View className="mb-6 mt-8">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-2">Dernières Dépenses</Text>
                    {recentExpenses.length === 0 ? (
                        <View className="p-6 items-center bg-slate-50 rounded-[24px] border border-dashed border-slate-200">
                            <Text className="text-slate-400 text-xs font-medium">Aucune dépense récente</Text>
                        </View>
                    ) : (
                        <View className="bg-white rounded-[24px] p-2 shadow-sm border border-slate-100">
                            {recentExpenses.map((exp: any, idx: number) => (
                                <View
                                    key={exp.id || idx}
                                    className={`p-4 flex-row items-center ${idx !== recentExpenses.length - 1 ? 'border-b border-slate-50' : ''}`}
                                >
                                    <View className="w-10 h-10 rounded-2xl items-center justify-center mr-4 bg-red-50 border border-red-100">
                                        <TrendingDown size={18} color="#EF4444" strokeWidth={2.5} />
                                    </View>

                                    <View className="flex-1 pr-2">
                                        <Text className="text-slate-900 font-bold text-sm mb-0.5" numberOfLines={1}>
                                            {exp.category || 'Dépense'}
                                        </Text>
                                        <Text className="text-slate-400 text-[10px] font-semibold" numberOfLines={1}>{exp.description || 'Sans description'}</Text>
                                    </View>

                                    <View className="items-end">
                                        <Text className="text-slate-900 font-black text-sm">
                                            -{(exp.amount || 0).toLocaleString()} <Text className="text-[10px] text-slate-500 font-bold">{profile?.currency || 'RWF'}</Text>
                                        </Text>
                                        <Text className="text-slate-400 text-[10px] font-bold mt-0.5">
                                            {exp.date}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Activity Logs */}
                <View className="mb-8">
                    <ActivityLogList />
                </View>

                {/* Version Footer */}
                <View className="py-8 items-center">
                    <Text className="text-slate-300 text-[10px] font-black uppercase tracking-widest">
                        QuickBill v2.2 - Compliance Ready
                    </Text>
                </View>
            </ScrollView>

            <TaxReportModal visible={taxModalVisible} onClose={() => setTaxModalVisible(false)} />

            {/* Team Modal */}
            <Modal visible={teamModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View className="flex-1 bg-slate-50">
                    <View className="flex-row justify-between items-center p-6 bg-white border-b border-slate-100">
                        <Text className="text-xl font-black text-slate-900">Mon Équipe</Text>
                        <TouchableOpacity onPress={() => setTeamModalVisible(false)} className="p-2 bg-slate-100 rounded-full">
                            <X size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                    <TeamSettings />
                </View>
            </Modal>
        </View >
    );
}
