import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openTestDb, TestDb } from './harness';

let db: TestDb;
beforeAll(async () => {
  db = await openTestDb();
});
afterAll(async () => {
  await db.close();
});

const PERMISSION_DENIED = '42501';

describe('delete_my_account', () => {
  it('member menghapus akunnya: profil, trade, dan progres ikut terhapus; akun lain utuh', () =>
    db.tx(async (s) => {
      const alice = { id: await s.member('alice@x.com') };
      const bob = { id: await s.member('bob@x.com') };
      await s.sql(`insert into public.user_trades (id, user_id, date, symbol, direction) values ('t-a', '${alice.id}', '2026-01-05', 'EURUSD', 'BUY'), ('t-b', '${bob.id}', '2026-01-05', 'EURUSD', 'SELL')`);
      await s.sql(`insert into public.user_lesson_progress (user_id, lesson_id) values ('${alice.id}', 'l1'), ('${bob.id}', 'l1')`);

      await s.run(alice, `select public.delete_my_account()`);

      expect(await s.rows('service', `select 1 from auth.users where id = $1`, [alice.id])).toHaveLength(0);
      expect(await s.rows('service', `select 1 from public.profiles where id = $1`, [alice.id])).toHaveLength(0);
      expect(await s.rows('service', `select 1 from public.user_trades where user_id = $1`, [alice.id])).toHaveLength(0);
      expect(await s.rows('service', `select 1 from public.user_lesson_progress where user_id = $1`, [alice.id])).toHaveLength(0);

      expect(await s.rows('service', `select 1 from auth.users where id = $1`, [bob.id])).toHaveLength(1);
      expect(await s.rows('service', `select 1 from public.user_trades where user_id = $1`, [bob.id])).toHaveLength(1);
      expect(await s.rows('service', `select 1 from public.user_lesson_progress where user_id = $1`, [bob.id])).toHaveLength(1);
    }));

  it('admin ditolak dan akunnya tetap ada', () =>
    db.tx(async (s) => {
      const admin = { id: await s.admin('admin@x.com') };
      await expect(s.run(admin, `select public.delete_my_account()`)).rejects.toMatchObject({ code: PERMISSION_DENIED });
      expect(await s.rows('service', `select 1 from auth.users where id = $1`, [admin.id])).toHaveLength(1);
    }));

  it('anon tidak boleh memanggil fungsi', () =>
    db.tx(async (s) => {
      await expect(s.run('anon', `select public.delete_my_account()`)).rejects.toMatchObject({ code: PERMISSION_DENIED });
    }));
});
