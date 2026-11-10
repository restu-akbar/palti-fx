import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeSupabase } from '../test/fakeSupabase';

vi.mock('./supabase', async () => {
  const { createFakeSupabase } = await import('../test/fakeSupabase');
  return { supabase: createFakeSupabase() };
});

import { supabase as client } from './supabase';
import { AdminInvitationsService, normalizeInviteCode } from './adminInvitations';

const supabase = client as unknown as FakeSupabase;

beforeEach(() => {
  supabase.reset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('normalizeInviteCode', () => {
  it('huruf besar tanpa spasi dan strip (sama dengan normalize_invite_code di database)', () => {
    expect(normalizeInviteCode(' pfx - vip 7k9a2 ')).toBe('PFXVIP7K9A2');
  });
});

describe('AdminInvitationsService.generateRandomCode', () => {
  it('format PREFIX-5 karakter tanpa huruf/angka yang membingungkan', () => {
    for (let i = 0; i < 50; i++) {
      expect(AdminInvitationsService.generateRandomCode()).toMatch(/^PFX-VIP-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/);
    }
    expect(AdminInvitationsService.generateRandomCode('ABC')).toMatch(/^ABC-/);
  });
});

describe('AdminInvitationsService.getStatus', () => {
  it('aktif dengan waktu penggantian terakhir', async () => {
    supabase.onTable('invitations', () => ({ data: [{ created_at: '2026-11-09T13:00:00Z' }] }));
    expect(await AdminInvitationsService.getStatus()).toEqual({ active: true, updatedAt: '2026-11-09T13:00:00Z' });
  });

  it('belum ada kode atau error → tidak aktif', async () => {
    supabase.onTable('invitations', () => ({ data: [] }));
    expect(await AdminInvitationsService.getStatus()).toEqual({ active: false, updatedAt: null });
    supabase.onTable('invitations', () => ({ error: { message: 'x' } }));
    expect(await AdminInvitationsService.getStatus()).toEqual({ active: false, updatedAt: null });
  });
});

describe('AdminInvitationsService.setCode', () => {
  it('memanggil RPC set_invite_code dengan kode huruf besar', async () => {
    supabase.onRpc('set_invite_code', () => ({ data: '2026-11-09T13:00:00Z' }));
    const res = await AdminInvitationsService.setCode(' kuda-2026 ');
    expect(res).toEqual({ success: true, code: 'KUDA-2026', updatedAt: '2026-11-09T13:00:00Z' });
    expect(supabase.rpc).toHaveBeenCalledWith('set_invite_code', { p_code: 'KUDA-2026' });
  });

  it('tanpa input membuat kode acak', async () => {
    const res = await AdminInvitationsService.setCode('');
    expect(res.success).toBe(true);
    expect(res.code).toMatch(/^PFX-VIP-/);
  });

  it('kode terlalu pendek ditolak tanpa memanggil server', async () => {
    const res = await AdminInvitationsService.setCode('a-b');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/minimal 4/);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('error izin dan error lain dari server', async () => {
    supabase.onRpc('set_invite_code', () => ({ error: { code: '42501', message: 'denied' } }));
    expect((await AdminInvitationsService.setCode('KODE1234')).error).toMatch(/Hanya administrator/);
    supabase.onRpc('set_invite_code', () => ({ error: { message: 'boom' } }));
    expect((await AdminInvitationsService.setCode('KODE1234')).error).toBe('boom');
  });
});
