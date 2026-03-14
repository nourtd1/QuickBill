import React from 'react';
import { View, ScrollView } from 'react-native';
import { Skeleton } from './Skeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const FormSkeleton = () => {
    const insets = useSafeAreaInsets();
    
    return (
        <ScrollView 
            className="flex-1 px-6 bg-white" 
            contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View className="flex-row items-center mb-10">
                <Skeleton width={40} height={40} borderRadius={20} className="mr-6" />
                <Skeleton width={180} height={28} borderRadius={8} />
            </View>

            {/* Avatar/Logo Picker Skeleton */}
            <View className="items-center mb-10">
                <Skeleton width={100} height={100} borderRadius={30} className="mb-4" />
                <Skeleton width={120} height={12} borderRadius={4} />
            </View>

            {/* Form Sections */}
            {[1, 2, 3].map((section) => (
                <View key={section} className="mb-8">
                    <Skeleton width={120} height={10} borderRadius={4} className="mb-4 ml-1" />
                    
                    {[1, 2].map((field) => (
                        <View key={field} className="mb-5">
                            <Skeleton width={100} height={8} borderRadius={4} className="mb-2 ml-1" />
                            <Skeleton width="100%" height={64} borderRadius={22} />
                        </View>
                    ))}
                </View>
            ))}

            {/* Button Skeleton */}
            <Skeleton width="100%" height={60} borderRadius={22} className="mt-4" />
        </ScrollView>
    );
};
