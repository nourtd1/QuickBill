import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Home, Settings, Users, FileText, Package, PieChart as PieChartIcon, User } from 'lucide-react-native';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
    const unreadCount = useUnreadMessages();
    const insets = useSafeAreaInsets();
    const { t } = useLanguage();
    const { resolvedTheme } = useTheme();

    const tabBarBg = resolvedTheme === 'dark' ? '#0F172A' : '#FFFFFF';
    const tabBarBorder = resolvedTheme === 'dark' ? '#334155' : '#F1F5F9';

    return (
        <>
            <StatusBar style="auto" />
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: '#2563EB', // Blue-600
                    tabBarInactiveTintColor: '#94A3B8', // Slate-400
                    tabBarStyle: {
                        borderTopWidth: 1,
                        borderTopColor: tabBarBorder,
                        backgroundColor: tabBarBg,
                        height: 60 + (insets.bottom > 0 ? insets.bottom : 10), // Taller tab bar like in modern designs
                        paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                        paddingTop: 10,
                        elevation: 0,
                        shadowOpacity: 0,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '600',
                        marginTop: 4,
                    }
                }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: t('tabs.home'),
                    tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="invoices"
                options={{
                    title: t('tabs.invoices'),
                    tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                    tabBarBadgeStyle: { backgroundColor: '#EF4444' }
                }}
            />
            <Tabs.Screen
                name="clients/index"
                options={{
                    title: t('tabs.clients'),
                    tabBarIcon: ({ color }) => <Users size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    title: t('tabs.analytics'),
                    tabBarIcon: ({ color }) => <PieChartIcon size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: t('tabs.settings'),
                    tabBarIcon: ({ color }) => <User size={24} color={color} />,
                }}
            />

            {/* Hidden Routes - Not in Tab Bar */}
            <Tabs.Screen
                name="clients/form"
                options={{
                    href: null,
                }}
            />
        </Tabs>
        </>
    );
}

