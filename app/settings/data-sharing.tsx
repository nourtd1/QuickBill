import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Share2,
    BarChart2,
    ShieldCheck,
    Mail,
    Globe,
    Lock
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function DataSharingScreen() {
    const router = useRouter();
    
    const [crashReporting, setCrashReporting] = useState(true);
    const [usageAnalytics, setUsageAnalytics] = useState(false);
    const [marketingEmails, setMarketingEmails] = useState(false);
    const [personalizedAds, setPersonalizedAds] = useState(false);

    const PrivacyOption = ({ icon: Icon, title, subtitle, value, onToggle, isLast }: any) => (
        <View className={`flex-row items-center justify-between p-5 bg-white ${!isLast ? 'border-b border-slate-50' : ''}`}>
            <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-1">
                    <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mr-3">
                        <Icon size={18} color="#2563EB" strokeWidth={2.5} />
                    </View>
                    <Text className="text-slate-900 font-black text-base tracking-tight">{title}</Text>
                </View>
                <Text className="text-slate-500 text-xs font-medium leading-4">{subtitle}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: "#E2E8F0", true: "#1E40AF" }}
                thumbColor="#FFFFFF"
            />
        </View>
    );

    const handleSave = () => {
        Alert.alert("Success", "Your privacy preferences have been updated.");
        router.back();
    };

    return (
        <View className="flex-1 bg-[#F9FAFC] relative">
            <StatusBar style="dark" />
            
            {/* Background Decorative Elements */}
            <View className="absolute top-0 left-0 right-0 h-[40%] pointer-events-none">
                <LinearGradient
                    colors={['#DBEAFE', '#F8FAFC', '#ffffff']}
                    locations={[0, 0.4, 1]}
                    className="flex-1"
                />
                <View className="absolute -top-32 -right-32 w-80 h-80 bg-blue-400/10 rounded-full" />
            </View>

            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                {/* Header */}
                <View className="flex-row justify-between items-center px-6 pt-4 pb-6 z-10 bg-transparent">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-white w-12 h-12 rounded-[18px] items-center justify-center shadow-sm shadow-slate-200/50 border border-slate-100"
                    >
                        <ChevronLeft size={24} color="#1E40AF" strokeWidth={2.5} className="-ml-1" />
                    </TouchableOpacity>
                    <Text className="text-[20px] font-black text-slate-900 tracking-tight">Data Sharing</Text>
                    <View className="w-12 h-12" />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
                    
                    <View className="bg-indigo-50/50 rounded-2xl p-5 flex-row border border-indigo-100 mb-8">
                        <Lock size={20} color="#4F46E5" style={{ marginTop: 2, marginRight: 12 }} strokeWidth={2.5} />
                        <View className="flex-1">
                            <Text className="text-indigo-900 text-sm font-bold mb-1">Your Privacy Matters</Text>
                            <Text className="text-indigo-800 text-xs font-medium leading-4 text-justify">
                                Control how your information is used. We never sell your personal data to third parties. Choose what you'd like to share with us.
                            </Text>
                        </View>
                    </View>

                    <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4 ml-1">
                        APP EXPERIENCE
                    </Text>

                    <View className="bg-white rounded-[28px] overflow-hidden shadow-sm shadow-slate-200/50 border border-slate-100 mb-8">
                        <PrivacyOption
                            icon={ShieldCheck}
                            title="Crash Reporting"
                            subtitle="Automatically send diagnostic data to help us fix bugs and improve stability."
                            value={crashReporting}
                            onToggle={setCrashReporting}
                        />
                        <PrivacyOption
                            icon={BarChart2}
                            title="Usage Analytics"
                            subtitle="Share anonymous data about how you use app features to help us improve the UI."
                            value={usageAnalytics}
                            onToggle={setUsageAnalytics}
                            isLast
                        />
                    </View>

                    <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4 ml-1">
                        COMMUNICATIONS
                    </Text>

                    <View className="bg-white rounded-[28px] overflow-hidden shadow-sm shadow-slate-200/50 border border-slate-100 mb-10">
                        <PrivacyOption
                            icon={Mail}
                            title="Marketing Emails"
                            subtitle="Receive updates about new features, tips, and special business offers."
                            value={marketingEmails}
                            onToggle={setMarketingEmails}
                        />
                        <PrivacyOption
                            icon={Globe}
                            title="Personalized Ads"
                            subtitle="Allow us to show you more relevant content and partnership deals."
                            value={personalizedAds}
                            onToggle={setPersonalizedAds}
                            isLast
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                    >
                        <LinearGradient
                            colors={['#1e3a8a', '#1E40AF']}
                            className="h-16 rounded-[22px] items-center justify-center shadow-xl shadow-blue-500/30"
                        >
                            <Text className="text-white font-black text-base uppercase tracking-widest">Update Preferences</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
