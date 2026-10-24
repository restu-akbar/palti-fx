import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeSupabase } from './helpers/fakeSupabase';

vi.mock('../src/lib/supabase', async () => {
  const { createFakeSupabase } = await import('./helpers/fakeSupabase');
  return { supabase: createFakeSupabase() };
});

import { supabase as client } from '../src/lib/supabase';
import { UserSyncService } from '../src/lib/userSyncService';

const supabase = client as unknown as FakeSupabase;

beforeEach(() => {
  supabase.reset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('UserSyncService.fetchUserData', () => {
  it('memetakan progres, medali, dan trade dari baris database', async () => {
    supabase.onTable('user_lesson_progress', () => ({
      data: [
        { lesson_id: 'l1', completed: true },
        { lesson_id: 'l2', completed: false },
      ],
    }));
    supabase.onTable('user_achievements', () => ({
      data: [{ achievement_id: 'a1', unlocked_at: '2026-01-05T00:00:00.000Z' }],
    }));
    supabase.onTable('user_trades', () => ({
      data: [
        {
          id: 't1', date: '2026-01-05', symbol: 'EURUSD', direction: 'BUY', lot: '0.5',
          entry: '1.1', exit: '1.2', sl: '1.0', tp: '1.3', pl: '12.5', pips: '100',
          setup: 'breakout', emotion: 'tenang', notes: 'ok', created_at: '2026-01-05T08:00:00.000Z',
        },
      ],
    }));

    const r = await UserSyncService.fetchUserData('u1');

    expect(r.completed).toEqual({ l1: true });
    expect(r.unlocked).toEqual({ a1: Date.parse('2026-01-05T00:00:00.000Z') });
    expect(r.trades).toEqual([
      {
        id: 't1', date: '2026-01-05', symbol: 'EURUSD', direction: 'BUY', lot: 0.5,
        entry: 1.1, exit: 1.2, sl: 1, tp: 1.3, pl: 12.5, pips: 100,
        setup: 'breakout', emotion: 'tenang', notes: 'ok', createdAt: Date.parse('2026-01-05T08:00:00.000Z'),
      },
    ]);
  });

  it('semua query dibatasi user_id', async () => {
    await UserSyncService.fetchUserData('u1');
    for (const table of ['user_lesson_progress', 'user_achievements', 'user_trades']) {
      expect(supabase.queriesFor(table)[0].filters).toContainEqual({ type: 'eq', column: 'user_id', value: 'u1' });
    }
  });

  it('nilai opsional kosong menjadi undefined dan lot bawaan 0.01', async () => {
    supabase.onTable('user_trades', () => ({
      data: [{ id: 't1', date: '2026-01-05', symbol: 'XAUUSD', direction: 'SELL', lot: null, entry: null, pl: null, notes: '' }],
    }));
    const [t] = (await UserSyncService.fetchUserData('u1')).trades;
    expect(t).toMatchObject({ lot: 0.01, pl: 0, entry: undefined, notes: undefined, setup: undefined });
  });

  it('data kosong menghasilkan struktur kosong', async () => {
    expect(await UserSyncService.fetchUserData('u1')).toEqual({ completed: {}, unlocked: {}, trades: [] });
  });

  it('error jaringan tidak melempar dan mengembalikan data kosong', async () => {
    supabase.onTable('user_trades', () => {
      throw new Error('offline');
    });
    const r = await UserSyncService.fetchUserData('u1');
    expect(r.trades).toEqual([]);
  });
});

describe('UserSyncService penulisan', () => {
  it('saveLessonProgress(true) melakukan upsert dengan onConflict', async () => {
    await UserSyncService.saveLessonProgress('u1', 'l1', true);
    const [q] = supabase.queriesFor('user_lesson_progress', 'upsert');
    expect(q.payload).toMatchObject({ user_id: 'u1', lesson_id: 'l1', completed: true });
    expect(q.options).toEqual({ onConflict: 'user_id,lesson_id' });
  });

  it('saveLessonProgress(false) menghapus baris milik user', async () => {
    await UserSyncService.saveLessonProgress('u1', 'l1', false);
    const [q] = supabase.queriesFor('user_lesson_progress', 'delete');
    expect(q.filters).toEqual([
      { type: 'eq', column: 'user_id', value: 'u1' },
      { type: 'eq', column: 'lesson_id', value: 'l1' },
    ]);
  });

  it('saveAchievement menyimpan waktu dalam ISO', async () => {
    await UserSyncService.saveAchievement('u1', 'a1', Date.parse('2026-01-05T00:00:00.000Z'));
    const [q] = supabase.queriesFor('user_achievements', 'upsert');
    expect(q.payload).toEqual({ user_id: 'u1', achievement_id: 'a1', unlocked_at: '2026-01-05T00:00:00.000Z' });
    expect(q.options).toEqual({ onConflict: 'user_id,achievement_id' });
  });

  it('saveTrade melakukan upsert berdasarkan id', async () => {
    await UserSyncService.saveTrade('u1', {
      id: 't1', date: '2026-01-05', symbol: 'EURUSD', direction: 'BUY', lot: 0.1, pl: 5, createdAt: 1000,
    });
    const [q] = supabase.queriesFor('user_trades', 'upsert');
    expect(q.payload).toMatchObject({ id: 't1', user_id: 'u1', symbol: 'EURUSD', pl: 5, created_at: new Date(1000).toISOString() });
    expect(q.options).toEqual({ onConflict: 'id' });
  });

  it('deleteTrade membatasi id dan user_id', async () => {
    await UserSyncService.deleteTrade('u1', 't1');
    const [q] = supabase.queriesFor('user_trades', 'delete');
    expect(q.filters).toEqual([
      { type: 'eq', column: 'id', value: 't1' },
      { type: 'eq', column: 'user_id', value: 'u1' },
    ]);
  });

  it('updateProfileName memangkas nama dan menyimpan null untuk nama kosong', async () => {
    await UserSyncService.updateProfileName('u1', '  Dio  ');
    await UserSyncService.updateProfileName('u1', null);
    const [a, b] = supabase.queriesFor('profiles', 'update');
    expect(a.payload).toEqual({ full_name: 'Dio' });
    expect(b.payload).toEqual({ full_name: null });
    expect(a.filters).toEqual([{ type: 'eq', column: 'id', value: 'u1' }]);
  });

  it('kegagalan penulisan ditelan tanpa melempar', async () => {
    supabase.onTable('user_trades', () => {
      throw new Error('offline');
    });
    await expect(
      UserSyncService.saveTrade('u1', { id: 't', date: 'd', symbol: 's', direction: 'BUY', lot: 1, pl: 0, createdAt: 1 })
    ).resolves.toBeUndefined();
    await expect(UserSyncService.deleteTrade('u1', 't')).resolves.toBeUndefined();
  });
});
