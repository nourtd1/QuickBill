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
    StyleSheet,
    useWindowDimensions,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Sparkles, ShieldCheck, CheckCircle, KeyRound, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { sendWelcomeEmail, send2FACode } from '../lib/email';

type ViewState = 'default' | 'verifyCode' | 'newPassword';
type VerificationPurpose = 'signup' | 'recovery';

const APPLE_REVIEW_EMAIL = 'apple.review.quickbill@gmail.com';
const APPLE_REVIEW_OTP = '123456';

export default function AuthScreen() {
    const { width, height } = useWindowDimensions();
    const isLargeScreen = width >= 768;
    const contentMaxWidth = isLargeScreen ? 560 : undefined;

    // Core states
    const [viewState, setViewState] = useState<ViewState>('default');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // OTP fields
    const [generatedCode, setGeneratedCode] = useState('');
    const [enteredCode, setEnteredCode] = useState('');
    const [verificationPurpose, setVerificationPurpose] = useState<VerificationPurpose>('signup');

    const toggleMode = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsSignUp(!isSignUp);
        setConfirmPassword('');
    };

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const isEmailValid = validateEmail(email);

    // Initial action: Sign in OR Trigger OTP for Signup
    const handleAuth = async () => {
        if (!email || !password || (isSignUp && (!fullName || !confirmPassword))) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
            return;
        }

        if (!isEmailValid) {
            Alert.alert('Erreur', 'Veuillez entrer une adresse email valide.');
            return;
        }

        if (isSignUp) {
            if (password.length < 6) {
                Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
                return;
            }
            if (password !== confirmPassword) {
                Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
                return;
            }
            // Initiate EmailJS OTP flow for Sign Up
            setLoading(true);
            const isAppleReview = email.toLowerCase() === APPLE_REVIEW_EMAIL;
            const code = isAppleReview ? APPLE_REVIEW_OTP : Math.floor(100000 + Math.random() * 900000).toString();
            
            setGeneratedCode(code);
            setVerificationPurpose('signup');

            if (isAppleReview) {
                // Bypass EmailJS for Apple Reviewer
                setLoading(false);
                setEnteredCode('');
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setViewState('verifyCode');
                return;
            }

            // Reusing the 2FA sending template to send a verification code
            const sent = await send2FACode(email, code);
            setLoading(false);

            if (sent) {
                setEnteredCode('');
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setViewState('verifyCode');
            } else {
                // Enhanced Fallback for real users that might have delivery issues
                const configStatus = `(Keys: ${!!process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY ? 'OK' : 'MISSING'})`;
                Alert.alert(
                    "Service de vérification",
                    `Une erreur est survenue lors de l'envoi du code. Veuillez réessayer ultérieurement. ${__DEV__ ? configStatus : ''}`,
                    [
                        { 
                            text: "Réessayer", 
                            onPress: () => handleAuth()
                        },
                        { 
                            text: "Ok", 
                            style: "cancel"
                        }
                    ]
                );
            }
        } else {
            // Sign in directly
            setLoading(true);
            try {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } catch (error: any) {
                Alert.alert('Erreur d\'authentification', error.message || 'Une erreur est survenue.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Trigger OTP for Forgot Password
    const handleForgotPassword = async () => {
        if (!isEmailValid) {
            Alert.alert('Erreur', 'Veuillez entrer une adresse email valide pour réinitialiser le mot de passe.');
            return;
        }

        setLoading(true);
        const isAppleReview = email.toLowerCase() === APPLE_REVIEW_EMAIL;
        const code = isAppleReview ? APPLE_REVIEW_OTP : Math.floor(100000 + Math.random() * 900000).toString();
        
        setGeneratedCode(code);
        setVerificationPurpose('recovery');

        if (isAppleReview) {
            setLoading(false);
            setEnteredCode('');
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setViewState('verifyCode');
            return;
        }

        // Reuse 2FA logic or custom email logic
        const sent = await send2FACode(email, code);
        setLoading(false);

        if (sent) {
            setEnteredCode('');
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setViewState('verifyCode');
        } else {
            Alert.alert(
                "Service de récupération",
                "Une erreur est survenue lors de l'envoi du code de récupération.",
                [{
                    text: "Ok"
                }]
            );
        }
    };

    // Verify OTP user just entered
    const handleVerifyCode = async () => {
        const isAppleReview = email.toLowerCase() === APPLE_REVIEW_EMAIL;
        
        if (enteredCode !== generatedCode && !(isAppleReview && enteredCode === APPLE_REVIEW_OTP)) {
            Alert.alert('Erreur', 'Le code de vérification est incorrect.');
            return;
        }

        if (verificationPurpose === 'signup') {
            // User verified code! Now create the Supabase record
            setLoading(true);
            try {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName },
                    },
                });
                if (error) throw error;

                Alert.alert(
                    'Compte vérifié et créé 🚀',
                    'Bienvenue sur QuickBill !',
                    [{ text: 'OK' }]
                );

                sendWelcomeEmail(email, fullName);

                // Switch back & pretend they are inside now or just go to sigin
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setViewState('default');
                setIsSignUp(false);
            } catch (error: any) {
                Alert.alert('Erreur', error.message || 'Impossible de créer le compte.');
            } finally {
                setLoading(false);
            }
        } else if (verificationPurpose === 'recovery') {
            // User verified recovery code! Go to new password screen
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setViewState('newPassword');
            setPassword(''); // clear password field for new input
        }
    };

    // Handle New Password submission after recovery verification
    const handleSetNewPassword = async () => {
        if (!password || password.length < 6) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }

        // Real update in Supabase using our custom RPC function
        setLoading(true);
        try {
            // NOTE: Ensure you have created the 'admin_reset_password' function in Supabase SQL Editor
            const { error } = await supabase.rpc('admin_reset_password', {
                target_email: email,
                new_password: password
            });

            if (error) throw error;

            Alert.alert(
                "Réinitialisation réussie ✅",
                "Votre nouveau mot de passe a bien été enregistré. Connectez-vous.",
                [{
                    text: "Se connecter", onPress: () => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setViewState('default');
                        setIsSignUp(false);
                    }
                }]
            );
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le mot de passe.');
        } finally {
            setLoading(false);
        }
    };

    // Render different views dynamically
    const renderContent = () => {
        if (viewState === 'verifyCode') {
            return (
                <View className="mt-2">
                    <TouchableOpacity
                        onPress={() => setViewState('default')}
                        className="flex-row items-center self-start mb-6 py-2 pr-4 -ml-1 active:opacity-70"
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <ChevronLeft size={22} color="#475569" strokeWidth={2.25} />
                        <Text className="text-[15px] font-semibold text-slate-600 ml-0.5">Retour</Text>
                    </TouchableOpacity>

                    <View className="rounded-[28px] border border-slate-200/90 bg-white p-7 shadow-xl shadow-slate-900/[0.06]">
                        <View className="items-center mb-8">
                            <View className="w-[72px] h-[72px] rounded-[22px] bg-blue-50 items-center justify-center mb-5 border border-blue-100/80">
                                <ShieldCheck size={34} color="#1D4ED8" strokeWidth={2} />
                            </View>
                            <Text className="text-2xl font-bold text-slate-900 text-center tracking-tight mb-2">
                                Code de vérification
                            </Text>
                            <Text className="text-[15px] text-slate-500 leading-6 text-center px-1">
                                Saisissez le code envoyé à{' '}
                                <Text className="font-semibold text-slate-800">{email}</Text>
                            </Text>
                        </View>

                        <View className="mb-6">
                            <Text className="text-xs font-semibold text-slate-500 mb-2 text-center">Code à 6 chiffres</Text>
                            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-[72px]">
                                <TextInput
                                    className="flex-1 text-[26px] text-slate-900 font-bold tracking-[10px] text-center"
                                    placeholder="• • • • • •"
                                    placeholderTextColor="#CBD5E1"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    value={enteredCode}
                                    onChangeText={setEnteredCode}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleVerifyCode}
                            disabled={loading || enteredCode.length < 6}
                            activeOpacity={0.92}
                            className={`overflow-hidden rounded-2xl shadow-lg ${enteredCode.length === 6 ? 'shadow-blue-500/25 opacity-100' : 'opacity-55'}`}
                        >
                            <LinearGradient
                                colors={['#1D4ED8', '#1E3A8A']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="h-[52px] items-center justify-center flex-row"
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white text-[15px] font-semibold">Confirmer</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setViewState('default')} className="mt-5 py-2">
                            <Text className="text-center text-sm font-medium text-slate-400">Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        if (viewState === 'newPassword') {
            return (
                <View className="mt-2">
                    <TouchableOpacity
                        onPress={() => setViewState('verifyCode')}
                        className="flex-row items-center self-start mb-6 py-2 pr-4 -ml-1 active:opacity-70"
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <ChevronLeft size={22} color="#475569" strokeWidth={2.25} />
                        <Text className="text-[15px] font-semibold text-slate-600 ml-0.5">Retour</Text>
                    </TouchableOpacity>

                    <View className="rounded-[28px] border border-slate-200/90 bg-white p-7 shadow-xl shadow-slate-900/[0.06]">
                        <View className="items-center mb-8">
                            <View className="w-[72px] h-[72px] rounded-[22px] bg-violet-50 items-center justify-center mb-5 border border-violet-100/80">
                                <KeyRound size={34} color="#6D28D9" strokeWidth={2} />
                            </View>
                            <Text className="text-2xl font-bold text-slate-900 text-center tracking-tight mb-2">
                                Nouveau mot de passe
                            </Text>
                            <Text className="text-[15px] text-slate-500 leading-6 text-center px-1">
                                Choisissez un mot de passe sécurisé pour votre compte.
                            </Text>
                        </View>

                        <View className="mb-2">
                            <Text className="text-xs font-semibold text-slate-500 mb-2">Mot de passe</Text>
                            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-[52px]">
                                <Lock size={20} color="#64748B" strokeWidth={2} />
                                <TextInput
                                    className="flex-1 ml-3 text-[16px] text-slate-900 font-medium"
                                    placeholder="Minimum 6 caractères"
                                    placeholderTextColor="#94A3B8"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                                    {showPassword ? <EyeOff size={20} color="#64748B" /> : <Eye size={20} color="#64748B" />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity onPress={handleSetNewPassword} activeOpacity={0.92} className="mt-6 overflow-hidden rounded-2xl shadow-lg shadow-violet-500/20">
                            <LinearGradient
                                colors={['#7C3AED', '#5B21B6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="h-[52px] items-center justify-center flex-row"
                            >
                                <Text className="text-white text-[15px] font-semibold">Enregistrer le mot de passe</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        // Default Authentication View (Sign In / Sign Up)
        const inputShell = 'flex-row items-center bg-slate-50 border rounded-2xl px-4 h-[52px]';
        const emailShell = isEmailValid
            ? `${inputShell} border-blue-200/90 bg-blue-50/40`
            : `${inputShell} border-slate-200`;
        const confirmMismatch =
            isSignUp && confirmPassword.length > 0 && password !== confirmPassword;
        const confirmShell = confirmMismatch
            ? `${inputShell} border-red-200 bg-red-50/30`
            : `${inputShell} border-slate-200`;

        return (
            <View>
                <View className="flex-row p-1 rounded-2xl bg-slate-100/95 border border-slate-200/80 mb-8">
                    <TouchableOpacity
                        onPress={() => isSignUp && toggleMode()}
                        activeOpacity={0.85}
                        className={`flex-1 py-3 rounded-[14px] items-center justify-center ${!isSignUp ? 'bg-white shadow-sm shadow-slate-900/5' : ''}`}
                    >
                        <Text className={`text-[15px] ${!isSignUp ? 'font-semibold text-slate-900' : 'font-medium text-slate-500'}`}>
                            Connexion
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => !isSignUp && toggleMode()}
                        activeOpacity={0.85}
                        className={`flex-1 py-3 rounded-[14px] items-center justify-center ${isSignUp ? 'bg-white shadow-sm shadow-slate-900/5' : ''}`}
                    >
                        <Text className={`text-[15px] ${isSignUp ? 'font-semibold text-slate-900' : 'font-medium text-slate-500'}`}>
                            Inscription
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="rounded-[28px] border border-slate-200/90 bg-white p-7 shadow-xl shadow-slate-900/[0.06]">
                    <View className="space-y-5">
                        {isSignUp && (
                            <View>
                                <Text className="text-xs font-semibold text-slate-500 mb-2">Nom complet</Text>
                                <View className={`${inputShell} border-slate-200`}>
                                    <User size={20} color="#64748B" strokeWidth={2} />
                                    <TextInput
                                        className="flex-1 ml-3 text-[16px] text-slate-900 font-medium"
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
                            <Text className="text-xs font-semibold text-slate-500 mb-2">Adresse e-mail</Text>
                            <View className={emailShell}>
                                <Mail size={20} color={isEmailValid ? '#1D4ED8' : '#64748B'} strokeWidth={2} />
                                <TextInput
                                    className="flex-1 ml-3 text-[16px] text-slate-900 font-medium"
                                    placeholder="vous@entreprise.com"
                                    placeholderTextColor="#94A3B8"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                                {isEmailValid && <CheckCircle size={19} color="#1D4ED8" strokeWidth={2.25} />}
                            </View>
                        </View>

                        <View>
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-xs font-semibold text-slate-500">Mot de passe</Text>
                                {!isSignUp && (
                                    <TouchableOpacity onPress={handleForgotPassword} disabled={loading} hitSlop={8}>
                                        <Text className="text-xs font-semibold text-blue-600">Oublié ?</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View className={`${inputShell} border-slate-200`}>
                                <Lock size={20} color="#64748B" strokeWidth={2} />
                                <TextInput
                                    className="flex-1 ml-3 text-[16px] text-slate-900 font-medium"
                                    placeholder="••••••••"
                                    placeholderTextColor="#94A3B8"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                                    {showPassword ? (
                                        <EyeOff size={20} color="#64748B" />
                                    ) : (
                                        <Eye size={20} color="#64748B" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {isSignUp && (
                            <View>
                                <Text className="text-xs font-semibold text-slate-500 mb-2">Confirmer le mot de passe</Text>
                                <View className={confirmShell}>
                                    <Lock size={20} color="#64748B" strokeWidth={2} />
                                    <TextInput
                                        className="flex-1 ml-3 text-[16px] text-slate-900 font-medium"
                                        placeholder="Répétez le mot de passe"
                                        placeholderTextColor="#94A3B8"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={12}>
                                        {showConfirmPassword ? (
                                            <EyeOff size={20} color="#64748B" />
                                        ) : (
                                            <Eye size={20} color="#64748B" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                                {confirmMismatch ? (
                                    <Text className="text-xs font-medium text-red-600 mt-2 ml-0.5">
                                        Les mots de passe ne correspondent pas.
                                    </Text>
                                ) : null}
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={handleAuth}
                        disabled={loading}
                        activeOpacity={0.92}
                        className="mt-7 overflow-hidden rounded-2xl shadow-lg shadow-blue-500/20"
                    >
                        <LinearGradient
                            colors={['#1D4ED8', '#1E3A8A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="h-[52px] flex-row items-center justify-center px-5"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text className="text-white text-[15px] font-semibold mr-2">
                                        {isSignUp ? 'Créer mon compte' : 'Se connecter'}
                                    </Text>
                                    <ArrowRight size={19} color="white" strokeWidth={2.5} />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <Text className="text-center text-[13px] text-slate-400 mt-8 leading-5 px-2">
                    {isSignUp
                        ? 'En vous inscrivant, vous acceptez nos conditions d’utilisation.'
                        : 'Accès sécurisé à votre espace professionnel.'}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

            <View className="absolute top-0 left-0 right-0 h-[52%] overflow-hidden">
                <LinearGradient
                    colors={['#EFF6FF', '#F8FAFC', '#F1F5F9']}
                    locations={[0, 0.55, 1]}
                    className="flex-1"
                />
                <View className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-sky-400/[0.12]" />
                <View className="absolute top-36 -left-24 w-56 h-56 rounded-full bg-indigo-500/[0.08]" />
                <View className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-blue-300/[0.1]" />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        {
                            paddingTop: isLargeScreen ? 32 : 20,
                            paddingBottom: isLargeScreen ? 48 : 36,
                            minHeight: height - 40,
                        },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                    className="px-4"
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        style={[
                            styles.contentInner,
                            isLargeScreen ? styles.contentInnerLarge : null,
                            contentMaxWidth ? { maxWidth: contentMaxWidth } : null,
                        ]}
                    >
                        {viewState === 'default' && (
                            <View className="items-center mb-8">
                                <View className="w-[76px] h-[76px] rounded-[26px] bg-white items-center justify-center border border-slate-200/90 shadow-xl shadow-slate-900/[0.08]">
                                    <LinearGradient
                                        colors={['#1D4ED8', '#1E3A8A']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        className="w-[52px] h-[52px] rounded-[18px] items-center justify-center"
                                    >
                                        <Sparkles size={26} color="white" strokeWidth={2} />
                                    </LinearGradient>
                                </View>
                                <Text className="text-[26px] font-bold text-slate-900 mt-5 tracking-tight">
                                    QuickBill <Text className="text-blue-600">Premium</Text>
                                </Text>
                                <View className="mt-2.5 px-3 py-1 rounded-full bg-white/90 border border-slate-200/80">
                                    <Text className="text-[11px] font-semibold text-slate-600 tracking-wide">
                                        Facturation & gestion pro
                                    </Text>
                                </View>
                            </View>
                        )}

                        {viewState === 'default' && (
                            <TouchableOpacity 
                                activeOpacity={1} 
                                onLongPress={() => {
                                    Alert.alert(
                                        "Diagnostique Système",
                                        `Service ID: ${process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID ? '✅' : '❌'}\nPublic Key: ${process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY ? '✅' : '❌'}\nTemplate: ${process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_2FA ? '✅' : '❌'}\nSupabase: ${process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅' : '❌'}`
                                    );
                                }}
                                className="mb-7"
                            >
                                <Text className="text-[28px] font-bold text-slate-900 mb-2 tracking-tight leading-8">
                                    {isSignUp ? 'Créer un compte' : 'Bon retour'}
                                </Text>
                                <Text className="text-[15px] text-slate-500 leading-6 font-normal">
                                    {isSignUp
                                        ? 'Rejoignez QuickBill et simplifiez votre facturation au quotidien.'
                                        : 'Connectez-vous pour accéder à votre tableau de bord.'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {renderContent()}

                        <View className="mt-12 flex-row items-center justify-center opacity-50">
                            <ShieldCheck size={15} color="#64748B" strokeWidth={2} />
                            <Text className="text-[11px] font-medium text-slate-500 ml-2 tracking-wide">
                                Connexion chiffrée (SSL)
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
    },
    contentInner: {
        width: '100%',
        alignSelf: 'center',
    },
    contentInnerLarge: {
        justifyContent: 'center',
    },
});
