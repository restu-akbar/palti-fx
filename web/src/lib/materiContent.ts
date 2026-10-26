import { extractYouTubeId } from './adminMateri';

/**
 * Kompresi foto di browser menjadi Blob siap unggah (WebP, fallback JPEG), lebar maks 1200px.
 * Format yang didukung browser: PNG, JPG, WEBP, BMP, AVIF. GIF dikembalikan apa adanya agar
 * animasinya tidak hilang. SVG tidak didukung (tidak bisa disanitasi).
 */
export function compressImageToBlob(file: File, maxWidth = 1200, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/gif') {
      resolve(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Berkas bukan gambar yang valid.'));
    };
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Browser tidak mendukung pemrosesan gambar.'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (webp) => {
          if (webp?.type === 'image/webp') {
            resolve(webp);
            return;
          }
          canvas.toBlob(
            (jpeg) => (jpeg ? resolve(jpeg) : reject(new Error('Gagal mengompres gambar.'))),
            'image/jpeg',
            quality
          );
        },
        'image/webp',
        quality
      );
    };
    img.src = objectUrl;
  });
}

/** True bila URL menunjuk langsung ke berkas video yang bisa diputar (MP4/WebM), bukan YouTube. */
export function isVideoFileUrl(url: string): boolean {
  return /^https?:\/\/\S+\.(?:mp4|webm)(?:\?\S*)?$/i.test((url || '').trim());
}

export interface EmbeddedMediaItem {
  id: string;
  type: 'image' | 'video';
  src: string;
  caption?: string;
  name: string;
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
