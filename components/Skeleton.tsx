import React, { useEffect } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: ViewStyle;
    className?: string;
}

export const Skeleton = ({ width, height, borderRadius = 8, style, className }: SkeletonProps) => {
    const opacity = new Animated.Value(0.3);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            className={`bg-slate-200 overflow-hidden ${className || ''}`}
            style={[
                {
                    width: width as any,
                    height: height as any,
                    borderRadius,
                    opacity,
                },
                style,
            ]}
        >
            <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
            />
        </Animated.View>
    );
};
