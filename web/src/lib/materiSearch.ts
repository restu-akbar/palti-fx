import type { EduLesson, EduModule } from '../types/admin';

export interface MatchedMateriItem {
  moduleId: string;
  moduleTitle: string;
  moduleIndex: number;
  moduleLevel: string;
  moduleIcon?: string;
  lessonId: string;
  lessonTitle: string;
  lessonIndex: number;
  minutes: number;
  hasVideo: boolean;
  matchType: 'title' | 'subbab' | 'content' | 'module';
  matchedSubbab?: string;
  snippet?: string;
  lesson: EduLesson;
}

/**
 * Mencari bab dan subbab di seluruh kurikulum berdasarkan kata kunci
 */
export function searchEduLessons(modules: EduModule[], rawQuery: string): MatchedMateriItem[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];

  const results: MatchedMateriItem[] = [];

  modules.forEach((mod, modIdx) => {
    const modTitle = mod.title || '';
    const lessons = mod.lessons || [];

    lessons.forEach((les, lesIdx) => {
      const lesTitle = les.title || '';
      const lesContent = les.content || '';
      const lesMinutes = les.minutes || 0;
      const hasVideo = !!(les.youtube_urls && les.youtube_urls.length > 0);

      // 1. Cek Judul Bab
      if (lesTitle.toLowerCase().includes(query)) {
        results.push({
          moduleId: mod.id,
          moduleTitle: modTitle,
          moduleIndex: modIdx + 1,
          moduleLevel: mod.level,
          moduleIcon: mod.icon,
          lessonId: les.id,
          lessonTitle: lesTitle,
          lessonIndex: lesIdx + 1,
          minutes: lesMinutes,
          hasVideo,
          matchType: 'title',
          lesson: les,
        });
        return;
      }

      // 2. Parse subbab & konten di dalam markdown
      const lines = lesContent.split('\n');
      let currentSubbab = '';
      let matchedSubbab: string | undefined;
      let matchedSnippet: string | undefined;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
        if (headingMatch) {
          currentSubbab = headingMatch[1].trim();
          if (currentSubbab.toLowerCase().includes(query)) {
            matchedSubbab = currentSubbab;
            break;
          }
        } else if (line.toLowerCase().includes(query)) {
          if (!matchedSnippet) {
            const clean = line.replace(/^[->*#]+\s*/, '').replace(/[*_`]/g, '').trim();
            if (clean) {
              const matchIdx = clean.toLowerCase().indexOf(query);
              const start = Math.max(0, matchIdx - 25);
              const end = Math.min(clean.length, matchIdx + query.length + 45);
              const snippetText = (start > 0 ? '...' : '') + clean.slice(start, end) + (end < clean.length ? '...' : '');
              matchedSnippet = snippetText;
              if (currentSubbab) {
                matchedSubbab = currentSubbab;
              }
            }
          }
        }
      }

      if (matchedSubbab) {
        results.push({
          moduleId: mod.id,
          moduleTitle: modTitle,
          moduleIndex: modIdx + 1,
          moduleLevel: mod.level,
          moduleIcon: mod.icon,
          lessonId: les.id,
          lessonTitle: lesTitle,
          lessonIndex: lesIdx + 1,
          minutes: lesMinutes,
          hasVideo,
          matchType: 'subbab',
          matchedSubbab,
          snippet: matchedSnippet,
          lesson: les,
        });
        return;
      }

      if (matchedSnippet) {
        results.push({
          moduleId: mod.id,
          moduleTitle: modTitle,
          moduleIndex: modIdx + 1,
          moduleLevel: mod.level,
          moduleIcon: mod.icon,
          lessonId: les.id,
          lessonTitle: lesTitle,
          lessonIndex: lesIdx + 1,
          minutes: lesMinutes,
          hasVideo,
          matchType: 'content',
          snippet: matchedSnippet,
          lesson: les,
        });
        return;
      }

      // 3. Cek Judul Modul
      if (modTitle.toLowerCase().includes(query)) {
        results.push({
          moduleId: mod.id,
          moduleTitle: modTitle,
          moduleIndex: modIdx + 1,
          moduleLevel: mod.level,
          moduleIcon: mod.icon,
          lessonId: les.id,
          lessonTitle: lesTitle,
          lessonIndex: lesIdx + 1,
          minutes: lesMinutes,
          hasVideo,
          matchType: 'module',
          lesson: les,
        });
      }
    });
  });

  return results;
}
