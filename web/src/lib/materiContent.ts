import { extractYouTubeId } from './adminMateri';

/**
 * Kompresi dan konversi file foto/gambar ke Data URL untuk semua format:
 * PNG, JPG, JPEG, WEBP, GIF, SVG, BMP, AVIF.
 * Menjaga ukuran tetap optimal (< 350KB) agar performa database dan rendering instan.
 */
export function compressImageFile(file: File, maxWidth = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    // Format SVG dan GIF animasi tidak di-rasterize melalui Canvas (pertahankan animasi & ketajaman vektor)
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch (_) {}
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface EmbeddedMediaItem {
  id: string;
  type: 'image' | 'video';
  src: string;
  caption?: string;
  name: string;
}

/**
 * Mengubah markdown foto base64/URL panjang dan video YouTube menjadi wrapper token ringkas:
 * Foto: ![Caption](data:image/...) -> [FOTO: Caption | id="foto_1"]
 * Video: https://www.youtube.com/... -> [VIDEO: Video YouTube (ID) | url="..." | id="video_1"]
 * Menjaga naskah editor tetap bersih, ringan, dan mudah di-scroll tanpa banjir base64 atau URL panjang.
 */
export function collapseMediaContent(
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

    // Lewati jika baris ini sudah merupakan token FOTO atau VIDEO
    if (/^\[(?:FOTO|GAMBAR|MEDIA_FOTO|VIDEO):\s*.*?\]$/i.test(trimmed)) {
      return line;
    }

    // Cek tag markdown [video: url] atau [video](url)
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

/**
 * Mengubah kembali wrapper token ringkas menjadi markdown lengkap sebelum disimpan ke database:
 * [FOTO: ... | id="foto_1"] -> ![Caption](src_asli)
 * [VIDEO: ... | url="..." | id="video_1"] -> \n\n${url}\n\n
 */
export function expandMediaContent(
  cleanContent: string,
  mediaList: EmbeddedMediaItem[]
): string {
  if (!cleanContent) return '';
  const mediaMap = new Map<string, EmbeddedMediaItem>();
  mediaList.forEach((m) => mediaMap.set(m.id, m));

  // 1. Expand FOTO
  const photoTagRegex = /\[(?:FOTO|GAMBAR|MEDIA_FOTO):\s*(.*?)\s*\|\s*id=["'](.*?)["']\]/gi;
  let expanded = cleanContent.replace(photoTagRegex, (match, label, id) => {
    const item = mediaMap.get(id);
    if (!item) return match;
    const cap = item.caption || label || '';
    return cap ? `![${cap}](${item.src})` : `![](${item.src})`;
  });

  // 2. Expand VIDEO
  const videoTagRegex = /\[(?:VIDEO|video):\s*(.*?)(?:\s*\|\s*url=["'](.*?)["'])?(?:\s*\|\s*id=["'](.*?)["'])?\]/gi;
  expanded = expanded.replace(videoTagRegex, (_match, label, urlAttr, idAttr) => {
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

/**
 * Estimasi waktu baca (menit) dari jumlah kata naskah, dengan kecepatan 200 kata per menit.
 * Token media dan tautan tidak dihitung sebagai kata.
 */
export function estimateReadingMinutes(content: string): number {
  const text = (content || '')
    .replace(/\[(?:FOTO|GAMBAR|MEDIA_FOTO|VIDEO):[^\]]*\]/gi, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[#>*`]/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/* ─── Draft Bab (localStorage) ─── */
export interface LessonDraft {
  title: string;
  minutes: number;
  content: string;
  media: EmbeddedMediaItem[];
  savedAt: number;
}

export const getLessonDraftKey = (moduleId: string, lessonId?: string | null) =>
  `pfx-lesson-draft:${moduleId}:${lessonId || 'new'}`;

export function readLessonDraft(key: string): LessonDraft | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as LessonDraft) : null;
  } catch {
    return null;
  }
}

export function writeLessonDraft(key: string, draft: LessonDraft): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(draft));
    return true;
  } catch {
    // Kuota localStorage penuh atau akses diblokir: abaikan tanpa mengganggu penulisan
    return false;
  }
}

export function clearLessonDraft(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* abaikan */
  }
}
