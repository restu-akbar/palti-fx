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

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      let resolvedProfile = profile as Profile | null;

      if (!resolvedProfile && session.user.email) {
        const isOfficialAdmin = session.user.email.toLowerCase() === 'dioraput@gmail.com';
        const { error: rpcErr } = await supabase.rpc('get_admin_dashboard_stats');
        if (!rpcErr || isOfficialAdmin) {
          resolvedProfile = {
            id: session.user.id,
            member_id: 'PFX-ADMIN-01',
            full_name: session.user.user_metadata?.full_name || 'Diora Put (Admin)',
            email: session.user.email,
            role: 'admin',
            status: 'active',
            created_at: session.user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      }

      if (!resolvedProfile || resolvedProfile.role !== 'admin') {
        // Bukan admin! Keluarkan dari sesi backoffice
        await supabase.auth.signOut();
        return null;
      }

      return resolvedProfile;
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
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
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

      let resolvedProfile = profile as Profile | null;

      if (!resolvedProfile) {
        // Fallback jika terjadi infinite recursion RLS pada tabel profiles di Supabase:
        // Cek via fungsi security definer get_admin_dashboard_stats atau email admin resmi
        const isOfficialAdmin = cleanEmail === 'dioraput@gmail.com';
        const { error: rpcErr } = await supabase.rpc('get_admin_dashboard_stats');

        if (!rpcErr || isOfficialAdmin) {
          resolvedProfile = {
            id: data.user.id,
            member_id: 'PFX-ADMIN-01',
            full_name: data.user.user_metadata?.full_name || 'Diora Put (Admin)',
            email: data.user.email || cleanEmail,
            role: 'admin',
            status: 'active',
            created_at: data.user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      }

      if (!resolvedProfile) {
        await supabase.auth.signOut();
        return { success: false, error: profError?.message || 'Profil pengguna tidak ditemukan dalam database.' };
      }

      if (resolvedProfile.role !== 'admin') {
        // Tolak akses jika akun adalah member biasa
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Akses Ditolak: Akun Anda terdaftar sebagai Member, bukan Administrator Backoffice.',
        };
      }

      if (resolvedProfile.status === 'suspended') {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Akun Administrator ini saat ini berstatus Ditangguhkan (Suspended).',
        };
      }

      return { success: true, profile: resolvedProfile };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Terjadi kesalahan sistem saat otentikasi admin.' };
    }
  }

  static async logout(): Promise<void> {
    await supabase.auth.signOut();
  }
}
