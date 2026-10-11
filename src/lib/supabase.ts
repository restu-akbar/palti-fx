import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Module, Lesson } from '../data/modules';

const SUPABASE_URL = 'https://xdeyntmcrdvhspkucclu.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZXludG1jcmR2aHNwa3VjY2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNDYzMzQsImV4cCI6MjEwNjYyMjMzNH0.f18NHyvz8qe4AVTG6kXWkQ2gLBM1lnuK2ZXFAYxgqgc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const CACHE_KEY = 'pfx.modules.cache.v1';

/**
 * Mengambil silabus modul dan bab pembelajaran langsung dari database Supabase.
 * Dilengkapi fallback cache offline AsyncStorage.
 */
export async function fetchEduModulesFromSupabase(): Promise<Module[] | null> {
  try {
    const { data: dbMods, error: modErr } = await supabase
      .from('edu_modules')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (modErr || !dbMods || dbMods.length === 0) {
      // Coba lewat direct REST jika client SDK terkendala jaringan
      return await fetchViaRest();
    }

    const { data: dbLessons, error: lesErr } = await supabase
      .from('edu_lessons')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (lesErr && !dbLessons) {
      return await fetchViaRest();
    }

    const lessonsByMod: Record<string, Lesson[]> = {};
    (dbLessons || []).forEach((l: any) => {
      const item: Lesson = {
        id: l.id,
        title: l.title,
        minutes: Number(l.minutes) || 5,
        content: l.content || '',
        youtube_urls: Array.isArray(l.youtube_urls) ? l.youtube_urls : [],
      };
      if (!lessonsByMod[l.module_id]) lessonsByMod[l.module_id] = [];
      lessonsByMod[l.module_id].push(item);
    });

    const parsedModules: Module[] = dbMods.map((m: any) => ({
      id: m.id,
      title: m.title,
      subtitle: m.subtitle || '',
      level: m.level || 'Pemula',
      icon: m.icon || 'school-outline',
      lessons: lessonsByMod[m.id] || [],
    }));

    // Simpan ke cache lokal agar saat offline tetap bisa dibuka
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsedModules)).catch(() => {});
    return parsedModules;
  } catch (err) {
    console.warn('[fetchEduModulesFromSupabase] Error fetching, trying REST fallback:', err);
    return await fetchViaRest();
  }
}

/**
 * Fallback REST API langsung via HTTPS fetch
 */
async function fetchViaRest(): Promise<Module[] | null> {
  try {
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const [modRes, lesRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/edu_modules?select=*&order=sort_order.asc,created_at.asc`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/edu_lessons?select=*&order=sort_order.asc,created_at.asc`, { headers }),
    ]);

    if (!modRes.ok) throw new Error(`Modules HTTP ${modRes.status}`);
    const mods = await modRes.json();
    const lessons = lesRes.ok ? await lesRes.json() : [];

    const lessonsByMod: Record<string, Lesson[]> = {};
    (lessons || []).forEach((l: any) => {
      const item: Lesson = {
        id: l.id,
        title: l.title,
        minutes: Number(l.minutes) || 5,
        content: l.content || '',
        youtube_urls: Array.isArray(l.youtube_urls) ? l.youtube_urls : [],
      };
      if (!lessonsByMod[l.module_id]) lessonsByMod[l.module_id] = [];
      lessonsByMod[l.module_id].push(item);
    });

    const parsed: Module[] = (mods || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      subtitle: m.subtitle || '',
      level: m.level || 'Pemula',
      icon: m.icon || 'school-outline',
      lessons: lessonsByMod[m.id] || [],
    }));

    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsed)).catch(() => {});
    return parsed;
  } catch (err) {
    console.warn('[fetchViaRest] Error, checking local cache:', err);
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached) as Module[];
    } catch {}
    return null;
  }
}

/**
 * Langganan Realtime Supabase untuk mendeteksi perubahan seketika saat admin mengedit silabus.
 */
export function subscribeToEduRealtime(onUpdate: () => void): () => void {
  try {
    const channel = supabase
      .channel('edu_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'edu_modules' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'edu_lessons' }, () => {
        onUpdate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
  } catch (err) {
    console.warn('[subscribeToEduRealtime] Error subscribing:', err);
    return () => {};
  }
}
