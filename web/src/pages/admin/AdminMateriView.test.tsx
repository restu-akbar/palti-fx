import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { FakeSupabase } from '../../test/fakeSupabase';

vi.mock('../../lib/supabase', async () => {
  const { createFakeSupabase } = await import('../../test/fakeSupabase');
  return { supabase: createFakeSupabase() };
});

// Canvas tidak tersedia di jsdom: kompresi diganti Blob PNG valid (magic bytes)
vi.mock('../../lib/materiContent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/materiContent')>();
  return {
    ...actual,
    compressImageToBlob: vi.fn(async () => new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])])),
  };
});

import { supabase as client } from '../../lib/supabase';
import { AdminMateriView } from './AdminMateriView';

const supabase = client as unknown as FakeSupabase;

const LESSON = {
  id: 'l1', module_id: 'm1', title: 'Bab Lama', minutes: 4, sort_order: 1,
  youtube_urls: ['https://youtu.be/abcdefghijk'],
  content: '## Pengantar\n\nIsi dengan **tebal**.',
};

afterEach(cleanup);

/** edu_lessons: daftar (array), baris tunggal (maybeSingle), dan cek rujukan media (ilike → kosong). */
const lessonsDb = (row: object) => (q: { op: string; maybeSingle: boolean; filters: { type: string }[] }) => {
  if (q.op !== 'select') return {};
  if (q.filters.some((f) => f.type === 'ilike')) return { data: [] };
  return q.maybeSingle ? { data: row } : { data: [row] };
};

beforeEach(() => {
  supabase.reset();
  window.localStorage.clear();
  // jsdom tidak mengimplementasikan ini; dipakai ProseMirror saat menjatuhkan berkas
  document.elementFromPoint = () => null;
  supabase.onTable('edu_modules', () => ({
    data: [{ id: 'm1', title: 'Modul A', subtitle: 's', level: 'Pemula', icon: 'school-outline', sort_order: 1 }],
  }));
  supabase.onTable('edu_lessons', lessonsDb(LESSON));
});

const editorEl = () => document.querySelector('.pfx-doc') as HTMLElement;

async function openNewLesson() {
  render(<AdminMateriView />);
  fireEvent.click((await screen.findAllByText(/Tambah Bab/))[0]);
  return (await screen.findByLabelText('Judul bab')) as HTMLInputElement;
}

async function openExistingLesson() {
  render(<AdminMateriView />);
  fireEvent.click(await screen.findByTitle("Edit Bab"));
  return (await screen.findByLabelText('Judul bab')) as HTMLInputElement;
}

describe('editor bab (halaman penuh)', () => {
  it('menggantikan daftar silabus, dan Kembali tanpa perubahan langsung menutup', async () => {
    await openNewLesson();
    expect(screen.queryByText('Silabus Pembelajaran Forex')).toBeNull();
    expect(screen.getByRole('toolbar')).toBeTruthy();
    expect(screen.getByText(/Modul A/)).toBeTruthy();

    fireEvent.click(screen.getByText('Kembali'));
    expect(await screen.findByText('Silabus Pembelajaran Forex')).toBeTruthy();
  });

  it('Kembali dengan perubahan meminta konfirmasi; Lanjut Mengedit mempertahankan isi', async () => {
    const title = await openNewLesson();
    fireEvent.change(title, { target: { value: 'Bab Baru' } });
    expect(screen.getByRole('status').textContent).toMatch(/Belum disimpan/);

    fireEvent.click(screen.getByText('Kembali'));
    expect(screen.getByText('Tutup tanpa menyimpan?')).toBeTruthy();
    fireEvent.click(screen.getByText('Lanjut Mengedit'));

    expect(screen.queryByText('Tutup tanpa menyimpan?')).toBeNull();
    expect((screen.getByLabelText('Judul bab') as HTMLInputElement).value).toBe('Bab Baru');
  });

  it('Tutup, Simpan Draft menyimpan draf yang bisa dipulihkan saat dibuka lagi', async () => {
    const title = await openNewLesson();
    fireEvent.change(title, { target: { value: 'Bab Baru' } });
    fireEvent.click(screen.getByText('Kembali'));
    fireEvent.click(screen.getByText('Tutup, Simpan Draft'));

    await screen.findByText('Silabus Pembelajaran Forex');
    expect(JSON.parse(window.localStorage.getItem('pfx-lesson-draft:m1:new') || '{}').title).toBe('Bab Baru');

    fireEvent.click((await screen.findAllByText(/Tambah Bab/))[0]);
    expect(await screen.findByText(/Ada draf yang belum disimpan/)).toBeTruthy();
    fireEvent.click(screen.getByText('Pulihkan Draft'));
    await waitFor(() => expect((screen.getByLabelText('Judul bab') as HTMLInputElement).value).toBe('Bab Baru'));
    expect(screen.queryByText(/Ada draf yang belum disimpan/)).toBeNull();
  });

  it('Ctrl+S menyimpan bab baru; judul kosong ditolak', async () => {
    const title = await openNewLesson();
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    expect(await screen.findByText('Judul bab wajib diisi.')).toBeTruthy();
    expect(supabase.queriesFor('edu_lessons', 'insert')).toHaveLength(0);

    fireEvent.change(title, { target: { value: 'Bab Baru' } });
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    await waitFor(() => expect(supabase.queriesFor('edu_lessons', 'insert')).toHaveLength(1));
    expect(supabase.queriesFor('edu_lessons', 'insert')[0].payload).toMatchObject({ module_id: 'm1', title: 'Bab Baru', content: '' });
    expect(await screen.findByText('Silabus Pembelajaran Forex')).toBeTruthy();
  });

  it('membuka bab lama: isi tampil di editor, video youtube_urls disematkan, dan belum dianggap berubah', async () => {
    await openExistingLesson();
    expect((screen.getByLabelText('Judul bab') as HTMLInputElement).value).toBe('Bab Lama');
    expect(editorEl().querySelector('h2')?.textContent).toBe('Pengantar');
    expect(editorEl().querySelector('strong')?.textContent).toBe('tebal');
    expect(editorEl().querySelector('iframe')?.getAttribute('src')).toContain('abcdefghijk');
    expect(screen.getByRole('status').textContent).toMatch(/Semua perubahan tersimpan/);
  });

  it('menyimpan bab lama mempertahankan isi dan video legacy', async () => {
    const title = await openExistingLesson();
    fireEvent.change(title, { target: { value: 'Bab Diubah' } });
    fireEvent.click(screen.getByTitle(/Simpan \(Ctrl\+S\)/));

    await waitFor(() => expect(supabase.queriesFor('edu_lessons', 'insert')).toHaveLength(1));
    expect(supabase.queriesFor('edu_lessons', 'insert')[0].payload).toMatchObject({
      title: 'Bab Diubah',
      youtube_urls: ['https://youtu.be/abcdefghijk'],
      content: 'https://youtu.be/abcdefghijk\n\n## Pengantar\n\nIsi dengan **tebal**.',
    });
  });

  it('menempel gambar mengunggah ke storage dan menyisipkan foto di dokumen', async () => {
    await openNewLesson();
    const file = new File(['x'], 'pinbar.png', { type: 'image/png' });
    fireEvent.paste(editorEl(), { clipboardData: { files: [file], getData: () => '' } });

    await waitFor(() => expect(editorEl().querySelector('img')).not.toBeNull());
    const upload = supabase.storageCalls.find((c) => c.op === 'upload');
    expect(upload).toMatchObject({ bucket: 'lesson-images', options: { contentType: 'image/png' } });
    expect(upload?.path).toMatch(/^lessons\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.png$/);
    expect(await screen.findByText('1 foto')).toBeTruthy();
  });

  it('berkas bukan gambar/video dari dialog Foto ditolak tanpa mengunggah', async () => {
    await openNewLesson();
    fireEvent.click(screen.getByText('Foto', { selector: 'button' }));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'catatan.pdf', { type: 'application/pdf' })] } });
    expect(await screen.findByText(/catatan\.pdf: Format berkas tidak didukung/)).toBeTruthy();
    expect(supabase.storageCalls).toHaveLength(0);
  });

  it('unggah foto dari dialog menyisipkan foto di dokumen', async () => {
    await openNewLesson();
    fireEvent.click(screen.getByText('Foto', { selector: 'button' }));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
    await waitFor(() => expect(editorEl().querySelector('img')).not.toBeNull());
    expect(supabase.storageCalls.filter((c) => c.op === 'upload')).toHaveLength(1);
  });

  it('dialog Video menolak tautan yang bukan YouTube/MP4 dan menerima YouTube', async () => {
    await openNewLesson();
    fireEvent.click(screen.getByText('Video', { selector: 'button' }));
    fireEvent.click(screen.getByText('YouTube / tautan'));
    const input = screen.getByPlaceholderText(/youtu\.be/);
    fireEvent.change(input, { target: { value: 'https://contoh.com/halaman' } });
    fireEvent.click(screen.getByText('Sisipkan'));
    expect(await screen.findByText(/harus berupa video YouTube/)).toBeTruthy();

    fireEvent.change(input, { target: { value: 'https://youtu.be/dQw4w9WgXcQ' } });
    fireEvent.click(screen.getByText('Sisipkan'));
    await waitFor(() => expect(editorEl().querySelector('iframe')?.getAttribute('src')).toContain('dQw4w9WgXcQ'));
    expect(screen.getByText('1 video')).toBeTruthy();
  });

  it('menyimpan setelah foto dihapus dari dokumen membersihkan file-nya dari storage', async () => {
    const IMG = 'https://x.supabase.co/storage/v1/object/public/lesson-images/lessons/2026/10/a.webp';
    supabase.onTable('edu_lessons', lessonsDb({ ...LESSON, youtube_urls: [], content: `Teks\n\n![cap](${IMG})` }));
    await openExistingLesson();
    fireEvent.click(await screen.findByText('Hapus', { selector: 'button' }));
    expect(editorEl().querySelector('img')).toBeNull();

    fireEvent.click(screen.getByTitle(/Simpan \(Ctrl\+S\)/));
    await waitFor(() => expect(supabase.storageCalls.some((c) => c.op === 'remove')).toBe(true));
    expect(supabase.storageCalls.find((c) => c.op === 'remove')).toMatchObject({ bucket: 'lesson-images', paths: ['lessons/2026/10/a.webp'] });
  });
});

describe('urutan bab dengan seret-lepas', () => {
  const L1 = { ...LESSON, id: 'l1', title: 'Bab Satu', sort_order: 1 };
  const L2 = { ...LESSON, id: 'l2', title: 'Bab Dua', sort_order: 2 };
  const L3 = { ...LESSON, id: 'l3', title: 'Bab Tiga', sort_order: 3 };
  const dt = () => ({ dataTransfer: { effectAllowed: '', dropEffect: '', setData: () => {} } });
  const row = (title: string) => screen.getByText(title).closest('[draggable="true"]') as HTMLElement;

  beforeEach(() => {
    supabase.onTable('edu_lessons', (q) => {
      if (q.op !== 'select') return {};
      return { data: [L1, L2, L3] };
    });
  });

  it('menyeret bab pertama ke posisi terakhir menyimpan urutan baru', async () => {
    render(<AdminMateriView />);
    await screen.findByText('Bab Satu');

    fireEvent.dragStart(row('Bab Satu'), dt());
    fireEvent.dragOver(row('Bab Tiga'), dt());
    fireEvent.drop(row('Bab Tiga'), dt());

    await waitFor(() => expect(supabase.queriesFor('edu_lessons', 'insert')).toHaveLength(1));
    const saved = supabase.queriesFor('edu_lessons', 'insert')[0].payload as { id: string; sort_order: number }[];
    expect(saved.map((l) => [l.id, l.sort_order]).sort()).toEqual([['l1', 3], ['l2', 1], ['l3', 2]]);
  });

  it('melepas di baris yang sama tidak menyimpan apa pun', async () => {
    render(<AdminMateriView />);
    await screen.findByText('Bab Dua');
    fireEvent.dragStart(row('Bab Dua'), dt());
    fireEvent.drop(row('Bab Dua'), dt());
    expect(supabase.queriesFor('edu_lessons', 'insert')).toHaveLength(0);
  });

  it('tombol panah tetap bisa dipakai sebagai alternatif', async () => {
    render(<AdminMateriView />);
    await screen.findByText('Bab Dua');
    fireEvent.click(within(row('Bab Dua')).getByTitle('Geser Naik'));
    await waitFor(() => expect(supabase.queriesFor('edu_lessons', 'insert')).toHaveLength(1));
    const saved = supabase.queriesFor('edu_lessons', 'insert')[0].payload as { id: string; sort_order: number }[];
    expect(saved.find((l) => l.id === 'l2')?.sort_order).toBe(1);
  });
});

