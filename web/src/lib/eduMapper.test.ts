import { describe, expect, it } from 'vitest';
import { mapEduRows } from './eduMapper';

describe('mapEduRows (web)', () => {
  it('mengisi nilai bawaan dan mengelompokkan bab per modul', () => {
    const r = mapEduRows(
      [{ id: 'm1', title: 'A' }, { id: 'm2', title: 'B', subtitle: 's', level: 'Lanjutan', icon: 'x', sort_order: 3 }],
      [
        { id: 'l1', module_id: 'm1', title: 'L1', minutes: '0', youtube_urls: 'bukan-array', content: null },
        { id: 'l2', module_id: 'm1', title: 'L2', minutes: 8, youtube_urls: ['u'], content: 'c', sort_order: 2 },
      ]
    );
    expect(r[0]).toMatchObject({ subtitle: '', level: 'Pemula', icon: 'school-outline', sort_order: 0 });
    expect(r[0].lessons).toHaveLength(2);
    expect(r[0].lessons![0]).toMatchObject({ minutes: 5, youtube_urls: [], content: '', sort_order: 0 });
    expect(r[0].lessons![1]).toMatchObject({ minutes: 8, youtube_urls: ['u'], sort_order: 2 });
    expect(r[1]).toMatchObject({ level: 'Lanjutan', icon: 'x', sort_order: 3, lessons: [] });
  });

  it('toleran terhadap data bab kosong', () => {
    expect(mapEduRows([{ id: 'm1', title: 'A' }], null)[0].lessons).toEqual([]);
    expect(mapEduRows([], undefined)).toEqual([]);
  });
});
