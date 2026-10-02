import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
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

export type ResetPasswordScreenProps = {
  onBackToLogin: () => void;
  onSuccess: () => void;
  initialIdentifier?: string;
};

export function ResetPasswordScreen({
  onBackToLogin,
  onSuccess,
  initialIdentifier = '',
}: ResetPasswordScreenProps) {
  const insets = useSafeAreaInsets();

  // Steps: 1 = Minta & Masukkan OTP, 2 = Password Baru & Konfirmasi
  const [step, setStep] = useState<1 | 2>(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Step 1 state
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Step 2 state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const confirmPasswordRef = useRef<TextInput>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Handle Send OTP
  const handleSendOtp = () => {
    if (!identifier.trim()) {
      setOtpError('Masukkan email atau username terlebih dahulu');
      return;
    }
    setOtpError(null);
    Keyboard.dismiss();
    tap('select');
    setIsSendingOtp(true);

    setTimeout(() => {
      setIsSendingOtp(false);
      setOtpSent(true);
      setCountdown(60);
      tap('success');
    }, 750);
  };

  // Handle Verify OTP
  const handleVerifyOtp = () => {
    Keyboard.dismiss();
    setOtpError(null);
    if (otp.trim().length < 6) {
      setOtpError('Masukkan 6 digit kode OTP');
      return;
    }
    tap('select');
    setIsVerifyingOtp(true);

    setTimeout(() => {
      setIsVerifyingOtp(false);
      tap('success');
      setStep(2);
    }, 700);
  };

  // Handle Save New Password
  const handleSavePassword = () => {
    Keyboard.dismiss();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('Kata sandi baru minimal 8 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    tap('select');
    setIsSavingPassword(true);

    setTimeout(() => {
      setIsSavingPassword(false);
      tap('success');
      setShowSuccessModal(true);
    }, 750);
  };

  const isStep1Valid = identifier.trim().length > 0 && otp.trim().length === 6;
  const isStep2Valid =
    newPassword.length >= 8 && confirmPassword.length >= 8 && newPassword === confirmPassword;

  return (
    <View style={st.container}>
      {/* Top Header: Tombol Kembali */}
      <View style={[st.topNav, { top: insets.top + 12 }]}>
        <Pressable
          onPress={() => {
            tap('select');
            onBackToLogin();
          }}
          hitSlop={12}
          style={st.backBtn}
          accessibilityLabel="Kembali ke halaman login"
        >
          <Ionicons name="chevron-back" size={16} color="rgba(255,255,255,0.6)" />
          <Text style={st.backBtnText}>Kembali ke Login</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[st.scroll, { paddingTop: insets.top + 54, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Identity */}
          <View style={st.brandBlock}>
            <LogoMark size={50} variant="gold" />
            <View style={st.brandTextBlock}>
              <Wordmark width={105} variant="gold" />
              <View style={st.taglineRow}>
                <View style={st.taglineLine} />
                <Text style={st.tagline}>Pemulihan Akun</Text>
                <View style={st.taglineLine} />
              </View>
            </View>
          </View>

          {/* Stepper Indicator */}
          <View style={st.stepperWrap}>
            <View style={[st.stepItem, step === 1 && st.stepItemActive]}>
              <View style={[st.stepNumCircle, step === 1 && st.stepNumCircleActive]}>
                <Text style={[st.stepNumText, step === 1 && st.stepNumTextActive]}>1</Text>
              </View>
              <Text style={[st.stepLabel, step === 1 && st.stepLabelActive]}>Kode OTP</Text>
            </View>

            <View style={st.stepLine} />

            <View style={[st.stepItem, step === 2 && st.stepItemActive]}>
              <View style={[st.stepNumCircle, step === 2 && st.stepNumCircleActive]}>
                <Text style={[st.stepNumText, step === 2 && st.stepNumTextActive]}>2</Text>
              </View>
              <Text style={[st.stepLabel, step === 2 && st.stepLabelActive]}>Sandi Baru</Text>
            </View>
          </View>

          {/* Glassmorphic Card Container */}
          <View style={st.cardOuter}>
            <BlurView intensity={Platform.OS === 'ios' ? 40 : 25} tint="dark" style={st.card}>
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
                {/* ──────── STEP 1: MINTA & MASUKKAN KODE OTP ──────── */}
                {step === 1 && (
                  <View style={st.flowBlock}>
                    <View style={st.cardHead}>
                      <Text style={st.cardTitle}>Verifikasi Kode OTP</Text>
                      <Text style={st.cardSub}>
                        Masukkan email akun Anda untuk menerima kode OTP 6-digit.
                      </Text>
                    </View>

                    {otpError && (
                      <View style={st.errBanner}>
                        <Ionicons name="alert-circle" size={14} color={colors.red} />
                        <Text style={st.errText}>{otpError}</Text>
                      </View>
                    )}

                    {/* Email / Username Input */}
                    <View style={st.fieldCol}>
                      <Text style={st.label}>EMAIL ATAU USERNAME</Text>
                      <View style={st.inputBox}>
                        <Ionicons name="mail-outline" size={15} color="rgba(255,255,255,0.25)" style={st.fieldIco} />
                        <TextInput
                          value={identifier}
                          onChangeText={(t) => {
                            setIdentifier(t);
                            if (otpError) setOtpError(null);
                          }}
                          placeholder="nama@email.com atau username"
                          placeholderTextColor="rgba(255,255,255,0.18)"
                          autoCapitalize="none"
                          autoCorrect={false}
                          selectionColor={colors.gold}
                          style={st.textInput}
                        />
                        {identifier.length > 0 && (
                          <Pressable onPress={() => setIdentifier('')} hitSlop={8}>
                            <Ionicons name="close-circle" size={14} color="rgba(255,255,255,0.20)" />
                          </Pressable>
                        )}
                      </View>
                    </View>

                    {/* Standalone Button: Kirim Kode OTP */}
                    <PressScale
                      onPress={isSendingOtp || countdown > 0 || !identifier.trim() ? undefined : handleSendOtp}
                      scaleTo={isSendingOtp || countdown > 0 || !identifier.trim() ? 1 : 0.98}
                    >
                      <View
                        style={[
                          st.sendOtpFullBtn,
                          (countdown > 0 || !identifier.trim() || isSendingOtp) && { opacity: 0.5 },
                        ]}
                      >
                        {isSendingOtp ? (
                          <View style={st.loadRow}>
                            <ActivityIndicator size="small" color={colors.gold} />
                            <Text style={st.sendOtpFullBtnText}>Mengirim Kode...</Text>
                          </View>
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="paper-plane-outline" size={14} color={colors.gold} />
                            <Text style={st.sendOtpFullBtnText}>
                              {countdown > 0 ? `Kirim Ulang Kode OTP (${countdown}s)` : otpSent ? 'Kirim Ulang Kode OTP' : 'Kirim Kode OTP'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </PressScale>

                    {/* OTP Input */}
                    <View style={st.fieldCol}>
                      <View style={st.labelRow}>
                        <Text style={st.label}>KODE OTP</Text>
                        {otpSent && (
                          <Text style={st.otpHintText}>Kode telah dikirim</Text>
                        )}
                      </View>
                      <View style={st.inputBox}>
                        <Ionicons name="key-outline" size={15} color="rgba(255,255,255,0.25)" style={st.fieldIco} />
                        <TextInput
                          value={otp}
                          onChangeText={(t) => {
                            setOtp(t.replace(/[^0-9]/g, '').slice(0, 6));
                            if (otpError) setOtpError(null);
                          }}
                          placeholder="Masukkan 6 digit kode OTP"
                          placeholderTextColor="rgba(255,255,255,0.18)"
                          keyboardType="number-pad"
                          maxLength={6}
                          selectionColor={colors.gold}
                          style={st.textInput}
                        />
                      </View>
                    </View>

                    {/* Submit Step 1 Button */}
                    <PressScale
                      onPress={!isStep1Valid || isVerifyingOtp ? undefined : handleVerifyOtp}
                      scaleTo={!isStep1Valid || isVerifyingOtp ? 1 : 0.97}
                    >
                      <View style={st.submitWrap}>
                        <LinearGradient
                          colors={isStep1Valid && !isVerifyingOtp ? goldGradient : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[st.submitBtn, (!isStep1Valid || isVerifyingOtp) && { opacity: 0.5 }]}
                        >
                          {isVerifyingOtp ? (
                            <View style={st.loadRow}>
                              <ActivityIndicator size="small" color={colors.ink} />
                              <Text style={[st.submitTxt, { color: colors.ink }]}>Memverifikasi...</Text>
                            </View>
                          ) : (
                            <Text style={[st.submitTxt, { color: isStep1Valid ? colors.ink : 'rgba(255,255,255,0.30)' }]}>
                              Verifikasi & Lanjutkan
                            </Text>
                          )}
                        </LinearGradient>
                      </View>
                    </PressScale>
                  </View>
                )}

                {/* ──────── STEP 2: MASUKKAN PASSWORD BARU & KONFIRMASI ──────── */}
                {step === 2 && (
                  <View style={st.flowBlock}>
                    <View style={st.cardHead}>
                      <Text style={st.cardTitle}>Buat Kata Sandi Baru</Text>
                      <Text style={st.cardSub}>
                        Gunakan kombinasi minimal 8 karakter agar akun Anda tetap aman.
                      </Text>
                    </View>

                    {passwordError && (
                      <View style={st.errBanner}>
                        <Ionicons name="alert-circle" size={14} color={colors.red} />
                        <Text style={st.errText}>{passwordError}</Text>
                      </View>
                    )}

                    {/* New Password Field */}
                    <View style={st.fieldCol}>
                      <Text style={st.label}>KATA SANDI BARU</Text>
                      <View style={st.inputBox}>
                        <Ionicons name="lock-closed-outline" size={15} color="rgba(255,255,255,0.25)" style={st.fieldIco} />
                        <TextInput
                          value={newPassword}
                          onChangeText={(t) => {
                            setNewPassword(t);
                            if (passwordError) setPasswordError(null);
                          }}
                          placeholder="Minimal 8 karakter"
                          placeholderTextColor="rgba(255,255,255,0.18)"
                          secureTextEntry={!showNewPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          selectionColor={colors.gold}
                          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                          returnKeyType="next"
                          style={st.textInput}
                        />
                        <Pressable onPress={() => setShowNewPassword((p) => !p)} hitSlop={12}>
                          <Ionicons
                            name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={16}
                            color={showNewPassword ? colors.gold : 'rgba(255,255,255,0.20)'}
                          />
                        </Pressable>
                      </View>
                    </View>

                    {/* Confirm Password Field */}
                    <View style={st.fieldCol}>
                      <Text style={st.label}>KONFIRMASI KATA SANDI BARU</Text>
                      <View style={st.inputBox}>
                        <Ionicons name="lock-closed-outline" size={15} color="rgba(255,255,255,0.25)" style={st.fieldIco} />
                        <TextInput
                          ref={confirmPasswordRef}
                          value={confirmPassword}
                          onChangeText={(t) => {
                            setConfirmPassword(t);
                            if (passwordError) setPasswordError(null);
                          }}
                          placeholder="Ketik ulang kata sandi baru"
                          placeholderTextColor="rgba(255,255,255,0.18)"
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          selectionColor={colors.gold}
                          onSubmitEditing={isStep2Valid ? handleSavePassword : undefined}
                          returnKeyType="done"
                          style={st.textInput}
                        />
                        <Pressable onPress={() => setShowConfirmPassword((p) => !p)} hitSlop={12}>
                          <Ionicons
                            name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={16}
                            color={showConfirmPassword ? colors.gold : 'rgba(255,255,255,0.20)'}
                          />
                        </Pressable>
                      </View>
                    </View>

                    {/* Checklist Requirements */}
                    <View style={st.reqList}>
                      <View style={st.reqRow}>
                        <Ionicons
                          name={newPassword.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'}
                          size={13}
                          color={newPassword.length >= 8 ? colors.green : 'rgba(255,255,255,0.25)'}
                        />
                        <Text style={[st.reqText, newPassword.length >= 8 && st.reqTextDone]}>
                          Minimal 8 karakter
                        </Text>
                      </View>
                      <View style={st.reqRow}>
                        <Ionicons
                          name={
                            confirmPassword.length > 0 && newPassword === confirmPassword
                              ? 'checkmark-circle'
                              : 'ellipse-outline'
                          }
                          size={13}
                          color={
                            confirmPassword.length > 0 && newPassword === confirmPassword
                              ? colors.green
                              : 'rgba(255,255,255,0.25)'
                          }
                        />
                        <Text
                          style={[
                            st.reqText,
                            confirmPassword.length > 0 &&
                              newPassword === confirmPassword &&
                              st.reqTextDone,
                          ]}
                        >
                          Kata sandi cocok
                        </Text>
                      </View>
                    </View>

                    {/* Submit Step 2 Button */}
                    <PressScale
                      onPress={!isStep2Valid || isSavingPassword ? undefined : handleSavePassword}
                      scaleTo={!isStep2Valid || isSavingPassword ? 1 : 0.97}
                    >
                      <View style={st.submitWrap}>
                        <LinearGradient
                          colors={isStep2Valid && !isSavingPassword ? goldGradient : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[st.submitBtn, (!isStep2Valid || isSavingPassword) && { opacity: 0.5 }]}
                        >
                          {isSavingPassword ? (
                            <View style={st.loadRow}>
                              <ActivityIndicator size="small" color={colors.ink} />
                              <Text style={[st.submitTxt, { color: colors.ink }]}>Menyimpan...</Text>
                            </View>
                          ) : (
                            <Text style={[st.submitTxt, { color: isStep2Valid ? colors.ink : 'rgba(255,255,255,0.30)' }]}>
                              Simpan Kata Sandi Baru
                            </Text>
                          )}
                        </LinearGradient>
                      </View>
                    </PressScale>
                  </View>
                )}
              </View>
            </BlurView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modal Popup: Kata Sandi Berhasil Diperbarui ── */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onSuccess}
      >
        <View style={st.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onSuccess}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={st.modalDimmer} />
          </Pressable>

          <BlurView intensity={Platform.OS === 'ios' ? 25 : 15} tint="dark" style={st.modalCard}>
            <Text style={st.modalTitle}>Kata Sandi Diperbarui</Text>
            <Text style={st.modalDesc}>
              Kata sandi Anda berhasil diperbarui. Silakan masuk kembali menggunakan kata sandi baru Anda.
            </Text>

            <View style={{ width: '100%' }}>
              <PressScale
                onPress={() => {
                  tap('success');
                  setShowSuccessModal(false);
                  onSuccess();
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
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  /* Top Navigation */
  topNav: {
    position: 'absolute',
    left: 20,
    zIndex: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  backBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: fonts.medium,
    fontSize: 12,
  },

  /* Scroll */
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
    gap: 22,
    alignItems: 'center',
  },

  /* Brand */
  brandBlock: {
    alignItems: 'center',
    gap: 10,
  },
  brandTextBlock: { alignItems: 'center', gap: 5 },
  taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  taglineLine: { width: 20, height: 0.5, backgroundColor: 'rgba(255,255,255,0.12)' },
  tagline: {
    color: 'rgba(255,255,255,0.35)',
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  /* Stepper */
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.45,
  },
  stepItemActive: {
    opacity: 1,
  },
  stepNumCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  stepNumCircleActive: {
    backgroundColor: colors.gold,
  },
  stepNumText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  stepNumTextActive: {
    color: colors.ink,
  },
  stepLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  stepLabelActive: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: fonts.semi,
  },
  stepLine: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  /* Card */
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
  },
  flowBlock: {
    gap: 18,
  },
  cardHead: { gap: 4 },
  cardTitle: { color: 'rgba(255,255,255,0.92)', fontFamily: fonts.bold, fontSize: 18, letterSpacing: -0.3 },
  cardSub: { color: 'rgba(255,255,255,0.42)', fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18 },

  /* Error */
  errBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(240,98,92,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(240,98,92,0.16)',
  },
  errText: { flex: 1, color: 'rgba(240,98,92,0.85)', fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },

  /* Form Fields */
  fieldCol: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: 'rgba(255,255,255,0.45)', fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.2 },
  otpHintText: { color: 'rgba(237,193,58,0.7)', fontFamily: fonts.medium, fontSize: 10.5 },
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
  fieldIco: { marginRight: 10 },
  textInput: { flex: 1, color: 'rgba(255,255,255,0.88)', fontFamily: fonts.semi, fontSize: 13.5, paddingVertical: 0, outlineWidth: 0 } as any,
  sendOtpFullBtn: {
    height: 42,
    borderRadius: 13,
    borderWidth: 0.5,
    borderColor: 'rgba(237, 193, 58, 0.25)',
    backgroundColor: 'rgba(237, 193, 58, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOtpFullBtnText: {
    color: colors.gold,
    fontFamily: fonts.semi,
    fontSize: 12.5,
  },

  /* Password Requirements */
  reqList: { gap: 6, paddingVertical: 2 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reqText: { color: 'rgba(255,255,255,0.35)', fontFamily: fonts.medium, fontSize: 11 },
  reqTextDone: { color: 'rgba(255,255,255,0.7)' },

  /* Submit Button */
  submitWrap: { borderRadius: 13, overflow: 'hidden', marginTop: 4 },
  submitBtn: { height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  submitTxt: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 0.3 },
  loadRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  /* Modal Popup Sukses (Konsisten dengan Onboarding & Login) */
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
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
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
  modalConfirmBtn: {
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalConfirmText: {
    color: colors.ink,
    fontFamily: fonts.semi,
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
