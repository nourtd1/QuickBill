import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Check } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const SUGGESTED_LANGUAGES = [
    { code: 'en-US', name: 'English (US)', englishName: 'English', flag: 'us' },
    { code: 'fr-FR', name: 'Français', englishName: 'French', flag: 'fr' },
];

const ALL_LANGUAGES = [
    { code: 'es-ES', name: 'Español', englishName: 'Spanish', flag: 'es' },
    { code: 'de-DE', name: 'Deutsch', englishName: 'German', flag: 'de' },
    { code: 'it-IT', name: 'Italiano', englishName: 'Italian', flag: 'it' },
    { code: 'pt-PT', name: 'Português', englishName: 'Portuguese', flag: 'pt' },
    { code: 'ja-JP', name: '日本語', englishName: 'Japanese', flag: 'jp' },
    { code: 'zh-CN', name: '中文', englishName: 'Chinese (Simplified)', flag: 'cn' },
    { code: 'ar-SA', name: 'العربية', englishName: 'Arabic', flag: 'sa' },
    { code: 'rw-RW', name: 'Ikinyarwanda', englishName: 'Kinyarwanda', flag: 'rw' },
    { code: 'sw-KE', name: 'Kiswahili', englishName: 'Swahili', flag: 'ke' },
];

export default function LanguageSettingsScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('en-US');

    const handleSelect = (code: string) => {
        setSelectedLanguage(code);
        // Persist language preference here
    };

    const filterLanguages = (languages: typeof ALL_LANGUAGES) => {
        if (!searchQuery) return languages;
        const lowerQuery = searchQuery.toLowerCase();
        return languages.filter(
            lang =>
                lang.name.toLowerCase().includes(lowerQuery) ||
                lang.englishName.toLowerCase().includes(lowerQuery)
        );
    };

    const filteredSuggested = filterLanguages(SUGGESTED_LANGUAGES);
    const filteredAll = filterLanguages(ALL_LANGUAGES);

    const LanguageRow = ({ item, isLast, isFirst }: { item: typeof ALL_LANGUAGES[0], isLast?: boolean, isFirst?: boolean }) => {
        const isSelected = selectedLanguage === item.code;
        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleSelect(item.code)}
                className={`flex-row items-center p-4 bg-white border-slate-100 ${!isLast ? 'border-b' : ''} ${isFirst ? 'rounded-t-[20px]' : ''} ${isLast ? 'rounded-b-[20px]' : ''}`}
            >
                <View className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden mr-4 border border-slate-200 shadow-sm relative">
                    {/* Using flagcdn for flags. Ensure internet access is available or handle offline elegantly */}
                    <Image
                        source={{ uri: `https://flagcdn.com/w160/${item.flag}.png` }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                    {/* Overlay to give it a slight shine/3D effect like in the design */}
                    <View className="absolute inset-0 bg-black/5 rounded-full" />
                </View>

                <View className="flex-1">
                    <Text className="text-slate-900 font-bold text-base">{item.name}</Text>
                    <Text className="text-slate-400 text-sm font-medium">{item.englishName}</Text>
                </View>

                <View className={`w-6 h-6 rounded-full items-center justify-center border-2 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-200'}`}>
                    {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-[#F9FAFB]">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center px-4 py-2 mb-2">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
                        <ArrowLeft size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900">Language</Text>
                </View>

                {/* Search Bar */}
                <View className="px-5 mb-6">
                    <View className="flex-row items-center bg-slate-100 rounded-2xl px-4 py-3">
                        <Search size={20} color="#94A3B8" style={{ marginRight: 10 }} />
                        <TextInput
                            className="flex-1 text-slate-900 font-medium text-base h-full"
                            placeholder="Search language"
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

                    {/* Suggested Section */}
                    {filteredSuggested.length > 0 && (
                        <View className="mb-6">
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 ml-1">
                                SUGGESTED
                            </Text>
                            <View className="rounded-[20px] overflow-hidden bg-white shadow-sm border border-slate-50">
                                {filteredSuggested.map((lang, index) => (
                                    <LanguageRow
                                        key={lang.code}
                                        item={lang}
                                        isFirst={index === 0}
                                        isLast={index === filteredSuggested.length - 1}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* All Languages Section */}
                    {filteredAll.length > 0 && (
                        <View className="mb-10">
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 ml-1">
                                ALL LANGUAGES
                            </Text>
                            <View className="rounded-[20px] overflow-hidden bg-white shadow-sm border border-slate-50">
                                {filteredAll.map((lang, index) => (
                                    <LanguageRow
                                        key={lang.code}
                                        item={lang}
                                        isFirst={index === 0}
                                        isLast={index === filteredAll.length - 1}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {filteredSuggested.length === 0 && filteredAll.length === 0 && (
                        <View className="items-center justify-center py-10">
                            <Text className="text-slate-400 font-medium">No results found for "{searchQuery}"</Text>
                        </View>
                    )}

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
