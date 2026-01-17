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
    Dimensions,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Sparkles, ShieldCheck, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

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
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
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
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />

            {/* Background Decorative Elements */}
            <View className="absolute top-0 left-0 right-0 h-[45%]">
                <LinearGradient
                    colors={['#DBEAFE', '#F8FAFC']}
                    className="flex-1"
                />
                <View className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400/10 rounded-full" />
                <View className="absolute top-40 -left-20 w-48 h-48 bg-indigo-400/10 rounded-full" />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingTop: 80, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    className="px-8"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Brand/Logo Area */}
                    <View className="items-center mb-10">
                        <View className="w-20 h-20 bg-white rounded-[28px] items-center justify-center shadow-2xl shadow-blue-500/20 border border-blue-50">
                            <LinearGradient
                                colors={['#1E40AF', '#1e3a8a']}
                                className="w-14 h-14 rounded-2xl items-center justify-center"
                            >
                                <Sparkles size={28} color="white" />
                            </LinearGradient>
                        </View>
                        <Text className="text-3xl font-black text-slate-900 mt-6 tracking-tighter">
                            QuickBill <Text className="text-blue-600">Premium</Text>
                        </Text>
                        <View className="bg-blue-50 px-3 py-1 rounded-full mt-2 border border-blue-100/50">
                            <Text className="text-blue-700 text-[10px] font-black uppercase tracking-[2px]">L'application des pros</Text>
                        </View>
                    </View>

                    {/* Title Section */}
                    <View className="mb-10">
                        <Text className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
                            {isSignUp ? 'Bienvenue !' : 'Bon retour,'}
                        </Text>
                        <Text className="text-slate-400 font-bold leading-6">
                            {isSignUp
                                ? 'Créez votre compte en 1 minute et commencez à facturer comme un pro.'
                                : 'Connectez-vous pour gérer votre entreprise et vos revenus.'}
                        </Text>
                    </View>

                    {/* Form Area */}
                    <View className="space-y-6">
                        {isSignUp && (
                            <View>
                                <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-2 ml-1">Nom Complet</Text>
                                <View className="flex-row items-center bg-white border border-slate-100 rounded-[22px] px-5 h-16 shadow-sm shadow-slate-200/50">
                                    <User size={20} color="#94A3B8" strokeWidth={2.5} />
                                    <TextInput
                                        className="flex-1 ml-3 text-base text-slate-900 font-bold"
                                        placeholder="Jean Dupont"
                                        placeholderTextColor="#CBD5E1"
                                        value={fullName}
                                        onChangeText={setFullName}
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>
                        )}

                        <View>
                            <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-2 ml-1">Email Professionnel</Text>
                            <View
                                className={`flex-row items-center border rounded-[22px] px-5 h-16 shadow-sm ${isEmailValid
                                    ? 'border-blue-100 bg-blue-50/30'
                                    : 'border-slate-100 bg-white shadow-slate-200/50'
                                    }`}
                            >
                                <Mail size={20} color={isEmailValid ? '#2563EB' : '#94A3B8'} strokeWidth={2.5} />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-slate-900 font-bold"
                                    placeholder="votre@entreprise.com"
                                    placeholderTextColor="#CBD5E1"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                                {isEmailValid && <CheckCircle size={18} color="#2563EB" />}
                            </View>
                        </View>

                        <View>
                            <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest mb-2 ml-1">Mot de passe</Text>
                            <View className="flex-row items-center bg-white border border-slate-100 rounded-[22px] px-5 h-16 shadow-sm shadow-slate-200/50">
                                <Lock size={20} color="#94A3B8" strokeWidth={2.5} />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-slate-900 font-bold"
                                    placeholder="••••••••"
                                    placeholderTextColor="#CBD5E1"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? (
                                        <EyeOff size={20} color="#94A3B8" strokeWidth={2.5} />
                                    ) : (
                                        <Eye size={20} color="#94A3B8" strokeWidth={2.5} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {!isSignUp && (
                            <TouchableOpacity className="self-end py-1">
                                <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Mot de passe oublié ?</Text>
                            </TouchableOpacity>
                        )}

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleAuth}
                            disabled={loading}
                            activeOpacity={0.9}
                            className="mt-4 shadow-2xl shadow-blue-500/40"
                        >
                            <LinearGradient
                                colors={['#1E40AF', '#1e3a8a']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="h-16 rounded-[22px] flex-row items-center justify-center"
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Text className="text-white text-lg font-black uppercase tracking-widest mr-3">
                                            {isSignUp ? "Créer mon espace" : 'Se connecter'}
                                        </Text>
                                        <ArrowRight size={20} color="white" strokeWidth={3} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Toggle Mode */}
                        <View className="flex-row justify-center mt-10">
                            <Text className="text-slate-400 font-bold">
                                {isSignUp ? 'Vous avez déjà un compte ? ' : 'Nouveau sur QuickBill ? '}
                            </Text>
                            <TouchableOpacity onPress={toggleMode}>
                                <Text className="text-blue-600 font-black">
                                    {isSignUp ? 'Se connecter' : "S'inscrire"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer Info */}
                    <View className="mt-16 flex-row items-center justify-center opacity-30">
                        <ShieldCheck size={14} color="#64748B" />
                        <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Serveurs Sécurisés SSL 256-bit</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
