import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { StatusBar } from 'expo-status-bar';
import { validateEmail, validatePassword } from '../../lib/validation';
import { showError, showSuccess, getErrorMessage } from '../../lib/error-handler';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        // Validate inputs
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            Alert.alert('Erreur', emailValidation.error);
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            Alert.alert('Erreur', passwordValidation.error);
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                showError(error, 'Erreur de connexion');
            }
        } catch (error) {
            showError(error, 'Erreur de connexion');
        } finally {
            setLoading(false);
        }
    }

    async function signUpWithEmail() {
        // Validate inputs
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            Alert.alert('Erreur', emailValidation.error);
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            Alert.alert('Erreur', passwordValidation.error);
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
            });

            if (error) {
                showError(error, 'Erreur d\'inscription');
            } else {
                showSuccess('Vérifiez votre boîte mail pour confirmer votre inscription !');
            }
        } catch (error) {
            showError(error, 'Erreur d\'inscription');
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
                <View className="p-6 w-full max-w-sm mx-auto">
                    <StatusBar style="auto" />

                    <View className="mb-8">
                        <Text className="text-4xl font-bold text-primary mb-2">QuickBill</Text>
                        <Text className="text-gray-500 text-lg">Facturation rapide sur WhatsApp</Text>
                    </View>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-gray-700 mb-1 font-medium">Email</Text>
                            <TextInput
                                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
                                placeholder="exemple@email.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View>
                            <Text className="text-gray-700 mb-1 font-medium">Mot de passe</Text>
                            <TextInput
                                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
                                placeholder="••••••••"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View className="pt-4 space-y-3">
                            <TouchableOpacity
                                onPress={signInWithEmail}
                                disabled={loading}
                                className={`w-full bg-primary py-4 rounded-xl items-center shadow-sm ${loading ? 'opacity-70' : ''}`}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">Se connecter</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={signUpWithEmail}
                                disabled={loading}
                                className="w-full bg-transparent py-4 rounded-xl items-center border border-primary"
                            >
                                <Text className="text-primary font-bold text-lg">Créer un compte</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
