import type { EduLesson, EduModule } from '../types/admin';

export function mapEduRows(dbMods: any[], dbLessons: any[] | null | undefined): EduModule[] {
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
}
