import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Zap, Share2, TrendingUp, ArrowRight, Check, Sparkles, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { usePreferences } from '../context/PreferencesContext';

const { width } = Dimensions.get('window');

type Slide = {
    id: string;
    title: string;
    description: string;
    icon: typeof Zap;
    gradient: readonly [string, string];
    tint: readonly [string, string];
};

const slides: Slide[] = [
    {
        id: '1',
        title: 'Facturation\nultra rapide',
        description:
            'Créez des factures professionnelles en quelques secondes. Un flux pensé pour les indépendants et les équipes.',
        icon: Zap,
        gradient: ['#1D4ED8', '#1E3A8A'],
        tint: ['#DBEAFE', '#EFF6FF'],
    },
    {
        id: '2',
        title: 'Partage\ninstantané',
        description:
            'Envoyez vos devis et factures par WhatsApp ou e-mail en un geste. Vos clients reçoivent un document clair et soigné.',
        icon: Share2,
        gradient: ['#059669', '#047857'],
        tint: ['#D1FAE5', '#ECFDF5'],
    },
    {
        id: '3',
        title: 'Pilotez votre\ncroissance',
        description:
            'Visualisez vos revenus et gardez le cap sur votre activité. Des indicateurs simples, actionnables au quotidien.',
        icon: TrendingUp,
        gradient: ['#D97706', '#B45309'],
        tint: ['#FEF3C7', '#FFFBEB'],
    },
];

export default function Onboarding() {
    const router = useRouter();
    const { completeOnboarding } = usePreferences();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
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
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            handleComplete();
        }
    };

    const isLast = currentIndex === slides.length - 1;

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

            <View className="absolute top-0 left-0 right-0 h-[55%] overflow-hidden">
                <LinearGradient
                    colors={['#EFF6FF', '#F8FAFC', '#F1F5F9']}
                    locations={[0, 0.5, 1]}
                    className="flex-1"
                />
                <View className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-sky-400/[0.12]" />
                <View className="absolute top-32 -left-20 w-56 h-56 rounded-full bg-indigo-500/[0.08]" />
                <View className="absolute bottom-8 right-1/4 w-36 h-36 rounded-full bg-blue-300/[0.1]" />
            </View>

            <View className="absolute top-2 right-0 z-10 px-6 pt-1">
                <TouchableOpacity onPress={handleComplete} hitSlop={12} className="py-2 pl-4">
                    <Text className="text-[15px] font-semibold text-slate-500">Passer</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={slides}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                keyExtractor={(item) => item.id}
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
                onScrollToIndexFailed={({ index }) => {
                    setTimeout(() => {
                        flatListRef.current?.scrollToIndex({ index, animated: true });
                    }, 350);
                }}
                renderItem={({ item }) => (
                    <View style={{ width }} className="flex-1 justify-center px-6 pt-10 pb-36">
                        <View className="items-center mb-8">
                            <View className="w-[76px] h-[76px] rounded-[26px] bg-white items-center justify-center border border-slate-200/90 shadow-xl shadow-slate-900/[0.08]">
                                <LinearGradient
                                    colors={['#1D4ED8', '#1E3A8A']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    className="w-[52px] h-[52px] rounded-[18px] items-center justify-center"
                                >
                                    <Sparkles size={26} color="white" strokeWidth={2} />
                                </LinearGradient>
                            </View>
                            <Text className="text-[26px] font-bold text-slate-900 mt-5 tracking-tight">
                                QuickBill <Text className="text-blue-600">Premium</Text>
                            </Text>
                            <View className="mt-2.5 px-3 py-1 rounded-full bg-white/90 border border-slate-200/80">
                                <Text className="text-[11px] font-semibold text-slate-600 tracking-wide">
                                    Facturation & gestion pro
                                </Text>
                            </View>
                        </View>

                        <View className="rounded-[28px] border border-slate-200/90 bg-white p-8 shadow-xl shadow-slate-900/[0.06]">
                            <LinearGradient
                                colors={item.tint}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="w-[72px] h-[72px] rounded-[22px] items-center justify-center mb-7 border border-white/80 self-center"
                            >
                                <LinearGradient
                                    colors={item.gradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    className="w-14 h-14 rounded-[18px] items-center justify-center"
                                >
                                    <item.icon size={30} color="white" strokeWidth={2} />
                                </LinearGradient>
                            </LinearGradient>

                            <Text className="text-[26px] font-bold text-slate-900 mb-4 tracking-tight leading-8">
                                {item.title}
                            </Text>
                            <Text className="text-[15px] text-slate-500 leading-6 font-normal">{item.description}</Text>
                        </View>
                    </View>
                )}
            />

            <SafeAreaView
                className="absolute bottom-0 left-0 right-0 border-t border-slate-200/70 bg-white/95 px-6 pt-5 pb-2"
                edges={['bottom']}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        {slides.map((_, index) => (
                            <View
                                key={index}
                                className={`h-2 rounded-full ${currentIndex === index ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'} ${index > 0 ? 'ml-2' : ''}`}
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.92}
                        onPress={nextSlide}
                        className="overflow-hidden rounded-2xl shadow-lg shadow-blue-500/25"
                    >
                        <LinearGradient
                            colors={['#1D4ED8', '#1E3A8A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className={`flex-row h-[52px] items-center justify-center px-6 ${isLast ? 'min-w-[160px]' : 'w-[52px]'}`}
                        >
                            {isLast ? (
                                <>
                                    <Text className="text-white text-[15px] font-semibold mr-2">{"C'est parti"}</Text>
                                    <Check size={19} color="white" strokeWidth={2.5} />
                                </>
                            ) : (
                                <ArrowRight size={22} color="white" strokeWidth={2.5} />
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View className="mt-5 flex-row items-center justify-center opacity-50 pb-2">
                    <ShieldCheck size={15} color="#64748B" strokeWidth={2} />
                    <Text className="text-[11px] font-medium text-slate-500 ml-2 tracking-wide">
                        Données protégées · SSL
                    </Text>
                </View>
            </SafeAreaView>
        </SafeAreaView>
    );
}
