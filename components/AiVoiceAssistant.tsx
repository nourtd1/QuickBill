import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    Animated,
    ActivityIndicator,
    StyleSheet,
    Alert
} from 'react-native';
import { Mic, X, Send, Sparkles, MessageSquare, StopCircle } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { parseNaturalLanguageRequest } from '../lib/aiAssistantService';
import { processAudioWithGemini } from '../lib/gemini';

interface AiVoiceAssistantProps {
    visible: boolean;
    onClose: () => void;
}

export default function AiVoiceAssistant({ visible, onClose }: AiVoiceAssistantProps) {
    const router = useRouter();
    const [listening, setListening] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState('Touchez pour parler');
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    // Animation for pulse
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        return () => {
            if (recording) {
                stopRecording();
            }
        };
    }, []);

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1.0, duration: 500, useNativeDriver: true }),
            ])
        ).start();
    };

    const stopPulse = () => {
        scaleAnim.setValue(1);
        scaleAnim.stopAnimation();
    };

    const startRecording = async () => {
        try {
            if (permissionResponse?.status !== 'granted') {
                console.log('Requesting permission..');
                await requestPermission();
            }

            // iOS requires explicit category for recording
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setListening(true);
            setFeedback('Je vous écoute...');
            startPulse();
            console.log('Recording started');
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert("Erreur", "Impossible d'accéder au micro.");
        }
    };

    const stopRecording = async () => {
        setListening(false);
        stopPulse();
        setRecording(null);
        setFeedback('Analyse avec Gemini...');
        setProcessing(true);

        if (!recording) return;

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            console.log('Recording stopped and stored at', uri);

            if (uri) {
                try {
                    // GEMINI 1.5 FLASH: AUDIO -> JSON DIRECTLY
                    const result = await processAudioWithGemini(uri);

                    setTranscript(`Facture: ${result.description} (${result.amount})`); // Feedback visual
                    handleProcessResult(result);

                } catch (e: any) {
                    console.log("Gemini failed:", e);
                    Alert.alert("Erreur IA", "L'analyse a échoué. Vérifiez votre connexion.");
                    setProcessing(false);
                    setFeedback("Réessayer");
                }
            }
        } catch (error) {
            console.error(error);
            setProcessing(false);
        }
    };

    const [inputText, setInputText] = useState('');

    // Handle Text Input separately (still uses regex or old logic, or could use Gemini Text-Only)
    const handleTextSubmit = () => {
        if (!inputText.trim()) return;
        setProcessing(true);
        setFeedback('Analyse avec Gemini (Texte)...');
        // For text, we can use the simple parser for speed, or call Gemini Text API
        // Let's use simple parser for text input to save tokens/latency, or the parser we already have
        const result = parseNaturalLanguageRequest(inputText);

        handleProcessResult({
            customerName: result.clientName,
            amount: result.amount,
            description: result.description
        });
        setInputText('');
    };

    const handleProcessResult = (result: any) => {
        setTimeout(() => {
            onClose();
            router.push({
                pathname: '/invoice/new',
                params: {
                    autoParams: JSON.stringify({
                        customerName: result.customerName || result.clientName,
                        amount: result.amount,
                        description: result.description,
                        aiSource: true
                    })
                }
            });

            // Reset state
            setTranscript('');
            setProcessing(false);
            setFeedback('Touchez pour parler');
        }, 1000);
    };

    const handleToggleRecording = () => {
        if (listening) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Blur Effect Background */}
                <View style={styles.backdrop} />

                <View className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl items-center relative transition-all">

                    {/* Header */}
                    <View className="flex-row justify-between w-full items-center mb-6">
                        <View className="flex-row items-center">
                            <Sparkles size={18} color="#7C3AED" className="mr-2" />
                            <Text className="text-slate-900 font-bold text-lg">Assistant Gemini</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="bg-slate-100 p-2 rounded-full">
                            <X size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* Voice Orb */}
                    <View className="h-40 justify-center items-center mb-4">
                        {processing ? (
                            <ActivityIndicator size="large" color="#7C3AED" />
                        ) : (
                            <TouchableOpacity
                                onPress={handleToggleRecording}
                                activeOpacity={0.8}
                            >
                                <Animated.View
                                    style={{
                                        transform: [{ scale: scaleAnim }]
                                    }}
                                    className={`w-24 h-24 rounded-full items-center justify-center shadow-lg ${listening ? 'bg-red-500 shadow-red-300' : 'bg-violet-600 shadow-violet-300'}`}
                                >
                                    {listening ? <StopCircle size={40} color="white" /> : <Mic size={40} color="white" />}
                                </Animated.View>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Status Text */}
                    <Text className="text-slate-500 font-medium text-center mb-6 h-6">
                        {feedback}
                    </Text>

                    {/* Transcript View */}
                    {transcript ? (
                        <View className="bg-slate-50 p-3 rounded-xl w-full mb-4 border border-slate-100">
                            <Text className="text-slate-700 italic text-center">"{transcript}"</Text>
                        </View>
                    ) : null}

                    {/* Text Input Option */}
                    <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-12 w-full mt-2">
                        <TextInput
                            className="flex-1 text-slate-900"
                            placeholder="Ou écrivez votre demande..."
                            placeholderTextColor="#94A3B8"
                            returnKeyType="send"
                            value={inputText}
                            onChangeText={setInputText}
                            onSubmitEditing={handleTextSubmit}
                        />
                        <TouchableOpacity onPress={handleTextSubmit} disabled={processing}>
                            <Send size={18} color={inputText.trim() ? "#7C3AED" : "#94A3B8"} />
                        </TouchableOpacity>
                    </View>

                    {/* Instructions */}
                    <View className="mt-4 pt-4 border-t border-slate-50 w-full">
                        <Text className="text-xs text-slate-400 text-center">
                            Propulsé par Google Gemini 1.5 Flash
                        </Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    }
});
