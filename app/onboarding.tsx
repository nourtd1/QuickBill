import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Zap, Share2, TrendingUp, ChevronRight, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePreferences } from '../context/PreferencesContext';

const { width } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        title: 'Facturation\nUltrarapide',
        description: 'Créez des factures professionnelles en moins de 30 secondes. Simple. Efficace.',
        icon: Zap,
        color: '#3B82F6', // Blue-500
        bgGradient: ['#EFF6FF', '#DBEAFE']
    },
    {
        id: '2',
        title: 'Partage\nInstantané',
        description: 'Envoyez vos documents par WhatsApp ou email en un seul clic. Vos clients vont adorer.',
        icon: Share2,
        color: '#10B981', // Emerald-500
        bgGradient: ['#ECFDF5', '#D1FAE5']
    },
    {
        id: '3',
        title: 'Pilotez votre\nSuccès',
        description: 'Suivez vos revenus et dépenses en temps réel. Prenez les bonnes décisions.',
        icon: TrendingUp,
        color: '#F59E0B', // Amber-500
        bgGradient: ['#FFFBEB', '#FEF3C7']
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
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

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
                    <View style={{ width }} className="flex-1 relative">
                        {/* Background Gradient */}
                        <LinearGradient
                            colors={currentIndex === 0 ? ['#EFF6FF', '#FFFFFF'] : currentIndex === 1 ? ['#ECFDF5', '#FFFFFF'] : ['#FFFBEB', '#FFFFFF']}
                            className="absolute top-0 left-0 right-0 h-[60%]"
                        />

                        <SafeAreaView className="flex-1 items-center px-8 pt-20">
                            {/* Icon Container with Glass Effect */}
                            <View
                                className="w-64 h-64 rounded-full items-center justify-center mb-16 shadow-2xl relative"
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.8)',
                                    shadowColor: item.color,
                                    shadowOffset: { width: 0, height: 20 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 30,
                                }}
                            >
                                <View className="absolute inset-0 rounded-full border border-white/50" />
                                <View className="p-8 rounded-3xl bg-white shadow-sm">
                                    <item.icon size={64} color={item.color} strokeWidth={2} />
                                </View>
                            </View>

                            <View className="w-full">
                                <Text className="text-4xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
                                    {item.title}
                                </Text>
                                <Text className="text-lg text-slate-500 font-medium leading-relaxed pr-4">
                                    {item.description}
                                </Text>
                            </View>
                        </SafeAreaView>
                    </View>
                )}
            />

            {/* Bottom Controls */}
            <SafeAreaView className="absolute bottom-0 left-0 right-0 px-8 pb-8">
                <View className="flex-row justify-between items-center">

                    {/* Pagination Dots */}
                    <View className="flex-row space-x-2">
                        {slides.map((_, index) => (
                            <View
                                key={index}
                                className={`h-2 rounded-full transition-all duration-300 ${currentIndex === index ? 'w-8 bg-slate-900' : 'w-2 bg-slate-200'
                                    }`}
                            />
                        ))}
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={nextSlide}
                        className={`h-16 flex-row items-center justify-center rounded-2xl shadow-xl transition-all ${currentIndex === slides.length - 1
                                ? 'bg-slate-900 px-8 shadow-slate-300'
                                : 'bg-white w-16 border border-slate-100 shadow-slate-200'
                            }`}
                        style={{
                            shadowColor: currentIndex === slides.length - 1 ? '#0F172A' : '#64748B',
                            shadowOpacity: 0.2,
                            shadowRadius: 10,
                            elevation: 5
                        }}
                    >
                        {currentIndex === slides.length - 1 ? (
                            <>
                                <Text className="text-white text-lg font-bold mr-2">C'est parti</Text>
                                <Check size={20} color="white" strokeWidth={3} />
                            </>
                        ) : (
                            <ChevronRight size={28} color="#0F172A" strokeWidth={2.5} />
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}
