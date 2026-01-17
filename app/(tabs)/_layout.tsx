import { Tabs } from 'expo-router';
import { Home, Settings, Users, FileText, Package } from 'lucide-react-native';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';

export default function TabLayout() {
    const unreadCount = useUnreadMessages();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#1E40AF', // primary
                tabBarInactiveTintColor: '#9CA3AF', // text-muted equivalent
                headerStyle: { backgroundColor: '#EFF6FF', elevation: 0, shadowOpacity: 0 },
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: '#E2E8F0', // slate-200
                    backgroundColor: '#FFFFFF', // card
                    height: 60,
                    paddingBottom: 8,
                }
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Accueil',
                    tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="invoices"
                options={{
                    title: 'Factures',
                    tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                    tabBarBadgeStyle: { backgroundColor: '#EF4444' }
                }}
            />
            <Tabs.Screen
                name="clients/index"
                options={{
                    title: 'Clients',
                    tabBarIcon: ({ color }) => <Users size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="items"
                options={{
                    title: 'Produits',
                    tabBarIcon: ({ color }) => <Package size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="clients/form"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Paramètres',
                    tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
