import { describe, expect, it } from 'vitest';
import type { EduLesson, EduModule } from '../types/admin';
import { searchEduLessons } from './materiSearch';

const lesson = (over: Partial<EduLesson>): EduLesson => ({
  id: 'l',
  module_id: 'm1',
  title: 'Judul',
  minutes: 5,
  youtube_urls: [],
  content: '',
  sort_order: 0,
  ...over,
});

const modules: EduModule[] = [
  {
    id: 'm1',
    title: 'Dasar Forex',
    subtitle: '',
    level: 'Pemula',
    icon: 'school-outline',
    sort_order: 1,
    lessons: [
      lesson({ id: 'l1', title: 'Mengenal Pip' }),
      lesson({ id: 'l2', title: 'Order', content: '## Support dan Resistance\nPenjelasan level harga.' }),
      lesson({ id: 'l3', title: 'Psikologi', content: 'Disiplin adalah kunci utama dalam trading jangka panjang.', youtube_urls: ['u'] }),
    ],
  },
  { id: 'm2', title: 'Analisis Teknikal', subtitle: '', level: 'Menengah', icon: 'x', sort_order: 2, lessons: [lesson({ id: 'l4', title: 'Candle' })] },
];

describe('searchEduLessons', () => {
  it('query kosong tidak mengembalikan hasil', () => {
    expect(searchEduLessons(modules, '')).toEqual([]);
    expect(searchEduLessons(modules, '   ')).toEqual([]);
  });

  it('mencocokkan judul bab tanpa peka huruf besar', () => {
    const r = searchEduLessons(modules, 'MENGENAL');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ lessonId: 'l1', matchType: 'title', moduleIndex: 1, lessonIndex: 1 });
  });

  it('mencocokkan judul subbab markdown', () => {
    const r = searchEduLessons(modules, 'resistance');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ lessonId: 'l2', matchType: 'subbab', matchedSubbab: 'Support dan Resistance' });
  });

  it('mencocokkan isi konten dengan cuplikan dan penanda hasVideo', () => {
    const r = searchEduLessons(modules, 'disiplin');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ lessonId: 'l3', matchType: 'content', hasVideo: true });
    expect(r[0].snippet).toContain('Disiplin');
  });

  it('cuplikan memotong teks panjang dengan elipsis', () => {
    const long = `${'a'.repeat(60)} kata-kunci ${'b'.repeat(80)}`;
    const r = searchEduLessons([{ ...modules[0], lessons: [lesson({ id: 'x', content: long })] }], 'kata-kunci');
    expect(r[0].snippet!.startsWith('...')).toBe(true);
    expect(r[0].snippet!.endsWith('...')).toBe(true);
  });

  it('mencocokkan judul modul ke setiap babnya', () => {
    const r = searchEduLessons(modules, 'teknikal');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ lessonId: 'l4', matchType: 'module', moduleId: 'm2' });
  });

  it('modul tanpa bab tidak menghasilkan apa pun', () => {
    expect(searchEduLessons([{ ...modules[0], lessons: undefined }], 'dasar')).toEqual([]);
  });
});
