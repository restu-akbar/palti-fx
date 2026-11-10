import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequest, type Env } from './upload-url';

const env: Env = {
  SUPABASE_URL: 'https://proj.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
  R2_ACCOUNT_ID: 'acct',
  R2_BUCKET: 'palti-lesson-media',
  R2_PUBLIC_BASE_URL: 'https://media.test/',
  R2_ACCESS_KEY_ID: 'AKID',
  R2_SECRET_ACCESS_KEY: 'secret',
};

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

/** Mock fetch: auth -> pengguna, profil -> role; panggilan lain (DELETE ke R2) dicatat. */
function mockUpstream(role: string | null = 'admin', authOk = true) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.endsWith('/auth/v1/user')) return authOk ? reply({ id: 'u1' }) : reply({}, 401);
    if (url.includes('/rest/v1/profiles')) return reply(role ? [{ role }] : []);
    if (url.includes('r2.cloudflarestorage.com') && (init?.method ?? (input as Request).method) === 'DELETE') {
      return new Response(null, { status: 204 });
    }
    throw new Error(`fetch tak terduga: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const call = (method: string, body?: unknown, token: string | null = 'jwt') =>
  onRequest({
    env,
    request: new Request('https://app.test/api/upload-url', {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  });

afterEach(() => vi.unstubAllGlobals());

describe('upload-url: autentikasi', () => {
  it('menolak metode selain POST/DELETE', async () => {
    mockUpstream();
    expect((await call('GET')).status).toBe(405);
  });

  it('401 tanpa token atau token tidak valid, 403 bila bukan admin', async () => {
    mockUpstream();
    expect((await call('POST', {}, null)).status).toBe(401);
    mockUpstream('admin', false);
    expect((await call('POST', {})).status).toBe(401);
    mockUpstream('student');
    expect((await call('POST', { kind: 'image', contentType: 'image/png', size: 10 })).status).toBe(403);
    mockUpstream(null);
    expect((await call('DELETE', { keys: ['images/a.png'] })).status).toBe(403);
  });
});

describe('upload-url: POST', () => {
  const ok = { kind: 'image', contentType: 'image/png', size: 1234 };

  it('membuat key di server dan menandatangani PUT dengan Content-Type', async () => {
    mockUpstream();
    const res = await call('POST', ok);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.key).toMatch(/^images\/lessons\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.png$/);
    expect(body.publicUrl).toBe(`https://media.test/${body.key}`);
    const u = new URL(body.uploadUrl);
    expect(u.host).toBe('acct.r2.cloudflarestorage.com');
    expect(u.pathname).toBe(`/palti-lesson-media/${body.key}`);
    expect(u.searchParams.get('X-Amz-Expires')).toBe('300');
    expect(u.searchParams.get('X-Amz-Signature')).toBeTruthy();
    expect(u.searchParams.get('X-Amz-SignedHeaders')).toMatch(/content-type/);
    expect(body.headers['Content-Type']).toBe('image/png');
  });

  it('video memakai prefix videos/', async () => {
    mockUpstream();
    const body = await (await call('POST', { kind: 'video', contentType: 'video/webm', size: 5 })).json();
    expect(body.key).toMatch(/^videos\/lessons\/.*\.webm$/);
  });

  it('menolak jenis, MIME, dan ukuran yang tidak valid', async () => {
    mockUpstream();
    expect((await call('POST', { ...ok, kind: 'audio' })).status).toBe(400);
    expect((await call('POST', { ...ok, contentType: 'image/svg+xml' })).status).toBe(400);
    expect((await call('POST', { ...ok, contentType: 'video/mp4' })).status).toBe(400);
    expect((await call('POST', { ...ok, size: 0 })).status).toBe(400);
    expect((await call('POST', { ...ok, size: 1.5 })).status).toBe(400);
    expect((await call('POST', { ...ok, size: 5 * 1024 * 1024 + 1 })).status).toBe(413);
    expect((await call('POST', { kind: 'video', contentType: 'video/mp4', size: 50 * 1024 * 1024 + 1 })).status).toBe(413);
  });
});

describe('upload-url: DELETE', () => {
  it('menghapus key valid di R2', async () => {
    const fetchMock = mockUpstream();
    const res = await call('DELETE', { keys: ['images/lessons/2026/11/a.webp', 'videos/lessons/2026/11/b.mp4'] });
    expect(await res.json()).toEqual({ deleted: 2 });
    const deletes = fetchMock.mock.calls.filter(([u]) => String(u instanceof Request ? u.url : u).includes('r2.cloudflarestorage.com'));
    expect(deletes).toHaveLength(2);
  });

  it('menolak key di luar prefix, path traversal, dan daftar kosong/terlalu besar', async () => {
    mockUpstream();
    for (const keys of [[], ['lessons/a.png'], ['images/../secret'], ['images//a.png'], ['images/a b.png'], [1], 'images/a.png',
      Array.from({ length: 101 }, (_, i) => `images/${i}.png`)]) {
      expect((await call('DELETE', { keys })).status).toBe(400);
    }
  });
});
