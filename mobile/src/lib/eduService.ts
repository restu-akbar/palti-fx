import AsyncStorage from '@react-native-async-storage/async-storage';
import { Module, MODULES } from '../data/modules';
import { mapEduRows } from './eduMapper';
import { supabase } from './supabase';
import { NetworkService } from './networkService';

const EDU_CACHE_KEY = 'pfx.edu_modules.cache.v3';

export interface EduCacheData {
  modules: Module[];
  totalModules: number;
  totalLessons: number;
  lastLessonUpdate?: string | null;
  lastModuleUpdate?: string | null;
  cachedAt: number;
}

/** Helper untuk mengekstrak YouTube Video ID dari berbagai macam URL (Watch, Shortlink, Shorts, Embed). */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const clean = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = clean.match(regExp);
  return match && match[1] ? match[1] : null;
}

/** True bila URL menunjuk langsung ke berkas video yang diunggah (MP4/WebM), bukan YouTube. */
export function isDirectVideoUrl(url: string): boolean {
  return /^https?:\/\/\S+\.(?:mp4|webm)(?:\?\S*)?$/i.test((url || '').trim());
}

export class EduService {
  /**
   * Mengambil data cache lokal beserta metadata jumlah modul, bab, dan waktu pembaruan server.
   */
  static async getCachedData(): Promise<EduCacheData | null> {
    try {
      const raw = await AsyncStorage.getItem(EDU_CACHE_KEY);
      return raw ? (JSON.parse(raw) as EduCacheData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Mengambil daftar modul yang tersimpan di cache lokal.
   */
  static async getCachedModules(): Promise<Module[] | null> {
    const cached = await this.getCachedData();
    return cached?.modules || null;
  }

  /**
   * Menghapus cache offline modul edukasi di perangkat.
   */
  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(EDU_CACHE_KEY);
    } catch {
      /* abaikan */
    }
  }

  /**
   * Mengambil materi edukasi:
   * 1. Cek cache lokal di perangkat.
   * 2. Bila cache ada dan forceRefresh=false, lakukan verifikasi ringan (jumlah modul, bab, dan timestamp update terbaru).
   * 3. Jika tidak ada perubahan data di server, langsung gunakan cache lokal (0ms & 0 byte transfer konten).
   * 4. Bila terdeteksi ada materi baru, pengeditan/penghapusan video atau konten, atau belum ada cache, unduh penuh dan simpan ke cache.
   */
  static async getModules(forceRefresh = false): Promise<Module[]> {
    const cached = await this.getCachedData();

    // Jika sudah ada cache dan bukan paksa refresh, cek apakah ada perubahan materi di server secara efisien
    if (!forceRefresh && cached && cached.modules && cached.modules.length > 0) {
      try {
        const [
          { count: moduleCount, error: modErr },
          { count: lessonCount, error: lesErr },
          { data: latestLes },
          { data: latestMod },
        ] = await Promise.all([
          supabase.from('edu_modules').select('*', { count: 'exact', head: true }),
          supabase.from('edu_lessons').select('*', { count: 'exact', head: true }),
          supabase
            .from('edu_lessons')
            .select('updated_at, created_at')
            .order('updated_at', { ascending: false, nullsFirst: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('edu_modules')
            .select('updated_at, created_at')
            .order('updated_at', { ascending: false, nullsFirst: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (!modErr && !lesErr && moduleCount !== null && lessonCount !== null) {
          const serverLatestLesTime = latestLes?.updated_at || latestLes?.created_at || null;
          const serverLatestModTime = latestMod?.updated_at || latestMod?.created_at || null;

          const countsMatch = moduleCount === cached.totalModules && lessonCount === cached.totalLessons;
          const lessonsMatch = !serverLatestLesTime || serverLatestLesTime === cached.lastLessonUpdate;
          const modulesMatch = !serverLatestModTime || serverLatestModTime === cached.lastModuleUpdate;

          if (countsMatch && lessonsMatch && modulesMatch) {
            return cached.modules;
          }
        }
      } catch {
        // Offline / jaringan terganggu: langsung kembalikan cache lokal
        return cached.modules;
      }
    }

    // Ambil materi penuh dari server (karena belum ada cache, data server diperbarui, atau force refresh)
    try {
      const { data: dbMods, error: modErr } = await supabase
        .from('edu_modules')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (modErr || !dbMods || dbMods.length === 0) {
        return cached?.modules && cached.modules.length > 0 ? cached.modules : MODULES;
      }

      const { data: dbLessons } = await supabase
        .from('edu_lessons')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      const { modules, latestLessonUpdate, latestModuleUpdate } = mapEduRows(dbMods, dbLessons);

      // Simpan materi beserta metadata jumlah & waktu ke cache offline
      const cachePayload: EduCacheData = {
        modules,
        totalModules: dbMods.length,
        totalLessons: (dbLessons || []).length,
        lastLessonUpdate: latestLessonUpdate,
        lastModuleUpdate: latestModuleUpdate,
        cachedAt: Date.now(),
      };
      await AsyncStorage.setItem(EDU_CACHE_KEY, JSON.stringify(cachePayload)).catch(() => {});

      NetworkService.notifyOnline();
      return modules;
    } catch (err) {
      console.warn('[EduService.getModules] Fallback to cache/static:', err);
      return cached?.modules && cached.modules.length > 0 ? cached.modules : MODULES;
    }
  }

  /* ─── CRUD Modul (Admin Only) ─── */

  static async createModule(input: {
    title: string;
    subtitle: string;
    level: Module['level'];
    icon: Module['icon'];
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: lastItem } = await supabase
        .from('edu_modules')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (lastItem?.sort_order ?? 0) + 1;
      const { error } = await supabase.from('edu_modules').insert({
        title: input.title.trim(),
        subtitle: input.subtitle.trim(),
        level: input.level,
        icon: input.icon,
        sort_order: nextOrder,
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal membuat modul.' };
    }
  }

  /**
   * Materi bersifat permanen / immutable (tidak dapat diedit).
   */
  static async updateModule(
    _id: string,
    _patch: {
      title?: string;
      subtitle?: string;
      level?: Module['level'];
      icon?: Module['icon'];
    }
  ): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Materi edukasi bersifat permanen dan tidak dapat diedit.' };
  }

  static async deleteModule(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('edu_modules').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghapus modul.' };
    }
  }

  static async reorderModules(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const updates = orderedIds.map((id, index) =>
        supabase.from('edu_modules').update({ sort_order: index + 1 }).eq('id', id)
      );
      await Promise.all(updates);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal memperbarui urutan modul.' };
    }
  }

  /* ─── CRUD Bab / Lesson (Admin Only) ─── */

  static async createLesson(
    moduleId: string,
    input: {
      title: string;
      minutes: number;
      youtubeUrls: string[];
      content: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: lastItem } = await supabase
        .from('edu_lessons')
        .select('sort_order')
        .eq('module_id', moduleId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (lastItem?.sort_order ?? 0) + 1;
      const cleanUrls = input.youtubeUrls.map((u) => u.trim()).filter((u) => u.length > 0);

      const { error } = await supabase.from('edu_lessons').insert({
        module_id: moduleId,
        title: input.title.trim(),
        minutes: input.minutes > 0 ? input.minutes : 5,
        youtube_urls: cleanUrls,
        content: input.content,
        sort_order: nextOrder,
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal membuat bab materi.' };
    }
  }

  /**
   * Materi bersifat permanen / immutable (tidak dapat diedit).
   */
  static async updateLesson(
    _id: string,
    _patch: {
      title?: string;
      minutes?: number;
      youtubeUrls?: string[];
      content?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Materi edukasi bersifat permanen dan tidak dapat diedit.' };
  }

  static async deleteLesson(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('edu_lessons').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghapus bab materi.' };
    }
  }

  static async reorderLessons(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const updates = orderedIds.map((id, index) =>
        supabase.from('edu_lessons').update({ sort_order: index + 1 }).eq('id', id)
      );
      await Promise.all(updates);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal memperbarui urutan bab.' };
    }
  }
}
