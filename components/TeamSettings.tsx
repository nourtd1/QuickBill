import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { Users, UserPlus, Trash2, Shield, Mail, CheckCircle, X } from 'lucide-react-native';
import { getTeamMembers, inviteMember, removeMember, TeamMember, TeamRole } from '../lib/teamService';
import { useAuth } from '../context/AuthContext';

export default function TeamSettings() {
    const { user } = useAuth();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
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
            Alert.alert("Succès", "Invitation envoyée !");
            setInviteModalVisible(false);
            setNewEmail('');
            loadTeam();
        } catch (e: any) {
            Alert.alert("Erreur", e.message || "Impossible d'envoyer l'invitation");
        } finally {
            setInviting(false);
        }
    };

    const handleRemove = async (id: string) => {
        Alert.alert(
            "Confirmer",
            "Voulez-vous vraiment retirer ce membre ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Retirer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await removeMember(id);
                            loadTeam();
                        } catch (e) {
                            Alert.alert("Erreur", "Impossible de supprimer.");
                        }
                    }
                }
            ]
        );
    };

    const renderRoleBadge = (role: string) => {
        const styles: any = {
            owner: 'bg-purple-100 text-purple-700',
            admin: 'bg-blue-100 text-blue-700',
            seller: 'bg-green-100 text-green-700',
            accountant: 'bg-orange-100 text-orange-700'
        };
        const currentStyle = styles[role] || 'bg-slate-100 text-slate-700';

        return (
            <View className={`px-2 py-1 rounded-md ${currentStyle.split(' ')[0]}`}>
                <Text className={`text-xs font-bold uppercase ${currentStyle.split(' ')[1]}`}>{role}</Text>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
            <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center">
                    <View className="bg-blue-50 p-2 rounded-xl mr-3">
                        <Users size={20} color="#2563EB" />
                    </View>
                    <View>
                        <Text className="text-lg font-bold text-slate-900">Membres de l'équipe</Text>
                        <Text className="text-slate-500 text-xs">Gérez les accès à votre espace</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => setInviteModalVisible(true)}
                    className="bg-blue-600 px-4 py-2 rounded-full flex-row items-center"
                >
                    <UserPlus size={16} color="white" className="mr-2" />
                    <Text className="text-white font-bold text-xs">Inviter</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color="#2563EB" />
            ) : members.length === 0 ? (
                <View className="items-center py-8">
                    <Text className="text-slate-400 text-sm">Aucun membre dans l'équipe.</Text>
                </View>
            ) : (
                members.map((member) => {
                    const email = member.email || (member as any).member_email || 'Inconnu';
                    const initial = email[0] ? email[0].toUpperCase() : '?';

                    return (
                        <View key={member.id} className="flex-row items-center justify-between py-4 border-b border-slate-50 last:border-0">
                            <View className="flex-row items-center flex-1">
                                <View className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center mr-3">
                                    <Text className="font-bold text-slate-600">{initial}</Text>
                                </View>
                                <View>
                                    <Text className="font-bold text-slate-900 text-sm" numberOfLines={1}>
                                        {email}
                                    </Text>
                                    <View className="flex-row items-center mt-1">
                                        {member.status === 'invited' && (
                                            <Text className="text-amber-500 text-[10px] font-bold mr-2">• En attente</Text>
                                        )}
                                        {renderRoleBadge(member.role)}
                                    </View>
                                </View>
                            </View>

                            {member.role !== 'owner' && (
                                <TouchableOpacity onPress={() => handleRemove(member.id)} className="p-2 bg-red-50 rounded-lg ml-2">
                                    <Trash2 size={16} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                })
            )}

            {/* Invite Modal */}
            <Modal
                transparent
                visible={inviteModalVisible}
                animationType="slide"
                onRequestClose={() => setInviteModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-[32px] p-6 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-slate-900">Inviter un membre</Text>
                            <TouchableOpacity onPress={() => setInviteModalVisible(false)} className="bg-slate-100 p-2 rounded-full">
                                <X size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-slate-600 font-bold mb-2">Email</Text>
                        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6">
                            <Mail size={20} color="#94A3B8" className="mr-3" />
                            <TextInput
                                className="flex-1 font-semibold text-slate-900"
                                placeholder="collegue@entreprise.com"
                                value={newEmail}
                                onChangeText={setNewEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <Text className="text-slate-600 font-bold mb-2">Rôle</Text>
                        <View className="flex-row space-x-2 mb-8">
                            {[
                                { id: 'seller', label: 'Vendeur', desc: 'Factures uniquement' },
                                { id: 'accountant', label: 'Comptable', desc: 'Lecture seule' },
                                { id: 'admin', label: 'Admin', desc: 'Accès total' }
                            ].map((roleOpt: any) => (
                                <TouchableOpacity
                                    key={roleOpt.id}
                                    onPress={() => setNewRole(roleOpt.id)}
                                    className={`flex-1 p-3 rounded-xl border-2 ${newRole === roleOpt.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white'}`}
                                >
                                    <Text className={`font-bold text-center mb-1 ${newRole === roleOpt.id ? 'text-blue-700' : 'text-slate-700'}`}>{roleOpt.label}</Text>
                                    <Text className="text-[10px] text-slate-400 text-center">{roleOpt.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={handleInvite}
                            disabled={inviting}
                            className={`py-4 rounded-xl items-center ${inviting ? 'bg-slate-300' : 'bg-blue-600'}`}
                        >
                            {inviting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Envoyer l'invitation</Text>
                            )}
                        </TouchableOpacity>
                        <View className="h-8" />
                    </View>
                </View>
            </Modal>
        </View>
    );
}
