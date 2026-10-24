import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeSupabase } from './helpers/fakeSupabase';

vi.mock('../src/lib/supabase', async () => {
  const { createFakeSupabase } = await import('./helpers/fakeSupabase');
  return { supabase: createFakeSupabase() };
});

import { supabase as client } from '../src/lib/supabase';
import { AuthService } from '../src/lib/authService';

const supabase = client as unknown as FakeSupabase;

const user = (over: Record<string, unknown> = {}) => ({
  id: 'u1',
  email: 'dio@mail.com',
  user_metadata: {},
  ...over,
});

const profile = (over: Record<string, unknown> = {}) => ({
  full_name: 'Dio Rahman',
  status: 'active',
  member_id: 'PFX-1',
  role: 'member',
  ...over,
});

const withProfile = (p: unknown) => supabase.onTable('profiles', () => ({ data: p }));

beforeEach(() => {
  supabase.reset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('AuthService.signIn', () => {
  it('menolak input kosong tanpa menghubungi server', async () => {
    const r = await AuthService.signIn('  ', '');
    expect(r.success).toBe(false);
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('login email dinormalisasi dan memakai nama dari profil', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: user(), session: {} }, error: null } as never);
    withProfile(profile({ role: 'admin' }));

    const r = await AuthService.signIn('  DIO@Mail.com ', 'rahasia123');

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'dio@mail.com', password: 'rahasia123' });
    expect(r).toMatchObject({ success: true, status: 'active', identifier: 'dio@mail.com', name: 'Dio Rahman', role: 'admin' });
  });

  it('ID member diubah ke email lewat RPC resolve_member_email', async () => {
    supabase.onRpc('resolve_member_email', () => ({ data: 'dio@mail.com' }));
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: user(), session: {} }, error: null } as never);
    withProfile(profile());

    const r = await AuthService.signIn('pfx-12345678', 'rahasia123');

    expect(supabase.rpc).toHaveBeenCalledWith('resolve_member_email', { p_member_id: 'pfx-12345678' });
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'dio@mail.com', password: 'rahasia123' });
    expect(r.success).toBe(true);
  });

  it('ID member tidak ditemukan memberi pesan kredensial generik', async () => {
    const r = await AuthService.signIn('pfx-00000000', 'x');
    expect(r).toEqual({ success: false, error: 'Email/ID Member atau kata sandi tidak cocok.' });
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('error RPC dipetakan ke pesan ramah', async () => {
    supabase.onRpc('resolve_member_email', () => ({ error: { message: 'Failed to fetch' } }));
    const r = await AuthService.signIn('pfx-1', 'x');
    expect(r.success).toBe(false);
    expect(r.error).toContain('terhubung ke server');
  });

  it('kredensial salah dipetakan', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
    } as never);
    const r = await AuthService.signIn('dio@mail.com', 'salah');
    expect(r).toEqual({ success: false, error: 'Email/ID Member atau kata sandi tidak cocok.' });
  });

  it('akun banned dari Auth ditandai suspended', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: 'user_banned', message: 'User is banned' },
    } as never);
    const r = await AuthService.signIn('dio@mail.com', 'x');
    expect(r.status).toBe('suspended');
    expect(r.success).toBe(false);
  });

  it('profil suspended memaksa sign out lokal dan menolak login', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: user(), session: {} }, error: null } as never);
    withProfile(profile({ status: 'suspended' }));

    const r = await AuthService.signIn('dio@mail.com', 'rahasia123');

    expect(r).toMatchObject({ success: false, status: 'suspended' });
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('tanpa profil memakai nama dari bagian lokal email dan role member', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: user({ email: 'dio.putra@mail.com' }), session: {} }, error: null } as never);
    const r = await AuthService.signIn('dio.putra@mail.com', 'rahasia123');
    expect(r).toMatchObject({ success: true, name: 'Dio.putra', role: 'member' });
  });

  it('nama dari user_metadata diprioritaskan atas email', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: user({ user_metadata: { full_name: 'Nama Meta' } }), session: {} },
      error: null,
    } as never);
    const r = await AuthService.signIn('dio@mail.com', 'rahasia123');
    expect(r.name).toBe('Nama Meta');
  });

  it('exception jaringan menjadi pesan generik', async () => {
    supabase.auth.signInWithPassword.mockRejectedValue(new Error('Network request failed'));
    const r = await AuthService.signIn('dio@mail.com', 'x');
    expect(r.success).toBe(false);
    expect(r.error).toContain('terhubung ke server');
  });
});

describe('AuthService.activate', () => {
  it('validasi input sebelum menghubungi server', async () => {
    expect((await AuthService.activate('bukan-email', 'PFX1234', 'abc12345')).error).toMatch(/email/i);
    expect((await AuthService.activate('a@b.com', 'ab', 'abc12345')).error).toMatch(/undangan/i);
    expect((await AuthService.activate('a@b.com', 'PFX1234', 'pendek')).success).toBe(false);
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('mengirim kode undangan ternormalisasi lewat metadata', async () => {
    await AuthService.activate(' New@Mail.com ', ' pfx - 8890 - ab ', 'abc12345');
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@mail.com',
      password: 'abc12345',
      options: { data: { invitation_code: 'PFX8890AB' } },
    });
  });

  it('error pendaftaran dipetakan', async () => {
    supabase.auth.signUp.mockResolvedValue({ data: {}, error: { message: 'Database error saving new user' } } as never);
    const r = await AuthService.activate('a@b.com', 'PFX1234', 'abc12345');
    expect(r.error).toContain('Kode undangan');
  });

  it('identities kosong berarti email sudah terdaftar', async () => {
    supabase.auth.signUp.mockResolvedValue({ data: { user: user({ identities: [] }), session: null }, error: null } as never);
    const r = await AuthService.activate('a@b.com', 'PFX1234', 'abc12345');
    expect(r).toEqual({ success: false, error: 'Email ini sudah memiliki akun aktif. Silakan masuk.' });
  });

  it('langsung masuk bila Supabase mengembalikan sesi', async () => {
    supabase.auth.signUp.mockResolvedValue({ data: { user: user(), session: {} }, error: null } as never);
    withProfile(profile());
    const r = await AuthService.activate('dio@mail.com', 'PFX1234', 'abc12345');
    expect(r).toMatchObject({ success: true, signedIn: true, identifier: 'dio@mail.com', name: 'Dio Rahman', role: 'member' });
  });

  it('belum masuk bila menunggu konfirmasi email', async () => {
    supabase.auth.signUp.mockResolvedValue({ data: { user: user(), session: null }, error: null } as never);
    const r = await AuthService.activate('dio@mail.com', 'PFX1234', 'abc12345');
    expect(r).toEqual({ success: true, signedIn: false, identifier: 'dio@mail.com' });
  });
});

describe('AuthService.requestPasswordReset', () => {
  it('menolak identifier kosong', async () => {
    expect((await AuthService.requestPasswordReset(' ')).success).toBe(false);
  });

  it('mengirim OTP ke email', async () => {
    const r = await AuthService.requestPasswordReset('Dio@Mail.com');
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('dio@mail.com');
    expect(r.success).toBe(true);
  });

  it('ID member tak dikenal tetap sukses tanpa mengirim email (tidak membocorkan akun)', async () => {
    const r = await AuthService.requestPasswordReset('pfx-99999999');
    expect(r).toEqual({ success: true });
    expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('rate limit ditandai', async () => {
    supabase.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: { status: 429, code: 'over_email_send_rate_limit', message: 'rate limit' } } as never);
    const r = await AuthService.requestPasswordReset('dio@mail.com');
    expect(r).toMatchObject({ success: false, rateLimited: true });
  });

  it('error lain tidak ditandai rate limit', async () => {
    supabase.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: { status: 500, message: 'smtp' } } as never);
    const r = await AuthService.requestPasswordReset('dio@mail.com');
    expect(r.success).toBe(false);
    expect(r.rateLimited).toBeUndefined();
  });
});

describe('AuthService.verifyResetOtp', () => {
  it('menolak OTP dengan panjang tidak valid', async () => {
    expect((await AuthService.verifyResetOtp('dio@mail.com', '123')).success).toBe(false);
    expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
  });

  it('ID member tak dikenal gagal dengan pesan generik', async () => {
    const r = await AuthService.verifyResetOtp('pfx-1', '123456');
    expect(r.success).toBe(false);
    expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
  });

  it('membersihkan sesi lama lalu verifikasi tipe recovery', async () => {
    const r = await AuthService.verifyResetOtp('Dio@Mail.com', ' 12 34-56 ');
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({ email: 'dio@mail.com', token: '123456', type: 'recovery' });
    expect(r.success).toBe(true);
  });

  it('kode kedaluwarsa memberi petunjuk memakai kode terbaru', async () => {
    supabase.auth.verifyOtp.mockResolvedValue({ data: {}, error: { message: 'Token has expired or is invalid' } } as never);
    const r = await AuthService.verifyResetOtp('dio@mail.com', '123456');
    expect(r.error).toContain('TERBARU');
  });
});

describe('AuthService.updatePassword', () => {
  it('menolak sandi lemah tanpa memanggil server', async () => {
    expect((await AuthService.updatePassword('abc')).success).toBe(false);
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('menyimpan sandi lalu mengakhiri sesi recovery', async () => {
    const r = await AuthService.updatePassword('abc12345');
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'abc12345' });
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(r.success).toBe(true);
  });

  it('sandi sama dengan yang lama dipetakan', async () => {
    supabase.auth.updateUser.mockResolvedValue({ data: {}, error: { code: 'same_password', message: 'x' } } as never);
    const r = await AuthService.updatePassword('abc12345');
    expect(r.error).toContain('tidak boleh sama');
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });
});

describe('AuthService.signOut & listener', () => {
  it('signOut tidak melempar error meski server gagal', async () => {
    supabase.auth.signOut.mockRejectedValue(new Error('x'));
    await expect(AuthService.signOut()).resolves.toBeUndefined();
  });

  it('onAuthStateChange meneruskan nama event dan mengembalikan subscription', () => {
    const cb = vi.fn();
    const sub = AuthService.onAuthStateChange(cb);
    const handler = supabase.auth.onAuthStateChange.mock.calls[0][0];
    handler('SIGNED_OUT');
    expect(cb).toHaveBeenCalledWith('SIGNED_OUT');
    expect(typeof sub.unsubscribe).toBe('function');
  });
});

describe('AuthService.restoreSession', () => {
  const hasSession = () =>
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: user() } }, error: null } as never);

  it('tanpa sesi tersimpan → unauthenticated', async () => {
    expect(await AuthService.restoreSession()).toEqual({ state: 'unauthenticated' });
    expect(supabase.auth.getUser).not.toHaveBeenCalled();
  });

  it('sesi valid → authenticated dengan data profil', async () => {
    hasSession();
    supabase.auth.getUser.mockResolvedValue({ data: { user: user() }, error: null } as never);
    withProfile(profile({ role: 'admin' }));
    expect(await AuthService.restoreSession()).toEqual({
      state: 'authenticated',
      identifier: 'dio@mail.com',
      name: 'Dio Rahman',
      role: 'admin',
    });
  });

  it.each([
    [{ status: 401, message: 'x' }],
    [{ status: 403, message: 'x' }],
    [{ code: 'user_not_found', message: 'x' }],
    [{ code: 'session_not_found', message: 'x' }],
    [{ code: 'bad_jwt', message: 'x' }],
    [{ code: 'user_banned', message: 'x' }],
  ])('error %j berarti sesi mati → sign out lokal', async (error) => {
    hasSession();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error } as never);
    expect(await AuthService.restoreSession()).toEqual({ state: 'unauthenticated' });
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('gagal menghubungi server → unknown dan sesi tidak dihapus', async () => {
    hasSession();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { status: 0, message: 'Failed to fetch' } } as never);
    expect(await AuthService.restoreSession()).toEqual({ state: 'unknown' });
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it('user kosong tanpa error → unauthenticated', async () => {
    hasSession();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as never);
    expect(await AuthService.restoreSession()).toEqual({ state: 'unauthenticated' });
  });

  it('profil suspended → sign out dan unauthenticated', async () => {
    hasSession();
    supabase.auth.getUser.mockResolvedValue({ data: { user: user() }, error: null } as never);
    withProfile(profile({ status: 'suspended' }));
    expect(await AuthService.restoreSession()).toEqual({ state: 'unauthenticated' });
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('exception tak terduga → unknown', async () => {
    supabase.auth.getSession.mockRejectedValue(new Error('boom'));
    expect(await AuthService.restoreSession()).toEqual({ state: 'unknown' });
  });
});
