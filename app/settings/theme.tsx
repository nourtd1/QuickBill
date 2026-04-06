import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Lightbulb } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeSettingsScreen() {
    const router = useRouter();
    const { userThemePreference, resolvedTheme, setThemePreference } = useTheme();
    const { setColorScheme } = useColorScheme();

    const applyLightTheme = () => {
        setThemePreference('light');
        setColorScheme('light');
    };

    const ThemeOption = ({
        title,
        description,
        isSelected,
        disabled,
        comingSoonLabel,
        children,
        onPress,
    }: {
        title: string;
        description: string;
        isSelected: boolean;
        disabled?: boolean;
        comingSoonLabel?: string;
        children: React.ReactNode;
        onPress?: () => void;
    }) => {
        const content = (
            <>
                <View className="mr-5 opacity-100">{children}</View>
                <View className="flex-1 mr-4">
                    <View className="flex-row flex-wrap items-center gap-2 mb-1">
                        <Text
                            className={`font-bold text-lg ${disabled ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}
                        >
                            {title}
                        </Text>
                        {comingSoonLabel ? (
                            <View className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                <Text className="text-slate-600 dark:text-slate-300 text-xs font-semibold">
                                    {comingSoonLabel}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm leading-5">{description}</Text>
                </View>
                <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}
                >
                    {isSelected && <View className="w-3 h-3 rounded-full bg-blue-500" />}
                </View>
            </>
        );

        const baseCard = `flex-row items-center p-4 mb-4 rounded-3xl border ${
            disabled
                ? 'bg-slate-100/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-75'
                : isSelected
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-none'
                  : 'bg-white dark:bg-slate-800 border-transparent shadow-sm'
        }`;

        if (disabled) {
            return (
                <View className={baseCard} accessibilityState={{ disabled: true }}>
                    {content}
                </View>
            );
        }

        return (
            <TouchableOpacity onPress={onPress} className={baseCard} activeOpacity={0.9}>
                {content}
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-[#F9FAFB] dark:bg-[#0a0f1e]">
            <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-2 mb-6">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={24} color={resolvedTheme === 'dark' ? '#F8fafc' : '#0F172A'} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900 dark:text-white">App Theme</Text>
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -mr-2">
                        <Text className="text-blue-600 dark:text-blue-400 font-bold text-lg">Done</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

                    <Text className="text-slate-500 dark:text-slate-400 text-sm mb-4 leading-5">
                        Choose how QuickBill looks on your device.
                    </Text>

                    <View className="mb-6 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-4 py-3">
                        <Text className="text-slate-900 dark:text-slate-100 font-semibold text-sm mb-1.5">
                            Thème disponible pour l’instant
                        </Text>
                        <Text className="text-slate-600 dark:text-slate-300 text-sm leading-5">
                            Seul le mode clair est activé. Le mode sombre et l’option « identique à l’appareil » seront
                            proposés dans une prochaine mise à jour de l’application.
                        </Text>
                    </View>

                    {/* Light Mode */}
                    <ThemeOption
                        title="Light Mode"
                        description="Clean and bright look, ideal for daylight environments."
                        isSelected={userThemePreference === 'light'}
                        onPress={applyLightTheme}
                    >
                        <View className="w-16 h-20 bg-slate-100 rounded-xl border border-slate-200 p-2 overflow-hidden shadow-sm relative">
                            {/* Mock UI for Light Mode */}
                            <View className="h-2 w-10 bg-white rounded-full mb-2" />
                            <View className="h-1.5 w-full bg-white rounded-full mb-1" />
                            <View className="h-1.5 w-8 bg-white rounded-full mb-3" />
                            <View className="absolute bottom-2 left-2 w-4 h-4 rounded-full bg-blue-100" />
                        </View>
                    </ThemeOption>

                    {/* Dark Mode — désactivé pour l’instant */}
                    <ThemeOption
                        title="Dark Mode"
                        description="Bientôt : confort visuel en faible lumière."
                        isSelected={false}
                        disabled
                        comingSoonLabel="Bientôt"
                    >
                        <View className="w-16 h-20 bg-slate-900 rounded-xl border border-slate-800 p-2 overflow-hidden shadow-sm relative">
                            {/* Mock UI for Dark Mode */}
                            <View className="h-2 w-10 bg-slate-700 rounded-full mb-2" />
                            <View className="h-1.5 w-full bg-slate-700 rounded-full mb-1" />
                            <View className="h-1.5 w-8 bg-slate-700 rounded-full mb-3" />
                            <View className="absolute bottom-2 left-2 w-4 h-4 rounded-full bg-indigo-900" />
                        </View>
                    </ThemeOption>

                    {/* System Default — désactivé pour l’instant */}
                    <ThemeOption
                        title="System Default"
                        description="Bientôt : suivi automatique des réglages de l’appareil."
                        isSelected={false}
                        disabled
                        comingSoonLabel="Bientôt"
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


                    {/* Rappel */}
                    <View className="mt-4 bg-white dark:bg-slate-800 rounded-[24px] p-5 flex-row items-start shadow-sm mb-10">
                        <View className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 items-center justify-center mr-4 mt-1">
                            <Lightbulb size={20} color="#D97706" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-900 dark:text-white font-bold text-base mb-1">À retenir</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-sm leading-5">
                                Dès que les autres thèmes seront prêts, vous pourrez les activer ici sans mettre à jour
                                manuellement vos réglages ailleurs.
                            </Text>
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
