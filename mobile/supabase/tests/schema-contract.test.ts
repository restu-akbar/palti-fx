import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openTestDb, TestDb } from './harness';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlFile = (name: string) => readFileSync(path.join(here, '..', name), 'utf8');

let db: TestDb;
beforeAll(async () => {
  db = await openTestDb();
});
afterAll(async () => {
  await db.close();
});


describe('kontrak skema dengan kode aplikasi', () => {
  it('tabel dan kolom yang dipakai mobile dan web tersedia', () =>
    db.tx(async (s) => {
      const expected: Record<string, string[]> = {
        profiles: ['id', 'member_id', 'full_name', 'email', 'role', 'status', 'created_at', 'updated_at'],
        invitations: ['id', 'code_hash', 'code_hint', 'role', 'is_used', 'used_at', 'created_at'],
        edu_modules: ['id', 'title', 'subtitle', 'level', 'icon', 'sort_order', 'created_at'],
        edu_lessons: ['id', 'module_id', 'title', 'minutes', 'youtube_urls', 'content', 'sort_order', 'created_at'],
        user_lesson_progress: ['user_id', 'lesson_id', 'completed', 'completed_at'],
        user_trades: ['id', 'user_id', 'date', 'symbol', 'direction', 'lot', 'entry', 'exit', 'sl', 'tp', 'pl', 'pips', 'setup', 'emotion', 'notes', 'created_at'],
      };
      for (const [table, cols] of Object.entries(expected)) {
        const rows = await s.rows<{ column_name: string }>('service', `select column_name from information_schema.columns where table_schema = 'public' and table_name = $1`, [table]);
        const have = rows.map((r) => r.column_name);
        expect({ table, missing: cols.filter((c) => !have.includes(c)) }).toEqual({ table, missing: [] });
      }
    }));

  it('tabel user_achievements sudah tidak ada (medali disimpan lokal)', () =>
    db.tx(async (s) => {
      expect((await s.rows('service', `select 1 from information_schema.tables where table_name = 'user_achievements'`)).length).toBe(0);
    }));

  it('edu_modules dan edu_lessons memiliki kolom updated_at yang dipakai aplikasi', () =>
    db.tx(async (s) => {
      const rows = await s.rows<{ table_name: string }>('service', `select table_name from information_schema.columns where table_schema = 'public' and column_name = 'updated_at' and table_name in ('edu_modules', 'edu_lessons')`);
      expect(rows.map((r) => r.table_name).sort()).toEqual(['edu_lessons', 'edu_modules']);
    }));

  it('edu_schema.sql dapat dijalankan setelah schema.sql tanpa error', () =>
    db.tx(async (s) => {
      await s.sql(sqlFile('edu_schema.sql'));
    }));
});

describe('idempotensi skema', () => {
  it('menjalankan ulang seluruh file SQL dan migrasi tidak error dan tidak menghapus data', () =>
    db.tx(async (s) => {
      const id = await s.member('a@x.com');
      await s.sql(`insert into public.user_trades (id, user_id, date, symbol, direction) values ('t1', $1, '2026-01-05', 'EURUSD', 'BUY')`, [id]);
      await s.sql(`insert into public.edu_modules (id, title) values ('m1', 'Modul')`);

      await s.sql(sqlFile('schema.sql'));
      await s.sql(sqlFile('admin_web_schema.sql'));
      await s.sql(sqlFile('user_data_schema.sql'));
      await s.sql(sqlFile('edu_schema.sql'));
      await s.sql(sqlFile('migrations/001_security_hardening.sql'));

      for (const t of ['profiles', 'user_trades', 'edu_modules']) {
        expect((await s.rows('service', `select 1 from public.${t}`)).length).toBeGreaterThan(0);
      }
    }));
});

describe('data bawaan', () => {
  // Kode undangan statis di repo: siapa pun yang membaca schema.sql dapat mendaftar
  // sebagai member dengan kode ini selama belum dipakai.
  it('schema.sql menanam satu kode undangan bawaan yang belum terpakai', () =>
    db.tx(async (s) => {
      const rows = await s.rows<{ code_hint: string; is_used: boolean }>('service', `select code_hint, is_used from public.invitations`);
      expect(rows).toEqual([{ code_hint: 'PFX-MEMBER-VIP', is_used: false }]);
    }));

  it('kode undangan bawaan benar-benar dapat dipakai mendaftar', () =>
    db.tx(async (s) => {
      await s.sql(`insert into auth.users (email, raw_user_meta_data) values ('x@x.com', '{"invitation_code":"pfx-member-vip"}')`);
      expect((await s.rows<{ role: string }>('service', `select role from public.profiles`))[0].role).toBe('member');
    }));
});
