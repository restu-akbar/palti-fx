import { randomBytes } from 'node:crypto';
import { Client, QueryResult } from 'pg';
import { inject } from 'vitest';

const TEMPLATE_DB = 'palti_template';

export type Actor = 'service' | 'anon' | { id: string };

export interface Session {
  run(actor: Actor, text: string, params?: unknown[]): Promise<QueryResult>;
  sql(text: string, params?: unknown[]): Promise<QueryResult>;
  member(email: string, opts?: { name?: string }): Promise<string>;
  admin(email: string): Promise<string>;
  rows<T = Record<string, unknown>>(actor: Actor, text: string, params?: unknown[]): Promise<T[]>;
}

export interface TestDb {
  tx<T>(fn: (s: Session) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

const withDb = (url: string, name: string) => url.replace(/\/[^/]*$/, `/${name}`);

export async function openTestDb(): Promise<TestDb> {
  const adminUrl = inject('dbAdminUrl');
  const dbName = `t_${randomBytes(6).toString('hex')}`;

  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  await admin.query(`create database ${dbName} template ${TEMPLATE_DB}`);

  const client = new Client({ connectionString: withDb(adminUrl, dbName) });
  await client.connect();

  const session: Session = {
    async run(actor, text, params) {
      await client.query('savepoint act');
      try {
        if (actor !== 'service') {
          await client.query(`set local role ${actor === 'anon' ? 'anon' : 'authenticated'}`);
          await client.query(`select set_config('request.jwt.claim.sub', $1, true)`, [actor === 'anon' ? '' : actor.id]);
        }
        const res = await client.query(text, params);
        await client.query('reset role');
        await client.query('release savepoint act');
        return res;
      } catch (err) {
        await client.query('rollback to savepoint act');
        await client.query('release savepoint act');
        throw err;
      }
    },
    sql(text, params) {
      return this.run('service', text, params);
    },
    async rows(actor, text, params) {
      return (await this.run(actor, text, params)).rows as never;
    },
    async member(email, opts = {}) {
      const code = `T${randomBytes(5).toString('hex').toUpperCase()}`;
      await this.sql(
        `insert into public.invitations (code_hash, code_hint) values (encode(sha256(convert_to($1, 'UTF8')), 'hex'), 'test')`,
        [code]
      );
      const meta = JSON.stringify({ invitation_code: code, ...(opts.name ? { full_name: opts.name } : {}) });
      const res = await this.sql(
        `insert into auth.users (email, raw_user_meta_data) values ($1, $2::jsonb) returning id`,
        [email, meta]
      );
      return res.rows[0].id as string;
    },
    async admin(email) {
      const id = await this.member(email);
      await this.sql(`update public.profiles set role = 'admin' where id = $1`, [id]);
      return id;
    },
  };

  return {
    async tx(fn) {
      await client.query('begin');
      try {
        return await fn(session);
      } finally {
        await client.query('rollback');
      }
    },
    async close() {
      await client.end();
      await admin.query(`drop database if exists ${dbName} with (force)`);
      await admin.end();
    },
  };
}
