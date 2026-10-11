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

      // Ambil user auth terkini langsung dari server Supabase agar user_metadata tidak stale
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user || session.user;

      // Cek cache lokal terlebih dahulu
      let cached: Profile | null = null;
      try {
        const cachedRaw = localStorage.getItem('palti_admin_profile');
        cached = cachedRaw ? JSON.parse(cachedRaw) : null;
      } catch (e) {
        cached = null;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      let resolvedProfile = profile as Profile | null;

      if (!resolvedProfile && currentUser.email) {
        const isOfficialAdmin = currentUser.email.toLowerCase() === 'dioraput@gmail.com';
        const { error: rpcErr } = await supabase.rpc('get_admin_dashboard_stats');
        if (!rpcErr || isOfficialAdmin) {
          resolvedProfile = {
            id: currentUser.id,
            member_id: 'PFX-ADMIN-01',
            full_name: cached?.full_name || currentUser.user_metadata?.full_name || 'Diora Put (Admin)',
            email: currentUser.email,
            role: 'admin',
            status: 'active',
            created_at: currentUser.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Upayakan simpan otomatis ke tabel profiles jika belum terbuat
          try {
            await supabase.from('profiles').upsert(resolvedProfile, { onConflict: 'id' });
          } catch (e) {
            // Abaikan jika terhalang RLS
          }
        }
      }

      // Pastikan nama terbaru diprioritaskan:
      // 1. Dari cache lokal (paling up-to-date saat user baru saja mengubah nama)
      // 2. Dari user_metadata Auth Supabase
      // 3. Dari tabel profiles
      if (resolvedProfile) {
        if (cached?.full_name) {
          resolvedProfile.full_name = cached.full_name;
        } else if (currentUser.user_metadata?.full_name) {
          resolvedProfile.full_name = currentUser.user_metadata.full_name;
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
        .maybeSingle();

      let resolvedProfile = profile as Profile | null;

      // Sinkronkan nama terbaru jika ada di cache lokal
      try {
        const cachedRaw = localStorage.getItem('palti_admin_profile');
        const cached = cachedRaw ? JSON.parse(cachedRaw) : null;
        if (resolvedProfile && cached && (cached.id === data.user.id || !cached.id) && cached.full_name) {
          resolvedProfile.full_name = cached.full_name;
        }
      } catch (e) {
        // ignore
      }

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

          try {
            const cachedRaw = localStorage.getItem('palti_admin_profile');
            const cached = cachedRaw ? JSON.parse(cachedRaw) : null;
            if (cached?.full_name) {
              resolvedProfile.full_name = cached.full_name;
            }
          } catch (e) {
            // ignore
          }
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

  /**
   * Update Profil Admin (Nama, Email, dan/atau Password) langsung ke Supabase
   */
  static async updateAdminProfile(
    adminId: string,
    params: {
      fullName?: string;
      email?: string;
      password?: string;
    }
  ): Promise<{ success: boolean; error?: string; message?: string; updatedProfile?: Profile }> {
    try {
      const updates: { full_name?: string; email?: string; updated_at: string } = {
        updated_at: new Date().toISOString(),
      };
      if (params.fullName !== undefined && params.fullName.trim()) {
        updates.full_name = params.fullName.trim();
      }
      if (params.email !== undefined && params.email.trim()) {
        updates.email = params.email.trim().toLowerCase();
      }

      // Cek email user auth saat ini agar tidak mengirim email yang sama (menghindari error / verification lock di Supabase Auth)
      const { data: userData } = await supabase.auth.getUser();
      const currentAuthEmail = userData?.user?.email?.toLowerCase();
      const isEmailChanged = Boolean(updates.email && currentAuthEmail && updates.email !== currentAuthEmail);

      // 1. Update Supabase Auth jika ada password, email (hanya jika berubah), atau nama (user_metadata)
      const authUpdatePayload: { email?: string; password?: string; data?: { full_name?: string } } = {};
      if (params.password && params.password.trim()) {
        authUpdatePayload.password = params.password.trim();
      }
      if (isEmailChanged && updates.email) {
        authUpdatePayload.email = updates.email;
      }
      if (updates.full_name) {
        authUpdatePayload.data = { full_name: updates.full_name };
      }

      let updatedAuthUser = null;
      if (Object.keys(authUpdatePayload).length > 0) {
        const { data: authData, error: authError } = await supabase.auth.updateUser(authUpdatePayload);
        if (authError) {
          console.warn('[AdminAuthService.updateAdminProfile] updateUser warning:', authError.message);
          // Jika authError terkait email rate-limit tapi nama terisi, lanjutkan update nama
          if (isEmailChanged && !updates.full_name) {
            return { success: false, error: authError.message };
          }
        } else {
          updatedAuthUser = authData?.user;
        }
      }

      // 2. Upayakan eksekusi RPC update_admin_profile jika sudah dibuat di Supabase (Security Definer untuk bypass RLS)
      try {
        await supabase.rpc('update_admin_profile', {
          p_full_name: updates.full_name || null,
          p_email: updates.email || null,
        });
      } catch (e) {
        // Abaikan jika RPC belum di-install di Supabase
      }

      // 3. Update tabel profiles di Supabase
      const profileUpdates: any = {
        updated_at: updates.updated_at,
      };
      if (updates.full_name) profileUpdates.full_name = updates.full_name;
      if (updates.email) profileUpdates.email = updates.email;

      let { data: updatedData, error: profError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', adminId)
        .select()
        .maybeSingle();

      // Jika baris belum ada di profiles, lakukan upsert lengkap dengan member_id (menghindari not-null constraint)
      if (!updatedData) {
        const profileToUpsert = {
          id: adminId,
          member_id: 'PFX-ADMIN-01',
          full_name: updates.full_name || 'Admin',
          email: updates.email || '',
          role: 'admin',
          status: 'active',
          updated_at: updates.updated_at,
        };

        const { data: upsertedData, error: upsertErr } = await supabase
          .from('profiles')
          .upsert(profileToUpsert, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (upsertedData) updatedData = upsertedData;
        if (upsertErr) {
          console.warn('[AdminAuthService.updateAdminProfile] Warning upserting profiles table:', upsertErr.message);
        }
      } else if (profError) {
        console.warn('[AdminAuthService.updateAdminProfile] Warning updating profiles table:', profError.message);
      }

      // 4. Susun data profile terbaru secara deterministik
      const newFullName = updates.full_name || (updatedData as any)?.full_name || updatedAuthUser?.user_metadata?.full_name || 'Admin';
      const newEmail = updates.email || (updatedData as any)?.email || updatedAuthUser?.email || '';

      const finalProfile: Profile = {
        id: adminId,
        member_id: (updatedData as any)?.member_id || 'PFX-ADMIN-01',
        full_name: newFullName,
        email: newEmail,
        role: 'admin',
        status: 'active',
        created_at: (updatedData as any)?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Simpan ke cache lokal agar tidak pernah ter-reset kembali ke nama lama saat refresh
      localStorage.setItem('palti_admin_profile', JSON.stringify(finalProfile));

      return {
        success: true,
        message: 'Profil berhasil diperbarui.',
        updatedProfile: finalProfile,
      };
    } catch (err: any) {
      console.error('[AdminAuthService.updateAdminProfile]', err);
      return { success: false, error: err?.message || 'Terjadi kesalahan saat memperbarui profil.' };
    }
  }

  static async logout(): Promise<void> {
    await supabase.auth.signOut();
  }
}
