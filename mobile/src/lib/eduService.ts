import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lesson, Module, MODULES } from '../data/modules';
import { supabase } from './supabase';

const EDU_CACHE_KEY = 'pfx.edu_modules.cache.v2';

export interface EduCacheData {
  modules: Module[];
  totalModules: number;
  totalLessons: number;
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

export class EduService {
  /**
   * Mengambil data cache lokal beserta metadata jumlah modul dan bab.
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
   * Mengambil materi edukasi:
   * 1. Cek cache lokal di perangkat.
   * 2. Bila cache ada, jalankan pengecekan ringan (HTTP HEAD count) ke Supabase.
   * 3. Selama tidak ada penambahan materi di server (jumlah modul & bab sama),
   *    langsung gunakan cache lokal (0ms & 0 byte transfer konten).
   * 4. Bila terdeteksi ada materi tambahan atau belum ada cache, unduh penuh sekali dan simpan.
   */
  static async getModules(): Promise<Module[]> {
    const cached = await this.getCachedData();

    // Jika sudah ada cache, cek apakah ada tambahan materi di server secara efisien (HEAD request)
    if (cached && cached.modules && cached.modules.length > 0) {
      try {
        const [{ count: moduleCount, error: modErr }, { count: lessonCount, error: lesErr }] =
          await Promise.all([
            supabase.from('edu_modules').select('*', { count: 'exact', head: true }),
            supabase.from('edu_lessons').select('*', { count: 'exact', head: true }),
          ]);

        if (!modErr && !lesErr && moduleCount !== null && lessonCount !== null) {
          // "selama gaada tambahan materi gaakan berubah"
          if (moduleCount === cached.totalModules && lessonCount === cached.totalLessons) {
            return cached.modules;
          }
        }
      } catch {
        // Offline / jaringan terganggu: langsung kembalikan cache lokal
        return cached.modules;
      }
    }

    // Ambil materi penuh dari server (karena belum ada cache atau ada materi baru ditambahkan)
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

      const lessonsByMod: Record<string, Lesson[]> = {};
      (dbLessons || []).forEach((l: any) => {
        const item: Lesson = {
          id: l.id,
          moduleId: l.module_id,
          title: l.title,
          minutes: Number(l.minutes) || 5,
          youtubeUrls: Array.isArray(l.youtube_urls) ? l.youtube_urls : [],
          content: l.content || '',
          sortOrder: l.sort_order ?? 0,
        };
        if (!lessonsByMod[l.module_id]) lessonsByMod[l.module_id] = [];
        lessonsByMod[l.module_id].push(item);
      });

      const modules: Module[] = dbMods.map((m: any) => ({
        id: m.id,
        title: m.title,
        subtitle: m.subtitle || '',
        level: m.level || 'Pemula',
        icon: m.icon || 'school-outline',
        sortOrder: m.sort_order ?? 0,
        lessons: lessonsByMod[m.id] || [],
      }));

      // Simpan materi beserta metadata jumlah ke cache offline
      const cachePayload: EduCacheData = {
        modules,
        totalModules: dbMods.length,
        totalLessons: (dbLessons || []).length,
        cachedAt: Date.now(),
      };
      await AsyncStorage.setItem(EDU_CACHE_KEY, JSON.stringify(cachePayload)).catch(() => {});

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
