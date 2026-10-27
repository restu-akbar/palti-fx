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
    expect(ops()).toEqual(['select:edu_lessons', 'delete:edu_lessons', 'delete:edu_modules']);
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

describe('AdminMateriService pembersihan media di storage', () => {
  const PUB = 'https://x.supabase.co/storage/v1/object/public';
  const IMG = `${PUB}/lesson-images/lessons/2026/10/a.webp`;
  const IMG2 = `${PUB}/lesson-images/lessons/2026/10/c.webp`;
  const VID = `${PUB}/lesson-videos/lessons/2026/10/b.mp4`;
  const removals = () => supabase.storageCalls.filter((c) => c.op === 'remove');

  /** Handler edu_lessons: select ber-ilike = cek rujukan (kosong), select lain = data bab. */
  const lessonsDb = (existing: unknown) => (q: RecordedQuery) =>
    q.op === 'select' ? (q.filters.some((f) => f.type === 'ilike') ? { data: [] } : { data: existing }) : {};

  it('updateLesson menghapus media yang dibuang dari naskah dan menyisakan yang masih dipakai', async () => {
    const existing = { id: 'l1', title: 'T', minutes: 3, youtube_urls: [], content: `![a](${IMG})\n\n${VID}` };
    supabase.onTable('edu_lessons', lessonsDb(existing));

    const r = await AdminMateriService.updateLesson('l1', { content: `${VID}\n\nteks` });

    expect(r.success).toBe(true);
    expect(removals()).toEqual([expect.objectContaining({ bucket: 'lesson-images', paths: ['lessons/2026/10/a.webp'] })]);
  });

  it('updateLesson juga menghapus unggahan sesi ini yang dibuang sebelum disimpan', async () => {
    const existing = { id: 'l1', title: 'T', minutes: 3, youtube_urls: [], content: 'lama' };
    supabase.onTable('edu_lessons', lessonsDb(existing));
    await AdminMateriService.updateLesson('l1', { content: 'baru' }, { uploadedUrls: [IMG2] });
    expect(removals()).toEqual([expect.objectContaining({ paths: ['lessons/2026/10/c.webp'] })]);
  });

  it('updateLesson gagal → tidak ada yang dihapus dari storage', async () => {
    const existing = { id: 'l1', title: 'T', minutes: 3, youtube_urls: [], content: `![a](${IMG})` };
    supabase.onTable('edu_lessons', (q) => (q.op === 'delete' ? { error: { message: 'x' } } : lessonsDb(existing)(q)));
    expect((await AdminMateriService.updateLesson('l1', { content: '' })).success).toBe(false);
    expect(removals()).toHaveLength(0);
  });

  it('createLesson menghapus unggahan sesi yang tidak ada di naskah akhir', async () => {
    supabase.onTable('edu_lessons', lessonsDb({ sort_order: 1 }));
    await AdminMateriService.createLesson('m1', { title: 'B', minutes: 5, youtubeUrls: [], content: `![a](${IMG})` }, { uploadedUrls: [IMG, IMG2] });
    expect(removals()).toEqual([expect.objectContaining({ paths: ['lessons/2026/10/c.webp'] })]);
  });

  it('deleteLesson menghapus semua media bab itu dari storage', async () => {
    supabase.onTable('edu_lessons', lessonsDb({ content: `![a](${IMG})\n${VID}` }));
    expect(await AdminMateriService.deleteLesson('l1')).toEqual({ success: true });
    expect(removals().map((c) => [c.bucket, c.paths])).toEqual([
      ['lesson-images', ['lessons/2026/10/a.webp']],
      ['lesson-videos', ['lessons/2026/10/b.mp4']],
    ]);
  });

  it('deleteLesson gagal → media tidak dihapus', async () => {
    supabase.onTable('edu_lessons', (q) => (q.op === 'delete' ? { error: { message: 'x' } } : lessonsDb({ content: IMG })(q)));
    expect((await AdminMateriService.deleteLesson('l1')).success).toBe(false);
    expect(removals()).toHaveLength(0);
  });

  it('deleteModule menghapus media seluruh bab di modul itu', async () => {
    supabase.onTable('edu_lessons', lessonsDb([{ content: `![a](${IMG})` }, { content: VID }]));
    expect((await AdminMateriService.deleteModule('m1')).success).toBe(true);
    expect(removals()).toHaveLength(2);
  });

  it('kegagalan pembersihan storage tidak menggagalkan simpan', async () => {
    const existing = { id: 'l1', title: 'T', minutes: 3, youtube_urls: [], content: `![a](${IMG})` };
    supabase.onTable('edu_lessons', lessonsDb(existing));
    supabase.failStorage('storage down');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await AdminMateriService.updateLesson('l1', { content: '' })).success).toBe(true);
  });
});
