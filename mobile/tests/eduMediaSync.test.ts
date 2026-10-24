import assert from 'node:assert';

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const clean = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = clean.match(regExp);
  return match && match[1] ? match[1] : null;
}

// Replikasi fungsi collapseMediaContent dan expandMediaContent dari AdminMateriView untuk validasi independen
interface EmbeddedMediaItem {
  id: string;
  type: 'image' | 'video';
  src: string;
  caption?: string;
  name: string;
}

function collapseMediaContent(
  rawContent: string,
  existingYoutubeUrls: string[] = []
): {
  cleanContent: string;
  mediaList: EmbeddedMediaItem[];
} {
  if (!rawContent && (!existingYoutubeUrls || existingYoutubeUrls.length === 0)) {
    return { cleanContent: '', mediaList: [] };
  }

  const mediaList: EmbeddedMediaItem[] = [];
  let imgCounter = 1;
  let videoCounter = 1;

  let content = rawContent || '';

  // 1. Ubah markdown foto biasa ![caption](src) menjadi token [FOTO: ... | id="..."]
  const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
  content = content.replace(imgRegex, (_, caption, src) => {
    const trimmedSrc = (src || '').trim();
    const trimmedCaption = (caption || '').trim();
    const mediaId = `foto_${imgCounter++}`;
    const displayName = trimmedCaption || `Foto #${mediaList.filter((m) => m.type === 'image').length + 1}`;

    mediaList.push({
      id: mediaId,
      type: 'image',
      src: trimmedSrc,
      caption: trimmedCaption,
      name: displayName,
    });

    return `[FOTO: ${displayName} | id="${mediaId}"]`;
  });

  // 2. Tangani token [VIDEO: ... | url="..." | id="..."] yang sudah ada
  const existingVideoTokenRegex = /\[(?:VIDEO|video):\s*(.*?)(?:\s*\|\s*url=["'](.*?)["'])?(?:\s*\|\s*id=["'](.*?)["'])?\]/gi;
  content = content.replace(existingVideoTokenRegex, (match, label, urlAttr, idAttr) => {
    const cleanUrl = (urlAttr || '').trim();
    const mediaId = (idAttr || '').trim() || `video_${videoCounter++}`;
    const ytid = extractYouTubeId(cleanUrl) || extractYouTubeId(label);
    const displayName = (label || '').trim() || (ytid ? `Video YouTube (${ytid})` : `Video #${videoCounter}`);

    if (cleanUrl) {
      if (!mediaList.some((m) => m.id === mediaId)) {
        mediaList.push({
          id: mediaId,
          type: 'video',
          src: cleanUrl,
          name: displayName,
        });
      }
      return `[VIDEO: ${displayName} | url="${cleanUrl}" | id="${mediaId}"]`;
    }
    return match;
  });

  // 3. Ubah URL YouTube langsung atau format [video: url] / [video](url) menjadi token [VIDEO: ...]
  const lines = content.split('\n');
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    if (/^\[(?:FOTO|GAMBAR|MEDIA_FOTO|VIDEO):\s*.*?\]$/i.test(trimmed)) {
      return line;
    }

    const ytTagMatch =
      trimmed.match(/^\[video(?::|\s+)(.*?)\]$/i) ||
      trimmed.match(/^!?\[(?:video|youtube)\]\((.*?)\)$/i);
    const candidateUrl = ytTagMatch ? ytTagMatch[1].trim() : trimmed;
    const ytid = extractYouTubeId(candidateUrl);

    if (
      ytid &&
      (ytTagMatch ||
        candidateUrl.startsWith('http://') ||
        candidateUrl.startsWith('https://') ||
        candidateUrl.startsWith('www.youtube.') ||
        candidateUrl.startsWith('youtu.be/'))
    ) {
      const fullUrl = candidateUrl.startsWith('http') ? candidateUrl : `https://${candidateUrl}`;
      const mediaId = `video_${videoCounter++}`;
      const displayName = `Video YouTube (${ytid})`;

      if (!mediaList.some((m) => m.src === fullUrl || extractYouTubeId(m.src) === ytid)) {
        mediaList.push({
          id: mediaId,
          type: 'video',
          src: fullUrl,
          name: displayName,
        });
      }
      return `[VIDEO: ${displayName} | url="${fullUrl}" | id="${mediaId}"]`;
    }

    return line;
  });
  content = processedLines.join('\n');

  // 4. Integrasikan video dari existingYoutubeUrls yang belum tersemat di dalam naskah
  if (Array.isArray(existingYoutubeUrls) && existingYoutubeUrls.length > 0) {
    const unplaced: string[] = [];
    existingYoutubeUrls.forEach((u) => {
      const cleanU = (u || '').trim();
      const ytid = extractYouTubeId(cleanU);
      if (ytid && !content.includes(ytid) && !mediaList.some((m) => extractYouTubeId(m.src) === ytid)) {
        unplaced.push(cleanU.startsWith('http') ? cleanU : `https://${cleanU}`);
      }
    });

    if (unplaced.length > 0) {
      const addedTokens: string[] = [];
      unplaced.forEach((u) => {
        const ytid = extractYouTubeId(u)!;
        const mediaId = `video_${videoCounter++}`;
        const displayName = `Video YouTube (${ytid})`;
        mediaList.push({
          id: mediaId,
          type: 'video',
          src: u,
          name: displayName,
        });
        addedTokens.push(`[VIDEO: ${displayName} | url="${u}" | id="${mediaId}"]`);
      });
      content = content.trim() ? content + '\n\n' + addedTokens.join('\n\n') : addedTokens.join('\n\n');
    }
  }

  return { cleanContent: content, mediaList };
}

function expandMediaContent(
  cleanContent: string,
  mediaList: EmbeddedMediaItem[]
): string {
  if (!cleanContent) return '';
  const mediaMap = new Map<string, EmbeddedMediaItem>();
  mediaList.forEach((m) => mediaMap.set(m.id, m));

  const photoTagRegex = /\[(?:FOTO|GAMBAR|MEDIA_FOTO):\s*(.*?)\s*\|\s*id=["'](.*?)["']\]/gi;
  let expanded = cleanContent.replace(photoTagRegex, (match, label, id) => {
    const item = mediaMap.get(id);
    if (!item) return match;
    const cap = item.caption || label || '';
    return cap ? `![${cap}](${item.src})` : `![](${item.src})`;
  });

  const videoTagRegex = /\[(?:VIDEO|video):\s*(.*?)(?:\s*\|\s*url=["'](.*?)["'])?(?:\s*\|\s*id=["'](.*?)["'])?\]/gi;
  expanded = expanded.replace(videoTagRegex, (match, label, urlAttr, idAttr) => {
    if (urlAttr && urlAttr.trim()) {
      return `\n\n${urlAttr.trim()}\n\n`;
    }
    if (idAttr) {
      const item = mediaMap.get(idAttr);
      if (item && item.src) {
        return `\n\n${item.src.trim()}\n\n`;
      }
    }
    const inlineYt = extractYouTubeId(label);
    if (inlineYt) {
      return `\n\nhttps://www.youtube.com/watch?v=${inlineYt}\n\n`;
    }
    return '';
  });

  return expanded.replace(/\n{3,}/g, '\n\n').trim();
}

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

console.log('Testing Media Collapse, Expansion, and Deletion Lifecycle...');

// Test 1: Mengubah foto dan URL video menjadi token ringkas
{
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
}

// Test 2: Skenario BUG UTAMA - Video dihapus dari naskah
{
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
}

// Test 3: Legacy video di existingYoutubeUrls yang belum tersemat di naskah
{
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
}

// Test 4: Mobile unplacedVideos & hasVideo detection
{
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
}

console.log('Semua pengujian lifecycle video, foto, dan penghapusan lulus!');
