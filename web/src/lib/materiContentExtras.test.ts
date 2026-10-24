import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearLessonDraft,
  estimateReadingMinutes,
  getLessonDraftKey,
  type LessonDraft,
  readLessonDraft,
  writeLessonDraft,
} from './materiContent';

describe('estimateReadingMinutes', () => {
  const words = (n: number) => Array.from({ length: n }, () => 'kata').join(' ');

  it('minimal 1 menit untuk konten kosong', () => {
    expect(estimateReadingMinutes('')).toBe(1);
    expect(estimateReadingMinutes(undefined as unknown as string)).toBe(1);
  });
  it('membulatkan ke atas per 200 kata', () => {
    expect(estimateReadingMinutes(words(200))).toBe(1);
    expect(estimateReadingMinutes(words(201))).toBe(2);
    expect(estimateReadingMinutes(words(600))).toBe(3);
  });
  it('mengabaikan token media, gambar markdown, tautan, dan simbol format', () => {
    const media = '[FOTO: x | id="foto_1"] ![c](data:image/png;base64,AAA) https://youtu.be/dQw4w9WgXcQ ## > * `';
    expect(estimateReadingMinutes(words(200) + ' ' + media)).toBe(1);
  });
});

describe('draft bab', () => {
  const draft: LessonDraft = { title: 'T', minutes: 5, content: 'c', media: [], savedAt: 1 };

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('kunci draft membedakan bab baru dan bab yang diedit', () => {
    expect(getLessonDraftKey('m1')).toBe('pfx-lesson-draft:m1:new');
    expect(getLessonDraftKey('m1', null)).toBe('pfx-lesson-draft:m1:new');
    expect(getLessonDraftKey('m1', 'l9')).toBe('pfx-lesson-draft:m1:l9');
  });

  it('tulis, baca, hapus', () => {
    const key = getLessonDraftKey('m1');
    expect(readLessonDraft(key)).toBeNull();
    expect(writeLessonDraft(key, draft)).toBe(true);
    expect(readLessonDraft(key)).toEqual(draft);
    clearLessonDraft(key);
    expect(readLessonDraft(key)).toBeNull();
  });

  it('JSON rusak dibaca sebagai tidak ada draft', () => {
    window.localStorage.setItem('k', '{rusak');
    expect(readLessonDraft('k')).toBeNull();
  });

  it('kuota penuh mengembalikan false tanpa melempar error', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    expect(writeLessonDraft('k', draft)).toBe(false);
  });
});
