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
    id: string,
    patch: {
      title?: string;
      subtitle?: string;
      level?: 'Pemula' | 'Menengah' | 'Lanjutan';
      icon?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Ambil data modul existing
      const { data: existingMod, error: modFetchErr } = await supabase
        .from('edu_modules')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (modFetchErr || !existingMod) {
        return { success: false, error: modFetchErr?.message || 'Modul tidak ditemukan.' };
      }

      // 2. Ambil seluruh bab di dalam modul ini agar tidak hilang saat replace (karena foreign key ON DELETE CASCADE)
      const { data: existingLessons } = await supabase
        .from('edu_lessons')
        .select('*')
        .eq('module_id', id);

      const updatedModule = {
        ...existingMod,
        title: patch.title !== undefined ? patch.title.trim() : existingMod.title,
        subtitle: patch.subtitle !== undefined ? patch.subtitle.trim() : existingMod.subtitle,
        level: patch.level !== undefined ? patch.level : existingMod.level,
        icon: patch.icon !== undefined ? (patch.icon.trim() || 'school-outline') : existingMod.icon,
        updated_at: new Date().toISOString(),
      };

      // 3. Hapus modul lama
      const { error: delErr } = await supabase.from('edu_modules').delete().eq('id', id);
      if (delErr) {
        return { success: false, error: delErr.message || 'Gagal memperbarui modul.' };
      }

      // 4. Masukkan kembali modul yang sudah diperbarui dengan ID yang sama persis
      const { error: insModErr } = await supabase.from('edu_modules').insert(updatedModule);
      if (insModErr) {
        // Rollback jika terjadi kesalahan
        await supabase.from('edu_modules').insert(existingMod);
        if (existingLessons && existingLessons.length > 0) {
          await supabase.from('edu_lessons').insert(existingLessons);
        }
        return { success: false, error: insModErr.message || 'Gagal menyimpan perubahan modul.' };
      }

      // 5. Masukkan kembali bab-bab materi anak
      if (existingLessons && existingLessons.length > 0) {
        await supabase.from('edu_lessons').insert(existingLessons);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal memperbarui modul.' };
    }
  }

  static async deleteModule(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Hapus seluruh bab di dalam modul terlebih dahulu untuk menghindari pelanggaran foreign key
      await supabase.from('edu_lessons').delete().eq('module_id', id);
      const { error } = await supabase.from('edu_modules').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghapus modul.' };
    }
  }

  static async reorderModules(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: existingMods, error: fetchErr } = await supabase
        .from('edu_modules')
        .select('*')
        .in('id', orderedIds);

      if (fetchErr || !existingMods) return { success: false, error: fetchErr?.message };

      const { data: allLessons } = await supabase
        .from('edu_lessons')
        .select('*')
        .in('module_id', orderedIds);

      const updated = existingMods.map((m) => ({
        ...m,
        sort_order: orderedIds.indexOf(m.id) + 1,
      }));

      await supabase.from('edu_modules').delete().in('id', orderedIds);
      const { error: insErr } = await supabase.from('edu_modules').insert(updated);
      if (insErr) {
        await supabase.from('edu_modules').insert(existingMods);
        if (allLessons && allLessons.length > 0) {
          await supabase.from('edu_lessons').insert(allLessons);
        }
        return { success: false, error: insErr.message };
      }

      if (allLessons && allLessons.length > 0) {
        await supabase.from('edu_lessons').insert(allLessons);
      }

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
    id: string,
    patch: {
      title?: string;
      minutes?: number;
      youtubeUrls?: string[];
      content?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Ambil data bab existing terlebih dahulu
      const { data: existingLesson, error: fetchErr } = await supabase
        .from('edu_lessons')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr || !existingLesson) {
        return { success: false, error: fetchErr?.message || 'Bab materi tidak ditemukan.' };
      }

      const cleanUrls = patch.youtubeUrls !== undefined
        ? patch.youtubeUrls.map((u) => u.trim()).filter((u) => u.length > 0)
        : existingLesson.youtube_urls;

      const updatedLesson = {
        ...existingLesson,
        title: patch.title !== undefined ? patch.title.trim() : existingLesson.title,
        minutes: patch.minutes !== undefined ? (patch.minutes > 0 ? patch.minutes : 5) : existingLesson.minutes,
        youtube_urls: cleanUrls,
        content: patch.content !== undefined ? patch.content : existingLesson.content,
        updated_at: new Date().toISOString(),
      };

      // 2. Karena trigger database PostgreSQL memblokir UPDATE (immutable), gunakan atomic delete & re-insert
      const { error: delErr } = await supabase.from('edu_lessons').delete().eq('id', id);
      if (delErr) {
        return { success: false, error: delErr.message || 'Gagal memperbarui bab.' };
      }

      const { error: insErr } = await supabase.from('edu_lessons').insert(updatedLesson);
      if (insErr) {
        // Rollback data lama jika insert gagal
        await supabase.from('edu_lessons').insert(existingLesson);
        return { success: false, error: insErr.message || 'Gagal menyimpan pembaruan bab.' };
      }

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
      return { success: false, error: err?.message || 'Gagal menghapus bab edukasi.' };
    }
  }

  static async reorderLessons(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: existingLessons, error: fetchErr } = await supabase
        .from('edu_lessons')
        .select('*')
        .in('id', orderedIds);

      if (fetchErr || !existingLessons) return { success: false, error: fetchErr?.message };

      const updated = existingLessons.map((l) => ({
        ...l,
        sort_order: orderedIds.indexOf(l.id) + 1,
      }));

      await supabase.from('edu_lessons').delete().in('id', orderedIds);
      const { error: insErr } = await supabase.from('edu_lessons').insert(updated);
      if (insErr) {
        await supabase.from('edu_lessons').insert(existingLessons);
        return { success: false, error: insErr.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal mengubah urutan bab materi.' };
    }
  }
}
