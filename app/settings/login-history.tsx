import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Monitor,
    Smartphone,
    MapPin,
    Clock,
    ShieldAlert,
    LogOut
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Device from 'expo-device';
import { useAuth } from '../../context/AuthContext';

interface SessionInfo {
    id: string;
    deviceType: 'mobile' | 'desktop';
    device: string;
    browser?: string;
    location: string;
    ipAddress: string;
    lastActive: string;
    isCurrent: boolean;
}

export default function LoginHistoryScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    // Simulated fetch of login sessions (since Supabase doesn't expose full audit logs to untrusted clients without custom RPCs)
    const [sessions, setSessions] = useState<SessionInfo[]>([]);

    useEffect(() => {
        const fetchDeviceInfo = async () => {
            // Real device info
            const deviceName = Device.deviceName || (Platform.OS === 'ios' ? 'iPhone' : 'Android Device');
            const modelName = Device.modelName || 'Device';
            const osVersion = Device.osVersion || '';
            const brand = Device.brand || '';
            
            // Mock other sessions but keep the current one real
            const mockSessions: SessionInfo[] = [
                {
                    id: 'sess-1',
                    deviceType: Device.deviceType === Device.DeviceType.PHONE || Device.deviceType === Device.DeviceType.TABLET ? 'mobile' : 'desktop',
                    device: `${brand} ${modelName} (${deviceName})`.trim(),
                    browser: `Native App / OS ${osVersion}`,
                    location: 'Finding location...', // Dynamic location would require expo-location
                    ipAddress: 'Current IP',
                    lastActive: 'Active Now',
                    isCurrent: true,
                },
                {
                    id: 'sess-2',
                    deviceType: 'desktop',
                    device: 'Windows 11 PC',
                    browser: 'Chrome 122.0',
                    location: 'Kigali, Rwanda',
                    ipAddress: '197.243.22.10',
                    lastActive: '2 days ago',
                    isCurrent: false,
                }
            ];
            setSessions(mockSessions);
            setLoading(false);
        };

        fetchDeviceInfo();
    }, []);

    const handleRevokeSession = (sessionId: string, isCurrent: boolean) => {
        if (isCurrent) {
            Alert.alert("Current Session", "You cannot revoke your active session from here. Please use the Log Out button in the main menu.");
            return;
        }

        Alert.alert(
            "Revoke Access",
            "Are you sure you want to log out this device? They will be asked to sign in again.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Revoke", 
                    style: "destructive",
                    onPress: () => {
                        // Simulate revocation
                        setSessions(prev => prev.filter(s => s.id !== sessionId));
                    }
                }
            ]
        );
    };

    const handleSignOutAllOther = () => {
        Alert.alert(
            "Security Action",
            "You are about to sign out of all other devices. Only this current device will remain logged in.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Sign out all others", 
                    style: "destructive",
                    onPress: () => {
                        setSessions(prev => prev.filter(s => s.isCurrent));
                    }
                }
            ]
        );
    };

    const SessionItem = ({ session }: { session: SessionInfo }) => (
        <View className="bg-white p-5 rounded-[24px] mb-4 shadow-sm shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
            {session.isCurrent && (
                <View className="absolute top-0 right-0 bg-emerald-50 px-4 py-1.5 rounded-bl-[16px] border-b border-l border-emerald-100 z-10">
                    <Text className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest">Active Now</Text>
                </View>
            )}

            <View className="flex-row items-start">
                <View className={`w-12 h-12 rounded-[16px] items-center justify-center mr-4 shadow-sm ${session.isCurrent ? 'bg-blue-50 border border-blue-100 shadow-blue-200/40' : 'bg-slate-50 border border-slate-100 shadow-slate-200/50'}`}>
                    {session.deviceType === 'desktop' ? (
                        <Monitor size={22} color={session.isCurrent ? "#1E40AF" : "#64748B"} strokeWidth={2.5} />
                    ) : (
                        <Smartphone size={22} color={session.isCurrent ? "#1E40AF" : "#64748B"} strokeWidth={2.5} />
                    )}
                </View>

                <View className="flex-1 mt-1">
                    <Text className="font-black text-slate-900 text-base mb-1 tracking-tight">{session.device}</Text>
                    
                    <View className="flex-row items-center mb-1.5">
                        <MapPin size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                        <Text className="text-slate-500 font-medium text-xs">{session.location}</Text>
                        <Text className="text-slate-300 mx-2">•</Text>
                        <Text className="text-slate-500 font-medium text-xs">{session.ipAddress}</Text>
                    </View>

                    <View className="flex-row items-center mb-4">
                        <Clock size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                        <Text className="text-slate-500 font-medium text-xs">
                            {session.browser ? `${session.browser} — ` : ''}{session.lastActive}
                        </Text>
                    </View>

                    {!session.isCurrent && (
                        <TouchableOpacity 
                            onPress={() => handleRevokeSession(session.id, session.isCurrent)}
                            className="bg-red-50 py-2 px-4 rounded-xl self-start border border-red-100"
                        >
                            <Text className="text-red-600 font-bold text-xs">Revoke Access</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-[#F9FAFC] relative">
            <StatusBar style="dark" />
            
            {/* Background Decorative Elements */}
            <View className="absolute top-0 left-0 right-0 h-[40%] pointer-events-none">
                <LinearGradient
                    colors={['#DBEAFE', '#F8FAFC', '#ffffff']}
                    locations={[0, 0.4, 1]}
                    className="flex-1"
                />
                <View className="absolute -top-32 -right-32 w-80 h-80 bg-blue-400/10 rounded-full" />
            </View>

            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                {/* Header */}
                <View className="flex-row justify-between items-center px-6 pt-4 pb-6 z-10 bg-transparent">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-white w-12 h-12 rounded-[18px] items-center justify-center shadow-sm shadow-slate-200/50 border border-slate-100"
                    >
                        <ChevronLeft size={24} color="#1E40AF" strokeWidth={2.5} className="-ml-1" />
                    </TouchableOpacity>
                    <Text className="text-[20px] font-black text-slate-900 tracking-tight">Login History</Text>
                    <View className="w-12 h-12" />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
                    
                    <View className="bg-blue-50/50 rounded-2xl p-4 flex-row border border-blue-100 mb-6">
                        <ShieldAlert size={20} color="#2563EB" style={{ marginTop: 2, marginRight: 12 }} strokeWidth={2.5} />
                        <Text className="flex-1 text-blue-900 text-sm font-medium leading-5">
                            Here is a list of devices that have logged into your account. If you see any unrecognized activity, please secure your account.
                        </Text>
                    </View>

                    <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4 ml-1">
                        Active Sessions ({sessions.length})
                    </Text>

                    {sessions.map((session) => (
                        <SessionItem key={session.id} session={session} />
                    ))}

                    {sessions.length > 1 && (
                        <TouchableOpacity
                            onPress={handleSignOutAllOther}
                            className="w-full bg-white h-14 rounded-[20px] flex-row items-center justify-center shadow-sm shadow-slate-200/50 border border-slate-100 mt-6 active:bg-slate-50"
                        >
                            <LogOut size={18} color="#DC2626" className="mr-2" strokeWidth={2.5} />
                            <Text className="text-red-600 font-bold text-sm">Sign Out All Other Devices</Text>
                        </TouchableOpacity>
                    )}

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
