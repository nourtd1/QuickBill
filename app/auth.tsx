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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const isEmailValid = validateEmail(email);

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
            return;
        }

        if (!isEmailValid) {
            Alert.alert('Erreur', 'Veuillez entrer une adresse email valide.');
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.replace('/setup');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                Alert.alert(
                    'Compte créé',
                    'Veuillez vérifier votre boîte mail pour confirmer votre inscription.',
                    [{ text: 'OK', onPress: () => router.replace('/setup') }]
                );
            }
        } catch (error: any) {
            Alert.alert('Erreur d\'authentification', error.message || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                keyboardShouldPersistTaps="handled"
                className="px-8"
            >
                <View className="mb-12">
                    <Text className="text-4xl font-bold text-slate-900 mb-2">
                        {isLogin ? 'Bon retour !' : 'Bienvenue !'}
                    </Text>
                    <Text className="text-lg text-slate-500">
                        {isLogin
                            ? 'Connectez-vous pour continuer.'
                            : 'Créez votre compte en quelques secondes.'}
                    </Text>
                </View>

                <View className="space-y-6">
                    <View>
                        <Text className="text-slate-700 font-semibold mb-2 ml-1">Email</Text>
                        <View
                            className={`flex-row items-center border-2 rounded-2xl px-4 h-16 ${email === ''
                                ? 'border-slate-100 bg-slate-50'
                                : isEmailValid
                                    ? 'border-emerald-500 bg-emerald-50/10'
                                    : 'border-slate-200 bg-slate-50'
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
                        <View className="flex-row items-center border-2 border-slate-100 bg-slate-50 rounded-2xl px-4 h-16">
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
                                {showPassword
                                    ? <EyeOff size={20} color="#94A3B8" />
                                    : <Eye size={20} color="#94A3B8" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleAuth}
                        disabled={loading}
                        className={`bg-blue-600 h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200 mt-4 ${loading ? 'opacity-70' : ''
                            }`}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text className="text-white text-xl font-bold mr-2">
                                    {isLogin ? 'Se connecter' : 'Créer un compte'}
                                </Text>
                                <ArrowRight size={20} color="white" strokeWidth={3} />
                            </>
                        )}
                    </TouchableOpacity>

                    <View className="flex-row justify-center mt-6">
                        <Text className="text-slate-500 text-lg">
                            {isLogin ? 'Pas de compte ? ' : 'Déjà un compte ? '}
                        </Text>
                        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                            <Text className="text-blue-600 text-lg font-bold">
                                {isLogin ? 'S\'inscrire' : 'Se connecter'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
