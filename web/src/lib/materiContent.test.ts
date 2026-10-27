import { assert, describe, it } from 'vitest';
import { expandMediaContent } from './materiContent';
import type { EmbeddedMediaItem } from './materiContent';

// expandMediaContent dipakai untuk membuka draf lama yang masih menyimpan token [FOTO: …] / [VIDEO: …]
describe('expandMediaContent (draf lama)', () => {
  const media: EmbeddedMediaItem[] = [
    { id: 'foto_1', type: 'image', src: 'https://cdn.test/a.webp', caption: 'Candlestick', name: 'Candlestick' },
    { id: 'foto_2', type: 'image', src: 'https://cdn.test/b.webp', name: 'Foto #2' },
    { id: 'video_1', type: 'video', src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', name: 'Video YouTube' },
  ];

  it('mengembalikan token foto menjadi markdown gambar dengan sumber asli', () => {
    const out = expandMediaContent('Intro\n\n[FOTO: Candlestick | id="foto_1"]\n\n[FOTO: Foto #2 | id="foto_2"]', media);
    assert.ok(out.includes('![Candlestick](https://cdn.test/a.webp)'));
    assert.ok(out.includes('![Foto #2](https://cdn.test/b.webp)'), 'tanpa caption memakai label token');
  });

  it('mengembalikan token video menjadi URL polos di barisnya sendiri', () => {
    const out = expandMediaContent('A\n[VIDEO: Video YouTube | url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" | id="video_1"]\nB', media);
    assert.strictEqual(out, 'A\n\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ\n\nB');
  });

  it('token video tanpa url diambil dari daftar media berdasarkan id, atau dari label YouTube', () => {
    assert.ok(expandMediaContent('[VIDEO: x | id="video_1"]', media).includes('dQw4w9WgXcQ'));
    assert.ok(expandMediaContent('[VIDEO: https://youtu.be/abcdefghijk]', []).includes('abcdefghijk'));
    assert.strictEqual(expandMediaContent('[VIDEO: tanpa sumber]', []), '');
  });

  it('token foto yang medianya tidak ada dibiarkan; naskah kosong tetap kosong', () => {
    assert.strictEqual(expandMediaContent('[FOTO: x | id="hilang"]', media), '[FOTO: x | id="hilang"]');
    assert.strictEqual(expandMediaContent('', media), '');
  });
});
