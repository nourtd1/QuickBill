import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
    LayoutAnimation,
    UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const toggleMode = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsSignUp(!isSignUp);
    };

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const isEmailValid = validateEmail(email);

    const handleAuth = async () => {
        if (!email || !password || (isSignUp && !fullName)) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
            return;
        }

        if (!isEmailValid) {
            Alert.alert('Erreur', 'Veuillez entrer une adresse email valide.');
            return;
        }

        setLoading(true);
        try {
            if (!isSignUp) {
                // Mode Login
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // La redirection vers /(tabs) ou /setup sera gérée par le useEffect dans RootLayout
            } else {
                // Mode Signup
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;
                Alert.alert(
                    'Compte créé 🚀',
                    'Veuillez vérifier votre boîte mail pour confirmer votre inscription.',
                    [{ text: 'OK' }]
                );
                setIsSignUp(false);
            }
        } catch (error: any) {
            Alert.alert('Erreur d\'authentification', error.message || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background" style={{ backgroundColor: '#EFF6FF' }} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                    keyboardShouldPersistTaps="handled"
                    className="px-8"
                >
                    <View className="mb-10">
                        <Text className="text-4xl font-bold text-slate-900 mb-2">
                            {isSignUp ? 'Créez votre compte 🚀' : 'Heureux de vous revoir 👋'}
                        </Text>
                        <Text className="text-lg text-slate-500">
                            {isSignUp
                                ? 'Rejoignez-nous pour gérer vos factures facilement.'
                                : 'Connectez-vous pour accéder à votre espace.'}
                        </Text>
                    </View>

                    <View className="space-y-5">
                        {isSignUp && (
                            <View>
                                <Text className="text-slate-700 font-semibold mb-2 ml-1">Nom Complet</Text>
                                <View className="flex-row items-center bg-white border border-slate-100 rounded-2xl px-4 h-16">
                                    <User size={20} color="#94A3B8" />
                                    <TextInput
                                        className="flex-1 ml-3 text-lg text-slate-900"
                                        placeholder="Jean Dupont"
                                        placeholderTextColor="#94A3B8"
                                        value={fullName}
                                        onChangeText={setFullName}
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>
                        )}

                        <View>
                            <Text className="text-slate-700 font-semibold mb-2 ml-1">Email</Text>
                            <View
                                className={`flex-row items-center border rounded-2xl px-4 h-16 ${email === ''
                                    ? 'border-slate-100 bg-white'
                                    : isEmailValid
                                        ? 'border-emerald-200 bg-emerald-50/30'
                                        : 'border-slate-100 bg-white'
                                    }`}
                            >
                                <Mail size={20} color={isEmailValid ? '#10B981' : '#94A3B8'} />
                                <TextInput
                                    className="flex-1 ml-3 text-lg text-slate-900"
                                    placeholder="votre@email.com"
                                    placeholderTextColor="#94A3B8"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-slate-700 font-semibold mb-2 ml-1">Mot de passe</Text>
                            <View className="flex-row items-center bg-white border border-slate-100 rounded-2xl px-4 h-16">
                                <Lock size={20} color="#94A3B8" />
                                <TextInput
                                    className="flex-1 ml-3 text-lg text-slate-900"
                                    placeholder="••••••••"
                                    placeholderTextColor="#94A3B8"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? (
                                        <EyeOff size={20} color="#94A3B8" />
                                    ) : (
                                        <Eye size={20} color="#94A3B8" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {!isSignUp && (
                            <TouchableOpacity className="self-end py-1">
                                <Text className="text-primary font-medium">Mot de passe oublié ?</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={handleAuth}
                            disabled={loading}
                            className={`bg-primary h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200 mt-4 ${loading ? 'opacity-70' : ''
                                }`}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text className="text-white text-xl font-bold mr-2">
                                        {isSignUp ? "S'inscrire gratuitement" : 'Se connecter'}
                                    </Text>
                                    <ArrowRight size={20} color="white" strokeWidth={3} />
                                </>
                            )}
                        </TouchableOpacity>

                        <View className="flex-row justify-center mt-6">
                            <Text className="text-slate-500 text-lg">
                                {isSignUp ? 'Déjà un compte ? ' : 'Pas de compte ? '}
                            </Text>
                            <TouchableOpacity onPress={toggleMode}>
                                <Text className="text-primary text-lg font-bold">
                                    {isSignUp ? 'Se connecter' : "S'inscrire"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

