import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeSupabase } from '../test/fakeSupabase';

vi.mock('./supabase', async () => {
  const { createFakeSupabase } = await import('../test/fakeSupabase');
  return { supabase: createFakeSupabase() };
});

import { supabase as client } from './supabase';
import {
  IMAGE_MAX_BYTES,
  VIDEO_MAX_BYTES,
  detectVideoType,
  validateVideoFile,
  MediaCleanup,
  extractContentUrls,
  MediaUploadService,
  SupabaseMediaStorage,
  createMediaStorage,
  detectImageType,
  validateImageFile,
} from './mediaStorage';

const supabase = client as unknown as FakeSupabase;

const bytes = (...b: number[]) => new Blob([new Uint8Array(b)]);
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

const PNG = bytes(0x89, ...ascii('PNG'), 0x0d, 0x0a, 0x1a, 0x0a);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0);
const GIF = bytes(...ascii('GIF89a'), 0, 0);
const WEBP = bytes(...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBP'));
const AVIF = bytes(0, 0, 0, 0x1c, ...ascii('ftypavif'));

beforeEach(() => {
  supabase.reset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('detectImageType', () => {
  it('mengenali PNG, JPEG, GIF, WebP, dan AVIF dari magic bytes', async () => {
    expect(await detectImageType(PNG)).toBe('image/png');
    expect(await detectImageType(JPEG)).toBe('image/jpeg');
    expect(await detectImageType(GIF)).toBe('image/gif');
    expect(await detectImageType(WEBP)).toBe('image/webp');
    expect(await detectImageType(AVIF)).toBe('image/avif');
  });

  it('menolak SVG, HTML, dan berkas pendek', async () => {
    expect(await detectImageType(new Blob(['<svg xmlns="http://www.w3.org/2000/svg"/>']))).toBeNull();
    expect(await detectImageType(new Blob(['<html><script>alert(1)</script>']))).toBeNull();
    expect(await detectImageType(bytes(0x89))).toBeNull();
  });
});

describe('validateImageFile', () => {
  const f = (name: string, type: string, size = 1000) => ({ name, type, size });

  it('menerima gambar valid', () => {
    expect(validateImageFile(f('a.png', 'image/png'))).toBeNull();
    expect(validateImageFile(f('a.avif', ''))).toBeNull();
  });

  it('menolak SVG, ekstensi palsu, dan MIME tidak cocok', () => {
    expect(validateImageFile(f('a.svg', 'image/svg+xml'))).toMatch(/tidak didukung/);
    expect(validateImageFile(f('a.exe', 'image/png'))).toMatch(/tidak didukung/);
    expect(validateImageFile(f('a.png', 'text/html'))).toMatch(/tidak didukung/);
  });

  it('membatasi ukuran berkas mentah dan GIF', () => {
    expect(validateImageFile(f('a.jpg', 'image/jpeg', 21 * 1024 * 1024))).toMatch(/terlalu besar/);
    expect(validateImageFile(f('a.jpg', 'image/jpeg', 10 * 1024 * 1024))).toBeNull();
    expect(validateImageFile(f('a.gif', 'image/gif', IMAGE_MAX_BYTES + 1))).toMatch(/GIF terlalu besar/);
  });
});

describe('createMediaStorage', () => {
  it('default memakai driver supabase', () => {
    expect(createMediaStorage('image', {})).toBeInstanceOf(SupabaseMediaStorage);
    expect(createMediaStorage('image', { VITE_STORAGE_DRIVER: ' Supabase ' })).toBeInstanceOf(SupabaseMediaStorage);
  });

  it('driver r2 belum dikonfigurasi dan driver asing ditolak', () => {
    expect(() => createMediaStorage('image', { VITE_STORAGE_DRIVER: 'r2' })).toThrow(/R2/);
    expect(() => createMediaStorage('image', { VITE_STORAGE_DRIVER: 's4' })).toThrow(/tidak dikenal/);
  });
});

describe('SupabaseMediaStorage', () => {
  it('mengunggah ke bucket dan mengembalikan URL publik', async () => {
    const { url } = await new SupabaseMediaStorage('lesson-images').upload('lessons/a.png', PNG, 'image/png');
    expect(url).toBe('https://fake.supabase.co/storage/v1/object/public/lesson-images/lessons/a.png');
    expect(supabase.storageCalls[0]).toMatchObject({
      bucket: 'lesson-images',
      op: 'upload',
      path: 'lessons/a.png',
      options: { contentType: 'image/png', upsert: false },
    });
  });

  it('melempar error dari storage', async () => {
    supabase.failStorage('Payload too large');
    await expect(new SupabaseMediaStorage('b').upload('p.png', PNG, 'image/png')).rejects.toMatchObject({ message: 'Payload too large' });
    await expect(new SupabaseMediaStorage('b').remove(['p.png'])).rejects.toMatchObject({ message: 'Payload too large' });
  });

  it('remove melewati panggilan kosong dan menghapus path yang diberikan', async () => {
    const s = new SupabaseMediaStorage('b');
    await s.remove([]);
    expect(supabase.storageCalls).toHaveLength(0);
    await s.remove(['x.png']);
    expect(supabase.storageCalls[0]).toMatchObject({ op: 'remove', paths: ['x.png'] });
  });
});

describe('MediaUploadService.uploadLessonImage', () => {
  const driver = () => ({
    upload: vi.fn(async (path: string) => ({ url: `https://cdn.test/${path}` })),
    remove: vi.fn(async () => {}),
    pathFromUrl: () => null,
  });

  it('mengunggah dengan nama acak dan ekstensi sesuai isi berkas', async () => {
    const d = driver();
    const res = await MediaUploadService.uploadLessonImage(new Blob([PNG], { type: 'image/jpeg' }), d);
    expect(res.success).toBe(true);
    expect(res.url).toMatch(/^https:\/\/cdn\.test\/lessons\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.png$/);
    expect(d.upload).toHaveBeenCalledWith(expect.stringMatching(/\.png$/), expect.any(Blob), 'image/png');
  });

  it('nama objek berbeda untuk setiap unggahan', async () => {
    const d = driver();
    const a = await MediaUploadService.uploadLessonImage(WEBP, d);
    const b = await MediaUploadService.uploadLessonImage(WEBP, d);
    expect(a.url).not.toBe(b.url);
  });

  it('menolak berkas kosong, terlalu besar, dan bukan gambar tanpa menyentuh storage', async () => {
    const d = driver();
    expect((await MediaUploadService.uploadLessonImage(new Blob([]), d)).error).toMatch(/kosong/);
    const big = new Blob([new Uint8Array(IMAGE_MAX_BYTES + 1)]);
    expect((await MediaUploadService.uploadLessonImage(big, d)).error).toMatch(/melebihi/);
    expect((await MediaUploadService.uploadLessonImage(new Blob(['<svg/>']), d)).error).toMatch(/bukan gambar/);
    expect(d.upload).not.toHaveBeenCalled();
  });

  it('melaporkan kegagalan driver sebagai error', async () => {
    const d = { upload: vi.fn(async () => { throw new Error('boom'); }), remove: vi.fn(), pathFromUrl: () => null };
    expect(await MediaUploadService.uploadLessonImage(PNG, d)).toEqual({ success: false, error: 'boom' });
  });

  it('memakai driver dari konfigurasi bila tidak diberikan', async () => {
    const res = await MediaUploadService.uploadLessonImage(JPEG);
    expect(res.success).toBe(true);
    expect(res.url).toContain('/storage/v1/object/public/lesson-images/lessons/');
  });
});

const MP4 = bytes(0, 0, 0, 0x20, ...ascii('ftypisom'), 0, 0, 2, 0);
const WEBM = bytes(0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0);
const HEIC = bytes(0, 0, 0, 0x18, ...ascii('ftypheic'), 0, 0, 0, 0);

describe('video', () => {
  it('detectVideoType mengenali MP4 dan WebM, menolak HEIC/AVIF/gambar/HTML', async () => {
    expect(await detectVideoType(MP4)).toBe('video/mp4');
    expect(await detectVideoType(WEBM)).toBe('video/webm');
    expect(await detectVideoType(HEIC)).toBeNull();
    expect(await detectVideoType(AVIF)).toBeNull();
    expect(await detectVideoType(PNG)).toBeNull();
    expect(await detectVideoType(new Blob(['<html>']))).toBeNull();
  });

  it('video tidak dianggap gambar dan sebaliknya', async () => {
    expect(await detectImageType(MP4)).toBeNull();
    expect(await detectImageType(WEBM)).toBeNull();
  });

  it('validateVideoFile: format dan ukuran', () => {
    const f = (name: string, type: string, size = 1000) => ({ name, type, size });
    expect(validateVideoFile(f('a.mp4', 'video/mp4'))).toBeNull();
    expect(validateVideoFile(f('a.webm', ''))).toBeNull();
    expect(validateVideoFile(f('a.mov', 'video/quicktime'))).toMatch(/tidak didukung/);
    expect(validateVideoFile(f('a.mp4', 'text/html'))).toMatch(/tidak didukung/);
    expect(validateVideoFile(f('a.mp4', 'video/mp4', VIDEO_MAX_BYTES + 1))).toMatch(/terlalu besar/);
  });

  it('createMediaStorage memakai bucket video yang dapat dikonfigurasi', async () => {
    expect(createMediaStorage('video', {})).toBeInstanceOf(SupabaseMediaStorage);
    await MediaUploadService.uploadLessonVideo(MP4);
    expect(supabase.storageCalls[0]).toMatchObject({ bucket: 'lesson-videos', op: 'upload' });
    supabase.reset();
    const custom = createMediaStorage('video', { VITE_STORAGE_VIDEO_BUCKET: 'vids' });
    await custom.upload('p.mp4', MP4, 'video/mp4');
    expect(supabase.storageCalls[0]).toMatchObject({ bucket: 'vids' });
  });

  it('uploadLessonVideo: nama acak berekstensi sesuai isi dan content-type dari magic bytes', async () => {
    const d = { upload: vi.fn(async (path: string) => ({ url: `https://cdn.test/${path}` })), remove: vi.fn(), pathFromUrl: () => null };
    const res = await MediaUploadService.uploadLessonVideo(new Blob([WEBM], { type: 'video/mp4' }), d);
    expect(res.url).toMatch(/^https:\/\/cdn\.test\/lessons\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.webm$/);
    expect(d.upload).toHaveBeenCalledWith(expect.any(String), expect.any(Blob), 'video/webm');
  });

  it('uploadLessonVideo menolak kosong, kebesaran, dan bukan video', async () => {
    const d = { upload: vi.fn(), remove: vi.fn(), pathFromUrl: () => null };
    expect((await MediaUploadService.uploadLessonVideo(new Blob([]), d)).error).toMatch(/kosong/);
    const big = new Blob([new Uint8Array(VIDEO_MAX_BYTES + 1)]);
    expect((await MediaUploadService.uploadLessonVideo(big, d)).error).toMatch(/melebihi 50 MB/);
    expect((await MediaUploadService.uploadLessonVideo(PNG, d)).error).toMatch(/bukan video/);
    expect(d.upload).not.toHaveBeenCalled();
  });
});

const PUB = 'https://x.supabase.co/storage/v1/object/public';
const IMG = `${PUB}/lesson-images/lessons/2026/10/a.webp`;
const VID = `${PUB}/lesson-videos/lessons/2026/10/b.mp4`;

describe('extractContentUrls', () => {
  it('mengambil URL dari markdown, token VIDEO, dan URL polos tanpa duplikat', () => {
    const content = `![cap](${IMG})\n\n[VIDEO: v | url="${VID}" | id="video_1"]\n\nhttps://youtu.be/dQw4w9WgXcQ\n${IMG}`;
    expect(extractContentUrls(content)).toEqual([IMG, VID, 'https://youtu.be/dQw4w9WgXcQ']);
    expect(extractContentUrls('')).toEqual([]);
  });
});

describe('SupabaseMediaStorage.pathFromUrl', () => {
  it('hanya mengenali URL dari bucket sendiri', () => {
    const s = new SupabaseMediaStorage('lesson-images');
    expect(s.pathFromUrl(IMG)).toBe('lessons/2026/10/a.webp');
    expect(s.pathFromUrl(`${IMG}?t=1`)).toBe('lessons/2026/10/a.webp');
    expect(s.pathFromUrl(VID)).toBeNull();
    expect(s.pathFromUrl('https://youtu.be/dQw4w9WgXcQ')).toBeNull();
    expect(s.pathFromUrl(`${PUB}/lesson-images/`)).toBeNull();
  });
});

describe('MediaCleanup.removeUnreferenced', () => {
  const drivers = () => ({
    image: Object.assign(new SupabaseMediaStorage('lesson-images'), { remove: vi.fn(async () => {}) }),
    video: Object.assign(new SupabaseMediaStorage('lesson-videos'), { remove: vi.fn(async () => {}) }),
  });

  it('menghapus berkas yang tidak dirujuk bab mana pun, per bucket', async () => {
    const d = drivers();
    supabase.onTable('edu_lessons', () => ({ data: [] }));
    const n = await MediaCleanup.removeUnreferenced([IMG, VID, 'https://youtu.be/dQw4w9WgXcQ'], d);
    expect(n).toBe(2);
    expect(d.image.remove).toHaveBeenCalledWith(['lessons/2026/10/a.webp']);
    expect(d.video.remove).toHaveBeenCalledWith(['lessons/2026/10/b.mp4']);
    const filters = supabase.queriesFor('edu_lessons', 'select').map((q) => q.filters[0]);
    expect(filters).toEqual([
      { type: 'ilike', column: 'content', value: '%lessons/2026/10/a.webp%' },
      { type: 'ilike', column: 'content', value: '%lessons/2026/10/b.mp4%' },
    ]);
  });

  it('tidak menghapus berkas yang masih dipakai bab lain', async () => {
    const d = drivers();
    supabase.onTable('edu_lessons', () => ({ data: [{ id: 'l2' }] }));
    expect(await MediaCleanup.removeUnreferenced([IMG, VID], d)).toBe(0);
    expect(d.image.remove).not.toHaveBeenCalled();
    expect(d.video.remove).not.toHaveBeenCalled();
  });

  it('gagal memeriksa rujukan = tidak menghapus', async () => {
    const d = drivers();
    supabase.onTable('edu_lessons', () => ({ error: { message: 'boom' } }));
    expect(await MediaCleanup.removeUnreferenced([IMG], d)).toBe(0);
    expect(d.image.remove).not.toHaveBeenCalled();
  });

  it('kegagalan storage tidak dilempar', async () => {
    const d = drivers();
    d.image.remove.mockRejectedValue(new Error('storage down'));
    supabase.onTable('edu_lessons', () => ({ data: [] }));
    await expect(MediaCleanup.removeUnreferenced([IMG], d)).resolves.toBe(0);
  });

  it('tanpa URL media tidak menyentuh database', async () => {
    const d = drivers();
    expect(await MediaCleanup.removeUnreferenced(['https://youtu.be/dQw4w9WgXcQ'], d)).toBe(0);
    expect(supabase.queries).toHaveLength(0);
  });
});
