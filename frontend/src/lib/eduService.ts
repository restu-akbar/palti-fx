import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lesson, Module, MODULES } from '../data/modules';
import { supabase } from './supabase';

const EDU_CACHE_KEY = 'pfx.edu_modules.cache.v1';

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
   * Mengambil semua modul beserta babnya dari Supabase dengan fallback offline cache
   * dan seeding fallback ke modules.ts jika database belum terisi.
   */
  static async getModules(): Promise<Module[]> {
    try {
      const { data: dbMods, error: modErr } = await supabase
        .from('edu_modules')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (modErr || !dbMods || dbMods.length === 0) {
        // Fallback: baca dari cache lokal, lalu bawaan modules.ts
        const cached = await this.getCachedModules();
        return cached && cached.length > 0 ? cached : MODULES;
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

      // Simpan ke cache offline
      await AsyncStorage.setItem(EDU_CACHE_KEY, JSON.stringify(modules)).catch(() => {});
      return modules;
    } catch (err) {
      console.warn('[EduService.getModules] Fallback to cache/static:', err);
      const cached = await this.getCachedModules();
      return cached && cached.length > 0 ? cached : MODULES;
    }
  }

  static async getCachedModules(): Promise<Module[] | null> {
    try {
      const raw = await AsyncStorage.getItem(EDU_CACHE_KEY);
      return raw ? (JSON.parse(raw) as Module[]) : null;
    } catch {
      return null;
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
      // Ambil urutan terakhir
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

  static async updateModule(
    id: string,
    patch: {
      title?: string;
      subtitle?: string;
      level?: Module['level'];
      icon?: Module['icon'];
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const payload: any = {};
      if (patch.title !== undefined) payload.title = patch.title.trim();
      if (patch.subtitle !== undefined) payload.subtitle = patch.subtitle.trim();
      if (patch.level !== undefined) payload.level = patch.level;
      if (patch.icon !== undefined) payload.icon = patch.icon;

      const { error } = await supabase.from('edu_modules').update(payload).eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal memperbarui modul.' };
    }
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

  static async updateLesson(
    id: string,
    patch: {
      title?: string;
      minutes?: number;
      youtubeUrls?: string[];
      content?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const payload: any = {};
      if (patch.title !== undefined) payload.title = patch.title.trim();
      if (patch.minutes !== undefined) payload.minutes = patch.minutes > 0 ? patch.minutes : 5;
      if (patch.youtubeUrls !== undefined) {
        payload.youtube_urls = patch.youtubeUrls.map((u) => u.trim()).filter((u) => u.length > 0);
      }
      if (patch.content !== undefined) payload.content = patch.content;

      const { error } = await supabase.from('edu_lessons').update(payload).eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal memperbarui bab materi.' };
    }
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
