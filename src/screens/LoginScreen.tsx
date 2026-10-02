import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoMark, Wordmark } from '../components/Logo';
import { PressScale, tap } from '../components/motion';
import { colors, fonts, goldGradient } from '../theme';

const isWeb = Platform.OS === 'web';

export type LoginScreenProps = {
  onSuccess: (credentials: { identifier: string; name?: string }) => void;
  onForgotPassword?: (identifier?: string) => void;
};

export function LoginScreen({ onSuccess, onForgotPassword }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<TextInput>(null);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'identifier' | 'password' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailFormatError, setEmailFormatError] = useState(false);
  const [showPendingSheet, setShowPendingSheet] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showActivateSheet, setShowActivateSheet] = useState(false);

  /* State Aktivasi Akun Baru */
  const [activateIdentifier, setActivateIdentifier] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [activateSuccess, setActivateSuccess] = useState(false);

  const handleOpenActivate = () => {
    tap('select');
    setActivateIdentifier(identifier);
    setActivationCode('');
    setActivateError(null);
    setActivateSuccess(false);
    setShowActivateSheet(true);
  };

  const handleActivateSubmit = () => {
    Keyboard.dismiss();
    setActivateError(null);
    if (!activateIdentifier.trim()) {
      setActivateError('Masukkan email atau username terlebih dahulu.');
      return;
    }
    if (!activationCode.trim()) {
      setActivateError('Masukkan kode aktivasi undangan dari admin.');
      return;
    }
    tap('select');
    setIsActivating(true);

    setTimeout(() => {
      setIsActivating(false);
      tap('success');
      setActivateSuccess(true);
    }, 850);
  };

  const isActivateValid = activateIdentifier.trim().length > 0 && activationCode.trim().length >= 4;

  const handleIdentifierBlur = () => {
    setFocusedField(null);
    if (identifier.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailFormatError(!emailRegex.test(identifier.trim()));
    } else {
      setEmailFormatError(false);
    }
  };

  const handleLogin = () => {
    Keyboard.dismiss();
    setErrorMessage(null);
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password;
    if (!cleanId || !cleanPass) return;
    tap('select');
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (cleanId === 'error') {
        tap('light');
        setErrorMessage('Email atau kata sandi tidak cocok. Silakan periksa kembali.');
        setPassword('');
        return;
      }
      if (cleanId === 'pending') { tap('light'); setShowPendingSheet(true); return; }
      if (cleanId === 'suspended') { tap('light'); setShowSuspendedModal(true); return; }
      tap('success');
      const displayName = cleanId.includes('@') ? cleanId.split('@')[0] : cleanId;
      onSuccess({ identifier: cleanId, name: displayName.charAt(0).toUpperCase() + displayName.slice(1) });
    }, 900);
  };

  const isFormValid = identifier.trim().length > 0 && password.length > 0;

  const openUrl = (url: string) => {
    if (isWeb) { window.open(url, '_blank'); }
    else { Linking.openURL(url).catch(() => {}); }
  };

  return (
    <View style={st.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[st.scroll, { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand Identity: Logo + Wordmark statis, tanpa animasi ── */}
          <View style={st.brandBlock}>
            <LogoMark size={56} variant="gold" />
            <View style={st.brandTextBlock}>
              <Wordmark width={110} variant="gold" />
              <View style={st.taglineRow}>
                <View style={st.taglineLine} />
                <Text style={st.tagline}>Portal Trader</Text>
                <View style={st.taglineLine} />
              </View>
            </View>
          </View>

          {/* ── Card Form ── */}
          <View style={st.cardOuter}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 40 : 25}
              tint="dark"
              style={st.card}
            >
              {/* Glass sheen */}
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.01)', 'transparent']}
                style={st.cardSheen}
                pointerEvents="none"
              />

              {/* Border caps & sides */}
              <View style={st.cardBorderTopCap} pointerEvents="none" />
              <LinearGradient
                colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)', 'transparent']}
                locations={[0, 0.3, 0.85]}
                style={st.cardBorderLeft}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)', 'transparent']}
                locations={[0, 0.3, 0.85]}
                style={st.cardBorderRight}
                pointerEvents="none"
              />


              <View style={st.cardContent}>
                {/* Card Header */}
                <View style={st.cardHead}>
                  <Text style={st.cardTitle}>Masuk ke Akun</Text>
                  <Text style={st.cardSub}>Gunakan akun yang telah disiapkan admin</Text>
                </View>

                {/* Error Banner */}
                {errorMessage ? (
                  <View style={st.errBanner}>
                    <View style={st.errIconWrap}>
                      <Ionicons name="alert-circle" size={14} color={colors.red} />
                    </View>
                    <Text style={st.errText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* Form */}
                <View style={st.form}>
                  {/* Email / Username */}
                  <View style={st.fieldCol}>
                    <Text style={st.label}>EMAIL ATAU USERNAME</Text>
                    <View style={[st.inputBox, focusedField === 'identifier' && st.inputOn, emailFormatError && st.inputErr]}>
                      <Ionicons name="mail-outline" size={15} color={focusedField === 'identifier' ? colors.gold : 'rgba(255,255,255,0.25)'} style={st.fieldIco} />
                      <TextInput
                        value={identifier}
                        onChangeText={(t) => { setIdentifier(t); if (errorMessage) setErrorMessage(null); }}
                        onFocus={() => setFocusedField('identifier')}
                        onBlur={handleIdentifierBlur}
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        returnKeyType="next"
                        placeholder="nama@email.com atau username"
                        placeholderTextColor="rgba(255,255,255,0.18)"
                        autoCapitalize="none"
                        autoCorrect={false}
                        selectionColor={colors.gold}
                        editable={!isSubmitting}
                        style={st.textInput}
                        accessibilityLabel="Input email atau username"
                      />
                      {identifier.length > 0 && (
                        <Pressable onPress={() => { setIdentifier(''); setEmailFormatError(false); }} hitSlop={8}>
                          <Ionicons name="close-circle" size={14} color="rgba(255,255,255,0.20)" />
                        </Pressable>
                      )}
                    </View>
                    {emailFormatError && <Text style={st.inlineErr}>Format email belum sesuai</Text>}
                  </View>

                  {/* Password */}
                  <View style={st.fieldCol}>
                    <View style={st.labelRow}>
                      <Text style={st.label}>KATA SANDI</Text>
                      <Pressable onPress={() => { tap('select'); setShowForgotModal(true); }} hitSlop={10}>
                        <Text style={st.forgotLnk}>Lupa sandi?</Text>
                      </Pressable>
                    </View>
                    <View style={[st.inputBox, focusedField === 'password' && st.inputOn]}>
                      <Ionicons name="lock-closed-outline" size={15} color={focusedField === 'password' ? colors.gold : 'rgba(255,255,255,0.25)'} style={st.fieldIco} />
                      <TextInput
                        ref={passwordRef}
                        value={password}
                        onChangeText={(t) => { setPassword(t); if (errorMessage) setErrorMessage(null); }}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        onSubmitEditing={isFormValid ? handleLogin : undefined}
                        returnKeyType="done"
                        placeholder="Masukkan kata sandi"
                        placeholderTextColor="rgba(255,255,255,0.18)"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        selectionColor={colors.gold}
                        editable={!isSubmitting}
                        style={st.textInput}
                        accessibilityLabel="Input kata sandi"
                      />
                      <Pressable onPress={() => { tap('select'); setShowPassword((p) => !p); }} hitSlop={12}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color={showPassword ? colors.gold : 'rgba(255,255,255,0.20)'} />
                      </Pressable>
                    </View>
                  </View>

                  {/* Submit */}
                  <PressScale onPress={!isFormValid || isSubmitting ? undefined : handleLogin} scaleTo={!isFormValid || isSubmitting ? 1 : 0.97}>
                    <View style={st.submitWrap}>
                      <LinearGradient
                        colors={isFormValid && !isSubmitting ? goldGradient : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={[st.submitBtn, (!isFormValid || isSubmitting) && { opacity: 0.50 }]}
                      >
                        {isSubmitting ? (
                          <View style={st.loadRow}>
                            <ActivityIndicator size="small" color={colors.ink} />
                            <Text style={[st.submitTxt, { color: colors.ink }]}>Memverifikasi...</Text>
                          </View>
                        ) : (
                          <Text style={[st.submitTxt, { color: isFormValid ? colors.ink : 'rgba(255,255,255,0.30)' }]}>Masuk</Text>
                        )}
                      </LinearGradient>
                    </View>
                  </PressScale>
                </View>

                {/* Divider + Aktivasi */}
                <View style={st.footerSection}>
                  <View style={st.footerDividerRow}>
                    <View style={st.footerDivLine} />
                    <Text style={st.footerDivText}>atau</Text>
                    <View style={st.footerDivLine} />
                  </View>
                  <Pressable
                    onPress={handleOpenActivate}
                    hitSlop={8}
                    style={st.activateBtn}
                  >
                    <Text style={st.activateTxt}>Aktivasi Akun Baru</Text>
                  </Pressable>
                </View>
              </View>
            </BlurView>
          </View>

          {/* Version */}
          <Text style={st.ver}>v1.0.0 · PALTI FX</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modal: Pending ── */}
      <Modal
        visible={showPendingSheet}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowPendingSheet(false)}
      >
        <View style={st.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPendingSheet(false)}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={st.modalDimmer} />
          </Pressable>

          <BlurView intensity={Platform.OS === 'ios' ? 25 : 15} tint="dark" style={st.modalCard}>
            <Text style={st.modalTitle}>Akun Belum Diaktifkan</Text>
            <Text style={st.modalDesc}>
              Akun Anda sudah disiapkan oleh admin. Lakukan verifikasi undangan dan tetapkan kata sandi Anda.
            </Text>

            <View style={st.modalBtnRow}>
              <Pressable
                onPress={() => {
                  tap('light');
                  setShowPendingSheet(false);
                }}
                hitSlop={8}
                style={st.modalCancelBtn}
              >
                <Text style={st.modalCancelText}>Tutup</Text>
              </Pressable>

              <View style={{ flex: 1 }}>
                <PressScale
                  onPress={() => {
                    setShowPendingSheet(false);
                    handleOpenActivate();
                  }}
                >
                  <LinearGradient
                    colors={goldGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={st.modalConfirmBtn}
                  >
                    <Text style={st.modalConfirmText}>Aktivasi</Text>
                  </LinearGradient>
                </PressScale>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* ── Modal: Suspended ── */}
      <Modal
        visible={showSuspendedModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowSuspendedModal(false)}
      >
        <View style={st.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSuspendedModal(false)}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={st.modalDimmer} />
          </Pressable>

          <BlurView intensity={Platform.OS === 'ios' ? 25 : 15} tint="dark" style={st.modalCard}>
            <Text style={st.modalTitle}>Akses Akun Dibatasi</Text>
            <Text style={st.modalDesc}>
              Akun ini dinonaktifkan sementara oleh administrator. Hubungi tim support untuk pemulihan akses.
            </Text>

            <View style={st.modalBtnRow}>
              <Pressable
                onPress={() => {
                  tap('light');
                  setShowSuspendedModal(false);
                }}
                hitSlop={8}
                style={st.modalCancelBtn}
              >
                <Text style={st.modalCancelText}>Kembali</Text>
              </Pressable>

              <View style={{ flex: 1 }}>
                <PressScale
                  onPress={() => {
                    setShowSuspendedModal(false);
                    openUrl('https://wa.me/?text=Halo%20Admin%20Palti%20FX,%20mohon%20bantuan%20akses%20akun%20saya');
                  }}
                >
                  <View style={[st.modalConfirmBtn, { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }]}>
                    <Text style={[st.modalConfirmText, { color: colors.text }]}>Hubungi Support</Text>
                  </View>
                </PressScale>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* ── Modal: Forgot Password ── */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowForgotModal(false)}
      >
        <View style={st.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowForgotModal(false)}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={st.modalDimmer} />
          </Pressable>

          <BlurView intensity={Platform.OS === 'ios' ? 25 : 15} tint="dark" style={st.modalCard}>
            <Text style={st.modalTitle}>Lupa Kata Sandi?</Text>
            <Text style={st.modalDesc}>
              Atur ulang kata sandi dengan verifikasi kode OTP ke email terdaftar Anda. Lanjutkan ke pemulihan akun?
            </Text>

            <View style={st.modalBtnRow}>
              <Pressable
                onPress={() => {
                  tap('light');
                  setShowForgotModal(false);
                }}
                hitSlop={8}
                style={st.modalCancelBtn}
                accessibilityRole="button"
                accessibilityLabel="Batal"
              >
                <Text style={st.modalCancelText}>Batal</Text>
              </Pressable>

              <View style={{ flex: 1 }}>
                <PressScale
                  onPress={() => {
                    tap('select');
                    setShowForgotModal(false);
                    if (onForgotPassword) {
                      onForgotPassword(identifier);
                    }
                  }}
                  accessibilityLabel="Konfirmasi lanjutkan reset kata sandi"
                >
                  <LinearGradient
                    colors={goldGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={st.modalConfirmBtn}
                  >
                    <Text style={st.modalConfirmText}>Ya, Lanjutkan</Text>
                  </LinearGradient>
                </PressScale>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* ── Modal: Aktivasi Akun Baru (Konsisten, Besar, Urgent, Elegan) ── */}
      <Modal
        visible={showActivateSheet}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!isActivating) setShowActivateSheet(false);
        }}
      >
        <View style={st.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!isActivating) setShowActivateSheet(false);
            }}
          >
            <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={st.modalDimmer} />
          </Pressable>

          {activateSuccess ? (
            <BlurView intensity={Platform.OS === 'ios' ? 25 : 15} tint="dark" style={st.modalCard}>
              <Text style={st.modalTitle}>Aktivasi Akun Berhasil</Text>
              <Text style={st.modalDesc}>
                Undangan Anda berhasil diverifikasi. Akun Anda kini aktif dan siap digunakan untuk masuk.
              </Text>

              <View style={{ width: '100%' }}>
                <PressScale
                  onPress={() => {
                    tap('success');
                    setShowActivateSheet(false);
                    setIdentifier(activateIdentifier);
                    passwordRef.current?.focus();
                  }}
                  accessibilityLabel="Masuk ke Akun"
                >
                  <LinearGradient
                    colors={goldGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={st.modalConfirmBtn}
                  >
                    <Text style={st.modalConfirmText}>Masuk ke Akun</Text>
                  </LinearGradient>
                </PressScale>
              </View>
            </BlurView>
          ) : (
            <BlurView intensity={Platform.OS === 'ios' ? 40 : 25} tint="dark" style={st.activateCard}>
              {/* Glass Sheen & Border Top Cap */}
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.01)', 'transparent']}
                style={st.cardSheen}
                pointerEvents="none"
              />
              <View style={st.cardBorderTopCap} pointerEvents="none" />

              <View style={{ gap: 16 }}>
                {/* Head */}
                <View style={st.activateHead}>
                  <Text style={st.activateTitle}>Aktivasi Akun Baru</Text>
                  <Text style={st.activateDesc}>
                    Akun Anda telah disiapkan oleh administrator. Masukkan kode undangan resmi untuk mengaktifkan akun dan membuat kata sandi.
                  </Text>
                </View>

                {/* Error Banner */}
                {activateError && (
                  <View style={st.errBanner}>
                    <Ionicons name="alert-circle" size={14} color={colors.red} />
                    <Text style={st.errText}>{activateError}</Text>
                  </View>
                )}

                {/* Field 1: Email / Username */}
                <View style={st.fieldCol}>
                  <Text style={st.activateLabel}>EMAIL ATAU USERNAME</Text>
                  <View style={st.inputBox}>
                    <Ionicons name="mail-outline" size={15} color="rgba(255,255,255,0.25)" style={st.fieldIco} />
                    <TextInput
                      value={activateIdentifier}
                      onChangeText={(t) => {
                        setActivateIdentifier(t);
                        if (activateError) setActivateError(null);
                      }}
                      placeholder="nama@email.com atau username"
                      placeholderTextColor="rgba(255,255,255,0.18)"
                      autoCapitalize="none"
                      autoCorrect={false}
                      selectionColor={colors.gold}
                      style={st.textInput}
                    />
                  </View>
                </View>

                {/* Field 2: Kode Undangan (No ticket emoticon) */}
                <View style={st.fieldCol}>
                  <Text style={st.activateLabel}>KODE AKTIVASI UNDANGAN</Text>
                  <View style={st.inputBox}>
                    <Ionicons name="key-outline" size={15} color="rgba(255,255,255,0.25)" style={st.fieldIco} />
                    <TextInput
                      value={activationCode}
                      onChangeText={(t) => {
                        setActivationCode(t.toUpperCase());
                        if (activateError) setActivateError(null);
                      }}
                      placeholder="Contoh: PFX-8890"
                      placeholderTextColor="rgba(255,255,255,0.18)"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      selectionColor={colors.gold}
                      style={st.textInput}
                    />
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={{ gap: 8, marginTop: 4 }}>
                  <PressScale
                    onPress={isActivating || !isActivateValid ? undefined : handleActivateSubmit}
                    scaleTo={isActivating || !isActivateValid ? 1 : 0.98}
                  >
                    <View style={st.submitWrap}>
                      <LinearGradient
                        colors={isActivateValid && !isActivating ? goldGradient : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[st.submitBtn, (!isActivateValid || isActivating) && { opacity: 0.5 }]}
                      >
                        {isActivating ? (
                          <View style={st.loadRow}>
                            <ActivityIndicator size="small" color={colors.ink} />
                            <Text style={[st.submitTxt, { color: colors.ink }]}>Memverifikasi Undangan...</Text>
                          </View>
                        ) : (
                          <Text style={[st.submitTxt, { color: isActivateValid ? colors.ink : 'rgba(255,255,255,0.30)' }]}>
                            Verifikasi & Aktifkan Akun
                          </Text>
                        )}
                      </LinearGradient>
                    </View>
                  </PressScale>

                  <Pressable
                    onPress={() => {
                      tap('light');
                      setShowActivateSheet(false);
                      setActivateError(null);
                    }}
                    hitSlop={8}
                    style={st.activateCancelBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Batal aktivasi"
                  >
                    <Text style={st.activateCancelTxt}>Batal</Text>
                  </Pressable>
                </View>
              </View>
            </BlurView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  /* Scroll */
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
    gap: 28,
    alignItems: 'center',
  },

  /* Brand — statis, logo + wordmark menyatu */
  brandBlock: {
    alignItems: 'center',
    gap: 12,
  },
  brandTextBlock: { alignItems: 'center', gap: 6 },
  taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  taglineLine: { width: 20, height: 0.5, backgroundColor: 'rgba(255,255,255,0.12)' },
  tagline: {
    color: 'rgba(255,255,255,0.35)',
    fontFamily: fonts.medium,
    fontSize: 10.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  /* Card — glassmorphism nyaru dengan background */
  cardOuter: { width: '100%', maxWidth: 390 },
  card: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.045)',
    ...(isWeb ? ({ backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' } as any) : {}),
  },
  cardBorderTopCap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderBottomWidth: 0,
  },
  cardBorderLeft: {
    position: 'absolute',
    top: 23,
    bottom: 0,
    left: 0,
    width: 0.5,
  },
  cardBorderRight: {
    position: 'absolute',
    top: 23,
    bottom: 0,
    right: 0,
    width: 0.5,
  },
  cardSheen: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 45,
  },
  cardContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    gap: 20,
  },
  cardHead: { gap: 4, alignItems: 'center' },
  cardTitle: { color: 'rgba(255,255,255,0.92)', fontFamily: fonts.bold, fontSize: 19, letterSpacing: -0.3, textAlign: 'center' },
  cardSub: { color: 'rgba(255,255,255,0.42)', fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, textAlign: 'center' },

  /* Error */
  errBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(240,98,92,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(240,98,92,0.16)',
  },
  errIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(240,98,92,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errText: { flex: 1, color: 'rgba(240,98,92,0.85)', fontFamily: fonts.medium, fontSize: 12, lineHeight: 17 },

  /* Form */
  form: { gap: 16 },
  fieldCol: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: 'rgba(255,255,255,0.45)', fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.2 },
  forgotLnk: { color: 'rgba(237,193,58,0.70)', fontFamily: fonts.semi, fontSize: 11 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 13,
    paddingHorizontal: 14,
  },
  inputOn: { borderColor: 'rgba(237,193,58,0.35)', backgroundColor: 'rgba(237,193,58,0.03)' },
  inputErr: { borderColor: 'rgba(240,98,92,0.35)', backgroundColor: 'rgba(240,98,92,0.03)' },
  fieldIco: { marginRight: 10 },
  textInput: { flex: 1, color: 'rgba(255,255,255,0.88)', fontFamily: fonts.semi, fontSize: 13.5, paddingVertical: 0, outlineWidth: 0 } as any,
  inlineErr: { color: 'rgba(240,98,92,0.80)', fontFamily: fonts.medium, fontSize: 10.5, paddingLeft: 2 },
  submitWrap: { borderRadius: 13, overflow: 'hidden' },
  submitBtn: { height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  submitTxt: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 0.3 },
  loadRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  /* Footer */
  footerSection: { gap: 12 },
  footerDividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerDivLine: { flex: 1, height: 0.5, backgroundColor: 'rgba(255,255,255,0.06)' },
  footerDivText: { color: 'rgba(255,255,255,0.22)', fontFamily: fonts.medium, fontSize: 11 },
  activateBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 13,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  activateTxt: { color: 'rgba(255,255,255,0.50)', fontFamily: fonts.semi, fontSize: 12.5 },

  /* Version */
  ver: { color: 'rgba(255,255,255,0.14)', fontFamily: fonts.medium, fontSize: 10, textAlign: 'center', letterSpacing: 0.5 },

  /* Modals (Konsisten dengan Onboarding) */
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalDimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 310,
    backgroundColor: 'rgba(12, 16, 24, 0.90)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    ...(isWeb ? ({ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any) : {}),
  },
  modalTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.semi,
    fontSize: 16,
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18.5,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  modalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalCancelText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  modalConfirmBtn: {
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    width: '100%',
  },
  modalConfirmText: {
    color: colors.ink,
    fontFamily: fonts.semi,
    fontSize: 13,
    letterSpacing: 0.2,
  },

  /* Activate Card (Lebar, Elegan, Konsisten) */
  activateCard: {
    width: '100%',
    maxWidth: 375,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(12, 16, 24, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 10 },
    elevation: 15,
    ...(isWeb ? ({ backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' } as any) : {}),
  },
  activateHead: {
    gap: 4,
    alignItems: 'center',
  },
  activateTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 18,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  activateDesc: {
    color: 'rgba(255, 255, 255, 0.52)',
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
  },
  activateLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  activateCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activateCancelTxt: {
    color: 'rgba(255, 255, 255, 0.60)',
    fontFamily: fonts.semi,
    fontSize: 13,
  },
});
