import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Linking,
    Image
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    Mail,
    Phone,
    MessageCircle, // For WhatsApp
    Twitter,
    Instagram,
    Linkedin,
    Globe,
    Send
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function ContactSupportScreen() {
    const router = useRouter();

    const openLink = async (url: string) => {
        Haptics.selectionAsync();
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            console.log("Don't know how to open URI: " + url);
        }
    };

    const ContactCard = ({ icon: Icon, title, subtitle, action, color, bgColor }: any) => (
        <TouchableOpacity
            onPress={action}
            activeOpacity={0.8}
            className="bg-white p-5 rounded-[24px] mb-4 border border-slate-100 shadow-sm flex-row items-center"
        >
            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${bgColor}`}>
                <Icon size={24} color={color} strokeWidth={2} />
            </View>
            <View className="flex-1">
                <Text className="text-slate-900 font-bold text-base">{title}</Text>
                <Text className="text-slate-500 text-xs font-medium">{subtitle}</Text>
            </View>
            <View className="bg-slate-50 p-2 rounded-full">
                <Send size={16} color={color} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            {/* Header */}
            <LinearGradient
                colors={['#1E1B4B', '#312E81']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="pt-14 pb-10 px-6 rounded-b-[40px] shadow-lg z-10 block"
            >
                <View className="flex-row items-center mb-6">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/10 mr-4 active:bg-white/20"
                    >
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white font-black text-2xl tracking-tight">Nous contacter</Text>
                </View>
                <Text className="text-indigo-200 text-sm font-medium leading-relaxed px-1">
                    Notre équipe est là pour vous aider. Choisissez le canal qui vous convient le mieux pour nous joindre.
                </Text>
            </LinearGradient>

            <ScrollView
                className="flex-1 px-6 -mt-6"
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-2 mt-4">Support Direct</Text>

                <ContactCard
                    icon={Mail}
                    title="Envoyer un email"
                    subtitle="support@chadito.tech"
                    action={() => openLink('mailto:support@chadito.tech')}
                    color="#EA4335"
                    bgColor="bg-red-50"
                />

                <ContactCard
                    icon={MessageCircle}
                    title="WhatsApp Support"
                    subtitle="+250 798 977 292"
                    action={() => openLink('https://wa.me/250798977292')}
                    color="#25D366"
                    bgColor="bg-green-50"
                />

                <ContactCard
                    icon={Phone}
                    title="Appeler le service client"
                    subtitle="Disponible 8h - 18h"
                    action={() => openLink('tel:+250798977292')}
                    color="#2563EB"
                    bgColor="bg-blue-50"
                />

                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-4 ml-2 mt-6">Réseaux Sociaux</Text>

                <View className="flex-row justify-between gap-4">
                    <TouchableOpacity
                        onPress={() => openLink('https://twitter.com/chadito')}
                        className="flex-1 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm items-center"
                    >
                        <View className="w-10 h-10 bg-sky-50 rounded-full items-center justify-center mb-2">
                            <Twitter size={20} color="#0EA5E9" fill="#0EA5E9" fillOpacity={0.2} />
                        </View>
                        <Text className="text-slate-700 font-bold text-xs">Twitter</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => openLink('https://instagram.com/chadito')}
                        className="flex-1 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm items-center"
                    >
                        <View className="w-10 h-10 bg-pink-50 rounded-full items-center justify-center mb-2">
                            <Instagram size={20} color="#E1306C" />
                        </View>
                        <Text className="text-slate-700 font-bold text-xs">Instagram</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => openLink('https://linkedin.com/company/chadito')}
                        className="flex-1 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm items-center"
                    >
                        <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mb-2">
                            <Linkedin size={20} color="#0A66C2" fill="#0A66C2" fillOpacity={0.2} />
                        </View>
                        <Text className="text-slate-700 font-bold text-xs">LinkedIn</Text>
                    </TouchableOpacity>
                </View>

                {/* FAQ Link */}
                <TouchableOpacity
                    onPress={() => router.push('/settings/help')}
                    className="mt-8 bg-indigo-50 p-5 rounded-[24px] border border-indigo-100 flex-row items-center justify-between"
                >
                    <View>
                        <Text className="text-indigo-900 font-bold text-base">Consulter la FAQ</Text>
                        <Text className="text-indigo-500 text-xs mt-0.5">Trouvez des réponses rapides</Text>
                    </View>
                    <View className="bg-indigo-100 px-3 py-1.5 rounded-full">
                        <Text className="text-indigo-600 font-bold text-xs">Voir</Text>
                    </View>
                </TouchableOpacity>

                <View className="items-center mt-10 mb-4 opactiy-50">
                    <Text className="text-slate-400 text-[10px] font-medium">
                        Kigali, Rwanda • Chadito Tech Ltd.
                    </Text>
                </View>

            </ScrollView>
        </View>
    );
}
