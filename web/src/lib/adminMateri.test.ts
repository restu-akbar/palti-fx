import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeSupabase, RecordedQuery } from '../test/fakeSupabase';

vi.mock('./supabase', async () => {
  const { createFakeSupabase } = await import('../test/fakeSupabase');
  return { supabase: createFakeSupabase() };
});

import { supabase as client } from './supabase';
import { AdminMateriService } from './adminMateri';

const supabase = client as unknown as FakeSupabase;

const ops = () => supabase.queries.map((q) => `${q.op}:${q.table}`);

beforeEach(() => {
  supabase.reset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('AdminMateriService.getModules', () => {
  it('menggabungkan modul dengan bab-babnya', async () => {
    supabase.onTable('edu_modules', () => ({ data: [{ id: 'm1', title: 'A' }] }));
    supabase.onTable('edu_lessons', () => ({ data: [{ id: 'l1', module_id: 'm1', title: 'B' }] }));
    const mods = await AdminMateriService.getModules();
    expect(mods).toHaveLength(1);
    expect(mods[0].lessons![0].id).toBe('l1');
  });

  it('error atau exception menghasilkan daftar kosong', async () => {
    supabase.onTable('edu_modules', () => ({ error: { message: 'x' } }));
    expect(await AdminMateriService.getModules()).toEqual([]);
    supabase.onTable('edu_modules', () => {
      throw new Error('offline');
    });
    expect(await AdminMateriService.getModules()).toEqual([]);
  });
});

describe('AdminMateriService modul', () => {
  it('createModule: sort_order berikutnya, teks dipangkas, ikon bawaan', async () => {
    supabase.onTable('edu_modules', (q) => (q.op === 'select' ? { data: { sort_order: 2 } } : {}));
    const r = await AdminMateriService.createModule({ title: ' T ', subtitle: ' S ', level: 'Pemula', icon: '  ' });
    expect(r.success).toBe(true);
    expect(supabase.queriesFor('edu_modules', 'insert')[0].payload).toEqual({
      title: 'T', subtitle: 'S', level: 'Pemula', icon: 'school-outline', sort_order: 3,
    });
  });

  it('createModule pertama dimulai dari 1', async () => {
    await AdminMateriService.createModule({ title: 'T', subtitle: '', level: 'Pemula', icon: 'x' });
    expect((supabase.queriesFor('edu_modules', 'insert')[0].payload as { sort_order: number }).sort_order).toBe(1);
  });

  it('updateModule: hapus lalu sisipkan ulang dengan ID sama dan bab dipulihkan', async () => {
    const existing = { id: 'm1', title: 'Lama', subtitle: 'S', level: 'Pemula', icon: 'i', sort_order: 1 };
    const lessons = [{ id: 'l1', module_id: 'm1' }];
    supabase.onTable('edu_modules', (q) => (q.op === 'select' ? { data: existing } : {}));
    supabase.onTable('edu_lessons', (q) => (q.op === 'select' ? { data: lessons } : {}));

    const r = await AdminMateriService.updateModule('m1', { title: ' Baru ', icon: '' });

    expect(r.success).toBe(true);
    expect(ops()).toEqual([
      'select:edu_modules', 'select:edu_lessons', 'delete:edu_modules', 'insert:edu_modules', 'insert:edu_lessons',
    ]);
    expect(supabase.queriesFor('edu_modules', 'insert')[0].payload).toMatchObject({
      id: 'm1', title: 'Baru', subtitle: 'S', icon: 'school-outline',
    });
    expect(supabase.queriesFor('edu_lessons', 'insert')[0].payload).toEqual(lessons);
  });

  it('updateModule: modul tidak ditemukan tidak menghapus apa pun', async () => {
    const r = await AdminMateriService.updateModule('m1', { title: 'x' });
    expect(r.success).toBe(false);
    expect(ops()).toEqual(['select:edu_modules']);
  });

  it('updateModule: insert gagal → modul dan bab lama dikembalikan', async () => {
    const existing = { id: 'm1', title: 'Lama' };
    const lessons = [{ id: 'l1' }];
    let inserts = 0;
    supabase.onTable('edu_modules', (q) => {
      if (q.op === 'select') return { data: existing };
      if (q.op === 'insert' && inserts++ === 0) return { error: { message: 'gagal' } };
      return {};
    });
    supabase.onTable('edu_lessons', (q) => (q.op === 'select' ? { data: lessons } : {}));

    const r = await AdminMateriService.updateModule('m1', { title: 'Baru' });

    expect(r).toEqual({ success: false, error: 'gagal' });
    const inserted = supabase.queriesFor('edu_modules', 'insert').map((q) => q.payload);
    expect(inserted[1]).toEqual(existing);
    expect(supabase.queriesFor('edu_lessons', 'insert')[0].payload).toEqual(lessons);
  });

  it('deleteModule menghapus bab lebih dulu', async () => {
    const r = await AdminMateriService.deleteModule('m1');
    expect(r.success).toBe(true);
    expect(ops()).toEqual(['delete:edu_lessons', 'delete:edu_modules']);
    expect(supabase.queriesFor('edu_lessons', 'delete')[0].filters).toEqual([{ type: 'eq', column: 'module_id', value: 'm1' }]);
  });

  it('deleteModule meneruskan error', async () => {
    supabase.onTable('edu_modules', () => ({ error: { message: 'fk' } }));
    expect(await AdminMateriService.deleteModule('m1')).toEqual({ success: false, error: 'fk' });
  });

  it('reorderModules menyisipkan ulang dengan sort_order sesuai urutan baru', async () => {
    supabase.onTable('edu_modules', (q) => (q.op === 'select' ? { data: [{ id: 'a' }, { id: 'b' }] } : {}));
    const r = await AdminMateriService.reorderModules(['b', 'a']);
    expect(r.success).toBe(true);
    expect(supabase.queriesFor('edu_modules', 'insert')[0].payload).toEqual([
      { id: 'a', sort_order: 2 },
      { id: 'b', sort_order: 1 },
    ]);
    expect(supabase.queriesFor('edu_modules', 'delete')[0].filters).toEqual([{ type: 'in', column: 'id', value: ['b', 'a'] }]);
  });

  it('reorderModules: insert gagal → data lama dikembalikan', async () => {
    const existing = [{ id: 'a' }, { id: 'b' }];
    let inserts = 0;
    supabase.onTable('edu_modules', (q: RecordedQuery) => {
      if (q.op === 'select') return { data: existing };
      if (q.op === 'insert' && inserts++ === 0) return { error: { message: 'gagal' } };
      return {};
    });
    supabase.onTable('edu_lessons', (q) => (q.op === 'select' ? { data: [{ id: 'l1' }] } : {}));

    const r = await AdminMateriService.reorderModules(['b', 'a']);

    expect(r).toEqual({ success: false, error: 'gagal' });
    expect(supabase.queriesFor('edu_modules', 'insert')[1].payload).toEqual(existing);
    expect(supabase.queriesFor('edu_lessons', 'insert')[0].payload).toEqual([{ id: 'l1' }]);
  });
});

describe('AdminMateriService bab', () => {
  it('createLesson: sort_order per modul, URL dibersihkan, menit bawaan 5', async () => {
    supabase.onTable('edu_lessons', (q) => (q.op === 'select' ? { data: { sort_order: 7 } } : {}));
    await AdminMateriService.createLesson('m1', { title: ' Bab ', minutes: -1, youtubeUrls: [' u1 ', ' '], content: 'isi' });
    expect(supabase.queriesFor('edu_lessons', 'select')[0].filters).toEqual([{ type: 'eq', column: 'module_id', value: 'm1' }]);
    expect(supabase.queriesFor('edu_lessons', 'insert')[0].payload).toEqual({
      module_id: 'm1', title: 'Bab', minutes: 5, youtube_urls: ['u1'], content: 'isi', sort_order: 8,
    });
  });

  it('updateLesson: gabungkan patch dengan data lama lalu hapus + sisipkan ulang', async () => {
    const existing = { id: 'l1', module_id: 'm1', title: 'Lama', minutes: 3, youtube_urls: ['x'], content: 'lama' };
    supabase.onTable('edu_lessons', (q) => (q.op === 'select' ? { data: existing } : {}));

    const r = await AdminMateriService.updateLesson('l1', { title: ' Baru ', youtubeUrls: [' y ', ''] });

    expect(r.success).toBe(true);
    expect(ops()).toEqual(['select:edu_lessons', 'delete:edu_lessons', 'insert:edu_lessons']);
    expect(supabase.queriesFor('edu_lessons', 'insert')[0].payload).toMatchObject({
      id: 'l1', module_id: 'm1', title: 'Baru', minutes: 3, youtube_urls: ['y'], content: 'lama',
    });
  });

  it('updateLesson tanpa youtubeUrls mempertahankan video lama', async () => {
    const existing = { id: 'l1', title: 'T', minutes: 3, youtube_urls: ['x'], content: 'c' };
    supabase.onTable('edu_lessons', (q) => (q.op === 'select' ? { data: existing } : {}));
    await AdminMateriService.updateLesson('l1', { content: 'baru' });
    expect(supabase.queriesFor('edu_lessons', 'insert')[0].payload).toMatchObject({ youtube_urls: ['x'], content: 'baru' });
  });

  it('updateLesson: bab tidak ada → tidak menghapus', async () => {
    const r = await AdminMateriService.updateLesson('l1', { title: 'x' });
    expect(r.success).toBe(false);
    expect(ops()).toEqual(['select:edu_lessons']);
  });

  it('updateLesson: insert gagal → bab lama dikembalikan', async () => {
    const existing = { id: 'l1', title: 'Lama', minutes: 3, youtube_urls: [], content: '' };
    let inserts = 0;
    supabase.onTable('edu_lessons', (q) => {
      if (q.op === 'select') return { data: existing };
      if (q.op === 'insert' && inserts++ === 0) return { error: { message: 'gagal' } };
      return {};
    });
    const r = await AdminMateriService.updateLesson('l1', { title: 'Baru' });
    expect(r).toEqual({ success: false, error: 'gagal' });
    expect(supabase.queriesFor('edu_lessons', 'insert')[1].payload).toEqual(existing);
  });

  it('deleteLesson menghapus per id dan meneruskan error', async () => {
    expect(await AdminMateriService.deleteLesson('l1')).toEqual({ success: true });
    supabase.onTable('edu_lessons', () => ({ error: { message: 'x' } }));
    expect(await AdminMateriService.deleteLesson('l1')).toEqual({ success: false, error: 'x' });
  });

  it('reorderLessons memberi sort_order sesuai urutan baru', async () => {
    supabase.onTable('edu_lessons', (q) => (q.op === 'select' ? { data: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] } : {}));
    const r = await AdminMateriService.reorderLessons(['c', 'a', 'b']);
    expect(r.success).toBe(true);
    expect(supabase.queriesFor('edu_lessons', 'insert')[0].payload).toEqual([
      { id: 'a', sort_order: 2 },
      { id: 'b', sort_order: 3 },
      { id: 'c', sort_order: 1 },
    ]);
  });
});
