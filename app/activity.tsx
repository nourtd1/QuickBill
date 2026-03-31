import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Check,
    FileText,
    AlertTriangle,
    UserPlus,
    Star,
    Bell
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useLanguage } from '../context/LanguageContext';

import { useNotifications } from '../hooks/useNotifications';
import { useColorScheme } from 'nativewind';
import { useAuth } from '../context/AuthContext';

const getActivityStyling = (type: string) => {
    switch (type) {
        case 'payment': return { icon: Check, color: '#10B981', bg: 'bg-emerald-100' };
        case 'invoice': return { icon: FileText, color: '#2563EB', bg: 'bg-blue-100' };
        case 'system': return { icon: AlertTriangle, color: '#DC2626', bg: 'bg-red-100' };
        default: return { icon: Bell, color: '#6366f1', bg: 'bg-indigo-50' };
    }
};

export default function ActivityScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const { t } = useLanguage();
    const { sections } = useNotifications();
    const { profile } = useAuth();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    
    // Pass real data into translations
    const translatedActivityData = sections.map(section => ({
        title: t(section.titleKey),
        data: section.data.map(item => ({
            ...item,
            displayTitle: item.title,
            displaySubtitle: item.message,
        }))
    }));

    return (
        <View className="flex-1 bg-[#F8F9FE] dark:bg-[#0a0f1e]">
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <SafeAreaView className="flex-1">
                <View className="flex-1 px-6 pt-2">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6 mt-2">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-12 h-12 bg-white dark:bg-[#151a2e] rounded-full items-center justify-center shadow-sm border border-slate-100 dark:border-white/10"
                        >
                            <ArrowLeft size={24} color={isDark ? '#E2E8F0' : '#1e293b'} />
                        </TouchableOpacity>

                        <Text className="text-xl font-bold text-slate-900">{t('activity.title')}</Text>

                        <TouchableOpacity
                            onPress={() => router.push('/notifications')}
                            className="w-12 h-12 bg-white dark:bg-[#151a2e] rounded-full items-center justify-center shadow-sm border border-slate-100 dark:border-white/10"
                        >
                            <Bell size={24} color="#6366f1" />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View className="bg-white dark:bg-[#151a2e] rounded-full px-5 py-3.5 flex-row items-center border border-slate-200 dark:border-white/10 shadow-sm mb-8">
                        <TextInput
                            className="flex-1 text-base text-slate-700 font-medium h-6 p-0"
                            placeholder={t('activity.search_placeholder')}
                            placeholderTextColor="#94a3b8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            style={{ height: 40 }}
                        />
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {translatedActivityData.map((section) => (
                            <View key={section.title} className="mb-6">
                                <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">
                                    {section.title}
                                </Text>

                                {section.data.map((item) => {
                                    const style = getActivityStyling(item.type);
                                    const Icon = style.icon;
                                    
                                    if (searchQuery && 
                                        !item.displayTitle.toLowerCase().includes(searchQuery.toLowerCase()) && 
                                        !item.displaySubtitle?.toLowerCase().includes(searchQuery.toLowerCase())) {
                                        return null;
                                    }
                                    
                                    return (
                                        <TouchableOpacity
                                            key={item.id}
                                            onPress={() => router.push('/notifications')}
                                                className="bg-white dark:bg-[#151a2e] rounded-[24px] p-5 mb-4 flex-row items-center shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)] border border-slate-50 dark:border-white/10"
                                        >
                                            <View className={`w-12 h-12 rounded-full ${style.bg} items-center justify-center mr-4`}>
                                                <Icon
                                                    size={22}
                                                    color={style.color}
                                                    strokeWidth={2.5}
                                                />
                                            </View>

                                            <View className="flex-1 mr-2">
                                                <Text className="text-slate-900 dark:text-white font-bold text-base mb-0.5" numberOfLines={1}>
                                                    {item.displayTitle}
                                                </Text>
                                                <Text className="text-slate-500 dark:text-slate-300 text-sm font-medium" numberOfLines={1}>
                                                    {item.displaySubtitle}
                                                </Text>
                                            </View>

                                            <View>
                                                <Text className="text-slate-500 dark:text-slate-300 text-xs font-bold text-right">
                                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                                <Text className="text-[9px] text-slate-400 dark:text-slate-400 text-right">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                        <View className="h-20" />
                    </ScrollView>
                </View>
            </SafeAreaView>
        </View>
    );
}
