import { supabase } from './supabase';
import type { Invitation } from '../types/admin';

/**
 * Menghasilkan SHA-256 hex string dari kode undangan yang telah dinormalisasi.
 * Digunakan agar database tidak menyimpan kode mentah.
 */
export async function hashInviteCode(code: string): Promise<string> {
  const normalized = code.toUpperCase().replace(/[\s-]/g, '');
  const msgUint8 = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class AdminInvitationsService {
  /**
   * Helper untuk membuat kode VIP acak yang aman dan mudah dibaca
   * Contoh: PFX-VIP-7K9A2
   */
  static generateRandomCode(prefix: string = 'PFX-VIP'): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${code}`;
  }

  static async getInvitations(): Promise<Invitation[]> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('[AdminInvitationsService.getInvitations] Error/empty:', error?.message);
        return [];
      }

      return data as Invitation[];
    } catch (err) {
      console.error('[AdminInvitationsService.getInvitations]', err);
      return [];
    }
  }

  static async createInvitation(input: {
    code: string;
    role?: 'member' | 'admin';
    hint?: string;
  }): Promise<{ success: boolean; rawCode?: string; data?: Invitation; error?: string }> {
    try {
      const cleanCode = input.code.trim().toUpperCase();
      const norm = cleanCode.replace(/[\s-]/g, '');
      if (!norm || norm.length < 4) {
        return { success: false, error: 'Kode undangan minimal 4 karakter (tanpa spasi/tanda hubung).' };
      }

      const codeHash = await hashInviteCode(cleanCode);

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          code_hash: codeHash,
          code_hint: input.hint ? input.hint.trim() : cleanCode,
          role: input.role || 'member',
          is_used: false,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Kode undangan ini sudah pernah dibuat sebelumnya. Silakan gunakan kode lain.' };
        }
        return { success: false, error: error.message };
      }

      return { success: true, rawCode: cleanCode, data: data as Invitation };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal membuat kode undangan.' };
    }
  }

  static async deleteInvitation(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('invitations').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghapus kode undangan.' };
    }
  }
}
