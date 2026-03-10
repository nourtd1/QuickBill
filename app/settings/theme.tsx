import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Lightbulb } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ThemeSettingsScreen() {
    const router = useRouter();
    const { colorScheme, setColorScheme } = useColorScheme();
    const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('system');

    useEffect(() => {
        AsyncStorage.getItem('quickbill_theme').then(saved => {
            if (saved) setSelectedTheme(saved as any);
        });
    }, []);

    const handleThemeSelect = async (theme: 'light' | 'dark' | 'system') => {
        setSelectedTheme(theme);
        setColorScheme(theme);
        await AsyncStorage.setItem('quickbill_theme', theme);
    };

    const ThemeOption = ({ theme, title, description, isSelected, children }: any) => (
        <TouchableOpacity
            onPress={() => handleThemeSelect(theme)}
            className={`flex-row items-center p-4 mb-4 rounded-3xl border ${isSelected ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-none' : 'bg-white dark:bg-slate-800 border-transparent shadow-sm'}`}
            activeOpacity={0.9}
        >
            <View className="mr-5">
                {children}
            </View>
            <View className="flex-1 mr-4">
                <Text className="text-slate-900 dark:text-white font-bold text-lg mb-1">{title}</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-sm leading-5">{description}</Text>
            </View>
            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                {isSelected && <View className="w-3 h-3 rounded-full bg-blue-500" />}
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-[#F9FAFB] dark:bg-slate-900">
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-2 mb-6">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={24} color={colorScheme === 'dark' ? '#F8fafc' : '#0F172A'} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900 dark:text-white">App Theme</Text>
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -mr-2">
                        <Text className="text-blue-600 dark:text-blue-400 font-bold text-lg">Done</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

                    <Text className="text-slate-500 text-sm mb-6 leading-5">
                        Choose how QuickBill looks on your device.
                    </Text>

                    {/* Light Mode */}
                    <ThemeOption
                        theme="light"
                        title="Light Mode"
                        description="Clean and bright look, ideal for daylight environments."
                        isSelected={selectedTheme === 'light'}
                    >
                        <View className="w-16 h-20 bg-slate-100 rounded-xl border border-slate-200 p-2 overflow-hidden shadow-sm relative">
                            {/* Mock UI for Light Mode */}
                            <View className="h-2 w-10 bg-white rounded-full mb-2" />
                            <View className="h-1.5 w-full bg-white rounded-full mb-1" />
                            <View className="h-1.5 w-8 bg-white rounded-full mb-3" />
                            <View className="absolute bottom-2 left-2 w-4 h-4 rounded-full bg-blue-100" />
                        </View>
                    </ThemeOption>

                    {/* Dark Mode */}
                    <ThemeOption
                        theme="dark"
                        title="Dark Mode"
                        description="Easy on the eyes, perfect for low-light conditions."
                        isSelected={selectedTheme === 'dark'}
                    >
                        <View className="w-16 h-20 bg-slate-900 rounded-xl border border-slate-800 p-2 overflow-hidden shadow-sm relative">
                            {/* Mock UI for Dark Mode */}
                            <View className="h-2 w-10 bg-slate-700 rounded-full mb-2" />
                            <View className="h-1.5 w-full bg-slate-700 rounded-full mb-1" />
                            <View className="h-1.5 w-8 bg-slate-700 rounded-full mb-3" />
                            <View className="absolute bottom-2 left-2 w-4 h-4 rounded-full bg-indigo-900" />
                        </View>
                    </ThemeOption>

                    {/* System Default */}
                    <ThemeOption
                        theme="system"
                        title="System Default"
                        description="We'll automatically adjust to your device's settings."
                        isSelected={selectedTheme === 'system'}
                    >
                        <View className="w-16 h-20 flex-row rounded-xl overflow-hidden border border-slate-200 relative shadow-sm">
                            {/* Half Light */}
                            <View className="w-1/2 h-full bg-slate-100 p-2">
                                <View className="h-2 w-4 bg-white rounded-full mb-2" />
                                <View className="h-1.5 w-full bg-white rounded-full mb-1" />
                                <View className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-blue-100" />
                            </View>
                            {/* Half Dark */}
                            <View className="w-1/2 h-full bg-slate-900 p-2">
                                <View className="h-2 w-4 bg-slate-700 rounded-full mb-2" />
                                <View className="h-1.5 w-full bg-slate-700 rounded-full mb-1" />
                                <View className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-indigo-900" />
                            </View>
                        </View>
                    </ThemeOption>


                    {/* Info Card */}
                    <View className="mt-4 bg-white dark:bg-slate-800 rounded-[24px] p-5 flex-row items-start shadow-sm mb-10">
                        <View className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 items-center justify-center mr-4 mt-1">
                            <Lightbulb size={20} color="#D97706" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-900 dark:text-white font-bold text-base mb-1">Did you know?</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-sm leading-5">
                                Dark mode can help save battery life on OLED screens and reduce eye strain during night usage.
                            </Text>
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
