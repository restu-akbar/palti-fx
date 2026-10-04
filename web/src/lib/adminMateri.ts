import { supabase } from './supabase';
import type { EduLesson, EduModule } from '../types/admin';

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const clean = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = clean.match(regExp);
  return match && match[1] ? match[1] : null;
}

export class AdminMateriService {
  static async getModules(): Promise<EduModule[]> {
    try {
      const { data: dbMods, error: modErr } = await supabase
        .from('edu_modules')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (modErr || !dbMods) return [];

      const { data: dbLessons } = await supabase
        .from('edu_lessons')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      const lessonsByMod: Record<string, EduLesson[]> = {};
      (dbLessons || []).forEach((l: any) => {
        const item: EduLesson = {
          id: l.id,
          module_id: l.module_id,
          title: l.title,
          minutes: Number(l.minutes) || 5,
          youtube_urls: Array.isArray(l.youtube_urls) ? l.youtube_urls : [],
          content: l.content || '',
          sort_order: l.sort_order ?? 0,
          created_at: l.created_at,
          updated_at: l.updated_at,
        };
        if (!lessonsByMod[l.module_id]) lessonsByMod[l.module_id] = [];
        lessonsByMod[l.module_id].push(item);
      });

      return dbMods.map((m: any) => ({
        id: m.id,
        title: m.title,
        subtitle: m.subtitle || '',
        level: m.level || 'Pemula',
        icon: m.icon || 'school-outline',
        sort_order: m.sort_order ?? 0,
        created_at: m.created_at,
        updated_at: m.updated_at,
        lessons: lessonsByMod[m.id] || [],
      }));
    } catch (err) {
      console.error('[AdminMateriService.getModules]', err);
      return [];
    }
  }

  static async createModule(input: {
    title: string;
    subtitle: string;
    level: 'Pemula' | 'Menengah' | 'Lanjutan';
    icon: string;
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
        icon: input.icon.trim() || 'school-outline',
        sort_order: nextOrder,
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menambahkan modul baru.' };
    }
  }

  static async updateModule(
    _id: string,
    _patch: {
      title?: string;
      subtitle?: string;
      level?: 'Pemula' | 'Menengah' | 'Lanjutan';
      icon?: string;
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
      return { success: false, error: err?.message || 'Gagal mengubah urutan modul.' };
    }
  }

  /* ─── CRUD Bab / Lesson ─── */

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
      return { success: false, error: err?.message || 'Gagal membuat bab edukasi.' };
    }
  }

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
      return { success: false, error: err?.message || 'Gagal menghapus bab edukasi.' };
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
      return { success: false, error: err?.message || 'Gagal mengubah urutan bab materi.' };
    }
  }
}
