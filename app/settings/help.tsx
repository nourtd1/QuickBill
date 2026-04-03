import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ImageBackground, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    MoreHorizontal,
    Search,
    MessageCircle,
    Play,
    CreditCard,
    LayoutGrid,
    Wrench,
    Bug,
    ThumbsUp,
    ChevronRight,
    Phone
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

export default function HelpSupportScreen() {
    const router = useRouter();

    const TopicRow = ({ icon: Icon, bgClass, iconColor, title, subtitle, isLast, onPress }: any) => (
        <TouchableOpacity
            className={`flex-row items-center p-4 bg-white ${!isLast ? 'border-b border-slate-100' : ''}`}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${bgClass}`}>
                <Icon size={20} color={iconColor} />
            </View>
            <View className="flex-1">
                <Text className="text-slate-900 font-bold text-base">{title}</Text>
                {subtitle && <Text className="text-slate-400 text-xs mt-0.5">{subtitle}</Text>}
            </View>
            <ChevronRight size={20} color="#CBD5E1" />
        </TouchableOpacity>
    );

    const OtherOptionRow = ({ icon: Icon, title, isLast, onPress }: any) => (
        <TouchableOpacity
            className={`flex-row items-center p-4 bg-white ${!isLast ? 'border-b border-slate-100' : ''}`}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-4">
                <Icon size={20} color="#334155" />
            </View>
            <Text className="flex-1 text-slate-900 font-bold text-base">{title}</Text>
            <ChevronRight size={20} color="#CBD5E1" />
        </TouchableOpacity>
    );

    const VideoCard = ({ title, duration, imageUri, onPress }: any) => (
        <TouchableOpacity 
            className="w-64 h-36 rounded-2xl overflow-hidden mr-4 relative shadow-sm" 
            activeOpacity={0.9}
            onPress={onPress}
        >
            <ImageBackground
                source={{ uri: imageUri }}
                className="w-full h-full justify-center items-center"
                resizeMode="cover"
            >
                <View className="absolute inset-0 bg-black/30" />
                <View className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md items-center justify-center border border-white/50">
                    <Play size={20} color="white" fill="white" style={{ marginLeft: 2 }} />
                </View>
                <View className="absolute bottom-3 left-3 right-3">
                    <Text className="text-white font-bold text-sm mb-0.5 shadow-sm">{title}</Text>
                    <Text className="text-white/80 text-xs font-medium">{duration}</Text>
                </View>
            </ImageBackground>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-[#F9FAFB]">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-2 mb-2">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900">Aide & Support</Text>
                    <TouchableOpacity className="p-2 -mr-2">
                        <MoreHorizontal size={24} color="#0F172A" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="px-5 mb-6">
                    <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm">
                        <Search size={20} color="#94A3B8" style={{ marginRight: 10 }} />
                        <TextInput
                            className="flex-1 text-slate-900 font-medium text-base h-full"
                            placeholder="Rechercher dans la FAQ..."
                            placeholderTextColor="#94A3B8"
                        />
                    </View>
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                    {/* Contact Hero */}
                    <View className="px-5 mb-8">
                        <View className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50 flex-row items-center justify-between">
                            <View className="flex-1 mr-4">
                                <Text className="text-slate-900 font-extrabold text-xl mb-2">Besoin d'aide ?</Text>
                                <Text className="text-slate-500 text-sm leading-5">Notre équipe est disponible 24/7 pour vous accompagner.</Text>
                            </View>
                            <TouchableOpacity 
                                className="bg-indigo-600 px-5 py-3 rounded-full flex-row items-center shadow-lg shadow-indigo-200"
                                onPress={() => Linking.openURL('mailto:nourdevtd@gmail.com')}
                            >
                                <MessageCircle size={18} color="white" style={{ marginRight: 8 }} />
                                <Text className="text-white font-bold text-sm">Contact</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* WhatsApp Support */}
                    <View className="px-5 mb-8">
                        <TouchableOpacity 
                            className="bg-emerald-500 rounded-[24px] p-5 shadow-sm border border-emerald-100 flex-row items-center"
                            onPress={() => Linking.openURL('https://wa.me/250798977292')}
                        >
                            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4">
                                <Phone size={24} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-bold text-lg">Support WhatsApp</Text>
                                <Text className="text-white/80 text-xs">Réponse rapide en direct</Text>
                            </View>
                            <ChevronRight size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Tutorial Videos */}
                    <View className="mb-8">
                        <View className="flex-row justify-between items-center px-5 mb-4">
                            <Text className="text-slate-900 font-bold text-lg">Vidéos Tutoriels</Text>
                            <TouchableOpacity>
                                <Text className="text-indigo-600 font-bold text-sm">Tout voir</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 6 }}>
                             <VideoCard
                                title="Débuter avec les Factures"
                                duration="2:45 min"
                                imageUri="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=600&auto=format&fit=crop"
                                onPress={() => Alert.alert("Tutoriel", "Lancement du tutoriel : Débuter avec les Factures")}
                            />
                            <VideoCard
                                title="Configurer les Paiements"
                                duration="3:12 min"
                                imageUri="https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=600&auto=format&fit=crop"
                                onPress={() => Alert.alert("Tutoriel", "Lancement du tutoriel : Configurer les Paiements")}
                            />
                            <VideoCard
                                title="Rapports Avancés"
                                duration="4:05 min"
                                imageUri="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop"
                                onPress={() => Alert.alert("Tutoriel", "Lancement du tutoriel : Rapports Avancés")}
                            />
                        </ScrollView>
                    </View>

                    {/* Parcourir par sujet */}
                    <View className="px-5 mb-8">
                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 ml-1">
                            PARCOURIR PAR SUJET
                        </Text>
                        <View className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-50">
                             <TopicRow
                                title="Facturation & Abonnements"
                                subtitle="Gérer les forfaits, factures et paiements"
                                icon={CreditCard}
                                bgClass="bg-indigo-50"
                                iconColor="#4F46E5"
                                onPress={() => Alert.alert("Article", "Le guide de facturation sera bientôt disponible.")}
                            />
                            <TopicRow
                                title="Fonctionnalités de l'App"
                                subtitle="Guides sur les factures, clients et rapports"
                                icon={LayoutGrid}
                                bgClass="bg-purple-50"
                                iconColor="#9333EA"
                                onPress={() => Alert.alert("Article", "Les guides de fonctionnalités seront bientôt disponibles.")}
                            />
                            <TopicRow
                                title="Dépannage & Erreurs"
                                subtitle="Résoudre les problèmes courants"
                                icon={Wrench}
                                bgClass="bg-orange-50"
                                iconColor="#F97316"
                                isLast
                                onPress={() => Alert.alert("Article", "Les étapes de dépannage seront bientôt disponibles.")}
                            />
                        </View>
                    </View>

                    {/* Other */}
                     <View className="px-5 mb-8">
                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 ml-1">
                            AUTRE
                        </Text>
                        <View className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-50">
                            <OtherOptionRow
                                title="Signaler un Problème"
                                icon={Bug}
                                onPress={() => Linking.openURL('mailto:nourdevtd@gmail.com?subject=Signalement de Bug')}
                            />
                            <OtherOptionRow
                                title="Envoyer un Avis"
                                icon={ThumbsUp}
                                isLast
                                onPress={() => Linking.openURL('mailto:nourdevtd@gmail.com?subject=Avis App')}
                            />
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
