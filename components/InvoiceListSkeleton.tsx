import React from 'react';
import { View, ScrollView } from 'react-native';
import { Skeleton } from './Skeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const InvoiceListSkeleton = () => {
    const insets = useSafeAreaInsets();
    
    return (
        <ScrollView 
            className="flex-1 px-6 bg-white" 
            contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-8">
                <Skeleton width={180} height={40} borderRadius={8} />
                <View className="flex-row gap-3">
                    <Skeleton width={48} height={48} borderRadius={18} />
                    <Skeleton width={48} height={48} borderRadius={18} />
                </View>
            </View>

            {/* Search Bar */}
            <View className="flex-row gap-3 mb-8">
                <Skeleton width="80%" height={56} borderRadius={22} />
                <Skeleton width={56} height={56} borderRadius={22} />
            </View>

            {/* Filter Tabs */}
            <View className="flex-row mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} width={80} height={36} borderRadius={20} className="mr-3" />
                ))}
            </View>

            {/* Total Card Skeleton */}
            <Skeleton width="100%" height={220} borderRadius={32} className="mb-10" />

            {/* Section Tag */}
            <View className="flex-row justify-between items-center mb-6 px-1">
                <Skeleton width={120} height={10} borderRadius={4} />
                <Skeleton width={60} height={10} borderRadius={4} />
            </View>

            {/* List Items */}
            {[1, 2, 3, 4].map((i) => (
                <View key={i} className="mb-4 bg-slate-50 p-5 rounded-[24px] border border-slate-100 flex-row items-center">
                    <Skeleton width={48} height={48} borderRadius={24} className="mr-4" />
                    <View className="flex-1 mr-2">
                        <Skeleton width="70%" height={16} borderRadius={4} className="mb-2" />
                        <View className="flex-row items-center">
                            <Skeleton width={40} height={10} borderRadius={4} />
                            <View className="w-1 h-1 rounded-full bg-slate-200 mx-2" />
                            <Skeleton width={60} height={10} borderRadius={4} />
                        </View>
                    </View>
                    <View className="items-end">
                        <Skeleton width={80} height={20} borderRadius={6} className="mb-3" />
                        <Skeleton width={60} height={24} borderRadius={8} />
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};
