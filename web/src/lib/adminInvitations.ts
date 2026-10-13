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
    label: string;
    code?: string;
    role?: 'member' | 'admin';
    hint?: string; // fallback alias for label
  }): Promise<{ success: boolean; rawCode?: string; data?: Invitation; error?: string }> {
    try {
      const memberLabel = (input.label || input.hint || '').trim();
      if (!memberLabel) {
        return { success: false, error: 'Label / Catatan Calon Member wajib diisi sebagai identitas kunci.' };
      }

      const raw = (input.code && input.code.trim()) ? input.code.trim().toUpperCase() : AdminInvitationsService.generateRandomCode();
      const norm = raw.replace(/[\s-]/g, '');
      if (!norm || norm.length < 4) {
        return { success: false, error: 'Kode undangan minimal 4 karakter (tanpa spasi/tanda hubung).' };
      }

      const codeHash = await hashInviteCode(raw);

      // Pastikan code_hint HANYA menyimpan label calon member, BUKAN kode mentah
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          code_hash: codeHash,
          code_hint: memberLabel,
          role: 'member',
          is_used: false,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Kode acak ini kebetulan bentrok dengan kode lain. Silakan coba kembali.' };
        }
        return { success: false, error: error.message };
      }

      return { success: true, rawCode: raw, data: data as Invitation };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menerbitkan kunci akses VIP.' };
    }
  }

  /**
   * Mengganti kode undangan yang lupa / kadaluwarsa (Rotasi Kunci):
   * 1. Menghanguskan (lapur) kode lama agar tidak bisa dipakai oleh calon user baru.
   * 2. Menerbitkan kode baru dengan label calon member yang sama.
   * 3. User yang sudah mendaftar sebelumnya tetap aman (tidak dibatalkan).
   */
  static async rotateInvitation(input: {
    oldId: string;
    label: string;
    newCode?: string;
  }): Promise<{ success: boolean; rawCode?: string; data?: Invitation; error?: string }> {
    try {
      // 1. Hanguskan kode lama (lapur)
      const cleanLabel = input.label.replace(/^\[LAPUR\]\s*/i, '').trim();
      await supabase
        .from('invitations')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          code_hint: `[LAPUR] ${cleanLabel}`,
        })
        .eq('id', input.oldId);

      // 2. Terbitkan kode baru yang terenkripsi
      const newRawCode = (input.newCode && input.newCode.trim())
        ? input.newCode.trim().toUpperCase()
        : AdminInvitationsService.generateRandomCode();

      const codeHash = await hashInviteCode(newRawCode);

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          code_hash: codeHash,
          code_hint: cleanLabel,
          role: 'member',
          is_used: false,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, rawCode: newRawCode, data: data as Invitation };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal melakukan rotasi kode.' };
    }
  }

  /**
   * Menghanguskan (lapur / revoke) kode undangan secara manual tanpa mengganti baru
   */
  static async revokeInvitation(id: string, currentLabel?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanLabel = (currentLabel || 'Calon Member').replace(/^\[LAPUR\]\s*/i, '').trim();
      const { error } = await supabase
        .from('invitations')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          code_hint: `[LAPUR] ${cleanLabel}`,
        })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghanguskan kode undangan.' };
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
