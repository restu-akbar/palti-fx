import type { Session } from '@supabase/supabase-js';
import {
  isEmail,
  mapAuthError,
  normalizeIdentifier,
  normalizeInviteCode,
  normalizeOtp,
  validatePassword,
} from './authUtils';
import { supabase } from './supabase';

export interface AuthResult {
  success: boolean;
  identifier?: string;
  name?: string;
  role?: 'member' | 'admin';
  error?: string;
  status?: 'active' | 'pending' | 'suspended';
}

export type RestoreResult =
  | { state: 'authenticated'; name: string; identifier: string; role?: 'member' | 'admin' }
  | { state: 'unauthenticated' }
  | { state: 'unknown' }; // gagal menghubungi server → jangan paksa logout

const INVALID_CREDENTIALS = 'Email/ID Member atau kata sandi tidak cocok.';

function fallbackName(email?: string | null, meta?: Record<string, any>): string {
  const n = meta?.full_name || meta?.name;
  if (n) return String(n);
  if (email) {
    const p = email.split('@')[0];
    return p.charAt(0).toUpperCase() + p.slice(1);
  }
  return 'Trader Palti';
}

async function fetchProfile(userId: string) {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, status, member_id, role')
      .eq('id', userId)
      .maybeSingle();
    return data as { full_name: string | null; status: string; member_id: string; role?: 'member' | 'admin' } | null;
  } catch {
    return null;
  }
}

export class AuthService {
  /** Login dengan Email atau ID Member (PFX-XXXXXXXX). */
  static async signIn(identifier: string, password: string): Promise<AuthResult> {
    const id = normalizeIdentifier(identifier);
    if (!id || !password) {
      return { success: false, error: 'Email / ID Member dan kata sandi wajib diisi.' };
    }

    try {
      let email = id;
      if (!isEmail(id)) {
        const { data, error } = await supabase.rpc('resolve_member_email', { p_member_id: id });
        if (error) return { success: false, error: mapAuthError(error) };
        if (!data) return { success: false, error: INVALID_CREDENTIALS };
        email = String(data);
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.code === 'user_banned' || /banned/i.test(error.message)) {
          return { success: false, status: 'suspended', error: mapAuthError(error) };
        }
        return { success: false, error: mapAuthError(error) };
      }

      const user = data.user;
      if (!user) return { success: false, error: INVALID_CREDENTIALS };

      const profile = await fetchProfile(user.id);
      if (profile?.status === 'suspended') {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        return {
          success: false,
          status: 'suspended',
          error: 'Akun ini ditangguhkan. Silakan hubungi admin PALTI FX.',
        };
      }

      return {
        success: true,
        status: 'active',
        identifier: user.email ?? email,
        name: profile?.full_name || fallbackName(user.email, user.user_metadata),
        role: (profile?.role as 'member' | 'admin') || 'member',
      };
    } catch (err: any) {
      return { success: false, error: mapAuthError(err) };
    }
  }

  /** Aktivasi akun: daftar atomik dengan kode undangan (divalidasi trigger di database). */
  static async activate(
    email: string,
    invitationCode: string,
    password: string
  ): Promise<{ success: boolean; signedIn?: boolean; identifier?: string; name?: string; role?: 'member' | 'admin'; error?: string }> {
    const mail = normalizeIdentifier(email);
    const code = normalizeInviteCode(invitationCode);
    if (!isEmail(mail)) return { success: false, error: 'Format email tidak valid.' };
    if (code.length < 4) return { success: false, error: 'Kode undangan tidak valid.' };
    const pwErr = validatePassword(password);
    if (pwErr) return { success: false, error: pwErr };

    try {
      const { data, error } = await supabase.auth.signUp({
        email: mail,
        password,
        options: {
          data: { invitation_code: code },
        },
      });
      if (error) {
        // Trigger yang menolak kode undangan kadang membuat GoTrue membalas 500 generik
        // ("unexpected_failure"); auth-js lalu melemparnya sebagai AuthRetryableFetchError
        // yang mirip error jaringan. Status 500 di signup hampir selalu berarti kode ditolak.
        if (error.status === 500) {
          return { success: false, error: 'Kode undangan tidak valid. Minta kode terbaru ke admin PALTI FX.' };
        }
        return { success: false, error: mapAuthError(error) };
      }

      // Email sudah terdaftar & konfirmasi aktif → identities kosong (tanpa error)
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return { success: false, error: 'Email ini sudah memiliki akun aktif. Silakan masuk.' };
      }

      if (data.session && data.user) {
        const profile = await fetchProfile(data.user.id);
        return {
          success: true,
          signedIn: true,
          identifier: data.user.email ?? mail,
          name: profile?.full_name || fallbackName(data.user.email, data.user.user_metadata),
          role: (profile?.role as 'member' | 'admin') || 'member',
        };
      }
      return { success: true, signedIn: false, identifier: mail };
    } catch (err: any) {
      return { success: false, error: mapAuthError(err) };
    }
  }

  /** Lupa sandi langkah 1: kirim OTP 6 digit ke email (respons selalu generik). */
  static async requestPasswordReset(identifier: string): Promise<{ success: boolean; error?: string; rateLimited?: boolean }> {
    const id = normalizeIdentifier(identifier);
    if (!id) return { success: false, error: 'Email / ID Member wajib diisi.' };
    try {
      let email = id;
      if (!isEmail(id)) {
        const { data } = await supabase.rpc('resolve_member_email', { p_member_id: id });
        if (!data) return { success: true }; // jangan bocorkan keberadaan akun
        email = String(data);
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
          return { success: false, rateLimited: true, error: mapAuthError(error) };
        }
        return { success: false, error: mapAuthError(error) };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: mapAuthError(err) };
    }
  }

  /** Lupa sandi langkah 2a: verifikasi OTP. Berhasil → sesi recovery sementara. */
  static async verifyResetOtp(identifier: string, otp: string): Promise<{ success: boolean; error?: string }> {
    const id = normalizeIdentifier(identifier);
    const token = normalizeOtp(otp);
    if (token.length < 6 || token.length > 8) return { success: false, error: 'Masukkan kode OTP yang valid (6-8 digit).' };
    try {
      let email = id;
      if (!isEmail(id)) {
        const { data } = await supabase.rpc('resolve_member_email', { p_member_id: id });
        if (!data) return { success: false, error: 'Kode salah atau sudah kedaluwarsa.' };
        email = String(data);
      }
      // Bersihkan sesi lokal sebelumnya agar tidak ada konflik sesi pemulihan
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      const { error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
      if (error) {
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          return {
            success: false,
            error: 'Kode salah atau kedaluwarsa. Jika Anda menekan kirim ulang, gunakan kode dari email yang PALING TERBARU.',
          };
        }
        return { success: false, error: mapAuthError(error) };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: mapAuthError(err) };
    }
  }

  /** Lupa sandi langkah 2b: simpan sandi baru lalu akhiri sesi recovery (user login ulang). */
  static async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    const pwErr = validatePassword(newPassword);
    if (pwErr) return { success: false, error: pwErr };
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: mapAuthError(error) };
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      return { success: true };
    } catch (err: any) {
      return { success: false, error: mapAuthError(err) };
    }
  }

  /**
   * Hapus akun permanen (syarat Apple/Play). Konfirmasi ulang dengan kata sandi,
   * lalu RPC delete_my_account menghapus akun beserta seluruh data di cloud.
   */
  static async deleteAccount(password: string): Promise<{ success: boolean; error?: string }> {
    if (!password) return { success: false, error: 'Masukkan kata sandi untuk konfirmasi.' };
    try {
      const { data: u } = await supabase.auth.getUser();
      const email = u?.user?.email;
      if (!email) return { success: false, error: 'Sesi tidak ditemukan. Silakan masuk kembali.' };

      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) {
        const net = authErr.name === 'AuthRetryableFetchError' || /network|fetch/i.test(authErr.message);
        return { success: false, error: net ? mapAuthError(authErr) : 'Kata sandi tidak cocok.' };
      }

      const { error } = await supabase.rpc('delete_my_account');
      if (error) {
        if (error.code === '42501') {
          return { success: false, error: 'Akun admin tidak dapat dihapus dari aplikasi.' };
        }
        return { success: false, error: 'Akun belum dapat dihapus. Periksa koneksi dan coba lagi.' };
      }

      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      return { success: true };
    } catch (err: any) {
      return { success: false, error: mapAuthError(err) };
    }
  }

  /** Logout: hapus sesi + token dari perangkat ini. */
  static async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {}
  }

  /** Rekonsiliasi sesi tersimpan saat startup (dipanggil sekali). */
  static async restoreSession(): Promise<RestoreResult> {
    try {
      const { data } = await supabase.auth.getSession();
      const session: Session | null = data?.session ?? null;
      if (!session) return { state: 'unauthenticated' };

      const { data: u, error } = await supabase.auth.getUser();
      if (error) {
        const code = error.code ?? '';
        const dead =
          error.status === 401 ||
          error.status === 403 ||
          ['user_not_found', 'session_not_found', 'bad_jwt', 'user_banned'].includes(code);
        if (dead) {
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          return { state: 'unauthenticated' };
        }
        return { state: 'unknown' };
      }
      if (!u.user) return { state: 'unauthenticated' };

      const profile = await fetchProfile(u.user.id);
      if (profile?.status === 'suspended') {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        return { state: 'unauthenticated' };
      }
      return {
        state: 'authenticated',
        identifier: u.user.email ?? '',
        name: profile?.full_name || fallbackName(u.user.email, u.user.user_metadata),
        role: (profile?.role as 'member' | 'admin') || 'member',
      };
    } catch {
      return { state: 'unknown' };
    }
  }

  /** Listener perubahan auth (misal token expired / SIGNED_OUT dari luar). */
  static onAuthStateChange(callback: (event: string) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      callback(event);
    });
    return subscription;
  }
}
