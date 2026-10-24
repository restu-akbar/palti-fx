import { Lesson, Module } from '../data/modules';

export interface MappedEduRows {
  modules: Module[];
  latestLessonUpdate: string | null;
  latestModuleUpdate: string | null;
}

export function mapEduRows(dbMods: any[], dbLessons: any[] | null | undefined): MappedEduRows {
  const lessonsByMod: Record<string, Lesson[]> = {};
  let latestLessonUpdate: string | null = null;

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

    const t = l.updated_at || l.created_at;
    if (t && (!latestLessonUpdate || t > latestLessonUpdate)) {
      latestLessonUpdate = t;
    }
  });

  let latestModuleUpdate: string | null = null;
  const modules: Module[] = dbMods.map((m: any) => {
    const t = m.updated_at || m.created_at;
    if (t && (!latestModuleUpdate || t > latestModuleUpdate)) {
      latestModuleUpdate = t;
    }
    return {
      id: m.id,
      title: m.title,
      subtitle: m.subtitle || '',
      level: m.level || 'Pemula',
      icon: m.icon || 'school-outline',
      sortOrder: m.sort_order ?? 0,
      lessons: lessonsByMod[m.id] || [],
    };
  });

  return { modules, latestLessonUpdate, latestModuleUpdate };
}
