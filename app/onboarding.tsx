import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Zap, Share2, TrendingUp, ChevronRight } from 'lucide-react-native';
import { usePreferences } from '../context/PreferencesContext';

const { width } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        title: 'Facturez en 30 secondes',
        description: 'Créez des factures professionnelles en un clin d\'œil et gagnez du temps au quotidien.',
        icon: Zap,
        color: '#0066FF', // Modern Blue
    },
    {
        id: '2',
        title: 'Partagez sur WhatsApp',
        description: 'Envoyez vos factures directement à vos clients via WhatsApp ou par email en un clic.',
        icon: Share2,
        color: '#10B981', // Emerald
    },
    {
        id: '3',
        title: 'Gérez votre Business',
        description: 'Suivez vos revenus et gardez un œil sur la santé de votre activité en temps réel.',
        icon: TrendingUp,
        color: '#F59E0B', // Amber
    },
];

export default function Onboarding() {
    const router = useRouter();
    const { completeOnboarding } = usePreferences();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleScroll = (event: any) => {
        const scrollOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollOffset / width);
        setCurrentIndex(index);
    };

    const handleComplete = async () => {
        try {
            await completeOnboarding();
            router.replace('/auth');
        } catch (error) {
            console.error('Error saving onboarding status:', error);
            router.replace('/auth');
        }
    };

    const nextSlide = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            handleComplete();
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background" style={{ backgroundColor: '#EFF6FF' }} edges={['top', 'bottom']}>
            <View className="flex-1">
                <FlatList
                    ref={flatListRef}
                    data={slides}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={{ width }} className="flex-1 items-center justify-center p-8">
                            <View
                                className="w-40 h-40 rounded-3xl items-center justify-center mb-12 shadow-sm"
                                style={{ backgroundColor: `${item.color}15` }}
                            >
                                <item.icon size={80} color={item.color} strokeWidth={1.5} />
                            </View>
                            <Text className="text-3xl font-bold text-center text-slate-900 mb-4 px-4">
                                {item.title}
                            </Text>
                            <Text className="text-lg text-center text-slate-500 leading-relaxed px-6">
                                {item.description}
                            </Text>
                        </View>
                    )}
                />

                {/* Pagination Dots */}
                <View className="flex-row justify-center mb-12">
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            className={`h-2.5 rounded-full mx-1.5 transition-all duration-300 ${currentIndex === index ? 'w-10 bg-blue-600' : 'w-2.5 bg-slate-200'
                                }`}
                        />
                    ))}
                </View>

                {/* Footer */}
                <View className="px-8 pb-10">
                    {currentIndex === slides.length - 1 ? (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleComplete}
                            className="bg-blue-600 h-16 rounded-2xl items-center justify-center shadow-xl shadow-blue-200"
                        >
                            <Text className="text-white text-xl font-bold">Commencer</Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="flex-row items-center justify-between">
                            <TouchableOpacity
                                activeOpacity={0.6}
                                onPress={handleComplete}
                            >
                                <Text className="text-slate-400 text-lg font-semibold">Passer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={nextSlide}
                                className="bg-blue-600 w-16 h-16 rounded-2xl items-center justify-center shadow-lg shadow-blue-200"
                            >
                                <ChevronRight size={32} color="white" strokeWidth={2.5} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}
