import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Animated,
    Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../hooks/useProfile';
import {
    ChevronLeft,
    Store,
    Globe,
    Briefcase,
    Camera,
    ChevronRight,
    FileText,
    ShieldCheck,
    CheckCircle2,
    LayoutDashboard,
    Check,
    X,
    Building2,
    Sparkles,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../lib/upload';
import { validateBusinessName } from '../../lib/validation';
import { showSuccess, showError } from '../../lib/error-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../context/LanguageContext';
import * as Haptics from 'expo-haptics';

const INDIGO = '#4F46E5';
const INDIGO_DARK = '#1337ec';
const SECTORS = ['Technology', 'Finance', 'E-commerce', 'Service', 'Retail', 'Healthcare', 'Education', 'Other'];

export default function BusinessProfileScreen() {
    const router = useRouter();
    const { profile, loading: profileLoading, fetchProfile, updateProfile } = useProfile();
    const { t } = useLanguage();

    const [businessName, setBusinessName] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [taxId, setTaxId] = useState('');
    const [website, setWebsite] = useState('');
    const [businessCategory, setBusinessCategory] = useState('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [sectorModalVisible, setSectorModalVisible] = useState(false);
    const [activeField, setActiveField] = useState<string | null>(null);

    const saveAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => { fetchProfile(); }, []);

    useEffect(() => {
        if (profile) {
            setBusinessName(profile.business_name || '');
            setRegistrationNumber(profile.rccm || '');
            setTaxId(profile.tax_id || '');
            setWebsite(profile.website || '');
            setLogoUrl(profile.logo_url || null);
        }
    }, [profile]);

    const handlePickImage = async () => {
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
            Alert.alert(t('business_profile.permission_required'), t('business_profile.permission_msg'));
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) handleUpload(result.assets[0].uri);
    };

    const handleUpload = async (uri: string) => {
        setUploading(true);
        try {
            const publicUrl = await uploadImage(uri, 'logos');
            setLogoUrl(publicUrl);
            showSuccess(t('business_profile.upload_success'));
        } catch (error: any) {
            showError(error, t('business_profile.upload_error'));
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        const validation = validateBusinessName(businessName);
        if (!validation.isValid) {
            Alert.alert(t('common.error'), validation.error);
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.sequence([
            Animated.timing(saveAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
            Animated.timing(saveAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();

        setSaving(true);
        try {
            const { error } = await updateProfile({
                business_name: businessName.trim(),
                rccm: registrationNumber.trim() || null,
                tax_id: taxId.trim() || null,
                website: website.trim() || null,
                logo_url: logoUrl,
            } as any);
            if (error) {
                showError(error, t('business_profile.update_error'));
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showSuccess(t('business_profile.update_success'));
                router.back();
            }
        } catch (error) {
            showError(error, t('business_profile.system_error'));
        } finally {
            setSaving(false);
        }
    };

    if (profileLoading && !profile) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={INDIGO} />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    const initials = businessName ? businessName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'B';

    return (
        <View style={styles.screen}>
            <StatusBar style="dark" />

            {/* Sector Picker Modal */}
            <Modal
                visible={sectorModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setSectorModalVisible(false)}
            >
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSectorModalVisible(false)} />
                <View style={styles.modalSheet}>
                    <View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}>Secteur d'activité</Text>
                    <Text style={styles.modalSubtitle}>Choisissez le secteur qui correspond le mieux à votre entreprise</Text>
                    <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                        {SECTORS.map((sector) => {
                            const selected = businessCategory === sector;
                            return (
                                <TouchableOpacity
                                    key={sector}
                                    style={[styles.sectorRow, selected && styles.sectorRowSelected]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setBusinessCategory(sector);
                                        setSectorModalVisible(false);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.sectorLabel, selected && styles.sectorLabelSelected]}>
                                        {t(`business_profile.sectors.${sector === 'E-commerce' ? 'Ecommerce' : sector}`) || sector}
                                    </Text>
                                    {selected && <Check size={18} color={INDIGO} strokeWidth={2.5} />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    <TouchableOpacity style={styles.modalCancel} onPress={() => setSectorModalVisible(false)}>
                        <Text style={styles.modalCancelText}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
                        <ChevronLeft size={20} color={INDIGO} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>{t('business_profile.title')}</Text>
                        <View style={styles.headerUnderline} />
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
                    <ScrollView
                        style={styles.flex}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Verified Badge */}
                        <View style={styles.verifiedBadge}>
                            <ShieldCheck size={13} color="#D97706" strokeWidth={2.5} />
                            <Text style={styles.verifiedText}>{t('business_profile.identity_verified')}</Text>
                        </View>

                        {/* Logo Zone */}
                        <View style={styles.logoSection}>
                            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85} style={styles.logoWrapper}>
                                <LinearGradient colors={[INDIGO_DARK, '#3b82f6']} style={styles.logoBorder}>
                                    <View style={styles.logoInner}>
                                        {logoUrl ? (
                                            <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="cover" />
                                        ) : (
                                            <View style={styles.logoPlaceholder}>
                                                <Text style={styles.logoInitials}>{initials}</Text>
                                            </View>
                                        )}
                                        {uploading && (
                                            <View style={styles.logoOverlay}>
                                                <ActivityIndicator color={INDIGO} />
                                            </View>
                                        )}
                                    </View>
                                </LinearGradient>
                                <View style={styles.cameraBadge}>
                                    <Camera size={15} color="white" strokeWidth={2.5} />
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.logoTitle}>{t('business_profile.logo_title')}</Text>
                            <Text style={styles.logoSubtitle}>{t('business_profile.logo_desc')}</Text>
                        </View>

                        {/* Section: Legal Info */}
                        <SectionHeader icon={<Briefcase size={13} color="#94A3B8" />} label={t('business_profile.legal_info')} />

                        <FieldWithFocus
                            label={t('business_profile.business_name')}
                            value={businessName}
                            onChangeText={setBusinessName}
                            placeholder={t('business_profile.business_name_placeholder')}
                            icon={<Store size={16} color={activeField === 'name' ? INDIGO : '#94A3B8'} />}
                            active={activeField === 'name'}
                            onFocus={() => setActiveField('name')}
                            onBlur={() => setActiveField(null)}
                        />
                        <FieldWithFocus
                            label={t('business_profile.rccm')}
                            value={registrationNumber}
                            onChangeText={setRegistrationNumber}
                            placeholder={t('business_profile.rccm_placeholder')}
                            icon={<Briefcase size={16} color={activeField === 'rccm' ? INDIGO : '#94A3B8'} />}
                            active={activeField === 'rccm'}
                            onFocus={() => setActiveField('rccm')}
                            onBlur={() => setActiveField(null)}
                        />
                        <FieldWithFocus
                            label={t('business_profile.tax_id')}
                            value={taxId}
                            onChangeText={setTaxId}
                            placeholder={t('business_profile.tax_id_placeholder')}
                            icon={<FileText size={16} color={activeField === 'tax' ? INDIGO : '#94A3B8'} />}
                            active={activeField === 'tax'}
                            onFocus={() => setActiveField('tax')}
                            onBlur={() => setActiveField(null)}
                        />

                        {/* Section: Digital */}
                        <SectionHeader icon={<Globe size={13} color="#94A3B8" />} label={t('business_profile.digital_presence')} />

                        <FieldWithFocus
                            label={t('business_profile.website')}
                            value={website}
                            onChangeText={setWebsite}
                            placeholder={t('business_profile.website_placeholder')}
                            icon={<Globe size={16} color={activeField === 'web' ? INDIGO : '#94A3B8'} />}
                            active={activeField === 'web'}
                            onFocus={() => setActiveField('web')}
                            onBlur={() => setActiveField(null)}
                            keyboardType="url"
                        />

                        {/* Sector Selector */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{t('business_profile.industry')}</Text>
                            <TouchableOpacity
                                style={[styles.fieldRow, businessCategory ? styles.fieldRowFilled : null]}
                                onPress={() => { Haptics.selectionAsync(); setSectorModalVisible(true); }}
                                activeOpacity={0.75}
                            >
                                <View style={[styles.fieldIcon, businessCategory ? styles.fieldIconActive : null]}>
                                    <LayoutDashboard size={16} color={businessCategory ? INDIGO : '#94A3B8'} />
                                </View>
                                <Text style={[styles.fieldValue, !businessCategory && styles.fieldPlaceholder]}>
                                    {businessCategory
                                        ? (t(`business_profile.sectors.${businessCategory === 'E-commerce' ? 'Ecommerce' : businessCategory}`) || businessCategory)
                                        : t('business_profile.industry_placeholder')}
                                </Text>
                                <ChevronRight size={16} color="#CBD5E1" strokeWidth={2} />
                            </TouchableOpacity>
                        </View>

                        {/* Live Preview Card */}
                        <View style={styles.previewHeader}>
                            <Sparkles size={13} color="#94A3B8" />
                            <Text style={styles.previewHeaderText}>Aperçu sur vos factures</Text>
                        </View>

                        <LinearGradient colors={['#1e1b4b', '#2d2a6e', '#312e81']} style={styles.previewCard}>
                            <View style={styles.previewCardInner}>
                                <View style={styles.previewLogoBox}>
                                    {logoUrl ? (
                                        <Image source={{ uri: logoUrl }} style={styles.previewLogoImage} resizeMode="cover" />
                                    ) : (
                                        <Text style={styles.previewLogoInitials}>{initials}</Text>
                                    )}
                                </View>
                                <View style={styles.previewInfo}>
                                    <Text style={styles.previewName} numberOfLines={1}>
                                        {businessName || t('business_profile.preview.your_business')}
                                    </Text>
                                    <Text style={styles.previewWebsite} numberOfLines={1}>
                                        {website || t('business_profile.preview.invoice_preview')}
                                    </Text>
                                    {(taxId || registrationNumber) ? (
                                        <View style={styles.previewBadgeRow}>
                                            {taxId ? <View style={styles.previewTag}><Text style={styles.previewTagText}>NIF: {taxId}</Text></View> : null}
                                            {registrationNumber ? <View style={styles.previewTag}><Text style={styles.previewTagText}>RCCM: {registrationNumber.slice(0, 10)}</Text></View> : null}
                                        </View>
                                    ) : null}
                                </View>
                                <View style={styles.previewProBadge}>
                                    <Text style={styles.previewProText}>PRO</Text>
                                </View>
                            </View>
                            {/* Decorative lines */}
                            <View style={styles.previewDivider} />
                            <View style={styles.previewFooter}>
                                <View style={styles.previewLineShort} />
                                <View style={styles.previewLineLong} />
                            </View>
                        </LinearGradient>

                        <View style={{ height: 100 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Floating Save Button */}
            <View style={styles.floatBtnContainer}>
                <Animated.View style={{ transform: [{ scale: saveAnim }] }}>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.88}
                        style={styles.floatBtn}
                    >
                        <LinearGradient
                            colors={saving ? ['#94A3B8', '#94A3B8'] : [INDIGO_DARK, INDIGO]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.floatBtnGradient}
                        >
                            {saving ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <CheckCircle2 size={18} color="white" strokeWidth={2.5} style={{ marginRight: 10 }} />
                                    <Text style={styles.floatBtnText}>{t('business_profile.save_profile')}</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}

/* ─── Reusable Sub-components ─── */

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <View style={styles.sectionHeader}>
            {icon}
            <Text style={styles.sectionHeaderText}>{label}</Text>
            <View style={styles.sectionHeaderLine} />
        </View>
    );
}

function FieldWithFocus({ label, value, onChangeText, placeholder, icon, active, onFocus, onBlur, keyboardType = 'default' }: any) {
    return (
        <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, active && styles.fieldLabelActive]}>{label}</Text>
            <View style={[styles.fieldRow, active && styles.fieldRowActive]}>
                <View style={[styles.fieldIcon, active && styles.fieldIconActive]}>
                    {icon}
                </View>
                <TextInput
                    style={styles.fieldInput}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#CBD5E1"
                    keyboardType={keyboardType}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    autoCorrect={false}
                />
                {value ? <CheckCircle2 size={14} color="#10B981" strokeWidth={2.5} /> : null}
            </View>
        </View>
    );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F8FAFC' },
    safeArea: { flex: 1 },
    flex: { flex: 1 },

    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', gap: 12 },
    loadingText: { color: '#94A3B8', fontWeight: '600', fontSize: 14 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
    headerBtn: { width: 40, height: 40, backgroundColor: 'white', borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#6366F1', shadowOpacity: 0.15, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: 'rgba(99,102,241,0.08)' },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '900', color: '#0F172A', letterSpacing: -0.3 },
    headerUnderline: { height: 2, width: 24, backgroundColor: INDIGO, borderRadius: 2, marginTop: 3 },

    // Scroll
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

    // Verified
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(251,191,36,0.1)', borderWidth: 1, borderColor: 'rgba(217,119,6,0.2)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, marginBottom: 24, gap: 6 },
    verifiedText: { color: '#B45309', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },

    // Logo
    logoSection: { alignItems: 'center', marginBottom: 32 },
    logoWrapper: { position: 'relative', marginBottom: 12 },
    logoBorder: { width: 110, height: 110, borderRadius: 34, padding: 3, shadowColor: INDIGO, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
    logoInner: { flex: 1, backgroundColor: 'white', borderRadius: 32, overflow: 'hidden' },
    logoImage: { width: '100%', height: '100%' },
    logoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF' },
    logoInitials: { fontSize: 36, fontWeight: '900', color: INDIGO },
    logoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
    cameraBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: INDIGO_DARK, width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#F8FAFC', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
    logoTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
    logoSubtitle: { fontSize: 11, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

    // Section Headers
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: 8, gap: 6 },
    sectionHeaderText: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.5 },
    sectionHeaderLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },

    // Field
    fieldContainer: { marginBottom: 14 },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginLeft: 2 },
    fieldLabelActive: { color: INDIGO },
    fieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: '#E2E8F0', gap: 10, shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    fieldRowActive: { borderColor: INDIGO, shadowColor: INDIGO, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
    fieldRowFilled: { borderColor: '#C7D2FE' },
    fieldIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    fieldIconActive: { backgroundColor: '#EEF2FF' },
    fieldInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0F172A', padding: 0 },
    fieldValue: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0F172A' },
    fieldPlaceholder: { color: '#CBD5E1', fontWeight: '500' },

    // Preview
    previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: 24 },
    previewHeaderText: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.5 },
    previewCard: { borderRadius: 24, padding: 20, shadowColor: '#312e81', shadowOpacity: 0.25, shadowRadius: 20, elevation: 8, marginBottom: 8 },
    previewCardInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    previewLogoBox: { width: 52, height: 52, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    previewLogoImage: { width: 40, height: 40, borderRadius: 12 },
    previewLogoInitials: { fontSize: 22, fontWeight: '900', color: 'white' },
    previewInfo: { flex: 1 },
    previewName: { fontSize: 15, fontWeight: '900', color: 'white', letterSpacing: -0.3, marginBottom: 2 },
    previewWebsite: { fontSize: 11, color: 'rgba(165,180,252,0.9)', fontWeight: '600', marginBottom: 6 },
    previewBadgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    previewTag: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    previewTagText: { fontSize: 9, color: 'rgba(199,210,254,0.9)', fontWeight: '700', letterSpacing: 0.5 },
    previewProBadge: { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    previewProText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
    previewDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 16, marginBottom: 12 },
    previewFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    previewLineShort: { width: 60, height: 3, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3 },
    previewLineLong: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 3 },

    // Float Button
    floatBtnContainer: { position: 'absolute', bottom: 28, left: 20, right: 20 },
    floatBtn: { borderRadius: 20, overflow: 'hidden', shadowColor: INDIGO_DARK, shadowOpacity: 0.45, shadowRadius: 16, elevation: 8 },
    floatBtnGradient: { height: 58, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderRadius: 20 },
    floatBtnText: { color: 'white', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.5 },

    // Modal
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
    modalHandle: { width: 36, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
    modalSubtitle: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginBottom: 16 },
    sectorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 16, marginBottom: 6, borderRadius: 14, borderWidth: 1.5, borderColor: '#F1F5F9', backgroundColor: '#FAFAFA' },
    sectorRowSelected: { borderColor: INDIGO, backgroundColor: '#EEF2FF' },
    sectorLabel: { fontSize: 15, fontWeight: '600', color: '#334155' },
    sectorLabelSelected: { color: INDIGO, fontWeight: '800' },
    modalCancel: { marginTop: 12, alignItems: 'center', paddingVertical: 14 },
    modalCancelText: { fontSize: 15, fontWeight: '700', color: '#94A3B8' },
});
