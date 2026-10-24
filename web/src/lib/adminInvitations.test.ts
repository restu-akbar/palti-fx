import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeSupabase } from '../test/fakeSupabase';

vi.mock('./supabase', async () => {
  const { createFakeSupabase } = await import('../test/fakeSupabase');
  return { supabase: createFakeSupabase() };
});

import { supabase as client } from './supabase';
import { AdminInvitationsService, hashInviteCode } from './adminInvitations';

const supabase = client as unknown as FakeSupabase;
const HASH: Record<string, string> = {
  PFXVIP7K9A2: '8a8f169b47542114dc674098f7d02b545ea1235897f8a3214ae09370b532b59e',
  PFX2026: '80226591aa4279c378aa934c606e3bf439bbaeb4680806b57ffdd5282dbdc186',
  KODEBARU1: '1775b303e76ca8a3183d6d4d605d8be6fa06b1446abd9689115cb4440fbd76c4',
};

beforeEach(() => {
  supabase.reset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('hashInviteCode', () => {
  it('SHA-256 dari kode yang dinormalisasi (huruf besar, tanpa spasi dan strip)', async () => {
    const expected = HASH.PFXVIP7K9A2;
    expect(await hashInviteCode('pfx-vip-7k9a2')).toBe(expected);
    expect(await hashInviteCode(' PFX VIP 7K9A2 ')).toBe(expected);
    expect(expected).toHaveLength(64);
  });
});

describe('AdminInvitationsService.generateRandomCode', () => {
  it('format PREFIX-5 karakter tanpa huruf/angka yang membingungkan', () => {
    for (let i = 0; i < 50; i++) {
      const code = AdminInvitationsService.generateRandomCode();
      expect(code).toMatch(/^PFX-VIP-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/);
    }
    expect(AdminInvitationsService.generateRandomCode('ABC')).toMatch(/^ABC-/);
  });
});

describe('AdminInvitationsService.getInvitations', () => {
  it('mengambil undangan terbaru dulu, kosong bila gagal', async () => {
    supabase.onTable('invitations', () => ({ data: [{ id: 'i1' }] }));
    expect(await AdminInvitationsService.getInvitations()).toEqual([{ id: 'i1' }]);
    supabase.onTable('invitations', () => ({ error: { message: 'x' } }));
    expect(await AdminInvitationsService.getInvitations()).toEqual([]);
  });
});

describe('AdminInvitationsService.createInvitation', () => {
  it('label wajib diisi', async () => {
    const r = await AdminInvitationsService.createInvitation({ label: '  ' });
    expect(r.success).toBe(false);
    expect(supabase.queries).toHaveLength(0);
  });

  it('kode minimal 4 karakter tanpa spasi dan strip', async () => {
    const r = await AdminInvitationsService.createInvitation({ label: 'Budi', code: 'a-b' });
    expect(r.success).toBe(false);
    expect(r.error).toContain('minimal 4');
  });

  it('hanya menyimpan hash dan label, bukan kode mentah', async () => {
    supabase.onTable('invitations', () => ({ data: { id: 'i1' } }));
    const r = await AdminInvitationsService.createInvitation({ label: ' Budi ', code: 'pfx-2026' });

    expect(r).toMatchObject({ success: true, rawCode: 'PFX-2026', data: { id: 'i1' } });
    const [q] = supabase.queriesFor('invitations', 'insert');
    expect(q.payload).toEqual({
      code_hash: HASH.PFX2026,
      code_hint: 'Budi',
      role: 'member',
      is_used: false,
    });
    expect(JSON.stringify(q.payload)).not.toContain('PFX-2026');
  });

  it('tanpa kode, membuat kode acak', async () => {
    supabase.onTable('invitations', () => ({ data: { id: 'i1' } }));
    const r = await AdminInvitationsService.createInvitation({ label: 'Budi' });
    expect(r.rawCode).toMatch(/^PFX-VIP-/);
  });

  it('role admin dari input diabaikan: selalu member', async () => {
    supabase.onTable('invitations', () => ({ data: { id: 'i1' } }));
    await AdminInvitationsService.createInvitation({ label: 'X', code: 'ABCD1', role: 'admin' });
    expect((supabase.queriesFor('invitations', 'insert')[0].payload as { role: string }).role).toBe('member');
  });

  it('bentrok hash (23505) memberi pesan khusus', async () => {
    supabase.onTable('invitations', () => ({ error: { code: '23505', message: 'dup' } }));
    const r = await AdminInvitationsService.createInvitation({ label: 'Budi' });
    expect(r.error).toContain('bentrok');
  });

  it('error lain meneruskan pesan database', async () => {
    supabase.onTable('invitations', () => ({ error: { message: 'RLS' } }));
    expect((await AdminInvitationsService.createInvitation({ label: 'Budi' })).error).toBe('RLS');
  });
});

describe('AdminInvitationsService.rotateInvitation', () => {
  it('menghanguskan kode lama lalu menerbitkan kode baru dengan label bersih', async () => {
    supabase.onTable('invitations', (q) => (q.op === 'insert' ? { data: { id: 'baru' } } : {}));
    const r = await AdminInvitationsService.rotateInvitation({ oldId: 'lama', label: '[LAPUR] Budi', newCode: 'kode-baru1' });

    expect(r).toMatchObject({ success: true, rawCode: 'KODE-BARU1' });
    const [upd] = supabase.queriesFor('invitations', 'update');
    expect(upd.payload).toMatchObject({ is_used: true, code_hint: '[LAPUR] Budi' });
    expect(upd.filters).toEqual([{ type: 'eq', column: 'id', value: 'lama' }]);
    const [ins] = supabase.queriesFor('invitations', 'insert');
    expect(ins.payload).toMatchObject({ code_hint: 'Budi', is_used: false, code_hash: HASH.KODEBARU1 });
  });

  it('gagal menerbitkan kode baru mengembalikan error', async () => {
    supabase.onTable('invitations', (q) => (q.op === 'insert' ? { error: { message: 'dup' } } : {}));
    const r = await AdminInvitationsService.rotateInvitation({ oldId: 'lama', label: 'Budi' });
    expect(r).toEqual({ success: false, error: 'dup' });
  });
});

describe('AdminInvitationsService.revokeInvitation & deleteInvitation', () => {
  it('revoke menandai terpakai dengan label [LAPUR] tanpa duplikasi', async () => {
    await AdminInvitationsService.revokeInvitation('i1', '[LAPUR] Budi');
    await AdminInvitationsService.revokeInvitation('i2');
    const [a, b] = supabase.queriesFor('invitations', 'update');
    expect(a.payload).toMatchObject({ is_used: true, code_hint: '[LAPUR] Budi' });
    expect(b.payload).toMatchObject({ code_hint: '[LAPUR] Calon Member' });
  });

  it('revoke dan delete meneruskan error database', async () => {
    supabase.onTable('invitations', () => ({ error: { message: 'RLS' } }));
    expect(await AdminInvitationsService.revokeInvitation('i1')).toEqual({ success: false, error: 'RLS' });
    expect(await AdminInvitationsService.deleteInvitation('i1')).toEqual({ success: false, error: 'RLS' });
  });

  it('delete menghapus berdasarkan id', async () => {
    expect(await AdminInvitationsService.deleteInvitation('i1')).toEqual({ success: true });
    expect(supabase.queriesFor('invitations', 'delete')[0].filters).toEqual([{ type: 'eq', column: 'id', value: 'i1' }]);
  });
});
