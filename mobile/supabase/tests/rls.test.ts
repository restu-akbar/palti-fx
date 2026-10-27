import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openTestDb, Session, TestDb } from './harness';

let db: TestDb;
beforeAll(async () => {
  db = await openTestDb();
});
afterAll(async () => {
  await db.close();
});

const PERMISSION_DENIED = '42501';

async function world(s: Session) {
  const alice = await s.member('alice@x.com');
  const bob = await s.member('bob@x.com');
  const admin = await s.admin('admin@x.com');
  return { alice: { id: alice }, bob: { id: bob }, admin: { id: admin } };
}

const trade = (id: string, userId: string, extra = '') =>
  `insert into public.user_trades (id, user_id, date, symbol, direction${extra ? ', ' + extra.split('=')[0] : ''}) values ('${id}', '${userId}', '2026-01-05', 'EURUSD', 'BUY'${extra ? ', ' + extra.split('=')[1] : ''})`;

describe('RLS profiles', () => {
  it('member hanya melihat profilnya sendiri', () =>
    db.tx(async (s) => {
      const w = await world(s);
      const rows = await s.rows<{ id: string }>(w.alice, `select id from public.profiles`);
      expect(rows.map((r) => r.id)).toEqual([w.alice.id]);
    }));

  it('admin melihat semua profil', () =>
    db.tx(async (s) => {
      const w = await world(s);
      expect((await s.rows(w.admin, `select id from public.profiles`)).length).toBe(3);
    }));

  it('anon tidak melihat profil apa pun', () =>
    db.tx(async (s) => {
      await world(s);
      expect((await s.rows('anon', `select id from public.profiles`)).length).toBe(0);
    }));

  it('member dapat mengubah nama sendiri tetapi bukan milik orang lain', () =>
    db.tx(async (s) => {
      const w = await world(s);
      const own = await s.run(w.alice, `update public.profiles set full_name = 'Alice Baru' where id = $1`, [w.alice.id]);
      expect(own.rowCount).toBe(1);
      const other = await s.run(w.alice, `update public.profiles set full_name = 'Diretas' where id = $1`, [w.bob.id]);
      expect(other.rowCount).toBe(0);
      expect((await s.rows<{ full_name: string }>('service', `select full_name from public.profiles where id = $1`, [w.bob.id]))[0].full_name).toBe('bob');
    }));

  it('admin dapat menangguhkan member dan ban Auth ikut terpasang', () =>
    db.tx(async (s) => {
      const w = await world(s);
      const r = await s.run(w.admin, `update public.profiles set status = 'suspended' where id = $1`, [w.alice.id]);
      expect(r.rowCount).toBe(1);
      expect((await s.rows<{ b: string | null }>('service', `select banned_until::text b from auth.users where id = $1`, [w.alice.id]))[0].b).not.toBeNull();
    }));

  it('admin dapat mengubah role (dipakai halaman Pengguna di web admin)', () =>
    db.tx(async (s) => {
      const w = await world(s);
      const r = await s.run(w.admin, `update public.profiles set role = 'admin' where id = $1`, [w.alice.id]);
      expect(r.rowCount).toBe(1);
    }));

  it('member tidak dapat menyisipkan atau menghapus profil', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await expect(
        s.run(w.alice, `insert into public.profiles (id, member_id, email) values (gen_random_uuid(), 'PFX-HACK0001', 'h@x.com')`)
      ).rejects.toMatchObject({ code: PERMISSION_DENIED });
      expect((await s.run(w.alice, `delete from public.profiles where id = $1`, [w.bob.id])).rowCount).toBe(0);
    }));

  it('member tidak boleh menaikkan role dirinya sendiri menjadi admin', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await expect(
        s.run(w.alice, `update public.profiles set role = 'admin' where id = $1`, [w.alice.id])
      ).rejects.toMatchObject({ code: PERMISSION_DENIED });
    }));

  it('member yang ditangguhkan tidak dapat mengaktifkan dirinya kembali', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await s.sql(`update public.profiles set status = 'suspended' where id = $1`, [w.alice.id]);
      await expect(
        s.run(w.alice, `update public.profiles set status = 'active' where id = $1`, [w.alice.id])
      ).rejects.toMatchObject({ code: PERMISSION_DENIED });
      expect((await s.rows<{ b: string | null }>('service', `select banned_until::text b from auth.users where id = $1`, [w.alice.id]))[0].b).not.toBeNull();
    }));

  it('member tidak dapat mengubah email, member_id, atau id profilnya', () =>
    db.tx(async (s) => {
      const w = await world(s);
      for (const col of [`email = 'baru@x.com'`, `member_id = 'PFX-PALSU001'`, `id = gen_random_uuid()`]) {
        await expect(s.run(w.alice, `update public.profiles set ${col} where id = $1`, [w.alice.id])).rejects.toMatchObject({ code: PERMISSION_DENIED });
      }
    }));

  it('perubahan nama oleh member tetap berjalan bersama updated_at otomatis', () =>
    db.tx(async (s) => {
      const w = await world(s);
      const r = await s.run(w.alice, `update public.profiles set full_name = 'Alice Baru' where id = $1 returning full_name`, [w.alice.id]);
      expect(r.rows[0].full_name).toBe('Alice Baru');
    }));

  it('perubahan email akun (proses internal Auth) tetap tersinkron ke profil', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await s.sql(`update auth.users set email = 'alice.baru@x.com' where id = $1`, [w.alice.id]);
      expect((await s.rows<{ email: string }>('service', `select email from public.profiles where id = $1`, [w.alice.id]))[0].email).toBe('alice.baru@x.com');
    }));

  it('admin dapat mengubah email dan role profil lain, service_role tidak dibatasi', () =>
    db.tx(async (s) => {
      const w = await world(s);
      expect((await s.run(w.admin, `update public.profiles set email = 'x@x.com', role = 'admin' where id = $1`, [w.alice.id])).rowCount).toBe(1);
      expect((await s.run('service', `update public.profiles set role = 'member' where id = $1`, [w.alice.id])).rowCount).toBe(1);
    }));
});

describe('RLS invitations & app_config', () => {
  it('admin mengelola undangan penuh (baca, tambah, ubah, hapus)', () =>
    db.tx(async (s) => {
      const w = await world(s);
      const ins = await s.run(w.admin, `insert into public.invitations (code_hash, code_hint) values ('h1', 'Budi') returning id`);
      const id = ins.rows[0].id;
      expect((await s.rows(w.admin, `select 1 from public.invitations where id = $1`, [id])).length).toBe(1);
      expect((await s.run(w.admin, `update public.invitations set is_used = true where id = $1`, [id])).rowCount).toBe(1);
      expect((await s.run(w.admin, `delete from public.invitations where id = $1`, [id])).rowCount).toBe(1);
    }));

  it('member tidak melihat, menambah, mengubah, atau menghapus undangan', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await s.sql(`insert into public.invitations (code_hash, code_hint) values ('h1', 'x')`);
      expect((await s.rows(w.alice, `select 1 from public.invitations`)).length).toBe(0);
      await expect(s.run(w.alice, `insert into public.invitations (code_hash) values ('h2')`)).rejects.toMatchObject({ code: PERMISSION_DENIED });
      expect((await s.run(w.alice, `update public.invitations set is_used = true`)).rowCount).toBe(0);
      expect((await s.run(w.alice, `delete from public.invitations`)).rowCount).toBe(0);
    }));

  it('anon tidak melihat undangan', () =>
    db.tx(async (s) => {
      await world(s);
      expect((await s.rows('anon', `select 1 from public.invitations`)).length).toBe(0);
    }));

  it('hash kode undangan unik', () =>
    db.tx(async (s) => {
      await s.sql(`insert into public.invitations (code_hash) values ('dup')`);
      await expect(s.sql(`insert into public.invitations (code_hash) values ('dup')`)).rejects.toMatchObject({ code: '23505' });
    }));

  it('app_config tertutup untuk anon dan authenticated', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await expect(s.run('anon', `select * from public.app_config`)).rejects.toMatchObject({ code: PERMISSION_DENIED });
      await expect(s.run(w.admin, `select * from public.app_config`)).rejects.toMatchObject({ code: PERMISSION_DENIED });
      await expect(s.run(w.alice, `update public.app_config set bool_value = true`)).rejects.toMatchObject({ code: PERMISSION_DENIED });
    }));
});

describe('RLS data pengguna (jurnal & progres)', () => {
  it('pemilik dapat membuat, membaca, mengubah, dan menghapus trade sendiri', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await s.run(w.alice, trade('t1', w.alice.id));
      expect((await s.rows(w.alice, `select 1 from public.user_trades`)).length).toBe(1);
      expect((await s.run(w.alice, `update public.user_trades set pl = 5 where id = 't1'`)).rowCount).toBe(1);
      expect((await s.run(w.alice, `delete from public.user_trades where id = 't1'`)).rowCount).toBe(1);
    }));

  it('user lain tidak dapat melihat, mengubah, atau menghapus trade orang lain', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await s.sql(trade('t1', w.alice.id));
      expect((await s.rows(w.bob, `select 1 from public.user_trades`)).length).toBe(0);
      expect((await s.run(w.bob, `update public.user_trades set pl = 999 where id = 't1'`)).rowCount).toBe(0);
      expect((await s.run(w.bob, `delete from public.user_trades where id = 't1'`)).rowCount).toBe(0);
      expect((await s.rows<{ pl: string }>('service', `select pl from public.user_trades`))[0].pl).toBe('0');
    }));

  it('admin pun tidak otomatis dapat membaca jurnal member', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await s.sql(trade('t1', w.alice.id));
      expect((await s.rows(w.admin, `select 1 from public.user_trades`)).length).toBe(0);
    }));

  it('tidak boleh menulis trade atas nama user lain', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await expect(s.run(w.bob, trade('t1', w.alice.id))).rejects.toMatchObject({ code: PERMISSION_DENIED });
    }));

  it('tidak boleh memindahkan trade sendiri ke user lain', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await s.sql(trade('t1', w.alice.id));
      await expect(s.run(w.alice, `update public.user_trades set user_id = $1 where id = 't1'`, [w.bob.id])).rejects.toMatchObject({ code: PERMISSION_DENIED });
    }));

  it('upsert dengan id yang sama milik user lain tidak menimpa data aslinya', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await s.sql(trade('t1', w.alice.id, `pl=10`));
      await expect(
        s.run(w.bob, `insert into public.user_trades (id, user_id, date, symbol, direction, pl) values ('t1', $1, 'x', 'HACK', 'SELL', -1) on conflict (id) do update set pl = excluded.pl, symbol = excluded.symbol`, [w.bob.id])
      ).rejects.toThrow();
      expect((await s.rows<{ pl: string; symbol: string }>('service', `select pl, symbol from public.user_trades`))[0]).toEqual({ pl: '10', symbol: 'EURUSD' });
    }));

  it('anon tidak dapat membaca atau menulis jurnal', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await s.sql(trade('t1', w.alice.id));
      expect((await s.rows('anon', `select 1 from public.user_trades`)).length).toBe(0);
      await expect(s.run('anon', trade('t2', w.alice.id))).rejects.toThrow();
    }));

  it('constraint arah trade dan nilai bawaan', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await expect(
        s.run(w.alice, `insert into public.user_trades (id, user_id, date, symbol, direction) values ('t', $1, 'd', 's', 'HOLD')`, [w.alice.id])
      ).rejects.toMatchObject({ code: '23514' });
      await s.run(w.alice, trade('t1', w.alice.id));
      const [r] = await s.rows<{ lot: string; pl: string }>(w.alice, `select lot, pl from public.user_trades`);
      expect(r).toEqual({ lot: '0.01', pl: '0' });
    }));

  it('progres bab terisolasi per user dan upsert per (user, bab) berjalan', () =>
    db.tx(async (s) => {
      const w = await world(s);
      const upsert = `insert into public.user_lesson_progress (user_id, lesson_id, completed) values ($1, 'dasar-1', true) on conflict (user_id, lesson_id) do update set completed = excluded.completed`;
      await s.run(w.alice, upsert, [w.alice.id]);
      await s.run(w.alice, upsert, [w.alice.id]);
      expect((await s.rows(w.alice, `select 1 from public.user_lesson_progress`)).length).toBe(1);
      expect((await s.rows(w.bob, `select 1 from public.user_lesson_progress`)).length).toBe(0);
      await expect(s.run(w.bob, upsert, [w.alice.id])).rejects.toMatchObject({ code: PERMISSION_DENIED });
    }));
});

describe('RLS materi edukasi', () => {
  const mod = `insert into public.edu_modules (id, title) values ('m1', 'Modul')`;
  const les = `insert into public.edu_lessons (id, module_id, title) values ('l1', 'm1', 'Bab')`;

  it('semua orang termasuk anon dapat membaca materi', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await s.sql(mod);
      await s.sql(les);
      for (const actor of ['anon', w.alice, w.admin] as const) {
        expect((await s.rows(actor, `select 1 from public.edu_modules`)).length).toBe(1);
        expect((await s.rows(actor, `select 1 from public.edu_lessons`)).length).toBe(1);
      }
    }));

  it('hanya admin yang dapat menambah materi', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await s.run(w.admin, mod);
      await s.run(w.admin, les);
      await expect(s.run(w.alice, `insert into public.edu_modules (id, title) values ('m2', 'x')`)).rejects.toMatchObject({ code: PERMISSION_DENIED });
      await expect(s.run('anon', `insert into public.edu_modules (id, title) values ('m3', 'x')`)).rejects.toMatchObject({ code: PERMISSION_DENIED });
      await expect(s.run(w.alice, `insert into public.edu_lessons (module_id, title) values ('m1', 'x')`)).rejects.toMatchObject({ code: PERMISSION_DENIED });
    }));

  it('hanya admin yang dapat menghapus materi; menghapus modul ikut menghapus babnya', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await s.sql(mod);
      await s.sql(les);
      expect((await s.run(w.alice, `delete from public.edu_modules`)).rowCount).toBe(0);
      expect((await s.run('anon', `delete from public.edu_lessons`)).rowCount).toBe(0);
      expect((await s.run(w.admin, `delete from public.edu_modules where id = 'm1'`)).rowCount).toBe(1);
      expect((await s.rows('service', `select 1 from public.edu_lessons`)).length).toBe(0);
    }));

  it('materi immutable: UPDATE ditolak trigger walau oleh admin', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await s.sql(mod);
      await s.sql(les);
      await expect(s.run(w.admin, `update public.edu_modules set title = 'Baru' where id = 'm1'`)).rejects.toMatchObject({ code: 'P0001', message: expect.stringContaining('immutable') });
      await expect(s.run(w.admin, `update public.edu_lessons set sort_order = 2 where id = 'l1'`)).rejects.toMatchObject({ code: 'P0001' });
      await expect(s.sql(`update public.edu_lessons set title = 'x'`)).rejects.toMatchObject({ code: 'P0001' });
    }));

  it('bab harus merujuk modul yang ada; level dibatasi', () =>
    db.tx(async (s) => {
      await expect(s.sql(`insert into public.edu_lessons (module_id, title) values ('tidak-ada', 'x')`)).rejects.toMatchObject({ code: '23503' });
      await expect(s.sql(`insert into public.edu_modules (title, level) values ('x', 'Dewa')`)).rejects.toMatchObject({ code: '23514' });
    }));

  it('id modul dan bab dibuat otomatis dengan prefiks', () =>
    db.tx(async (s) => {
      await s.sql(`insert into public.edu_modules (title) values ('x')`);
      const [m] = await s.rows<{ id: string }>('service', `select id from public.edu_modules`);
      expect(m.id).toMatch(/^mod-[0-9a-f]{8}$/);
      await s.sql(`insert into public.edu_lessons (module_id, title) values ($1, 'x')`, [m.id]);
      expect((await s.rows<{ id: string }>('service', `select id from public.edu_lessons`))[0].id).toMatch(/^les-[0-9a-f]{8}$/);
    }));
});

describe('RPC & hak eksekusi fungsi', () => {
  it('get_admin_dashboard_stats: admin berhasil, member ditolak, anon tidak punya hak', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await s.sql(`insert into public.invitations (code_hash) values ('a'), ('b')`);
      await s.sql(`update public.invitations set is_used = true where code_hash = 'b'`);

      const [r] = await s.rows<{ stats: Record<string, number> }>(w.admin, `select public.get_admin_dashboard_stats() as stats`);
      expect(r.stats).toMatchObject({ total_users: 3, active_users: 3, used_invites: 4, active_invites: 2 });

      await expect(s.run(w.alice, `select public.get_admin_dashboard_stats()`)).rejects.toMatchObject({ code: PERMISSION_DENIED });
      await expect(s.run('anon', `select public.get_admin_dashboard_stats()`)).rejects.toMatchObject({ code: PERMISSION_DENIED });
    }));

  it('fungsi internal tidak dapat dipanggil dari klien', () =>
    db.tx(async (s) => {
      const w = await world(s);
      for (const actor of ['anon', w.alice] as const) {
        await expect(s.run(actor, `select public.generate_member_id()`)).rejects.toMatchObject({ code: PERMISSION_DENIED });
        await expect(s.run(actor, `select public.handle_new_user()`)).rejects.toMatchObject({ code: PERMISSION_DENIED });
        await expect(s.run(actor, `select public.sync_profile_ban()`)).rejects.toMatchObject({ code: PERMISSION_DENIED });
        await expect(s.run(actor, `select public.sync_profile_email()`)).rejects.toMatchObject({ code: PERMISSION_DENIED });
      }
    }));

  it('is_admin: true hanya untuk admin, false untuk member dan anon', () =>
    db.tx(async (s) => {
      const w = await world(s);
      expect((await s.rows<{ v: boolean }>(w.admin, `select public.is_admin() v`))[0].v).toBe(true);
      expect((await s.rows<{ v: boolean }>(w.alice, `select public.is_admin() v`))[0].v).toBe(false);
    }));
});

describe('RLS storage gambar materi', () => {
  const put = (name: string, bucket = 'lesson-images') =>
    `insert into storage.objects (bucket_id, name) values ('${bucket}', '${name}')`;

  it('bucket lesson-images publik, dibatasi 5 MB dan tanpa SVG', () =>
    db.tx(async (s) => {
      const [b] = await s.rows<{ public: boolean; file_size_limit: string; allowed_mime_types: string[] }>(
        'service',
        `select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'lesson-images'`
      );
      expect(b.public).toBe(true);
      expect(Number(b.file_size_limit)).toBe(5 * 1024 * 1024);
      expect(b.allowed_mime_types).not.toContain('image/svg+xml');
    }));

  it('admin dapat mengunggah dan menghapus gambar', () =>
    db.tx(async (s) => {
      const w = await world(s);
      expect((await s.run(w.admin, put('lessons/2026/01/a.webp'))).rowCount).toBe(1);
      expect((await s.run(w.admin, `delete from storage.objects where name = 'lessons/2026/01/a.webp'`)).rowCount).toBe(1);
    }));

  it('member dan anon tidak dapat mengunggah', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await expect(s.run(w.alice, put('lessons/x.webp'))).rejects.toMatchObject({ code: PERMISSION_DENIED });
      await expect(s.run('anon', put('lessons/x.webp'))).rejects.toMatchObject({ code: PERMISSION_DENIED });
    }));

  it('member tidak dapat menghapus atau mengubah gambar admin', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await s.run(w.admin, put('lessons/y.webp'));
      expect((await s.run(w.alice, `delete from storage.objects where name = 'lessons/y.webp'`)).rowCount).toBe(0);
      expect((await s.run(w.alice, `update storage.objects set name = 'z' where name = 'lessons/y.webp'`)).rowCount).toBe(0);
    }));

  it('gambar dapat dibaca publik, bucket lain tidak terbuka untuk admin', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await s.run(w.admin, put('lessons/y.webp'));
      expect((await s.rows('anon', `select name from storage.objects where bucket_id = 'lesson-images'`)).length).toBe(1);
      await s.sql(`insert into storage.buckets (id, name) values ('lain', 'lain')`);
      await expect(s.run(w.admin, put('a.webp', 'lain'))).rejects.toMatchObject({ code: PERMISSION_DENIED });
    }));
});

describe('RLS storage video materi', () => {
  const put = (name: string, bucket = 'lesson-videos') =>
    `insert into storage.objects (bucket_id, name) values ('${bucket}', '${name}')`;

  it('bucket lesson-videos publik, dibatasi 50 MB, hanya MP4/WebM', () =>
    db.tx(async (s) => {
      const [b] = await s.rows<{ public: boolean; file_size_limit: string; allowed_mime_types: string[] }>(
        'service',
        `select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'lesson-videos'`
      );
      expect(b.public).toBe(true);
      expect(Number(b.file_size_limit)).toBe(50 * 1024 * 1024);
      expect(b.allowed_mime_types).toEqual(['video/mp4', 'video/webm']);
    }));

  it('admin dapat mengunggah dan menghapus video', () =>
    db.tx(async (s) => {
      const w = await world(s);
      expect((await s.run(w.admin, put('lessons/2026/01/a.mp4'))).rowCount).toBe(1);
      expect((await s.run(w.admin, `delete from storage.objects where name = 'lessons/2026/01/a.mp4'`)).rowCount).toBe(1);
    }));

  it('member dan anon tidak dapat mengunggah, tetapi anon dapat membaca', () =>
    db.tx(async (s) => {
      const w = await world(s);
      await expect(s.run(w.alice, put('lessons/x.mp4'))).rejects.toMatchObject({ code: PERMISSION_DENIED });
      await expect(s.run('anon', put('lessons/x.mp4'))).rejects.toMatchObject({ code: PERMISSION_DENIED });
      await s.run(w.admin, put('lessons/y.mp4'));
      expect((await s.rows('anon', `select name from storage.objects where bucket_id = 'lesson-videos'`)).length).toBe(1);
      expect((await s.run(w.alice, `delete from storage.objects where name = 'lessons/y.mp4'`)).rowCount).toBe(0);
    }));
});
