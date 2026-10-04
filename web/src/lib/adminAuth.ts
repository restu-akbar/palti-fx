import { supabase } from './supabase';
import type { Profile } from '../types/admin';

export class AdminAuthService {
  /**
   * Mengambil sesi dan memastikan bahwa pengguna memiliki role = 'admin'.
   */
  static async getCurrentAdmin(): Promise<Profile | null> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) return null;

      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profError || !profile) return null;

      if (profile.role !== 'admin') {
        // Bukan admin! Keluarkan dari sesi backoffice
        await supabase.auth.signOut();
        return null;
      }

      return profile as Profile;
    } catch (err) {
      console.error('[AdminAuthService.getCurrentAdmin]', err);
      return null;
    }
  }

  /**
   * Login khusus Admin. Memblokir jika role adalah 'member'.
   */
  static async loginAdmin(email: string, password: string): Promise<{ success: boolean; profile?: Profile; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || 'Email atau kata sandi tidak valid.' };
      }

      // Verifikasi hak akses admin
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profError || !profile) {
        await supabase.auth.signOut();
        return { success: false, error: 'Profil pengguna tidak ditemukan dalam database.' };
      }

      if (profile.role !== 'admin') {
        // Tolak akses jika akun adalah member biasa
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Akses Ditolak: Akun Anda terdaftar sebagai Member, bukan Administrator Backoffice.',
        };
      }

      if (profile.status === 'suspended') {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Akun Administrator ini saat ini berstatus Ditangguhkan (Suspended).',
        };
      }

      return { success: true, profile: profile as Profile };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Terjadi kesalahan sistem saat otentikasi admin.' };
    }
  }

  static async logout(): Promise<void> {
    await supabase.auth.signOut();
  }
}
