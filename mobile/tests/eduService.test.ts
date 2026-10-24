import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeSupabase, RecordedQuery } from './helpers/fakeSupabase';

const { storage } = vi.hoisted(() => ({ storage: new Map<string, string>() }));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => storage.get(k) ?? null,
    setItem: async (k: string, v: string) => void storage.set(k, v),
    removeItem: async (k: string) => void storage.delete(k),
  },
}));
vi.mock('../src/lib/supabase', async () => {
  const { createFakeSupabase } = await import('./helpers/fakeSupabase');
  return { supabase: createFakeSupabase() };
});

import { MODULES } from '../src/data/modules';
import { supabase as client } from '../src/lib/supabase';
import { EduService, extractYouTubeId } from '../src/lib/eduService';

const supabase = client as unknown as FakeSupabase;
const CACHE_KEY = 'pfx.edu_modules.cache.v3';

const dbModules = [
  { id: 'm1', title: 'Dasar', subtitle: 'S', level: 'Pemula', icon: 'school-outline', sort_order: 1, created_at: '2026-01-01', updated_at: '2026-01-03' },
];
const dbLessons = [
  { id: 'l1', module_id: 'm1', title: 'Bab 1', minutes: 4, youtube_urls: [], content: 'isi', sort_order: 1, created_at: '2026-01-02', updated_at: '2026-01-04' },
];

function serveServer(mods = dbModules, lessons = dbLessons) {
  const serve = (rows: any[]) => (q: RecordedQuery) => {
    if (q.head) return { count: rows.length };
    if (q.maybeSingle) {
      const sorted = [...rows].sort((a, b) => String(b.updated_at ?? '').localeCompare(String(a.updated_at ?? '')));
      return { data: sorted[0] ? { updated_at: sorted[0].updated_at, created_at: sorted[0].created_at } : null };
    }
    return { data: rows };
  };
  supabase.onTable('edu_modules', serve(mods));
  supabase.onTable('edu_lessons', serve(lessons));
}

const fullFetches = () =>
  supabase.queries.filter((q) => q.op === 'select' && !q.head && !q.maybeSingle);

beforeEach(() => {
  supabase.reset();
  storage.clear();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('extractYouTubeId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['  https://youtube.com/watch?feature=share&v=dQw4w9WgXcQ  ', 'dQw4w9WgXcQ'],
    ['https://example.com/video', null],
    ['', null],
  ])('%s', (url, id) => {
    expect(extractYouTubeId(url)).toBe(id);
  });
});

describe('EduService.getModules', () => {
  it('tanpa cache: unduh penuh, petakan, dan simpan metadata cache', async () => {
    serveServer();
    const modules = await EduService.getModules();

    expect(modules).toHaveLength(1);
    expect(modules[0].lessons[0]).toMatchObject({ id: 'l1', moduleId: 'm1', minutes: 4, content: 'isi' });

    const cache = JSON.parse(storage.get(CACHE_KEY)!);
    expect(cache).toMatchObject({
      totalModules: 1,
      totalLessons: 1,
      lastLessonUpdate: '2026-01-04',
      lastModuleUpdate: '2026-01-03',
    });
    expect(typeof cache.cachedAt).toBe('number');
  });

  it('cache masih segar: hanya cek ringan, tanpa unduh penuh', async () => {
    serveServer();
    await EduService.getModules();
    supabase.queries.length = 0;

    const again = await EduService.getModules();

    expect(again).toHaveLength(1);
    expect(fullFetches()).toHaveLength(0);
  });

  it('jumlah bab berubah di server: unduh ulang', async () => {
    serveServer();
    await EduService.getModules();
    serveServer(dbModules, [...dbLessons, { ...dbLessons[0], id: 'l2', title: 'Bab 2' }]);

    const modules = await EduService.getModules();

    expect(modules[0].lessons.map((l) => l.id)).toEqual(['l1', 'l2']);
  });

  it('bab diedit (timestamp berubah, jumlah sama): unduh ulang', async () => {
    serveServer();
    await EduService.getModules();
    serveServer(dbModules, [{ ...dbLessons[0], title: 'Judul Baru', updated_at: '2026-02-01' }]);

    const modules = await EduService.getModules();

    expect(modules[0].lessons[0].title).toBe('Judul Baru');
  });

  it('forceRefresh melewati pengecekan cache', async () => {
    serveServer();
    await EduService.getModules();
    supabase.queries.length = 0;

    await EduService.getModules(true);

    expect(fullFetches().length).toBeGreaterThan(0);
  });

  it('offline saat verifikasi: pakai cache', async () => {
    serveServer();
    await EduService.getModules();
    supabase.onTable('edu_modules', () => {
      throw new Error('offline');
    });

    const modules = await EduService.getModules();

    expect(modules[0].id).toBe('m1');
  });

  it('server kosong tanpa cache: fallback ke materi bawaan', async () => {
    serveServer([], []);
    expect(await EduService.getModules()).toBe(MODULES);
  });

  it('server kosong dengan cache: pertahankan cache', async () => {
    serveServer();
    await EduService.getModules();
    serveServer([], []);
    const modules = await EduService.getModules(true);
    expect(modules[0].id).toBe('m1');
  });

  it('error server tanpa cache: fallback ke materi bawaan', async () => {
    supabase.onTable('edu_modules', () => ({ error: { message: 'boom' } }));
    expect(await EduService.getModules()).toBe(MODULES);
  });

  it('getCachedModules dan clearCache', async () => {
    expect(await EduService.getCachedModules()).toBeNull();
    serveServer();
    await EduService.getModules();
    expect((await EduService.getCachedModules())![0].id).toBe('m1');
    await EduService.clearCache();
    expect(await EduService.getCachedData()).toBeNull();
  });

  it('cache rusak dibaca sebagai tidak ada cache', async () => {
    storage.set(CACHE_KEY, '{rusak');
    expect(await EduService.getCachedData()).toBeNull();
  });
});

describe('EduService CRUD admin', () => {
  it('createModule memakai sort_order berikutnya dan memangkas teks', async () => {
    supabase.onTable('edu_modules', (q) => (q.op === 'select' ? { data: { sort_order: 4 } } : {}));
    const r = await EduService.createModule({ title: ' T ', subtitle: ' S ', level: 'Pemula', icon: 'school-outline' });
    expect(r).toEqual({ success: true });
    expect(supabase.queriesFor('edu_modules', 'insert')[0].payload).toEqual({
      title: 'T', subtitle: 'S', level: 'Pemula', icon: 'school-outline', sort_order: 5,
    });
  });

  it('createModule meneruskan pesan error database', async () => {
    supabase.onTable('edu_modules', (q) => (q.op === 'insert' ? { error: { message: 'RLS' } } : {}));
    const r = await EduService.createModule({ title: 'T', subtitle: '', level: 'Pemula', icon: 'x' });
    expect(r).toEqual({ success: false, error: 'RLS' });
  });

  it('materi bersifat permanen: update ditolak tanpa query', async () => {
    expect((await EduService.updateModule('m1', { title: 'x' })).success).toBe(false);
    expect((await EduService.updateLesson('l1', { title: 'x' })).success).toBe(false);
    expect(supabase.queries).toHaveLength(0);
  });

  it('deleteModule dan deleteLesson menghapus berdasarkan id', async () => {
    expect(await EduService.deleteModule('m1')).toEqual({ success: true });
    expect(await EduService.deleteLesson('l1')).toEqual({ success: true });
    expect(supabase.queriesFor('edu_modules', 'delete')[0].filters).toEqual([{ type: 'eq', column: 'id', value: 'm1' }]);
    expect(supabase.queriesFor('edu_lessons', 'delete')[0].filters).toEqual([{ type: 'eq', column: 'id', value: 'l1' }]);
  });

  it('createLesson membersihkan URL kosong dan menetapkan menit bawaan', async () => {
    supabase.onTable('edu_lessons', (q) => (q.op === 'select' ? { data: null } : {}));
    await EduService.createLesson('m1', { title: ' Bab ', minutes: 0, youtubeUrls: [' https://youtu.be/abc ', '  ', ''], content: 'x' });
    expect(supabase.queriesFor('edu_lessons', 'insert')[0].payload).toEqual({
      module_id: 'm1', title: 'Bab', minutes: 5, youtube_urls: ['https://youtu.be/abc'], content: 'x', sort_order: 1,
    });
  });

  it('reorder memperbarui sort_order sesuai urutan baru', async () => {
    await EduService.reorderModules(['b', 'a']);
    await EduService.reorderLessons(['y', 'x']);
    const mods = supabase.queriesFor('edu_modules', 'update');
    expect(mods.map((q) => q.payload)).toEqual([{ sort_order: 1 }, { sort_order: 2 }]);
    expect(mods.map((q) => q.filters[0].value)).toEqual(['b', 'a']);
    expect(supabase.queriesFor('edu_lessons', 'update').map((q) => q.filters[0].value)).toEqual(['y', 'x']);
  });
});
