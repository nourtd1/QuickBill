import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { ActivityLog } from '../lib/teamService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Activity } from 'lucide-react-native';

export default function ActivityLogList() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) console.error(error);
            setLogs((data || []) as ActivityLog[]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <ActivityIndicator color="#2563EB" />;

    if (logs.length === 0) {
        return (
            <View className="p-6 items-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Text className="text-slate-400 text-xs">Aucune activité récente.</Text>
            </View>
        );
    }

    return (
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center mb-4">
                <View className="bg-slate-100 p-2 rounded-xl mr-3">
                    <Activity size={18} color="#475569" />
                </View>
                <Text className="text-lg font-bold text-slate-900">Journal d'activité</Text>
            </View>

            {logs.map((log) => (
                <View key={log.id} className="flex-row py-3 border-b border-slate-50 last:border-0">
                    <View className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3" />
                    <View className="flex-1">
                        <Text className="text-slate-800 font-medium text-sm">
                            <Text className="font-bold text-blue-600">{log.action}</Text>
                            {log.details?.email ? ` pour ${log.details.email}` : ''}
                        </Text>
                        <Text className="text-slate-400 text-xs mt-0.5">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
                        </Text>
                    </View>
                </View>
            ))}
        </View>
    );
}
