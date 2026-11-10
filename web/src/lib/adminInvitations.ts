import { supabase } from './supabase';

/**
 * Kode undangan PALTI FX: hanya SATU kode global untuk semua calon member.
 * - Bisa dipakai berkali-kali; tidak ada status "sudah dipakai".
 * - Mengganti kode langsung menimpa kode lama (RPC set_invite_code, migrasi 005).
 * - Database hanya menyimpan hash SHA-256, jadi kode mentah hanya terlihat saat disimpan.
 */

export const INVITE_CODE_MIN_LENGTH = 4;

export function normalizeInviteCode(code: string): string {
  return code.toUpperCase().replace(/[\s-]/g, '');
}

export interface InviteCodeStatus {
  /** Ada kode aktif atau belum. */
  active: boolean;
  /** Waktu kode terakhir diganti (ISO), null bila belum pernah diset. */
  updatedAt: string | null;
}

export class AdminInvitationsService {
  /** Kode acak yang mudah dibaca, contoh: PFX-VIP-7K9A2 */
  static generateRandomCode(prefix: string = 'PFX-VIP'): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${code}`;
  }

  static async getStatus(): Promise<InviteCodeStatus> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) {
        console.warn('[AdminInvitationsService.getStatus]', error.message);
        return { active: false, updatedAt: null };
      }
      const row = (data as { created_at: string }[] | null)?.[0];
      return row ? { active: true, updatedAt: row.created_at } : { active: false, updatedAt: null };
    } catch (err) {
      console.error('[AdminInvitationsService.getStatus]', err);
      return { active: false, updatedAt: null };
    }
  }

  /** Menimpa kode undangan global. Kode kosong → dibuat acak. */
  static async setCode(input?: string): Promise<{ success: boolean; code?: string; updatedAt?: string; error?: string }> {
    const code = input?.trim() ? input.trim().toUpperCase() : AdminInvitationsService.generateRandomCode();
    if (normalizeInviteCode(code).length < INVITE_CODE_MIN_LENGTH) {
      return { success: false, error: `Kode undangan minimal ${INVITE_CODE_MIN_LENGTH} karakter (tanpa spasi/tanda hubung).` };
    }
    try {
      const { data, error } = await supabase.rpc('set_invite_code', { p_code: code });
      if (error) {
        if (error.code === '42501') return { success: false, error: 'Hanya administrator yang dapat mengganti kode undangan.' };
        return { success: false, error: error.message };
      }
      return { success: true, code, updatedAt: (data as string | null) ?? new Date().toISOString() };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menyimpan kode undangan.' };
    }
  }
}
