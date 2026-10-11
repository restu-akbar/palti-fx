import { supabase } from './supabase';
import type { DashboardStats, Profile } from '../types/admin';

export class AdminUsersService {
  static async getUsers(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('[AdminUsersService.getUsers] Error/empty:', error?.message);
        return [];
      }

      return data as Profile[];
    } catch (err) {
      console.error('[AdminUsersService.getUsers]', err);
      return [];
    }
  }

  static async updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId)
        .select();

      if (error) return { success: false, error: error.message };
      if (!data || data.length === 0) {
        return { success: false, error: 'Gagal memperbarui status: Baris data tidak ditemukan atau terhalang izin RLS database.' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal memperbarui status pengguna.' };
    }
  }

  static async updateUserRole(userId: string, role: 'member' | 'admin'): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select();

      if (error) return { success: false, error: error.message };
      if (!data || data.length === 0) {
        return { success: false, error: 'Gagal memperbarui peran: Baris data tidak ditemukan atau terhalang izin RLS database.' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal memperbarui peran pengguna.' };
    }
  }

  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Hitung manual via query untuk memastikan data admin terdaftar akurat
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: totalAdmins },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('status', 'suspended').neq('role', 'admin'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      ]);

      const [
        { count: totalModules },
        { data: lessonsData },
      ] = await Promise.all([
        supabase.from('edu_modules').select('*', { count: 'exact', head: true }),
        supabase.from('edu_lessons').select('id, youtube_urls'),
      ]);

      const totalLessons = lessonsData?.length || 0;
      let totalVideos = 0;
      (lessonsData || []).forEach((l: any) => {
        if (Array.isArray(l.youtube_urls)) {
          totalVideos += l.youtube_urls.filter((u: string) => Boolean(u && u.trim())).length;
        }
      });

      const [{ count: activeInvites }, { count: usedInvites }] = await Promise.all([
        supabase.from('invitations').select('*', { count: 'exact', head: true }).eq('is_used', false),
        supabase.from('invitations').select('*', { count: 'exact', head: true }).eq('is_used', true),
      ]);

      return {
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        total_admins: totalAdmins || 0,
        total_modules: totalModules || 0,
        total_chapters: totalModules || 0,
        total_lessons: totalLessons,
        total_videos: totalVideos,
        active_invites: activeInvites || 0,
        used_invites: usedInvites || 0,
      };
    } catch (err) {
      console.warn('[AdminUsersService.getDashboardStats] fallback:', err);
      return {
        total_users: 0,
        active_users: 0,
        total_admins: 0,
        total_modules: 0,
        total_chapters: 0,
        total_lessons: 0,
        total_videos: 0,
        active_invites: 0,
        used_invites: 0,
      };
    }
  }
}
