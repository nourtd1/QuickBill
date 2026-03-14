import React from 'react';
import { View, ScrollView } from 'react-native';
import { Skeleton } from './Skeleton';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export const InvoiceDetailSkeleton = () => {
    const insets = useSafeAreaInsets();
    
    return (
        <View className="flex-1 bg-slate-50">
            {/* Header Curve */}
            <LinearGradient
                colors={['#1E40AF', '#1e3a8a']}
                className="absolute top-0 left-0 right-0 h-[180px] rounded-b-[40px]"
            />

            <SafeAreaView className="flex-1">
                {/* Header Content */}
                <View className="flex-row items-center justify-between px-6 py-4 mb-2">
                    <Skeleton width={40} height={40} borderRadius={20} className="bg-white/20" />
                    <Skeleton width={120} height={20} borderRadius={4} className="bg-white/20" />
                    <Skeleton width={40} height={40} borderRadius={20} className="bg-white/20" />
                </View>

                <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                    {/* Invoice Number & Status */}
                    <View className="items-center mb-10">
                        <Skeleton width={100} height={10} borderRadius={4} className="mb-2 bg-white/20" />
                        <Skeleton width={180} height={32} borderRadius={8} className="bg-white/20" />
                    </View>

                    {/* Status Card Skeleton */}
                    <Skeleton width="100%" height={80} borderRadius={24} className="mb-6" />

                    {/* Main Details Card */}
                    <View className="bg-white rounded-3xl overflow-hidden mb-6">
                        {/* Client Section */}
                        <View className="p-6 bg-slate-50 border-b border-slate-100">
                            <View className="flex-row justify-between items-start">
                                <View>
                                    <Skeleton width={80} height={10} borderRadius={4} className="mb-3" />
                                    <Skeleton width={150} height={24} borderRadius={6} className="mb-2" />
                                    <Skeleton width={120} height={14} borderRadius={4} />
                                </View>
                                <View className="items-end">
                                    <Skeleton width={60} height={10} borderRadius={4} className="mb-3" />
                                    <Skeleton width={100} height={18} borderRadius={4} />
                                </View>
                            </View>
                        </View>

                        {/* Items List */}
                        <View className="p-6">
                            <Skeleton width={100} height={10} borderRadius={4} className="mb-6" />
                            {[1, 2, 3].map((i) => (
                                <View key={i} className="flex-row justify-between items-center mb-6">
                                    <View className="flex-1 mr-4">
                                        <Skeleton width="60%" height={16} borderRadius={4} className="mb-2" />
                                        <Skeleton width="30%" height={10} borderRadius={4} />
                                    </View>
                                    <Skeleton width={80} height={16} borderRadius={4} />
                                </View>
                            ))}

                            <View className="h-px bg-slate-100 my-6" />

                            <View className="flex-row justify-between items-center">
                                <Skeleton width={120} height={20} borderRadius={4} />
                                <View className="items-end">
                                    <Skeleton width={150} height={36} borderRadius={8} className="mb-1" />
                                    <Skeleton width={40} height={12} borderRadius={4} />
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Bottom Bar Skeleton */}
            <View className="absolute bottom-0 left-0 right-0 bg-white p-5 pt-4 pb-8 border-t border-slate-100 rounded-t-[30px]">
                <View className="flex-row gap-2">
                    <Skeleton width={48} height={56} borderRadius={16} />
                    <Skeleton width={48} height={56} borderRadius={16} />
                    <Skeleton width={48} height={56} borderRadius={16} />
                    <Skeleton width="100%" height={56} borderRadius={16} className="flex-1" />
                </View>
            </View>
        </View>
    );
};
