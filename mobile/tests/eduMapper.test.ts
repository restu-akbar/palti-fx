import assert from 'node:assert/strict';
import { it } from 'vitest';
import { mapEduRows } from '../src/lib/eduMapper';

it('eduMapper', () => {
  const r = mapEduRows(
    [
      { id: 'm1', title: 'A', sort_order: 2, updated_at: '2026-01-05', created_at: '2026-01-01' },
      { id: 'm2', title: 'B', subtitle: 's', level: 'Lanjutan', icon: 'x', created_at: '2026-01-09' },
    ],
    [
      { id: 'l1', module_id: 'm1', title: 'L', minutes: '0', youtube_urls: 'bad', content: null, created_at: '2026-02-01' },
      { id: 'l2', module_id: 'm1', title: 'L2', minutes: 7, youtube_urls: ['u'], content: 'c', updated_at: '2026-03-01', created_at: '2026-01-01' },
    ]
  );
  assert.equal(r.modules[0].subtitle, '');
  assert.equal(r.modules[0].level, 'Pemula');
  assert.equal(r.modules[0].icon, 'school-outline');
  assert.equal(r.modules[0].sortOrder, 2);
  assert.equal(r.modules[1].sortOrder, 0);
  assert.equal(r.modules[0].lessons.length, 2);
  assert.equal(r.modules[0].lessons[0].minutes, 5);
  assert.deepEqual(r.modules[0].lessons[0].youtubeUrls, []);
  assert.equal(r.modules[1].lessons.length, 0);
  assert.equal(r.latestLessonUpdate, '2026-03-01');
  assert.equal(r.latestModuleUpdate, '2026-01-09');
  assert.equal(mapEduRows([], null).latestLessonUpdate, null);
});
