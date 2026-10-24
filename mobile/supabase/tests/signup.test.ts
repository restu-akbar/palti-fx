import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openTestDb, TestDb } from './harness';

let db: TestDb;
beforeAll(async () => {
  db = await openTestDb();
});
afterAll(async () => {
  await db.close();
});

const hashOf = (code: string) => `encode(sha256(convert_to('${code}', 'UTF8')), 'hex')`;
const addInvite = (s: { sql: (t: string) => Promise<unknown> }, code: string) =>
  s.sql(`insert into public.invitations (code_hash, code_hint) values (${hashOf(code)}, 'label')`);

describe('normalize_invite_code', () => {
  it('huruf besar, tanpa spasi dan strip, null aman', () =>
    db.tx(async (s) => {
      const r = await s.rows<{ a: string; b: string }>(
        'service',
        `select public.normalize_invite_code(' pfx - vip 7k9a2 ') as a, public.normalize_invite_code(null) as b`
      );
      expect(r[0]).toEqual({ a: 'PFXVIP7K9A2', b: '' });
    }));
});

describe('trigger handle_new_user: pendaftaran member', () => {
  it('kode undangan valid membuat profil member aktif dan menghanguskan undangan', () =>
    db.tx(async (s) => {
      await addInvite(s, 'ABCD1234');
      await s.sql(
        `insert into auth.users (email, raw_user_meta_data) values ('  Budi@Mail.COM ', '{"invitation_code":"abcd-1234","full_name":"Budi S"}')`
      );

      const [p] = await s.rows<Record<string, string>>('service', `select * from public.profiles`);
      expect(p).toMatchObject({ email: 'budi@mail.com', full_name: 'Budi S', role: 'member', status: 'active' });
      expect(p.member_id).toMatch(/^PFX-[0-9A-F]{8}$/);

      const [inv] = await s.rows<{ is_used: boolean; used_at: string | null }>('service', `select is_used, used_at from public.invitations where code_hint = 'label'`);
      expect(inv.is_used).toBe(true);
      expect(inv.used_at).not.toBeNull();
    }));

  it('email otomatis terkonfirmasi', () =>
    db.tx(async (s) => {
      await s.member('a@x.com');
      const [u] = await s.rows<{ email_confirmed_at: string | null }>('service', `select email_confirmed_at from auth.users`);
      expect(u.email_confirmed_at).not.toBeNull();
    }));

  it('nama bawaan diambil dari bagian lokal email bila tidak diisi', () =>
    db.tx(async (s) => {
      await s.member('dio.putra@x.com');
      const [p] = await s.rows<{ full_name: string }>('service', `select full_name from public.profiles`);
      expect(p.full_name).toBe('dio.putra');
    }));

  it('kode salah ditolak dan tidak ada akun maupun profil yang tertinggal', () =>
    db.tx(async (s) => {
      await addInvite(s, 'ABCD1234');
      await expect(
        s.sql(`insert into auth.users (email, raw_user_meta_data) values ('x@x.com', '{"invitation_code":"SALAH999"}')`)
      ).rejects.toMatchObject({ code: 'P0001', message: expect.stringContaining('Kode undangan') });

      expect((await s.rows('service', `select 1 from auth.users`)).length).toBe(0);
      expect((await s.rows('service', `select 1 from public.profiles`)).length).toBe(0);
      expect((await s.rows<{ is_used: boolean }>('service', `select is_used from public.invitations where code_hint = 'label'`))[0].is_used).toBe(false);
    }));

  it('kode yang sudah dipakai tidak bisa dipakai lagi', () =>
    db.tx(async (s) => {
      await addInvite(s, 'ABCD1234');
      await s.sql(`insert into auth.users (email, raw_user_meta_data) values ('a@x.com', '{"invitation_code":"ABCD1234"}')`);
      await expect(
        s.sql(`insert into auth.users (email, raw_user_meta_data) values ('b@x.com', '{"invitation_code":"ABCD1234"}')`)
      ).rejects.toMatchObject({ code: 'P0001' });
    }));

  it('tanpa kode ditolak selama pendaftaran manual dimatikan', () =>
    db.tx(async (s) => {
      await expect(s.sql(`insert into auth.users (email) values ('x@x.com')`)).rejects.toMatchObject({
        code: 'P0001',
        message: expect.stringContaining('kode undangan resmi'),
      });
    }));

  it('saklar allow_manual_signup mengizinkan pendaftaran tanpa kode', () =>
    db.tx(async (s) => {
      await s.sql(`update public.app_config set bool_value = true where key = 'allow_manual_signup'`);
      await s.sql(`insert into auth.users (email) values ('x@x.com')`);
      expect((await s.rows<{ role: string }>('service', `select role from public.profiles`))[0].role).toBe('member');
    }));

  it('role dalam undangan tidak menaikkan hak: pendaftar undangan selalu member', () =>
    db.tx(async (s) => {
      await s.sql(`insert into public.invitations (code_hash, role) values (${hashOf('ADMIN123')}, 'admin')`);
      await s.sql(`insert into auth.users (email, raw_user_meta_data) values ('a@x.com', '{"invitation_code":"ADMIN123"}')`);
      expect((await s.rows<{ role: string }>('service', `select role from public.profiles`))[0].role).toBe('member');
    }));
});

describe('trigger handle_new_user: jalur admin', () => {
  it('email admin resmi tidak butuh kode undangan', () =>
    db.tx(async (s) => {
      await s.sql(`insert into auth.users (email) values ('DioRaput@Gmail.com')`);
      expect((await s.rows<{ role: string }>('service', `select role from public.profiles`))[0].role).toBe('admin');
    }));

  it('metadata role=admin tanpa kode undangan tetap ditolak', () =>
    db.tx(async (s) => {
      await expect(
        s.sql(`insert into auth.users (email, raw_user_meta_data) values ('penyusup@x.com', '{"role":"admin"}')`)
      ).rejects.toMatchObject({ code: 'P0001' });
    }));

  it('metadata role=admin bersama kode undangan valid tetap menjadi member', () =>
    db.tx(async (s) => {
      await addInvite(s, 'ABCD1234');
      await s.sql(`insert into auth.users (email, raw_user_meta_data) values ('a@x.com', '{"role":"admin","invitation_code":"ABCD1234"}')`);
      expect((await s.rows<{ role: string }>('service', `select role from public.profiles`))[0].role).toBe('member');
    }));
});

describe('trigger profil', () => {
  it('member_id unik untuk banyak akun', () =>
    db.tx(async (s) => {
      for (let i = 0; i < 20; i++) await s.member(`u${i}@x.com`);
      const [r] = await s.rows<{ n: string; d: string }>('service', `select count(*) n, count(distinct member_id) d from public.profiles`);
      expect(r.n).toBe('20');
      expect(r.d).toBe('20');
    }));

  it('perubahan email akun disinkronkan ke profil (huruf kecil, dipangkas)', () =>
    db.tx(async (s) => {
      const id = await s.member('lama@x.com');
      await s.sql(`update auth.users set email = '  BARU@X.com ' where id = $1`, [id]);
      expect((await s.rows<{ email: string }>('service', `select email from public.profiles`))[0].email).toBe('baru@x.com');
    }));

  it('suspend profil mem-ban akun Auth, aktifkan kembali menghapus ban', () =>
    db.tx(async (s) => {
      const id = await s.member('a@x.com');
      const banned = () => s.rows<{ b: string | null }>('service', `select banned_until::text b from auth.users where id = $1`, [id]);

      await s.sql(`update public.profiles set status = 'suspended' where id = $1`, [id]);
      expect((await banned())[0].b).not.toBeNull();
      const [{ future }] = await s.rows<{ future: boolean }>('service', `select banned_until > now() + interval '50 years' as future from auth.users where id = $1`, [id]);
      expect(future).toBe(true);

      await s.sql(`update public.profiles set status = 'active' where id = $1`, [id]);
      expect((await banned())[0].b).toBeNull();
    }));

  it('mengubah kolom lain tidak menyentuh status ban', () =>
    db.tx(async (s) => {
      const id = await s.member('a@x.com');
      await s.sql(`update auth.users set banned_until = now() + interval '1 day' where id = $1`, [id]);
      await s.sql(`update public.profiles set full_name = 'Baru' where id = $1`, [id]);
      expect((await s.rows<{ b: string | null }>('service', `select banned_until::text b from auth.users`))[0].b).not.toBeNull();
    }));

  it('updated_at diperbarui otomatis saat profil berubah', () =>
    db.tx(async (s) => {
      const id = await s.member('a@x.com');
      await s.sql(`update public.profiles set updated_at = now() - interval '1 day' where id = $1`, [id]);
      await s.sql(`select pg_sleep(0.01)`);
      await s.sql(`update public.profiles set full_name = 'Baru' where id = $1`, [id]);
      const [r] = await s.rows<{ fresh: boolean }>('service', `select updated_at > now() - interval '1 minute' as fresh from public.profiles where id = $1`, [id]);
      expect(r.fresh).toBe(true);
    }));

  it('constraint role dan status', () =>
    db.tx(async (s) => {
      const id = await s.member('a@x.com');
      await expect(s.sql(`update public.profiles set role = 'owner' where id = $1`, [id])).rejects.toMatchObject({ code: '23514' });
      await expect(s.sql(`update public.profiles set status = 'banned' where id = $1`, [id])).rejects.toMatchObject({ code: '23514' });
    }));

  it('menghapus akun Auth menghapus profil dan datanya (cascade)', () =>
    db.tx(async (s) => {
      const id = await s.member('a@x.com');
      await s.sql(`insert into public.user_trades (id, user_id, date, symbol, direction) values ('t1', $1, '2026-01-05', 'EURUSD', 'BUY')`, [id]);
      await s.sql(`insert into public.user_lesson_progress (user_id, lesson_id) values ($1, 'l1')`, [id]);

      await s.sql(`delete from auth.users where id = $1`, [id]);

      for (const t of ['profiles', 'user_trades', 'user_lesson_progress']) {
        expect((await s.rows('service', `select 1 from public.${t}`)).length).toBe(0);
      }
    }));
});

describe('RPC resolve_member_email', () => {
  it('ID member (tanpa peka huruf besar/spasi) diubah menjadi email', () =>
    db.tx(async (s) => {
      await s.member('Dio@X.com');
      const [{ member_id }] = await s.rows<{ member_id: string }>('service', `select member_id from public.profiles`);
      for (const input of [member_id, member_id.toLowerCase(), `  ${member_id}  `]) {
        const [r] = await s.rows<{ e: string | null }>('anon', `select public.resolve_member_email($1) as e`, [input]);
        expect(r.e).toBe('dio@x.com');
      }
    }));

  it('ID tak dikenal mengembalikan null dan tidak melempar error', () =>
    db.tx(async (s) => {
      const [r] = await s.rows<{ e: string | null }>('anon', `select public.resolve_member_email('PFX-00000000') as e`);
      expect(r.e).toBeNull();
    }));

  it('hanya menerima ID member, bukan email', () =>
    db.tx(async (s) => {
      await s.member('dio@x.com');
      const [r] = await s.rows<{ e: string | null }>('anon', `select public.resolve_member_email('dio@x.com') as e`);
      expect(r.e).toBeNull();
    }));
});
