import { supabase } from './supabase';

/**
 * Penyimpanan media materi (gambar & video).
 *
 * Media tidak disimpan sebagai base64 di edu_lessons.content, melainkan diunggah ke object
 * storage dan yang disimpan di naskah hanya URL publiknya.
 *
 * Penyimpanan dipisah menjadi "driver" agar backend bisa diganti tanpa menyentuh UI:
 *   - `supabase` (default): bucket Supabase Storage (lihat migrations/002 & 003).
 *   - `r2`: Cloudflare R2. Browser tidak memegang kunci R2: Pages Function
 *     (web/functions/api/upload-url.ts) memverifikasi JWT Supabase + role admin, membuat path di
 *     server, lalu mengembalikan presigned PUT URL. Driver ini hanya `fetch(PUT)` ke URL itu.
 *     Selama masa transisi `pathFromUrl` juga mengenali URL Supabase lama (lihat R2MediaStorage).
 */

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
/** Batas berkas mentah sebelum dikompres (foto ponsel besar masih wajar). */
export const IMAGE_MAX_INPUT_BYTES = 20 * 1024 * 1024;
/** Harus sama dengan file_size_limit bucket lesson-videos (migrasi 003). */
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export const IMAGE_MIME_TO_EXT = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/avif': 'avif',
} as const;

export const VIDEO_MIME_TO_EXT = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
} as const;

export type ImageMime = keyof typeof IMAGE_MIME_TO_EXT;
export type VideoMime = keyof typeof VIDEO_MIME_TO_EXT;
export type MediaKind = 'image' | 'video';

export interface MediaStorageDriver {
  upload(path: string, blob: Blob, contentType: string): Promise<{ url: string }>;
  remove(paths: string[]): Promise<void>;
  /** Path objek dari URL publik yang dihasilkan driver ini; null bila URL bukan milik driver. */
  pathFromUrl(url: string): string | null;
}

export class SupabaseMediaStorage implements MediaStorageDriver {
  private readonly bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  async upload(path: string, blob: Blob, contentType: string): Promise<{ url: string }> {
    const store = supabase.storage.from(this.bucket);
    const { error } = await store.upload(path, blob, {
      contentType,
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) throw new Error(error.message);
    return { url: store.getPublicUrl(path).data.publicUrl };
  }

  async remove(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    const { error } = await supabase.storage.from(this.bucket).remove(paths);
    if (error) throw new Error(error.message);
  }

  pathFromUrl(url: string): string | null {
    const marker = `/storage/v1/object/public/${this.bucket}/`;
    const at = url.indexOf(marker);
    if (at < 0) return null;
    const path = decodeURIComponent(url.slice(at + marker.length).split(/[?#]/)[0]);
    return path || null;
  }
}

const R2_PREFIX: Record<MediaKind, string> = { image: 'images/', video: 'videos/' };

/**
 * Driver Cloudflare R2. `path` dari pemanggil diabaikan saat upload: server yang menentukan key
 * (`images|videos/lessons/YYYY/MM/<uuid>.<ext>`), dan URL publik dibentuk dari respons server.
 */
export class R2MediaStorage implements MediaStorageDriver {
  private readonly kind: MediaKind;
  private readonly publicBaseUrl: string;
  private readonly legacyBucket: string;
  private readonly apiUrl: string;

  constructor(kind: MediaKind, publicBaseUrl: string, legacyBucket: string, apiUrl = '/api/upload-url') {
    this.kind = kind;
    this.publicBaseUrl = publicBaseUrl;
    this.legacyBucket = legacyBucket;
    this.apiUrl = apiUrl;
  }

  private async authHeader(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Sesi login tidak ditemukan. Silakan masuk ulang.');
    return { Authorization: `Bearer ${token}` };
  }

  async upload(_path: string, blob: Blob, contentType: string): Promise<{ url: string }> {
    const sign = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { ...(await this.authHeader()), 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: this.kind, contentType, size: blob.size }),
    });
    const signed = await sign.json().catch(() => ({}));
    if (!sign.ok) throw new Error(signed.error || `Gagal meminta URL unggah (${sign.status}).`);

    const put = await fetch(signed.uploadUrl, { method: 'PUT', headers: signed.headers, body: blob });
    if (!put.ok) throw new Error(`Gagal mengunggah ke R2 (${put.status}).`);
    return { url: signed.publicUrl };
  }

  async remove(paths: string[]): Promise<void> {
    // Path lama dari Supabase (tanpa prefix images/ atau videos/) bukan milik bucket R2: dibiarkan
    // sebagai cadangan sampai bucket Supabase dihapus.
    const keys = paths.filter((p) => p.startsWith(R2_PREFIX[this.kind]));
    if (keys.length === 0) return;
    const res = await fetch(this.apiUrl, {
      method: 'DELETE',
      headers: { ...(await this.authHeader()), 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Gagal menghapus dari R2 (${res.status}).`);
    }
  }

  pathFromUrl(url: string): string | null {
    const base = `${this.publicBaseUrl.replace(/\/+$/, '')}/`;
    if (url.startsWith(base)) {
      const path = decodeURIComponent(url.slice(base.length).split(/[?#]/)[0]);
      return path.startsWith(R2_PREFIX[this.kind]) ? path : null;
    }
    return new SupabaseMediaStorage(this.legacyBucket).pathFromUrl(url);
  }
}

export function createMediaStorage(
  kind: MediaKind,
  env: Record<string, unknown> = import.meta.env
): MediaStorageDriver {
  const driver = String(env.VITE_STORAGE_DRIVER || 'supabase').trim().toLowerCase();
  const legacyBucket =
    kind === 'image'
      ? String(env.VITE_STORAGE_BUCKET || 'lesson-images')
      : String(env.VITE_STORAGE_VIDEO_BUCKET || 'lesson-videos');
  switch (driver) {
    case 'supabase':
      return new SupabaseMediaStorage(legacyBucket);
    case 'r2': {
      const base = String(env.VITE_R2_PUBLIC_BASE_URL || '').trim();
      if (!base) throw new Error('Driver penyimpanan "r2" membutuhkan VITE_R2_PUBLIC_BASE_URL.');
      return new R2MediaStorage(kind, base, legacyBucket, String(env.VITE_UPLOAD_API_URL || '/api/upload-url'));
    }
    default:
      throw new Error(`Driver penyimpanan tidak dikenal: "${driver}".`);
  }
}

const readHead = async (blob: Blob) => {
  const b = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  return { b, ascii: (from: number, to: number) => String.fromCharCode(...b.slice(from, to)) };
};

/** Mendeteksi tipe gambar dari magic bytes (bukan dari ekstensi atau MIME yang diklaim klien). */
export async function detectImageType(blob: Blob): Promise<ImageMime | null> {
  const { b, ascii } = await readHead(blob);

  if (b.length >= 8 && b[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (ascii(0, 4) === 'GIF8') return 'image/gif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12))) return 'image/avif';
  return null;
}

/** Brand ISO-BMFF yang lazim untuk MP4 (HEIC/AVIF/QuickTime sengaja tidak termasuk). */
const MP4_BRANDS = ['isom', 'iso2', 'iso4', 'iso5', 'iso6', 'mp41', 'mp42', 'avc1', 'dash', 'M4V '];

/** Mendeteksi tipe video (MP4/WebM) dari magic bytes. */
export async function detectVideoType(blob: Blob): Promise<VideoMime | null> {
  const { b, ascii } = await readHead(blob);

  if (ascii(4, 8) === 'ftyp' && MP4_BRANDS.includes(ascii(8, 12))) return 'video/mp4';
  // Header EBML (Matroska/WebM)
  if (b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'video/webm';
  return null;
}

/** Pemeriksaan cepat di UI sebelum berkas diproses. Mengembalikan pesan error atau null jika layak. */
export function validateImageFile(file: { name: string; type: string; size: number }): string | null {
  // Ekstensi wajib cocok; MIME wajib cocok bila browser menyediakannya (kadang kosong untuk AVIF/BMP)
  const okType = !file.type || /^image\/(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.type);
  const okExt = /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.name);
  if (!okType || !okExt) {
    return 'Format berkas tidak didukung. Harap pilih gambar (PNG, JPG, WEBP, GIF, BMP, AVIF).';
  }
  if (file.size > IMAGE_MAX_INPUT_BYTES) {
    return `Ukuran berkas terlalu besar (maks ${IMAGE_MAX_INPUT_BYTES / 1024 / 1024} MB).`;
  }
  // GIF diunggah apa adanya (animasi dipertahankan), jadi tunduk pada batas unggah
  if (/gif$/i.test(file.type) && file.size > IMAGE_MAX_BYTES) {
    return `GIF terlalu besar (maks ${IMAGE_MAX_BYTES / 1024 / 1024} MB).`;
  }
  return null;
}

/** Pemeriksaan cepat di UI untuk video. Video diunggah apa adanya (tanpa transkode di browser). */
export function validateVideoFile(file: { name: string; type: string; size: number }): string | null {
  const okType = !file.type || /^video\/(mp4|webm)$/i.test(file.type);
  const okExt = /\.(mp4|webm)$/i.test(file.name);
  if (!okType || !okExt) {
    return 'Format video tidak didukung. Gunakan MP4 (H.264) atau WebM.';
  }
  if (file.size > VIDEO_MAX_BYTES) {
    return `Ukuran video terlalu besar (maks ${VIDEO_MAX_BYTES / 1024 / 1024} MB). Kompres dulu atau gunakan tautan YouTube.`;
  }
  return null;
}

const MEDIA_RULES = {
  image: { maxBytes: IMAGE_MAX_BYTES, ext: IMAGE_MIME_TO_EXT as Record<string, string>, detect: detectImageType, label: 'gambar' },
  video: { maxBytes: VIDEO_MAX_BYTES, ext: VIDEO_MIME_TO_EXT as Record<string, string>, detect: detectVideoType, label: 'video' },
} as const;

export class MediaUploadService {
  static uploadLessonImage(blob: Blob, driver?: MediaStorageDriver) {
    return MediaUploadService.upload('image', blob, driver);
  }

  static uploadLessonVideo(blob: Blob, driver?: MediaStorageDriver) {
    return MediaUploadService.upload('video', blob, driver);
  }

  private static async upload(
    kind: MediaKind,
    blob: Blob,
    driver?: MediaStorageDriver
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    const rules = MEDIA_RULES[kind];
    try {
      if (blob.size === 0) return { success: false, error: `Berkas ${rules.label} kosong.` };
      if (blob.size > rules.maxBytes) {
        return { success: false, error: `Ukuran ${rules.label} melebihi ${rules.maxBytes / 1024 / 1024} MB.` };
      }

      const mime = await rules.detect(blob);
      if (!mime) return { success: false, error: `Isi berkas bukan ${rules.label} yang didukung.` };

      // Nama acak: tidak membocorkan nama asli dan tidak bisa bertabrakan/menimpa berkas lain
      const now = new Date();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      const path = `lessons/${now.getUTCFullYear()}/${month}/${crypto.randomUUID()}.${rules.ext[mime]}`;

      const { url } = await (driver ?? createMediaStorage(kind)).upload(path, blob, mime);
      return { success: true, url };
    } catch (err) {
      console.error(`[MediaUploadService.upload:${kind}]`, err);
      return { success: false, error: err instanceof Error ? err.message : `Gagal mengunggah ${rules.label}.` };
    }
  }
}

/** Semua URL http(s) di dalam naskah (markdown gambar, token [VIDEO: ... url="..."], atau URL polos). */
export function extractContentUrls(content: string): string[] {
  const found = (content || '').match(/https?:\/\/[^\s)"'\]]+/g) || [];
  return [...new Set(found)];
}

/**
 * Menghapus berkas dari storage untuk URL yang sudah tidak dipakai.
 * Aman dipanggil dengan URL apa saja: URL di luar storage kita (YouTube, CDN lain) diabaikan,
 * dan berkas yang masih dirujuk bab mana pun di database TIDAK dihapus.
 * Kegagalan tidak dilempar (hanya dicatat) agar tidak menggagalkan simpan/hapus bab.
 */
export class MediaCleanup {
  static async removeUnreferenced(urls: string[], drivers?: Partial<Record<MediaKind, MediaStorageDriver>>): Promise<number> {
    let removed = 0;
    for (const kind of ['image', 'video'] as const) {
      try {
        const driver = drivers?.[kind] ?? createMediaStorage(kind);
        const paths = [...new Set(urls.map((u) => driver.pathFromUrl(u)).filter((p): p is string => !!p))];
        const unused: string[] = [];
        for (const path of paths) {
          const { data, error } = await supabase.from('edu_lessons').select('id').ilike('content', `%${path}%`).limit(1);
          // Gagal memeriksa = anggap masih dipakai (lebih baik menyisakan berkas daripada menghapus yang terpakai)
          if (!error && Array.isArray(data) && data.length === 0) unused.push(path);
        }
        if (unused.length > 0) {
          await driver.remove(unused);
          removed += unused.length;
        }
      } catch (err) {
        console.error(`[MediaCleanup.removeUnreferenced:${kind}]`, err);
      }
    }
    return removed;
  }
}
