import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    dbAdminUrl: string;
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
const SQL_ORDER = [
  path.join(here, 'auth-stub.sql'),
  path.join(here, '..', 'schema.sql'),
  path.join(here, '..', 'admin_web_schema.sql'),
  path.join(here, '..', 'user_data_schema.sql'),
  ...readdirSync(path.join(here, '..', 'migrations'))
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => path.join(here, '..', 'migrations', f)),
];
export const TEMPLATE_DB = 'palti_template';

const docker = (...args: string[]) => execFileSync('docker', args, { encoding: 'utf8' }).trim();

async function waitForPostgres(url: string, timeoutMs = 60_000) {
  const started = Date.now();
  for (;;) {
    const c = new Client({ connectionString: url });
    try {
      await c.connect();
      await c.query('select 1');
      await c.end();
      return;
    } catch (err) {
      await c.end().catch(() => {});
      if (Date.now() - started > timeoutMs) throw err;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

export default async function setup(project: TestProject) {
  let container: string | null = null;
  let adminUrl = process.env.TEST_DATABASE_URL ?? '';

  if (!adminUrl) {
    container = `palti-fx-test-db-${process.pid}`;
    docker('run', '-d', '--rm', '--name', container, '-e', 'POSTGRES_PASSWORD=test', '-p', '127.0.0.1::5432', 'postgres:17-alpine');
    const mapping = docker('port', container, '5432/tcp').split('\n')[0];
    adminUrl = `postgres://postgres:test@127.0.0.1:${mapping.split(':').pop()}/postgres`;
  }

  try {
    await waitForPostgres(adminUrl);

    const admin = new Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`drop database if exists ${TEMPLATE_DB}`);
    await admin.query(`create database ${TEMPLATE_DB}`);
    await admin.end();

    const tpl = new Client({ connectionString: adminUrl.replace(/\/[^/]*$/, `/${TEMPLATE_DB}`) });
    await tpl.connect();
    for (const file of SQL_ORDER) {
      await tpl.query(readFileSync(file, 'utf8'));
    }
    await tpl.end();
  } catch (err) {
    if (container) docker('rm', '-f', container);
    throw err;
  }

  project.provide('dbAdminUrl', adminUrl);

  return async () => {
    if (container) docker('rm', '-f', container);
  };
}
