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
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal memperbarui status pengguna.' };
    }
  }

  static async updateUserRole(userId: string, role: 'member' | 'admin'): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal memperbarui peran pengguna.' };
    }
  }

  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Coba panggil RPC jika tersedia
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_admin_dashboard_stats');
      if (!rpcErr && rpcData) {
        return rpcData as DashboardStats;
      }

      // Fallback: hitung manual via query
      const [{ count: totalUsers }, { count: activeUsers }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      const [{ count: totalModules }, { count: totalLessons }] = await Promise.all([
        supabase.from('edu_modules').select('*', { count: 'exact', head: true }),
        supabase.from('edu_lessons').select('*', { count: 'exact', head: true }),
      ]);

      const [{ count: activeInvites }, { count: usedInvites }] = await Promise.all([
        supabase.from('invitations').select('*', { count: 'exact', head: true }).eq('is_used', false),
        supabase.from('invitations').select('*', { count: 'exact', head: true }).eq('is_used', true),
      ]);

      return {
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        total_modules: totalModules || 0,
        total_lessons: totalLessons || 0,
        active_invites: activeInvites || 0,
        used_invites: usedInvites || 0,
      };
    } catch (err) {
      console.warn('[AdminUsersService.getDashboardStats] fallback:', err);
      return {
        total_users: 0,
        active_users: 0,
        total_modules: 0,
        total_lessons: 0,
        active_invites: 0,
        used_invites: 0,
      };
    }
  }
}
