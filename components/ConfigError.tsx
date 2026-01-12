import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface ConfigErrorProps {
    error: string;
}

export default function ConfigError({ error }: ConfigErrorProps) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <AlertTriangle size={48} color="#EF4444" />
                </View>

                <Text style={styles.title}>Erreur de Configuration</Text>

                <Text style={styles.description}>
                    L'application ne peut pas démarrer car certaines variables d'environnement sont manquantes.
                </Text>

                <View style={styles.card}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>

                <Text style={styles.hint}>
                    Veuillez créer un fichier .env à la racine du projet ou configurer les secrets dans votre hébergeur.
                </Text>

                <View style={styles.variablesBox}>
                    <Text style={styles.variable}>EXPO_PUBLIC_SUPABASE_URL</Text>
                    <Text style={styles.variable}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FEF2F2', // Red-50
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
    },
    iconContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#FEE2E2', // Red-100
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#991B1B', // Red-800
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#7F1D1D', // Red-900
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        marginBottom: 24,
    },
    errorText: {
        color: '#B91C1C', // Red-700
        fontSize: 14,
        fontFamily: 'monospace',
    },
    hint: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    variablesBox: {
        backgroundColor: '#F3F4F6',
        padding: 16,
        borderRadius: 8,
        width: '100%',
    },
    variable: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#374151',
        marginBottom: 4,
    }
});
