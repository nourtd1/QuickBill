import React from 'react';
import { View, ScrollView } from 'react-native';
import { Skeleton } from './Skeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ClientListSkeleton = () => {
    const insets = useSafeAreaInsets();
    
    return (
        <ScrollView 
            className="flex-1 px-6 bg-white" 
            contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-8">
                <Skeleton width={150} height={40} borderRadius={8} />
                <Skeleton width={48} height={48} borderRadius={18} />
            </View>

            {/* Search Bar */}
            <View className="flex-row gap-3 mb-8">
                <Skeleton width="80%" height={56} borderRadius={22} />
                <Skeleton width={56} height={56} borderRadius={22} />
            </View>

            {/* Filter Pills */}
            <View className="flex-row mb-10">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} width={100} height={36} borderRadius={20} className="mr-3" />
                ))}
            </View>

            {/* Section Tag */}
            <Skeleton width={120} height={10} borderRadius={4} className="mb-6 ml-1" />

            {/* List Items */}
            {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} className="bg-slate-50 p-5 rounded-[24px] mb-4 flex-row justify-between items-center border border-slate-100">
                    <View className="flex-row items-center gap-4">
                        <Skeleton width={56} height={56} borderRadius={18} />
                        <View>
                            <Skeleton width={120} height={16} borderRadius={4} className="mb-2" />
                            <Skeleton width={80} height={10} borderRadius={4} />
                        </View>
                    </View>
                    <View className="items-end">
                        <Skeleton width={60} height={10} borderRadius={4} className="mb-2" />
                        <Skeleton width={80} height={20} borderRadius={6} />
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};
