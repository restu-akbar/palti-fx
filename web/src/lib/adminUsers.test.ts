import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeSupabase } from '../test/fakeSupabase';

vi.mock('./supabase', async () => {
  const { createFakeSupabase } = await import('../test/fakeSupabase');
  return { supabase: createFakeSupabase() };
});

import { supabase as client } from './supabase';
import { AdminUsersService } from './adminUsers';

const supabase = client as unknown as FakeSupabase;

beforeEach(() => {
  supabase.reset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('AdminUsersService.getUsers', () => {
  it('mengambil profil terbaru lebih dulu', async () => {
    supabase.onTable('profiles', () => ({ data: [{ id: 'u1' }, { id: 'u2' }] }));
    const users = await AdminUsersService.getUsers();
    expect(users).toHaveLength(2);
    expect(supabase.queriesFor('profiles')[0].orders).toEqual([{ column: 'created_at', options: { ascending: false } }]);
  });

  it('error atau data kosong menghasilkan daftar kosong', async () => {
    supabase.onTable('profiles', () => ({ error: { message: 'RLS' } }));
    expect(await AdminUsersService.getUsers()).toEqual([]);
    supabase.onTable('profiles', () => {
      throw new Error('offline');
    });
    expect(await AdminUsersService.getUsers()).toEqual([]);
  });
});

describe.each([
  ['updateUserStatus', 'status', 'suspended'],
  ['updateUserRole', 'role', 'admin'],
] as const)('AdminUsersService.%s', (method, column, value) => {
  it('memperbarui kolom pada profil target', async () => {
    supabase.onTable('profiles', () => ({ data: [{ id: 'u1' }] }));
    const r = await (AdminUsersService[method] as (id: string, v: string) => Promise<{ success: boolean }>)('u1', value);
    expect(r.success).toBe(true);
    const [q] = supabase.queriesFor('profiles', 'update');
    expect(q.payload).toEqual({ [column]: value });
    expect(q.filters).toEqual([{ type: 'eq', column: 'id', value: 'u1' }]);
  });

  it('nol baris terpengaruh dianggap gagal (terhalang RLS)', async () => {
    supabase.onTable('profiles', () => ({ data: [] }));
    const r = await (AdminUsersService[method] as (id: string, v: string) => Promise<{ success: boolean; error?: string }>)('u1', value);
    expect(r.success).toBe(false);
    expect(r.error).toContain('RLS');
  });

  it('meneruskan pesan error database', async () => {
    supabase.onTable('profiles', () => ({ error: { message: 'permission denied' } }));
    const r = await (AdminUsersService[method] as (id: string, v: string) => Promise<{ success: boolean; error?: string }>)('u1', value);
    expect(r).toEqual({ success: false, error: 'permission denied' });
  });
});

describe('AdminUsersService.getDashboardStats', () => {
  it('menghitung total user, admin, modul, bab, video, dan undangan', async () => {
    supabase.onTable('profiles', (q) => {
      const hasNeq = q.filters.some((f) => f.type === 'neq');
      const isAdmin = q.filters.some((f) => f.type === 'eq' && f.column === 'role');
      return { count: isAdmin ? 2 : hasNeq ? 7 : 10 };
    });
    supabase.onTable('edu_modules', () => ({ count: 3 }));
    supabase.onTable('edu_lessons', () => ({
      data: [
        { id: 'l1', youtube_urls: ['a', ' ', ''] },
        { id: 'l2', youtube_urls: ['b', 'c'] },
        { id: 'l3', youtube_urls: null },
      ],
    }));
    supabase.onTable('invitations', (q) => ({ count: q.filters.some((f) => f.value === false) ? 4 : 6 }));

    expect(await AdminUsersService.getDashboardStats()).toEqual({
      total_users: 10,
      active_users: 7,
      total_admins: 2,
      total_modules: 3,
      total_chapters: 3,
      total_lessons: 3,
      total_videos: 3,
      active_invites: 4,
      used_invites: 6,
    });
  });

  it('gagal total mengembalikan nol semua', async () => {
    supabase.onTable('profiles', () => {
      throw new Error('offline');
    });
    const stats = await AdminUsersService.getDashboardStats();
    expect(Object.values(stats).every((v) => v === 0)).toBe(true);
  });
});
