import React from 'react';
import { View, ScrollView } from 'react-native';
import { Skeleton } from './Skeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const AnalyticsSkeleton = () => {
    const insets = useSafeAreaInsets();
    
    return (
        <ScrollView 
            className="flex-1 bg-white" 
            contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View className="flex-row justify-between items-center px-6 mb-8">
                <View className="flex-row items-center">
                    <Skeleton width={40} height={40} borderRadius={12} className="mr-3" />
                    <Skeleton width={150} height={28} borderRadius={6} />
                </View>
                <Skeleton width={40} height={40} borderRadius={20} />
            </View>

            {/* Period Selector */}
            <View className="flex-row bg-slate-50 p-1 rounded-xl mb-8 mx-6">
                <Skeleton width="33%" height={40} borderRadius={8} className="flex-1 mr-1" />
                <Skeleton width="33%" height={40} borderRadius={8} className="flex-1 mr-1" />
                <Skeleton width="33%" height={40} borderRadius={8} className="flex-1" />
            </View>

            {/* Summary Grid */}
            <View className="flex-row px-6 gap-4 mb-8">
                <Skeleton width="48%" height={120} borderRadius={24} />
                <Skeleton width="48%" height={120} borderRadius={24} />
            </View>

            {/* Main Chart Card */}
            <View className="mx-6 mb-8">
                <Skeleton width="100%" height={320} borderRadius={32} />
            </View>

            {/* Breakdown Section */}
            <View className="mx-6 mb-8">
                <Skeleton width="100%" height={200} borderRadius={32} />
            </View>

            {/* Top Clients */}
            <View className="mx-6">
                <View className="flex-row justify-between items-center mb-6">
                    <Skeleton width={150} height={20} borderRadius={4} />
                    <Skeleton width={80} height={12} borderRadius={4} />
                </View>
                {[1, 2, 3].map((i) => (
                    <View key={i} className="flex-row items-center p-4 bg-slate-50 rounded-[24px] mb-3 border border-slate-100">
                        <Skeleton width={48} height={48} borderRadius={24} className="mr-4" />
                        <View className="flex-1">
                            <Skeleton width="60%" height={16} borderRadius={4} className="mb-2" />
                            <Skeleton width="30%" height={10} borderRadius={4} />
                        </View>
                        <View className="items-end">
                            <Skeleton width={100} height={20} borderRadius={6} className="mb-2" />
                            <Skeleton width={60} height={12} borderRadius={4} />
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};
