import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSmartPriceSuggestion } from '../lib/aiAssistantService';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/currencyEngine'; // Assuming this exists or similar

interface PriceSuggestionProps {
    itemName: string;
    onAccept: (price: number) => void;
    currentPrice?: number;
    currency: string;
}

export const SmartPriceSuggestion: React.FC<PriceSuggestionProps> = ({ itemName, onAccept, currentPrice, currency }) => {
    const { session } = useAuth();
    const [suggestion, setSuggestion] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!itemName || itemName.length < 3 || !session?.user?.id) {
            setVisible(false);
            return;
        }

        const fetch = async () => {
            setLoading(true);
            // Artificial delay debounce
            await new Promise(r => setTimeout(r, 500));

            const result = await getSmartPriceSuggestion(session.user.id, itemName);
            if (result && result.price > 0 && result.price !== currentPrice) {
                setSuggestion(result);
                setVisible(true);
            } else {
                setVisible(false);
            }
            setLoading(false);
        };

        const timer = setTimeout(fetch, 800);
        return () => clearTimeout(timer);
    }, [itemName, session?.user?.id]); // Don't depend on currentPrice to avoid loop, just check once

    if (!visible || !suggestion) return null;

    return (
        <Animated.View className="mt-2 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
                <View className="bg-indigo-100 p-1.5 rounded-full mr-3">
                    <Ionicons name="sparkles" size={16} color="#4F46E5" />
                </View>
                <View>
                    <Text className="text-xs text-indigo-800 font-bold">Suggestion IA</Text>
                    <Text className="text-xs text-indigo-600">
                        Prix habituel : {formatCurrency(suggestion.price, currency)}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                onPress={() => onAccept(suggestion.price)}
                className="bg-indigo-600 px-3 py-1.5 rounded-md"
            >
                <Text className="text-white text-xs font-bold">Appliquer</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

interface AnomalyAlertProps {
    alerts: Array<{ type: string; message: string; severity: string }>;
}

export const AnomalyAlert: React.FC<AnomalyAlertProps> = ({ alerts }) => {
    if (!alerts || alerts.length === 0) return null;

    return (
        <View className="mb-4 space-y-2">
            {alerts.map((alert, idx) => (
                <View key={idx} className={`p-3 rounded-lg border flex-row items-start ${alert.severity === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
                    }`}>
                    <Ionicons
                        name={alert.severity === 'warning' ? 'warning' : 'alert-circle'}
                        size={20}
                        color={alert.severity === 'warning' ? '#D97706' : '#DC2626'}
                        style={{ marginTop: 2 }}
                    />
                    <Text className={`ml-3 flex-1 text-sm ${alert.severity === 'warning' ? 'text-amber-800' : 'text-red-800'
                        }`}>
                        {alert.message}
                    </Text>
                </View>
            ))}
        </View>
    );
};
