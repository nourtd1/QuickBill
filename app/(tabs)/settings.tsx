import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    Dimensions
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
    MessageSquare,
    Bell,
    ShieldCheck,
    QrCode,
    CreditCard,
    User as UserIcon,
    Wallet
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
    const router = useRouter();
    const { signOut, user } = useAuth();
    const { profile, fetchProfile } = useProfile();

    useEffect(() => {
        fetchProfile();
    }, []);

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
            className="bg-card rounded-[24px] p-4 flex-row items-center mb-4 shadow-sm active:opacity-70"
        >
            <View className={`w-14 h-14 ${bgColor} rounded-2xl items-center justify-center mr-4`}>
                <Icon size={26} color={color} />
            </View>
            <View className="flex-1">
                <Text className="text-text-main font-black text-base">{title}</Text>
                <Text className="text-text-muted text-xs font-medium">{subtitle}</Text>
            </View>
            <ChevronRight size={20} color="#CBD5E1" />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-background" style={{ backgroundColor: '#EFF6FF' }}>
            <StatusBar style="light" />
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                {/* Header Profile Section */}
                <View className="bg-primary pt-16 pb-24 px-6 rounded-b-[40px] shadow-lg">
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <Text className="text-white/60 text-sm font-medium uppercase tracking-widest">Configuration</Text>
                            <Text className="text-white text-3xl font-black">Mon Compte</Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleSignOut}
                            className="bg-white/10 p-3 rounded-2xl border border-white/10"
                        >
                            <LogOut size={22} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Profile Summary Card */}
                    <View className="bg-white p-5 rounded-[32px] shadow-xl flex-row items-center mt-4">
                        <View className="w-16 h-16 rounded-2xl bg-background items-center justify-center overflow-hidden border-2 border-slate-50">
                            {profile?.logo_url ? (
                                <Image source={{ uri: profile.logo_url }} className="w-full h-full" />
                            ) : (
                                <Building2 size={28} color="#94A3B8" />
                            )}
                        </View>

                        <View className="ml-4 flex-1">
                            <Text className="text-text-main font-black text-lg leading-tight" numberOfLines={1}>
                                {profile?.business_name || 'Mon Business'}
                            </Text>
                            <Text className="text-text-muted text-xs font-bold mt-0.5">{user?.email}</Text>
                        </View>

                        <View className="bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200">
                            <Text className="text-emerald-700 text-[9px] font-black uppercase tracking-wider">Premium</Text>
                        </View>
                    </View>
                </View>

                <View className="px-6 -mt-8 pb-32">

                    {/* Section: Identité */}
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-2">Identité & Contact</Text>

                    <MenuButton
                        icon={Building2}
                        title="Profil Business"
                        subtitle="Nom, Logo, Devise et Contact"
                        onPress={() => router.push('/settings/business')}
                        color="#2563EB"
                        bgColor="bg-blue-50"
                    />

                    <MenuButton
                        icon={PenTool}
                        title="Signature"
                        subtitle="Dessinez votre signature numérique"
                        onPress={() => router.push('/settings/signature')}
                        color="#7C3AED"
                        bgColor="bg-purple-50"
                    />

                    {/* Section: Automatisation */}
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mt-4 mb-4 ml-2">Automatisation</Text>

                    <MenuButton
                        icon={MessageSquare}
                        title="WhatsApp Express"
                        subtitle="Template de message automatique"
                        onPress={() => router.push('/settings/whatsapp')}
                        color="#10B981"
                        bgColor="bg-emerald-50"
                    />

                    <MenuButton
                        icon={QrCode}
                        title="Paiement QR Code"
                        subtitle="Configuration du scan pour payer"
                        onPress={() => router.push('/settings/payment')}
                        color="#F59E0B"
                        bgColor="bg-orange-50"
                    />

                    {/* Section: Outils */}
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mt-4 mb-4 ml-2">Gestion</Text>

                    <MenuButton
                        icon={Package}
                        title="Catalogue"
                        subtitle="Services et articles préenregistrés"
                        onPress={() => router.push('/items')}
                        color="#EC4899"
                        bgColor="bg-pink-50"
                    />

                    <MenuButton
                        icon={ShieldCheck}
                        title="Sécurité"
                        subtitle="Confidentialité et accès"
                        onPress={() => router.push('/settings/security')}
                        color="#64748B"
                        bgColor="bg-slate-100"
                    />

                    <View className="mt-8 mb-4">
                        <TouchableOpacity
                            onPress={handleSignOut}
                            className="bg-red-50 py-5 rounded-[28px] items-center border border-red-100"
                        >
                            <Text className="text-red-600 font-black text-base">Se déconnecter</Text>
                        </TouchableOpacity>
                    </View>

                    <Text className="text-center text-slate-300 text-[10px] font-black uppercase tracking-widest mt-4">
                        QuickBill v2.2.0 • Premium Edition
                    </Text>
                </View>

            </ScrollView>
        </View>
    );
}
