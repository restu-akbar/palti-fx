export const MIN_PASSWORD_LENGTH = 8;
export const OTP_LENGTH = 8;

/** Email / ID Member: trim + huruf kecil. */
export function normalizeIdentifier(v: string): string {
  return (v ?? '').trim().toLowerCase();
}

/** Kode undangan: trim, huruf besar, buang spasi & strip. */
export function normalizeInviteCode(v: string): string {
  return (v ?? '').toUpperCase().replace(/[\s-]+/g, '');
}

/** OTP: hanya digit, maksimal 8 digit. */
export function normalizeOtp(v: string): string {
  return (v ?? '').replace(/\D+/g, '').slice(0, OTP_LENGTH);
}

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v ?? '').trim());
}

/** Mengembalikan pesan error, atau null jika valid (min 8 karakter, harus berisikan huruf dan angka). */
export function validatePassword(pw: string): string | null {
  if (!pw || pw.length < MIN_PASSWORD_LENGTH) {
    return `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }
  if (!/[a-zA-Z]/.test(pw)) {
    return 'Kata sandi harus mengandung setidaknya satu huruf (a-z / A-Z).';
  }
  if (!/[0-9]/.test(pw)) {
    return 'Kata sandi harus mengandung setidaknya satu angka (0-9).';
  }
  return null;
}

/** Mengecek kriteria password secara individual untuk feedback UI. */
export function checkPasswordCriteria(pw: string) {
  const p = pw ?? '';
  return {
    minLength: p.length >= MIN_PASSWORD_LENGTH,
    hasLetter: /[a-zA-Z]/.test(p),
    hasDigit: /[0-9]/.test(p),
    isValid: p.length >= MIN_PASSWORD_LENGTH && /[a-zA-Z]/.test(p) && /[0-9]/.test(p),
  };
}

export interface AuthErrorLike {
  code?: string;
  message?: string;
  status?: number;
  name?: string;
}

/** Terjemahkan error Supabase Auth ke pesan Indonesia yang ramah. */
export function mapAuthError(err: AuthErrorLike | null | undefined): string {
  const code = err?.code ?? '';
  const msg = (err?.message ?? '').toLowerCase();
  const status = err?.status;

  if (msg.includes('error sending') || msg.includes('recovery email') || msg.includes('smtp') || status === 500) {
    return 'Gagal mengirim email dari server (SMTP). Jika memakai Resend Sandbox, email tujuan harus sama dengan akun Resend Anda (atau verifikasi domain di Resend).';
  }
  if (err?.name === 'AuthRetryableFetchError' || msg.includes('network request failed') || msg.includes('failed to fetch')) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  }
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'Email/ID Member atau kata sandi tidak cocok.';
  }
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Periksa kotak masuk email Anda.';
  }
  if (code === 'user_banned' || msg.includes('banned')) {
    return 'Akun ini ditangguhkan. Silakan hubungi admin PALTI FX.';
  }
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || status === 429 || msg.includes('rate limit')) {
    return 'Terlalu banyak percobaan. Coba lagi beberapa saat.';
  }
  if (code === 'user_already_exists' || code === 'email_exists' || msg.includes('already registered')) {
    return 'Email ini sudah memiliki akun aktif. Silakan masuk.';
  }
  if (code === 'weak_password' || msg.includes('password should be')) {
    return `Kata sandi terlalu lemah. Gunakan minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }
  if (code === 'same_password' || msg.includes('different from the old password')) {
    return 'Kata sandi baru tidak boleh sama dengan yang lama.';
  }
  if (code === 'otp_expired' || msg.includes('expired') || msg.includes('invalid') && msg.includes('token')) {
    return 'Kode salah atau sudah kedaluwarsa.';
  }
  if (msg.includes('database error saving new user')) {
    return 'Kode undangan tidak valid, sudah dipakai, atau kedaluwarsa.';
  }
  return 'Terjadi kendala. Silakan coba lagi.';
}
