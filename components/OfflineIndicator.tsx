import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { useSync } from '../hooks/useSync';
import { WifiOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OfflineIndicator = () => {
    const { isConnected, pendingCount } = useOfflineStatus();
    const { isSyncing, startSync } = useSync();
    const [visible, setVisible] = useState(false);
    const insets = useSafeAreaInsets();
    const translateY = useState(new Animated.Value(-100))[0];

    useEffect(() => {
        const shouldShow = !isConnected || isSyncing || pendingCount > 0;
        
        if (shouldShow && !visible) {
            setVisible(true);
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 40,
                friction: 7
            }).start();
        } else if (!shouldShow && visible) {
            Animated.timing(translateY, {
                toValue: -120,
                duration: 500,
                useNativeDriver: true
            }).start(() => setVisible(false));
        }
    }, [isConnected, isSyncing, pendingCount]);

    if (!visible && !isConnected && !isSyncing && pendingCount === 0) return null;

    let bgColor: string = COLORS.slate800;
    let icon = <RefreshCw size={14} color="white" />;
    let text = "Mise à jour...";
    let subtext = "";

    if (!isConnected) {
        bgColor = COLORS.danger;
        icon = <WifiOff size={14} color="white" />;
        text = "Mode Hors-ligne";
        subtext = pendingCount > 0 ? `${pendingCount} modifications en attente` : "Pas de connexion";
    } else if (isSyncing) {
        bgColor = COLORS.primary;
        icon = <RefreshCw size={14} color="white" className="animate-spin" />;
        text = "Synchronisation...";
        subtext = "Envoi des données vers le cloud";
    } else if (pendingCount > 0) {
        bgColor = COLORS.warning;
        icon = <AlertCircle size={14} color="white" />;
        text = "Données locales";
        subtext = `${pendingCount} éléments à synchroniser`;
    }

    return (
        <Animated.View 
            style={{ 
                transform: [{ translateY }],
                zIndex: 999,
                position: 'absolute',
                top: insets.top + 5,
                left: 20,
                right: 20,
            }}
        >
            <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => isConnected && !isSyncing && startSync()}
                style={{
                    backgroundColor: bgColor,
                    borderRadius: 16,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: bgColor,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                }}
            >
                <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center mr-3">
                    {icon}
                </View>
                <View className="flex-1">
                    <Text className="text-white font-black text-[12px] uppercase tracking-wider">{text}</Text>
                    {subtext ? <Text className="text-white/80 text-[10px] font-medium">{subtext}</Text> : null}
                </View>
                
                {isConnected && !isSyncing && pendingCount > 0 && (
                    <View className="bg-white/20 px-3 py-1 rounded-full">
                        <Text className="text-white text-[10px] font-bold">SYNCHRONISER</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};
