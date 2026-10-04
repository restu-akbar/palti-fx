import { Trade } from './store';
import { supabase } from './supabase';

export class UserSyncService {
  /**
   * Memperbarui nama panggilan (full_name) langsung di tabel profiles Supabase.
   */
  static async updateProfileName(userId: string, name: string | null): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({ full_name: name ? name.trim() : null })
        .eq('id', userId);
    } catch (err) {
      console.warn('[UserSyncService.updateProfileName] Error:', err);
    }
  }

  /**
   * Mengambil seluruh data user dari cloud Supabase saat login / restore session:
   * 1. Progres Bab Edukasi (completed lessons)
   * 2. Pencapaian Medali (unlocked achievements)
   * 3. Catatan Jurnal Trading (trades)
   */
  static async fetchUserData(userId: string): Promise<{
    completed: Record<string, boolean>;
    unlocked: Record<string, number>;
    trades: Trade[];
  }> {
    const result: {
      completed: Record<string, boolean>;
      unlocked: Record<string, number>;
      trades: Trade[];
    } = {
      completed: {},
      unlocked: {},
      trades: [],
    };

    try {
      // 1. Fetch Lesson Progress
      const { data: progData } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, completed')
        .eq('user_id', userId);

      if (progData) {
        progData.forEach((row: any) => {
          if (row.completed) {
            result.completed[row.lesson_id] = true;
          }
        });
      }

      // 2. Fetch Achievements
      const { data: achData } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId);

      if (achData) {
        achData.forEach((row: any) => {
          const timestamp = row.unlocked_at ? new Date(row.unlocked_at).getTime() : Date.now();
          result.unlocked[row.achievement_id] = timestamp;
        });
      }

      // 3. Fetch Trades
      const { data: tradeData } = await supabase
        .from('user_trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (tradeData) {
        result.trades = tradeData.map((t: any) => ({
          id: t.id,
          date: t.date,
          symbol: t.symbol,
          direction: t.direction,
          lot: Number(t.lot) || 0.01,
          entry: t.entry ? Number(t.entry) : undefined,
          exit: t.exit ? Number(t.exit) : undefined,
          sl: t.sl ? Number(t.sl) : undefined,
          tp: t.tp ? Number(t.tp) : undefined,
          pl: Number(t.pl) || 0,
          pips: t.pips ? Number(t.pips) : undefined,
          setup: t.setup || undefined,
          emotion: t.emotion || undefined,
          notes: t.notes || undefined,
          createdAt: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
        }));
      }
    } catch (err) {
      console.warn('[UserSyncService.fetchUserData] Error fetching cloud data:', err);
    }

    return result;
  }

  /**
   * Menyimpan progres penyelesaian bab ke tabel user_lesson_progress di Supabase.
   */
  static async saveLessonProgress(userId: string, lessonId: string, completed: boolean): Promise<void> {
    try {
      if (completed) {
        await supabase.from('user_lesson_progress').upsert(
          {
            user_id: userId,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,lesson_id' }
        );
      } else {
        await supabase
          .from('user_lesson_progress')
          .delete()
          .eq('user_id', userId)
          .eq('lesson_id', lessonId);
      }
    } catch (err) {
      console.warn('[UserSyncService.saveLessonProgress] Error:', err);
    }
  }

  /**
   * Menyimpan medali pencapaian yang baru terbuka ke tabel user_achievements di Supabase.
   */
  static async saveAchievement(userId: string, achievementId: string, unlockedAt: number): Promise<void> {
    try {
      await supabase.from('user_achievements').upsert(
        {
          user_id: userId,
          achievement_id: achievementId,
          unlocked_at: new Date(unlockedAt).toISOString(),
        },
        { onConflict: 'user_id,achievement_id' }
      );
    } catch (err) {
      console.warn('[UserSyncService.saveAchievement] Error:', err);
    }
  }

  /**
   * Menyimpan trade jurnal ke tabel user_trades di Supabase.
   */
  static async saveTrade(userId: string, trade: Trade): Promise<void> {
    try {
      await supabase.from('user_trades').upsert(
        {
          id: trade.id,
          user_id: userId,
          date: trade.date,
          symbol: trade.symbol,
          direction: trade.direction,
          lot: trade.lot,
          entry: trade.entry,
          exit: trade.exit,
          sl: trade.sl,
          tp: trade.tp,
          pl: trade.pl,
          pips: trade.pips,
          setup: trade.setup,
          emotion: trade.emotion,
          notes: trade.notes,
          created_at: new Date(trade.createdAt).toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch (err) {
      console.warn('[UserSyncService.saveTrade] Error:', err);
    }
  }

  /**
   * Menghapus trade jurnal dari tabel user_trades di Supabase.
   */
  static async deleteTrade(userId: string, tradeId: string): Promise<void> {
    try {
      await supabase
        .from('user_trades')
        .delete()
        .eq('id', tradeId)
        .eq('user_id', userId);
    } catch (err) {
      console.warn('[UserSyncService.deleteTrade] Error:', err);
    }
  }
}
