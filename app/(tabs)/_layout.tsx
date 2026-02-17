import { Tabs } from 'expo-router';
import { Home, Settings, Users, FileText, Package, PieChart as PieChartIcon, User } from 'lucide-react-native';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';

export default function TabLayout() {
    const unreadCount = useUnreadMessages();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#2563EB', // Blue-600
                tabBarInactiveTintColor: '#94A3B8', // Slate-400
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: '#F1F5F9', // Slate-100
                    backgroundColor: '#FFFFFF',
                    height: 80, // Taller tab bar like in modern designs
                    paddingBottom: 25,
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
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="invoices"
                options={{
                    title: 'Invoices',
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
                name="analytics"
                options={{
                    title: 'Reports',
                    tabBarIcon: ({ color }) => <PieChartIcon size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <User size={24} color={color} />,
                }}
            />

            {/* Hidden Tabs */}

            <Tabs.Screen
                name="clients/form"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="items"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
