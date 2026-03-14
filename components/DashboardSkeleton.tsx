import React from 'react';
import { View, ScrollView } from 'react-native';
import { Skeleton } from './Skeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const DashboardSkeleton = () => {
    const insets = useSafeAreaInsets();
    
    return (
        <ScrollView 
            className="flex-1 px-6 pt-2 bg-white" 
            contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Header Skeleton */}
            <View className="flex-row justify-between items-center mb-10">
                <View className="flex-row items-center">
                    <Skeleton width={56} height={56} borderRadius={18} className="mr-4" />
                    <View>
                        <Skeleton width={80} height={10} borderRadius={4} className="mb-2" />
                        <Skeleton width={120} height={20} borderRadius={6} />
                    </View>
                </View>
                <Skeleton width={48} height={48} borderRadius={24} />
            </View>

            {/* main Card Skeleton */}
            <Skeleton width="100%" height={180} borderRadius={32} className="mb-8" />

            {/* Stats Row */}
            <View className="flex-row justify-between mb-10">
                <Skeleton width="48%" height={100} borderRadius={24} />
                <Skeleton width="48%" height={100} borderRadius={24} />
            </View>

            {/* Quick Actions */}
            <View className="mb-4">
                <Skeleton width={100} height={12} borderRadius={4} className="mb-6" />
                <View className="flex-row justify-between px-1">
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} className="items-center">
                            <Skeleton width={64} height={64} borderRadius={20} className="mb-2" />
                            <Skeleton width={40} height={8} borderRadius={4} />
                        </View>
                    ))}
                </View>
            </View>

            {/* Activity List */}
            <View className="mt-8">
                <View className="flex-row justify-between items-center mb-6">
                    <Skeleton width={120} height={12} borderRadius={4} />
                    <Skeleton width={60} height={12} borderRadius={4} />
                </View>
                {[1, 2, 3].map((i) => (
                    <View key={i} className="flex-row items-center p-4 bg-slate-50 rounded-[24px] mb-3 border border-slate-100">
                        <Skeleton width={48} height={48} borderRadius={12} className="mr-4" />
                        <View className="flex-1">
                            <Skeleton width="60%" height={14} borderRadius={4} className="mb-2" />
                            <Skeleton width="30%" height={10} borderRadius={4} />
                        </View>
                        <View className="items-end">
                            <Skeleton width={60} height={16} borderRadius={4} className="mb-2" />
                            <Skeleton width={40} height={12} borderRadius={4} />
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};
