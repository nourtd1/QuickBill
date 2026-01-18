import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    SafeAreaView,
    Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Users, UserPlus, Trash2, Mail, CheckCircle, X, Shield, Lock } from 'lucide-react-native';
import { getTeamMembers, inviteMember, removeMember, TeamMember, TeamRole } from '../../lib/teamService';
import { useAuth } from '../../context/AuthContext';
import { showError, showSuccess } from '../../lib/error-handler';

export default function TeamSettingsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    // Invite State
    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState<TeamRole>('seller');
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        loadTeam();
    }, []);

    const loadTeam = async () => {
        try {
            const data = await getTeamMembers();
            setMembers(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async () => {
        if (!newEmail.trim()) {
            Alert.alert("Erreur", "Veuillez entrer une adresse email valide.");
            return;
        }
        setInviting(true);
        try {
            await inviteMember(newEmail, newRole);

            // Success: Ask to notify
            Alert.alert(
                "Membre ajouté",
                "L'accès a été créé. Voulez-vous envoyer un email de notification maintenant ?",
                [
                    {
                        text: "Plus tard",
                        style: "cancel",
                        onPress: () => {
                            showSuccess("Invitation enregistrée !");
                            setInviteModalVisible(false);
                            setNewEmail('');
                            loadTeam();
                        }
                    },
                    {
                        text: "Envoyer l'email",
                        onPress: async () => {
                            const subject = "Invitation à rejoindre l'équipe QuickBill";
                            const body = `Bonjour,\n\nJe vous invite à rejoindre mon équipe sur QuickBill en tant que ${newRole.toUpperCase()}.\n\nVeuillez télécharger l'application et créer un compte avec l'adresse : ${newEmail}.\n\nCordialement.`;
                            const url = `mailto:${newEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

                            if (await Linking.canOpenURL(url)) {
                                await Linking.openURL(url);
                            } else {
                                Alert.alert("Erreur", "Impossible d'ouvrir l'application mail.");
                            }

                            setInviteModalVisible(false);
                            setNewEmail('');
                            loadTeam();
                        }
                    }
                ]
            );

        } catch (e: any) {
            showError(e, "Impossible d'envoyer l'invitation");
        } finally {
            setInviting(false);
        }
    };

    const handleRemove = async (id: string, role: string) => {
        if (role === 'owner') {
            Alert.alert("Action impossible", "Le propriétaire ne peut pas être retiré.");
            return;
        }

        Alert.alert(
            "Confirmer le retrait",
            "Voulez-vous vraiment retirer ce membre de l'équipe ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Retirer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await removeMember(id);
                            showSuccess("Membre retiré");
                            loadTeam();
                        } catch (e) {
                            showError(e, "Impossible de supprimer");
                        }
                    }
                }
            ]
        );
    };

    const renderRoleBadge = (role: string) => {
        const styles: any = {
            owner: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'PROPRIÉTAIRE' },
            admin: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'ADMIN' },
            seller: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'VENDEUR' },
            accountant: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'COMPTABLE' }
        };
        const style = styles[role] || { bg: 'bg-slate-100', text: 'text-slate-700', label: role.toUpperCase() };

        return (
            <View className={`px-2.5 py-1 rounded-md ${style.bg}`}>
                <Text className={`text-[10px] font-black uppercase tracking-widest ${style.text}`}>{style.label}</Text>
            </View>
        );
    };

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
                    <Text className="text-xl font-black text-white tracking-tight">Gestion d'Équipe</Text>
                    <TouchableOpacity
                        onPress={() => setInviteModalVisible(true)}
                        className="w-10 h-10 bg-white/20 items-center justify-center rounded-full backdrop-blur-md"
                    >
                        <UserPlus size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    className="flex-1 px-6"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    {/* Intro Card */}
                    <View className="bg-white p-6 rounded-[24px] shadow-sm shadow-blue-900/5 mb-6 border border-slate-100 mt-4">
                        <View className="flex-row items-center mb-3">
                            <View className="bg-blue-50 p-2.5 rounded-xl mr-3">
                                <Users size={24} color="#1E40AF" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 font-bold text-lg">Collaborateurs</Text>
                                <Text className="text-slate-400 text-xs">Gérez les accès et rôles de votre business</Text>
                            </View>
                        </View>
                        <Text className="text-slate-500 text-sm leading-relaxed">
                            Invitez votre comptable, vos vendeurs ou des administrateurs pour vous aider à gérer votre activité.
                        </Text>
                    </View>

                    {/* Members List */}
                    <View className="mb-6">
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-2">Membres Actifs</Text>

                        {loading ? (
                            <ActivityIndicator size="large" color="#1E40AF" className="mt-8" />
                        ) : members.length === 0 ? (
                            <View className="items-center justify-center py-12 bg-white rounded-[24px] border border-dashed border-slate-200">
                                <Text className="text-slate-400 text-sm font-medium">Aucun membre pour le moment.</Text>
                            </View>
                        ) : (
                            members.map((member) => {
                                const email = member.member_email || 'Inconnu';
                                const initial = email[0] ? email[0].toUpperCase() : '?';

                                return (
                                    <View key={member.id} className="bg-white p-4 rounded-[20px] mb-3 border border-slate-100 shadow-sm flex-row items-center">
                                        <View className="w-12 h-12 bg-slate-100 rounded-full items-center justify-center mr-4 shadow-inner">
                                            <Text className="font-black text-slate-600 text-lg">{initial}</Text>
                                        </View>

                                        <View className="flex-1 mr-2">
                                            <Text className="text-slate-900 font-bold text-base mb-1" numberOfLines={1}>{email}</Text>
                                            <View className="flex-row items-center flex-wrap gap-2">
                                                {renderRoleBadge(member.role)}
                                                {member.status === 'invited' && (
                                                    <View className="bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                                        <Text className="text-[9px] font-bold text-amber-600 uppercase">Invitation envoyée</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        {member.role !== 'owner' && (
                                            <TouchableOpacity
                                                onPress={() => handleRemove(member.id, member.role)}
                                                className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center border border-red-100 active:scale-95"
                                            >
                                                <Trash2 size={18} color="#EF4444" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Invite Modal */}
            <Modal
                transparent
                visible={inviteModalVisible}
                animationType="slide"
                onRequestClose={() => setInviteModalVisible(false)}
            >
                <View className="flex-1 bg-slate-900/60 justify-end">
                    <View className="bg-slate-50 rounded-t-[32px] overflow-hidden">
                        <View className="p-6 pb-4 bg-white border-b border-slate-100 flex-row justify-between items-center">
                            <Text className="text-xl font-black text-slate-900">Inviter un membre</Text>
                            <TouchableOpacity onPress={() => setInviteModalVisible(false)} className="bg-slate-100 p-2 rounded-full">
                                <X size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="p-6">
                            <Text className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2 ml-1">Adresse Email</Text>
                            <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 h-14 mb-6 shadow-sm">
                                <Mail size={20} color="#94A3B8" className="mr-3" />
                                <TextInput
                                    className="flex-1 font-bold text-slate-800 text-base"
                                    placeholder="collegue@entreprise.com"
                                    placeholderTextColor="#CBD5E1"
                                    value={newEmail}
                                    onChangeText={setNewEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <Text className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-3 ml-1">Rôle & Permissions</Text>
                            <View className="space-y-3 mb-8">
                                <TouchableOpacity
                                    onPress={() => setNewRole('seller')}
                                    className={`p-4 rounded-2xl border-2 flex-row items-center ${newRole === 'seller' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'}`}
                                >
                                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${newRole === 'seller' ? 'bg-blue-200' : 'bg-slate-100'}`}>
                                        <UserPlus size={20} color={newRole === 'seller' ? '#1E40AF' : '#64748B'} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className={`font-black text-base ${newRole === 'seller' ? 'text-blue-900' : 'text-slate-700'}`}>Vendeur</Text>
                                        <Text className="text-xs text-slate-500 mt-0.5">Peut créer et gérer les factures et devis.</Text>
                                    </View>
                                    {newRole === 'seller' && <CheckCircle size={20} color="#2563EB" fill="#DBEAFE" />}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setNewRole('accountant')}
                                    className={`p-4 rounded-2xl border-2 flex-row items-center ${newRole === 'accountant' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white'}`}
                                >
                                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${newRole === 'accountant' ? 'bg-amber-200' : 'bg-slate-100'}`}>
                                        <Shield size={20} color={newRole === 'accountant' ? '#B45309' : '#64748B'} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className={`font-black text-base ${newRole === 'accountant' ? 'text-amber-900' : 'text-slate-700'}`}>Comptable</Text>
                                        <Text className="text-xs text-slate-500 mt-0.5">Accès en lecture seule aux rapports financiers.</Text>
                                    </View>
                                    {newRole === 'accountant' && <CheckCircle size={20} color="#D97706" fill="#FEF3C7" />}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setNewRole('admin')}
                                    className={`p-4 rounded-2xl border-2 flex-row items-center ${newRole === 'admin' ? 'border-purple-600 bg-purple-50' : 'border-slate-200 bg-white'}`}
                                >
                                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${newRole === 'admin' ? 'bg-purple-200' : 'bg-slate-100'}`}>
                                        <Lock size={20} color={newRole === 'admin' ? '#7C3AED' : '#64748B'} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className={`font-black text-base ${newRole === 'admin' ? 'text-purple-900' : 'text-slate-700'}`}>Administrateur</Text>
                                        <Text className="text-xs text-slate-500 mt-0.5">Accès complet à tous les paramètres et données.</Text>
                                    </View>
                                    {newRole === 'admin' && <CheckCircle size={20} color="#7C3AED" fill="#F3E8FF" />}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                onPress={handleInvite}
                                disabled={inviting}
                                className={`h-16 rounded-[20px] items-center justify-center shadow-lg shadow-blue-200 active:scale-95 transition-transform ${inviting ? 'bg-slate-300' : 'bg-blue-600'}`}
                            >
                                {inviting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-black text-lg tracking-wide uppercase">Envoyer l'invitation</Text>
                                )}
                            </TouchableOpacity>
                            <View className="h-10" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
