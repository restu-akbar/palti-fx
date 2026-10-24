import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeSupabase } from '../test/fakeSupabase';

vi.mock('./supabase', async () => {
  const { createFakeSupabase } = await import('../test/fakeSupabase');
  return { supabase: createFakeSupabase() };
});

import { supabase as client } from './supabase';
import { AdminAuthService, checkAdminPasswordCriteria } from './adminAuth';

const supabase = client as unknown as FakeSupabase;
const CACHE = 'palti_admin_profile';

const authUser = (over: Record<string, unknown> = {}) => ({
  id: 'u1', email: 'admin@mail.com', user_metadata: {}, created_at: '2026-01-01', ...over,
});
const profile = (over: Record<string, unknown> = {}) => ({
  id: 'u1', member_id: 'PFX-1', full_name: 'Admin Satu', email: 'admin@mail.com', role: 'admin', status: 'active', ...over,
});

const signedIn = (user = authUser()) =>
  supabase.auth.signInWithPassword.mockResolvedValue({ data: { user, session: {} }, error: null } as never);
const hasSession = (user = authUser()) => {
  supabase.auth.getSession.mockResolvedValue({ data: { session: { user } }, error: null } as never);
  supabase.auth.getUser.mockResolvedValue({ data: { user }, error: null } as never);
};

beforeEach(() => {
  supabase.reset();
  localStorage.clear();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('checkAdminPasswordCriteria', () => {
  it('menilai panjang, huruf, dan angka', () => {
    expect(checkAdminPasswordCriteria('abc12345')).toEqual({ minLength: true, hasLetter: true, hasDigit: true, isValid: true });
    expect(checkAdminPasswordCriteria('abcdefgh').isValid).toBe(false);
    expect(checkAdminPasswordCriteria('12345678').isValid).toBe(false);
    expect(checkAdminPasswordCriteria('a1').minLength).toBe(false);
    expect(checkAdminPasswordCriteria(undefined as unknown as string).isValid).toBe(false);
  });
});

describe('AdminAuthService.loginAdmin', () => {
  it('login admin aktif berhasil dan menyimpan profil ke localStorage', async () => {
    signedIn();
    supabase.onTable('profiles', () => ({ data: profile() }));

    const r = await AdminAuthService.loginAdmin('  ADMIN@Mail.com ', 'rahasia123');

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'admin@mail.com', password: 'rahasia123' });
    expect(r.success).toBe(true);
    expect(JSON.parse(localStorage.getItem(CACHE)!)).toMatchObject({ id: 'u1', role: 'admin' });
  });

  it('kredensial salah', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid login credentials' } } as never);
    expect(await AdminAuthService.loginAdmin('a@b.com', 'x')).toEqual({ success: false, error: 'Invalid login credentials' });
  });

  it('member biasa ditolak dan sesi diakhiri', async () => {
    signedIn();
    supabase.onTable('profiles', () => ({ data: profile({ role: 'member' }) }));
    const r = await AdminAuthService.loginAdmin('a@b.com', 'x');
    expect(r.success).toBe(false);
    expect(r.error).toContain('Akses Ditolak');
    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(localStorage.getItem(CACHE)).toBeNull();
  });

  it('admin suspended ditolak dan cache dibersihkan', async () => {
    signedIn();
    localStorage.setItem(CACHE, JSON.stringify(profile()));
    supabase.onTable('profiles', () => ({ data: profile({ status: 'suspended' }) }));
    const r = await AdminAuthService.loginAdmin('a@b.com', 'x');
    expect(r.error).toContain('Ditangguhkan');
    expect(localStorage.getItem(CACHE)).toBeNull();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('nama dari cache lokal diprioritaskan', async () => {
    signedIn();
    localStorage.setItem(CACHE, JSON.stringify(profile({ full_name: 'Nama Cache' })));
    supabase.onTable('profiles', () => ({ data: profile({ full_name: 'Nama DB' }) }));
    const r = await AdminAuthService.loginAdmin('a@b.com', 'x');
    expect(r.profile?.full_name).toBe('Nama Cache');
  });

  it('tanpa profil dan RPC admin gagal untuk email biasa: ditolak', async () => {
    signedIn();
    supabase.onRpc('get_admin_dashboard_stats', () => ({ error: { message: 'forbidden' } }));
    const r = await AdminAuthService.loginAdmin('a@b.com', 'x');
    expect(r.success).toBe(false);
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('tanpa profil tetapi RPC admin berhasil: profil admin disusun', async () => {
    signedIn();
    const r = await AdminAuthService.loginAdmin('a@b.com', 'x');
    expect(r.success).toBe(true);
    expect(r.profile).toMatchObject({ id: 'u1', role: 'admin', status: 'active' });
  });

  it('exception tak terduga dikembalikan sebagai error', async () => {
    supabase.auth.signInWithPassword.mockRejectedValue(new Error('boom'));
    expect(await AdminAuthService.loginAdmin('a@b.com', 'x')).toEqual({ success: false, error: 'boom' });
  });
});

describe('AdminAuthService.getCurrentAdmin', () => {
  it('tanpa sesi → null', async () => {
    expect(await AdminAuthService.getCurrentAdmin()).toBeNull();
  });

  it('admin aktif → profil dan cache diperbarui', async () => {
    hasSession();
    supabase.onTable('profiles', () => ({ data: profile() }));
    const p = await AdminAuthService.getCurrentAdmin();
    expect(p).toMatchObject({ id: 'u1', role: 'admin' });
    expect(localStorage.getItem(CACHE)).not.toBeNull();
  });

  it('nama dari user_metadata menggantikan nama di profil', async () => {
    hasSession(authUser({ user_metadata: { full_name: 'Nama Meta' } }));
    supabase.onTable('profiles', () => ({ data: profile() }));
    expect((await AdminAuthService.getCurrentAdmin())?.full_name).toBe('Nama Meta');
  });

  it('member → null, sign out, dan cache dihapus', async () => {
    hasSession();
    localStorage.setItem(CACHE, JSON.stringify(profile()));
    supabase.onTable('profiles', () => ({ data: profile({ role: 'member' }) }));
    expect(await AdminAuthService.getCurrentAdmin()).toBeNull();
    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(localStorage.getItem(CACHE)).toBeNull();
  });

  it('admin suspended → null', async () => {
    hasSession();
    supabase.onTable('profiles', () => ({ data: profile({ status: 'suspended' }) }));
    expect(await AdminAuthService.getCurrentAdmin()).toBeNull();
  });

  it('tanpa profil dan RPC gagal untuk email biasa → null', async () => {
    hasSession();
    supabase.onRpc('get_admin_dashboard_stats', () => ({ error: { message: 'forbidden' } }));
    expect(await AdminAuthService.getCurrentAdmin()).toBeNull();
  });

  it('cache JSON rusak tidak menggagalkan pengecekan', async () => {
    hasSession();
    localStorage.setItem(CACHE, '{rusak');
    supabase.onTable('profiles', () => ({ data: profile() }));
    expect(await AdminAuthService.getCurrentAdmin()).toMatchObject({ role: 'admin' });
  });
});

describe('AdminAuthService pemulihan sandi', () => {
  it('requestPasswordReset: validasi dan pemetaan rate limit', async () => {
    expect((await AdminAuthService.requestPasswordReset('  ')).success).toBe(false);
    expect((await AdminAuthService.requestPasswordReset('tanpa-at')).error).toContain('tidak valid');
    expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();

    expect((await AdminAuthService.requestPasswordReset(' Admin@Mail.com ')).success).toBe(true);
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('admin@mail.com');

    supabase.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: { status: 429, message: 'rl' } } as never);
    expect((await AdminAuthService.requestPasswordReset('a@b.com')).error).toContain('Terlalu banyak');
  });

  it('verifyResetOtp: hanya angka, minimal 6 digit, sesi lama dibersihkan', async () => {
    expect((await AdminAuthService.verifyResetOtp('a@b.com', '12ab')).success).toBe(false);

    supabase.auth.verifyOtp.mockResolvedValue({ data: { session: {}, user: {} }, error: null } as never);
    const r = await AdminAuthService.verifyResetOtp(' A@B.com ', '123 456');
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({ email: 'a@b.com', token: '123456', type: 'recovery' });
    expect(r.success).toBe(true);
  });

  it('verifyResetOtp: kode kedaluwarsa dan sesi tidak terbentuk', async () => {
    supabase.auth.verifyOtp.mockResolvedValue({ data: {}, error: { message: 'Token expired' } } as never);
    expect((await AdminAuthService.verifyResetOtp('a@b.com', '123456')).error).toContain('PALING TERBARU');

    supabase.auth.verifyOtp.mockResolvedValue({ data: { session: null, user: null }, error: null } as never);
    expect((await AdminAuthService.verifyResetOtp('a@b.com', '123456')).error).toContain('Sesi verifikasi');
  });

  it('updateForgottenPassword: pesan spesifik per kriteria', async () => {
    expect((await AdminAuthService.updateForgottenPassword('a1')).error).toContain('8 karakter');
    expect((await AdminAuthService.updateForgottenPassword('12345678')).error).toContain('huruf');
    expect((await AdminAuthService.updateForgottenPassword('abcdefgh')).error).toContain('angka');
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('updateForgottenPassword: sukses mengakhiri sesi recovery dan menghapus cache', async () => {
    localStorage.setItem(CACHE, '{}');
    const r = await AdminAuthService.updateForgottenPassword('abc12345');
    expect(r.success).toBe(true);
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'abc12345' });
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(localStorage.getItem(CACHE)).toBeNull();
  });

  it('updateForgottenPassword: error server tidak mengakhiri sesi', async () => {
    supabase.auth.updateUser.mockResolvedValue({ data: {}, error: { message: 'same password' } } as never);
    expect(await AdminAuthService.updateForgottenPassword('abc12345')).toEqual({ success: false, error: 'same password' });
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });
});

describe('AdminAuthService.logout', () => {
  it('menghapus cache dan mengakhiri sesi walau signOut gagal', async () => {
    localStorage.setItem(CACHE, '{}');
    supabase.auth.signOut.mockRejectedValue(new Error('x'));
    await expect(AdminAuthService.logout()).resolves.toBeUndefined();
    expect(localStorage.getItem(CACHE)).toBeNull();
  });
});

describe('AdminAuthService.updateAdminProfile', () => {
  beforeEach(() => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: authUser() }, error: null } as never);
  });

  it('menolak sandi lemah tanpa mengubah apa pun', async () => {
    const r = await AdminAuthService.updateAdminProfile('u1', { password: 'abc' });
    expect(r.success).toBe(false);
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    expect(supabase.queriesFor('profiles')).toHaveLength(0);
  });

  it('mengubah nama: update Auth metadata, tabel profiles, dan cache', async () => {
    supabase.onTable('profiles', () => ({ data: profile({ member_id: 'PFX-9' }) }));
    supabase.auth.updateUser.mockResolvedValue({ data: { user: authUser({ user_metadata: { full_name: 'Baru' } }) }, error: null } as never);

    const r = await AdminAuthService.updateAdminProfile('u1', { fullName: ' Baru ' });

    expect(r.success).toBe(true);
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ data: { full_name: 'Baru' } });
    expect(supabase.queriesFor('profiles', 'update')[0].payload).toMatchObject({ full_name: 'Baru' });
    expect(r.updatedProfile).toMatchObject({ id: 'u1', full_name: 'Baru', member_id: 'PFX-9', role: 'admin' });
    expect(JSON.parse(localStorage.getItem(CACHE)!).full_name).toBe('Baru');
  });

  it('email yang sama dengan email Auth tidak dikirim ulang', async () => {
    supabase.onTable('profiles', () => ({ data: profile() }));
    await AdminAuthService.updateAdminProfile('u1', { email: 'ADMIN@mail.com' });
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('email berubah dikirim ke Auth; gagal tanpa perubahan nama → error', async () => {
    supabase.auth.updateUser.mockResolvedValue({ data: {}, error: { message: 'rate limit' } } as never);
    const r = await AdminAuthService.updateAdminProfile('u1', { email: 'baru@mail.com' });
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ email: 'baru@mail.com' });
    expect(r).toEqual({ success: false, error: 'rate limit' });
  });

  it('baris profiles belum ada → upsert lengkap dengan member_id', async () => {
    supabase.onTable('profiles', (q) => (q.op === 'upsert' ? { data: profile() } : { data: null }));
    const r = await AdminAuthService.updateAdminProfile('u1', { fullName: 'Admin' });
    expect(r.success).toBe(true);
    expect(supabase.queriesFor('profiles', 'upsert')[0].payload).toMatchObject({ id: 'u1', member_id: 'PFX-ADMIN-01', role: 'admin' });
  });
});
