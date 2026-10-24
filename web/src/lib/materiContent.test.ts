import { assert, describe, it } from 'vitest';
import { extractYouTubeId } from './adminMateri';
import { collapseMediaContent, expandMediaContent } from './materiContent';

function extractFinalYoutubeUrls(expandedContent: string): string[] {
  const finalYoutubeUrls: string[] = [];
  const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi;
  let ytMatch;
  while ((ytMatch = ytRegex.exec(expandedContent)) !== null) {
    const full = ytMatch[0];
    const norm = full.startsWith('http') ? full : `https://${full}`;
    const id = extractYouTubeId(norm);
    if (id && !finalYoutubeUrls.some((existing) => extractYouTubeId(existing) === id)) {
      finalYoutubeUrls.push(norm);
    }
  }
  return finalYoutubeUrls;
}

describe('siklus hidup media materi', () => {
  it('Mengubah foto dan URL video menjadi token ringkas', () => {
    const raw = `## Pengenalan Tren
  Berikut adalah video materi dasar:
  https://www.youtube.com/watch?v=dQw4w9WgXcQ

  Berikut adalah foto ilustrasi candlestick:
  ![Candlestick Bullish](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==)

  Akhir naskah.`;

    const { cleanContent, mediaList } = collapseMediaContent(raw);

    assert.strictEqual(mediaList.length, 2, 'Harus mendeteksi 1 foto dan 1 video');
    assert.ok(cleanContent.includes('[VIDEO: Video YouTube (dQw4w9WgXcQ) | url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"'), 'Harus membungkus video ke token');
    assert.ok(cleanContent.includes('[FOTO: Candlestick Bullish | id="foto_1"]'), 'Harus membungkus foto ke token');

    // Pastikan expandedContent mengembalikan data asli
    const expanded = expandMediaContent(cleanContent, mediaList);
    assert.ok(expanded.includes('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'Video URL harus kembali');
    assert.ok(expanded.includes('![Candlestick Bullish](data:image/png;base64,'), 'Foto data URL harus kembali');
  });

  it('Skenario BUG UTAMA - Video dihapus dari naskah', () => {
    const raw = `## Analisis Teknikal
  [VIDEO: Video YouTube (dQw4w9WgXcQ) | url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" | id="video_1"]

  Penjelasan tentang breakout level support & resistance.`;

    const { cleanContent, mediaList } = collapseMediaContent(raw);

    // Admin menghapus video token dari cleanContent
    const editedContent = cleanContent.replace(/\[VIDEO:[^\]]+\]/g, '').trim();

    // Saat disimpan ke database
    const expanded = expandMediaContent(editedContent, mediaList);
    const finalUrls = extractFinalYoutubeUrls(expanded);

    assert.strictEqual(finalUrls.length, 0, 'finalYoutubeUrls HARUS KOSONG saat video dihapus dari naskah!');
    assert.strictEqual(expanded.includes('dQw4w9WgXcQ'), false, 'Naskah yang disimpan tidak boleh mengandung URL video yang sudah dihapus');
  });

  it('Legacy video di existingYoutubeUrls yang belum tersemat di naskah', () => {
    const raw = `## Bab Lama Tanpa Tag
  Penjelasan materi silabus lama.`;
    const legacyUrls = ['https://youtu.be/abcdefghijk'];

    const { cleanContent, mediaList } = collapseMediaContent(raw, legacyUrls);

    assert.strictEqual(mediaList.length, 1, 'Harus menambahkan video legacy ke mediaList');
    assert.ok(cleanContent.includes('[VIDEO: Video YouTube (abcdefghijk)'), 'Harus menyematkan video legacy ke naskah agar transparan dan bisa diedit/dihapus');

    // Sekarang simulasikan admin menghapus video legacy ini
    const afterDelete = cleanContent.replace(/\[VIDEO:[^\]]+\]/g, '').trim();
    const expanded = expandMediaContent(afterDelete, mediaList);
    const finalUrls = extractFinalYoutubeUrls(expanded);

    assert.strictEqual(finalUrls.length, 0, 'Video legacy yang dihapus admin tidak boleh muncul di finalYoutubeUrls');
  });

  it('Mobile unplacedVideos & hasVideo detection', () => {
    const contentWithVideo = `## Bab Forex\n[VIDEO: Video YouTube (12345678901) | url="https://youtu.be/12345678901" | id="video_1"]`;
    const ytid = extractYouTubeId(contentWithVideo);
    assert.strictEqual(ytid, '12345678901');

    // Bila content kosong / video dihapus
    const contentDeleted = `## Bab Forex\nPenjelasan tanpa video.`;
    const ytidDeleted = extractYouTubeId(contentDeleted);
    assert.strictEqual(ytidDeleted, null, 'Tidak boleh ada video terdeteksi pada konten yang videonya sudah dihapus');

    const youtubeUrls: string[] = [];
    const hasVideo = !!((youtubeUrls.length > 0) || extractYouTubeId(contentDeleted));
    assert.strictEqual(hasVideo, false, 'hasVideo harus false bila video sudah dihapus');
  });
});
